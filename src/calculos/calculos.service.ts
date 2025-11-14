import { Injectable, BadRequestException } from '@nestjs/common';
import { Registro } from '../registros/entities/registro.entity';
import { DistribucionesService } from '../distribuciones/services/distribuciones.service';
import { Perfil } from '../perfiles/entities/perfil.entity';
import { ResultadoConsulta, ResultadoPerfil, ResultadoProyectoMes } from './types/calculos.types';

@Injectable()
export class CalculosService {
  constructor(private readonly distribucionesService: DistribucionesService) {}

  /**
   * Calcula el desglose de las nóminas por perfil -> proyecto -> mes
   * prorrateando por días de registro y considerando horas no asignadas.
   */
  async calcularDistribucion(
    perfiles: Perfil[],
    registros: Registro[],
    fechaConsulta: { inicio: Date; fin: Date },
    tipoDato: 'real' | 'estimacion' | 'mixta',
    filtros?: {
      perfiles?: string[];
      proyectos?: string[];
      empresas?: string[];
      contratacion?: ('antiguo' | 'nuevo')[];
      soloDisponibles?: boolean;
    },
  ): Promise<ResultadoConsulta> {
    if (!fechaConsulta || !fechaConsulta.inicio || !fechaConsulta.fin) {
      throw new BadRequestException('Rango de fechas obligatorio');
    }

    const consultaInicio = new Date(fechaConsulta.inicio);
    const consultaFin = new Date(fechaConsulta.fin);

    const resultadosPerfiles: ResultadoPerfil[] = [];

    for (const perfil of perfiles) {
      if (filtros?.perfiles && !filtros.perfiles.includes(perfil.nombre)) continue;

      let registrosPerfil = registros.filter(
        (r) => (r as any).perfil?.id === perfil.id || (r as any).perfilId === perfil.id,
      );

      registrosPerfil = registrosPerfil.filter((r) =>
        this.rangoSolapado(new Date(r.fechaInicio), new Date(r.fechaFin), consultaInicio, consultaFin),
      );

      if (tipoDato === 'real') registrosPerfil = registrosPerfil.filter((r) => r.tipoDato === 'real');
      else if (tipoDato === 'estimacion') registrosPerfil = registrosPerfil.filter((r) => r.tipoDato === 'estimacion');
      else if (tipoDato === 'mixta') {
        const mesesConReales = new Set(
          registrosPerfil.filter((r) => r.tipoDato === 'real')
            .map((r) => new Date(r.fechaInicio).toISOString().slice(0, 7)),
        );
        registrosPerfil = registrosPerfil.filter((r) => {
          const mes = new Date(r.fechaInicio).toISOString().slice(0, 7);
          return r.tipoDato === 'real' || !mesesConReales.has(mes);
        });
      }

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

        const distribucionesActivas = await this.distribucionesService.getDistribucionesPorPerfil(
          perfil.id,
          rInicio,
          rFin,
          filtros,
        );

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

          const diasNoAsignadosEquivalente = Math.max(0, diasMes - sumaDiasPorcentaje);
          if (diasNoAsignadosEquivalente > 0) {
            const factorNoAsignadoSobreRegistro = diasNoAsignadosEquivalente / diasRegistro;
            horasNoAsignadasPerfil += Number((registro.horas * factorNoAsignadoSobreRegistro).toFixed(2));
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

    let perfilesFiltrados = resultadosPerfiles;
    if (filtros?.soloDisponibles) {
      perfilesFiltrados = resultadosPerfiles.filter((p) => p.horasNoAsignadas > 0);
    }

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

    return { perfiles: perfilesFiltrados, totalGlobal };
  }

  /**
   * Porcentaje libre de un perfil en un rango de fechas.
   */
  async getPorcentajeLibre(perfilId: number, inicio: Date, fin: Date) {
    if (!perfilId || isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      throw new BadRequestException('Parámetros inválidos');
    }

    // Distribuciones del perfil en el rango
    const distribuciones = await this.distribucionesService.findDistribucionesPorPerfil(
      perfilId,
      inicio,
      fin,
    );

    // Calcular porcentaje ocupado por día
    let diasTotales = 0;
    let diasOcupados = 0;

    for (const dist of distribuciones) {
      const distInicio = new Date(dist.fechaInicio);
      const distFin = new Date(dist.fechaFin);

      const solapInicio = new Date(Math.max(distInicio.getTime(), inicio.getTime()));
      const solapFin = new Date(Math.min(distFin.getTime(), fin.getTime()));

      const diasSolapados = this.diasEntre(solapInicio, solapFin);
      if (diasSolapados > 0) {
        diasTotales += diasSolapados;
        diasOcupados += diasSolapados * ((dist.porcentaje ?? 0) / 100);
      }
    }

    const porcentajeLibre = diasTotales > 0 ? Math.max(0, 100 - (diasOcupados / diasTotales) * 100) : 100;

    return { perfilId, porcentajeLibre: Number(porcentajeLibre.toFixed(2)) };
  }

  // ============================
  // Helpers
  // ============================
  private rangoSolapado(inicioA: Date, finA: Date, inicioB: Date, finB: Date): boolean {
    return inicioA <= finB && finA >= inicioB;
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
