import { Injectable, BadRequestException } from '@nestjs/common';
import { Registro } from '../registros/entities/registro.entity';
import { Distribucion } from '../distribuciones/entities/distribucion.entity';
import { Perfil } from '../perfiles/entities/perfil.entity';
import { ResultadoConsulta, ResultadoPerfil, ResultadoProyectoMes } from './types/calculos.types';

@Injectable()
export class CalculosService {
  /**
   * Calcula la distribución por perfil -> proyecto -> mes, prorrateando por días del registro
   * y calculando horas no asignadas correctamente.
   */
  calcularDistribucion(
    perfiles: Perfil[],
    registros: Registro[],
    distribuciones: Distribucion[],
    fechaConsulta: { inicio: Date; fin: Date },
    tipoDato: 'real' | 'estimacion' | 'mixta',
    filtros?: {
      perfiles?: string[];
      proyectos?: string[];
      empresas?: string[];
      contratacion?: ('antiguo' | 'nuevo')[];
      /** Nuevo filtro opcional para devolver solo perfiles con disponibilidad */
      soloDisponibles?: boolean;
    },
  ): ResultadoConsulta {
    if (!fechaConsulta || !fechaConsulta.inicio || !fechaConsulta.fin) {
      throw new BadRequestException('Rango de fechas obligatorio');
    }

    // Normalizar fechas de consulta
    const consultaInicio = new Date(fechaConsulta.inicio);
    const consultaFin = new Date(fechaConsulta.fin);

    const resultadosPerfiles: ResultadoPerfil[] = [];

    for (const perfil of perfiles) {
      // Filtro opcional por nombre de perfil (si se especificó)
      if (filtros?.perfiles && !filtros.perfiles.includes(perfil.nombre)) continue;

      // Filtrar registros del perfil
      let registrosPerfil = registros.filter((r) => {
        const rPerfilId =
          (r as any).perfil?.id ?? (r as any).perfilId ?? (r as any).perfil_id ?? null;
        return rPerfilId === perfil.id;
      });

      // Filtrar por solapamiento con la consulta
      registrosPerfil = registrosPerfil.filter((r) =>
        this.rangoSolapado(new Date(r.fechaInicio), new Date(r.fechaFin), consultaInicio, consultaFin),
      );

      // Filtrar por tipo de dato
      if (tipoDato === 'real') {
        registrosPerfil = registrosPerfil.filter((r) => r.tipoDato === 'real');
      } else if (tipoDato === 'estimacion') {
        registrosPerfil = registrosPerfil.filter((r) => r.tipoDato === 'estimacion');
      } else if (tipoDato === 'mixta') {
        const mesesConReales = new Set<string>(
          registrosPerfil
            .filter((r) => r.tipoDato === 'real')
            .map((r) => new Date(r.fechaInicio).toISOString().slice(0, 7)),
        );
        registrosPerfil = registrosPerfil.filter((r) => {
          const mes = new Date(r.fechaInicio).toISOString().slice(0, 7);
          return r.tipoDato === 'real' || !mesesConReales.has(mes);
        });
      }

      // Mapa acumulador por proyecto y mes
      const proyectosMesMap: Record<string, ResultadoProyectoMes> = {};
      let totalDevengadoPerfil = 0;
      let totalAportacionPerfil = 0;
      let totalHorasPerfil = 0;
      let horasNoAsignadasPerfil = 0;

      for (const registro of registrosPerfil) {
        const registroInicio = new Date(registro.fechaInicio);
        const registroFin = new Date(registro.fechaFin);

        const rInicio = new Date(Math.max(registroInicio.getTime(), consultaInicio.getTime()));
        const rFin = new Date(Math.min(registroFin.getTime(), consultaFin.getTime()));
        if (rInicio > rFin) continue;

        const diasRegistro = this.diasEntre(rInicio, rFin);
        if (diasRegistro <= 0) continue;

        // Distribuciones activas del perfil que solapan
        const distribucionesActivas = distribuciones.filter((d) => {
          const dPerfilId =
            (d as any).perfil?.id ?? (d as any).perfilId ?? (d as any).perfil_id ?? null;
          if (dPerfilId !== perfil.id) return false;

          const proyectoNombre = (d as any).proyecto?.nombre ?? null;
          if (filtros?.proyectos && proyectoNombre && !filtros.proyectos.includes(proyectoNombre)) return false;
          if (filtros?.contratacion && !filtros.contratacion.includes(d.estado)) return false;
          if (filtros?.empresas && registro.empresa && !filtros.empresas.includes(registro.empresa)) return false;

          return this.rangoSolapado(new Date(d.fechaInicio), new Date(d.fechaFin), rInicio, rFin);
        });

        // Recorremos mes a mes dentro del rango
        let actual = new Date(rInicio);
        while (actual <= rFin) {
          const inicioMes = new Date(actual.getFullYear(), actual.getMonth(), 1);
          const finMes = new Date(actual.getFullYear(), actual.getMonth() + 1, 0);

          const mesInicio = new Date(Math.max(rInicio.getTime(), inicioMes.getTime()));
          const mesFin = new Date(Math.min(rFin.getTime(), finMes.getTime()));
          if (mesInicio > mesFin) {
            actual.setMonth(actual.getMonth() + 1);
            continue;
          }

          const diasMes = this.diasEntre(mesInicio, mesFin);
          if (diasMes <= 0) {
            actual.setMonth(actual.getMonth() + 1);
            continue;
          }

          let sumaDiasPorcentaje = 0;

          for (const dist of distribucionesActivas) {
            const distInicio = new Date(dist.fechaInicio);
            const distFin = new Date(dist.fechaFin);

            const solapInicio = new Date(Math.max(mesInicio.getTime(), distInicio.getTime()));
            const solapFin = new Date(Math.min(mesFin.getTime(), distFin.getTime()));

            const diasSolapados = this.diasEntre(solapInicio, solapFin);
            if (diasSolapados <= 0) continue;

            const porcentaje = typeof dist.porcentaje === 'number'
              ? dist.porcentaje / 100
              : Number(dist.porcentaje) / 100;

            sumaDiasPorcentaje += diasSolapados * porcentaje;
            const factorSobreRegistro = diasSolapados / diasRegistro;

            const proyectoNombre = (dist as any).proyecto?.nombre ?? 'Sin proyecto';
            const mesKey = mesInicio.toISOString().slice(0, 7);
            const proyectoKey = `${proyectoNombre}-${mesKey}`;

            if (!proyectosMesMap[proyectoKey]) {
              proyectosMesMap[proyectoKey] = {
                mes: mesKey,
                proyecto: proyectoNombre,
                devengado: 0,
                aportacion: 0,
                horas: 0,
                empresa: registro.empresa ?? 'Sin empresa',
                tipoContratacion: dist.estado ?? 'sin estado',
              };
            }

            const devengadoAdd = Number((registro.devengado * factorSobreRegistro * porcentaje).toFixed(2));
            const aportacionAdd = Number((registro.aportacion * factorSobreRegistro * porcentaje).toFixed(2));
            const horasAdd = Number((registro.horas * factorSobreRegistro * porcentaje).toFixed(2));

            proyectosMesMap[proyectoKey].devengado += devengadoAdd;
            proyectosMesMap[proyectoKey].aportacion += aportacionAdd;
            proyectosMesMap[proyectoKey].horas += horasAdd;

            totalDevengadoPerfil += devengadoAdd;
            totalAportacionPerfil += aportacionAdd;
            totalHorasPerfil += horasAdd;
          }

          // Horas no asignadas
          const diasNoAsignadosEquivalente = Math.max(0, diasMes - sumaDiasPorcentaje);
          if (diasNoAsignadosEquivalente > 0) {
            const factorNoAsignadoSobreRegistro = diasNoAsignadosEquivalente / diasRegistro;
            const horasNoAsignadasSegmento = Number((registro.horas * factorNoAsignadoSobreRegistro).toFixed(2));
            horasNoAsignadasPerfil += horasNoAsignadasSegmento;
          }

          actual.setMonth(actual.getMonth() + 1);
        }
      }

      resultadosPerfiles.push({
        perfil: perfil.nombre,
        proyectos: Object.values(proyectosMesMap),
        totalDevengado: Number(totalDevengadoPerfil.toFixed(2)),
        totalAportacion: Number(totalAportacionPerfil.toFixed(2)),
        totalHoras: Number(totalHorasPerfil.toFixed(2)),
        horasNoAsignadas: Number(horasNoAsignadasPerfil.toFixed(2)),
      });
    }

    // Filtro adicional: mostrar solo perfiles con disponibilidad
    let perfilesFiltrados = resultadosPerfiles;
    if (filtros?.soloDisponibles) {
      perfilesFiltrados = resultadosPerfiles.filter((p) => p.horasNoAsignadas > 0);
    }

    // Totales globales recalculados
    const totalGlobal = perfilesFiltrados.reduce(
      (acc, p) => {
        acc.devengado += p.totalDevengado;
        acc.aportacion += p.totalAportacion;
        acc.horas += p.totalHoras;
        acc.horasNoAsignadas += p.horasNoAsignadas;
        return acc;
      },
      { devengado: 0, aportacion: 0, horas: 0, horasNoAsignadas: 0 },
    );

    totalGlobal.devengado = Number(totalGlobal.devengado.toFixed(2));
    totalGlobal.aportacion = Number(totalGlobal.aportacion.toFixed(2));
    totalGlobal.horas = Number(totalGlobal.horas.toFixed(2));
    totalGlobal.horasNoAsignadas = Number(totalGlobal.horasNoAsignadas.toFixed(2));

    return { perfiles: perfilesFiltrados, totalGlobal };
  }

  // Helpers
  private rangoSolapado(inicioA: Date, finA: Date, inicioB: Date, finB: Date): boolean {
    const aInicio = new Date(inicioA);
    const aFin = new Date(finA);
    const bInicio = new Date(inicioB);
    const bFin = new Date(finB);
    return aInicio <= bFin && aFin >= bInicio;
  }

  private diasEntre(inicio: Date, fin: Date): number {
    const i = new Date(inicio);
    const f = new Date(fin);
    const msPorDia = 1000 * 60 * 60 * 24;
    i.setHours(0, 0, 0, 0);
    f.setHours(0, 0, 0, 0);
    return Math.floor((f.getTime() - i.getTime()) / msPorDia) + 1;
  }
}
