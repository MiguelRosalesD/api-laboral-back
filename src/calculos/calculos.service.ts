import { Injectable, BadRequestException } from '@nestjs/common';
import { Registro } from '../registros/entities/registro.entity';
import { Distribucion } from '../distribuciones/entities/distribucion.entity';
import { Perfil } from '../perfiles/entities/perfil.entity';
import { ResultadoConsulta, ResultadoPerfil, ResultadoProyectoMes } from './types/calculos.types';

@Injectable()
export class CalculosService {
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
    },
  ): ResultadoConsulta {
    if (!fechaConsulta || !fechaConsulta.inicio || !fechaConsulta.fin) {
      throw new BadRequestException('Rango de fechas obligatorio');
    }

    const resultadosPerfiles: ResultadoPerfil[] = [];

    for (const perfil of perfiles) {
      // Filtro opcional por nombre de perfil
      if (filtros?.perfiles && !filtros.perfiles.includes(perfil.nombre)) continue;

      // Filtrar registros del perfil según rango y tipo de dato
      let registrosPerfil = registros.filter(r => r.perfil.id === perfil.id);
      registrosPerfil = registrosPerfil.filter(r =>
        this.rangoSolapado(r.fechaInicio, r.fechaFin, fechaConsulta.inicio, fechaConsulta.fin),
      );

      // Filtrar por tipo de dato
      if (tipoDato === 'real') {
        registrosPerfil = registrosPerfil.filter(r => r.tipoDato === 'real');
      } else if (tipoDato === 'estimacion') {
        registrosPerfil = registrosPerfil.filter(r => r.tipoDato === 'estimacion');
      } else if (tipoDato === 'mixta') {
        // Determinar meses con registros reales
        const mesesConReales = new Set(
          registrosPerfil
            .filter(r => r.tipoDato === 'real')
            .map(r => r.fechaInicio.toISOString().slice(0, 7)),
        );
        registrosPerfil = registrosPerfil.filter(r => {
          const mes = r.fechaInicio.toISOString().slice(0, 7);
          return r.tipoDato === 'real' || !mesesConReales.has(mes);
        });
      }

      const proyectosMesMap: Record<string, ResultadoProyectoMes> = {};
      let totalDevengado = 0;
      let totalAportacion = 0;
      let totalHoras = 0;
      let horasNoAsignadas = 0;

      for (const registro of registrosPerfil) {
        const rInicio: Date = new Date(Math.max(registro.fechaInicio.getTime(), fechaConsulta.inicio.getTime()));
        const rFin: Date = new Date(Math.min(registro.fechaFin.getTime(), fechaConsulta.fin.getTime()));

        // Filtrar distribuciones activas del perfil y con filtros opcionales
        const distribucionesActivas = distribuciones.filter(d =>
          d.perfil.id === perfil.id &&
          this.rangoSolapado(rInicio, rFin, d.fechaInicio, d.fechaFin) &&
          (!filtros?.proyectos || filtros.proyectos.includes(d.proyecto.nombre)) &&
          (!filtros?.contratacion || filtros.contratacion.includes(d.estado)) &&
          (!filtros?.empresas || filtros.empresas.includes(registro.empresa)),
        );

        // Recorrer mes a mes
        let actual = new Date(rInicio);
        while (actual <= rFin) {
          const inicioMes = new Date(actual.getFullYear(), actual.getMonth(), 1);
          const finMes = new Date(actual.getFullYear(), actual.getMonth() + 1, 0);

          const mesInicio = new Date(Math.max(rInicio.getTime(), inicioMes.getTime()));
          const mesFin = new Date(Math.min(rFin.getTime(), finMes.getTime()));
          const diasMes = this.diasEntre(mesInicio, mesFin);

          let totalPorcentajeMes = 0;

          for (const dist of distribucionesActivas) {
            const distInicio = dist.fechaInicio;
            const distFin = dist.fechaFin;

            const solapInicio = new Date(Math.max(mesInicio.getTime(), distInicio.getTime()));
            const solapFin = new Date(Math.min(mesFin.getTime(), distFin.getTime()));
            const diasSolapados = this.diasEntre(solapInicio, solapFin);
            if (diasSolapados <= 0) continue;

            const porcentaje = dist.porcentaje / 100;
            totalPorcentajeMes += porcentaje;

            const factor = diasSolapados / diasMes;
            const proyectoKey = `${dist.proyecto.nombre}-${mesInicio.toISOString().slice(0, 7)}`;

            if (!proyectosMesMap[proyectoKey]) {
              proyectosMesMap[proyectoKey] = {
                mes: mesInicio.toISOString().slice(0, 7),
                proyecto: dist.proyecto.nombre,
                devengado: 0,
                aportacion: 0,
                horas: 0,
                empresa: registro.empresa ?? 'Sin empresa',
                tipoContratacion: dist.estado ?? 'sin estado',
              };
            }

            proyectosMesMap[proyectoKey].devengado += Number((registro.devengado * factor * porcentaje).toFixed(2));
            proyectosMesMap[proyectoKey].aportacion += Number((registro.aportacion * factor * porcentaje).toFixed(2));
            proyectosMesMap[proyectoKey].horas += Number((registro.horas * factor * porcentaje).toFixed(2));

            totalDevengado += Number((registro.devengado * factor * porcentaje).toFixed(2));
            totalAportacion += Number((registro.aportacion * factor * porcentaje).toFixed(2));
            totalHoras += Number((registro.horas * factor * porcentaje).toFixed(2));
          }

          // Horas no asignadas
          if (totalPorcentajeMes < 1) {
            const factorNoAsignado = 1 - totalPorcentajeMes;
            horasNoAsignadas += Number((registro.horas * factorNoAsignado).toFixed(2));
          }

          actual.setMonth(actual.getMonth() + 1);
        }
      }

      resultadosPerfiles.push({
        perfil: perfil.nombre,
        proyectos: Object.values(proyectosMesMap),
        totalDevengado,
        totalAportacion,
        totalHoras,
        horasNoAsignadas,
      });
    }

    // Totales globales
    const totalGlobal = resultadosPerfiles.reduce(
      (acc, p) => {
        acc.devengado += p.totalDevengado;
        acc.aportacion += p.totalAportacion;
        acc.horas += p.totalHoras;
        acc.horasNoAsignadas += p.horasNoAsignadas;
        return acc;
      },
      { devengado: 0, aportacion: 0, horas: 0, horasNoAsignadas: 0 },
    );

    return { perfiles: resultadosPerfiles, totalGlobal };
  }

  private rangoSolapado(inicioA: Date, finA: Date, inicioB: Date, finB: Date): boolean {
    return inicioA <= finB && finA >= inicioB;
  }

  private diasEntre(inicio: Date, fin: Date): number {
    const msPorDia = 1000 * 60 * 60 * 24;
    return Math.floor((fin.getTime() - inicio.getTime()) / msPorDia) + 1;
  }
}
