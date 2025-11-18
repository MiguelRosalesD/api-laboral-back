import { Injectable, BadRequestException } from '@nestjs/common';
import { Registro } from '../registros/entities/registro.entity';
import { DistribucionesService } from '../distribuciones/services/distribuciones.service';
import { Perfil } from '../perfiles/entities/perfil.entity';
import { ResultadoConsulta, ResultadoPerfil, ResultadoMes, ResultadoProyecto, ResultadoPorcentajeLibre } from './types/calculos.types';

@Injectable()
export class CalculosService {
  constructor(private readonly distribucionesService: DistribucionesService) {}

  /**
   * Calcula el desglose de las nóminas por perfil -> mes -> proyecto
   * prorrateando por días de registro.
   */
  async calcularDistribucion(
    perfiles: Perfil[],
    registros: Registro[],
    fechaConsulta: { inicio: Date; fin: Date },
    tipoDato: 'real' | 'estimacion' | 'mixta',
    filtros?: {
      perfilIds?: number[];
      proyectoIds?: number[];
      empresas?: string[];
      contratacion?: ('antiguo' | 'nuevo')[];
    },
  ): Promise<ResultadoConsulta> {
    if (!fechaConsulta || !fechaConsulta.inicio || !fechaConsulta.fin) {
      throw new BadRequestException('Rango de fechas obligatorio');
    }

    const consultaInicio = new Date(fechaConsulta.inicio);
    const consultaFin = new Date(fechaConsulta.fin);

    const resultadosPerfiles: ResultadoPerfil[] = [];

    for (const perfil of perfiles) {
      // Filtrar registros por perfil
      let registrosPerfil = registros.filter(
        (r) => (r as any).perfil?.id === perfil.id || (r as any).perfilId === perfil.id,
      );

      // Filtrar por solapamiento de fechas
      registrosPerfil = registrosPerfil.filter((r) =>
        this.rangoSolapado(new Date(r.fechaInicio), new Date(r.fechaFin), consultaInicio, consultaFin),
      );

      // Filtrar por tipo de dato
      if (tipoDato === 'real') {
        registrosPerfil = registrosPerfil.filter((r) => r.tipoDato === 'real');
      } else if (tipoDato === 'estimacion') {
        registrosPerfil = registrosPerfil.filter((r) => r.tipoDato === 'estimacion');
      } else if (tipoDato === 'mixta') {
        const mesesConReales = new Set(
          registrosPerfil.filter((r) => r.tipoDato === 'real')
            .map((r) => new Date(r.fechaInicio).toISOString().slice(0, 7)),
        );
        registrosPerfil = registrosPerfil.filter((r) => {
          const mes = new Date(r.fechaInicio).toISOString().slice(0, 7);
          return r.tipoDato === 'real' || !mesesConReales.has(mes);
        });
      }

      // Estructura: Mes -> Proyecto
      const mesesMap: Record<string, ResultadoMes> = {};
      let totalDevengadoPerfil = 0;
      let totalAportacionPerfil = 0;
      let totalHorasPerfil = 0;

      for (const registro of registrosPerfil) {
        const registroInicio = new Date(registro.fechaInicio);
        const registroFin = new Date(registro.fechaFin);

        const rInicio = new Date(Math.max(registroInicio.getTime(), consultaInicio.getTime()));
        const rFin = new Date(Math.min(registroFin.getTime(), consultaFin.getTime()));
        if (rInicio > rFin) continue;

        const diasRegistro = this.diasEntre(rInicio, rFin);
        if (diasRegistro <= 0) continue;

        // Obtener distribuciones activas para este perfil
        const distribucionesActivas = await this.distribucionesService.getDistribucionesPorPerfil(
          perfil.id,
          rInicio,
          rFin,
        );

        // Filtrar distribuciones por proyectos y contratación si se especifican
        const distribucionesFiltradas = distribucionesActivas.filter((dist) => {
          const proyectoId = (dist as any).proyecto?.id;
          const estadoContratacion = dist.estado;

          if (filtros?.proyectoIds && proyectoId && !filtros.proyectoIds.includes(proyectoId)) {
            return false;
          }

          if (filtros?.contratacion && estadoContratacion && !filtros.contratacion.includes(estadoContratacion)) {
            return false;
          }

          return true;
        });

        // Procesar cada mes dentro del rango del registro
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

          const mesKey = mesInicio.toISOString().slice(0, 7);

          // Inicializar mes si no existe
          if (!mesesMap[mesKey]) {
            mesesMap[mesKey] = {
              mes: mesKey,
              proyectos: [],
              totalDevengado: 0,
              totalAportacion: 0,
              totalHoras: 0,
            };
          }

          const proyectosMap: Record<string, ResultadoProyecto> = {};

          // Procesar cada distribución que solapa con este mes
          for (const dist of distribucionesFiltradas) {
            const distInicio = new Date(dist.fechaInicio);
            const distFin = new Date(dist.fechaFin);

            const solapInicio = new Date(Math.max(mesInicio.getTime(), distInicio.getTime()));
            const solapFin = new Date(Math.min(mesFin.getTime(), distFin.getTime()));

            const diasSolapados = this.diasEntre(solapInicio, solapFin);
            if (diasSolapados <= 0) continue;

            const porcentaje = typeof dist.porcentaje === 'number'
              ? dist.porcentaje / 100
              : Number(dist.porcentaje) / 100;

            const factorSobreRegistro = diasSolapados / diasRegistro;

            const proyectoNombre = (dist as any).proyecto?.nombre ?? 'Sin proyecto';

            if (!proyectosMap[proyectoNombre]) {
              proyectosMap[proyectoNombre] = {
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

            proyectosMap[proyectoNombre].devengado += devengadoAdd;
            proyectosMap[proyectoNombre].aportacion += aportacionAdd;
            proyectosMap[proyectoNombre].horas += horasAdd;
          }

          // Agregar proyectos al mes y actualizar totales del mes
          const proyectosArray = Object.values(proyectosMap);
          mesesMap[mesKey].proyectos.push(...proyectosArray);

          for (const proyecto of proyectosArray) {
            mesesMap[mesKey].totalDevengado += proyecto.devengado;
            mesesMap[mesKey].totalAportacion += proyecto.aportacion;
            mesesMap[mesKey].totalHoras += proyecto.horas;

            totalDevengadoPerfil += proyecto.devengado;
            totalAportacionPerfil += proyecto.aportacion;
            totalHorasPerfil += proyecto.horas;
          }

          actual.setMonth(actual.getMonth() + 1);
        }
      }

      resultadosPerfiles.push({
        perfil: perfil.nombre,
        meses: Object.values(mesesMap),
        totalDevengado: Number(totalDevengadoPerfil.toFixed(2)),
        totalAportacion: Number(totalAportacionPerfil.toFixed(2)),
        totalHoras: Number(totalHorasPerfil.toFixed(2)),
      });
    }

    const totalGlobal = resultadosPerfiles.reduce(
      (acc, p) => {
        acc.devengado += p.totalDevengado;
        acc.aportacion += p.totalAportacion;
        acc.horas += p.totalHoras;
        return acc;
      },
      { devengado: 0, aportacion: 0, horas: 0 },
    );

    return { perfiles: resultadosPerfiles, totalGlobal };
  }

  /**
   * Porcentaje mínimo libre y horas sin asignar de un perfil en un rango de fechas.
   * Calcula día a día el porcentaje ocupado y retorna el mínimo porcentaje libre encontrado,
   * además de las horas totales sin asignar en todo el rango.
   */
  async getPorcentajeLibre(perfilId: number, inicio: Date, fin: Date): Promise<ResultadoPorcentajeLibre> {
    if (!perfilId || isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      throw new BadRequestException('Parámetros inválidos');
    }

    // Obtener distribuciones del perfil en el rango
    const distribuciones = await this.distribucionesService.findDistribucionesPorPerfil(
      perfilId,
      inicio,
      fin,
    );

    // Obtener todos los registros del perfil que solapen con el rango
    // Nota: Esto requeriría acceso al repositorio de registros, pero por simplicidad
    // asumiremos que las horas se calculan basadas en un estándar (ej: 160 horas/mes)
    const diasTotales = this.diasEntre(inicio, fin);
    
    let porcentajeMinimoLibre = 100;
    let horasTotalesSinAsignar = 0;

    // Calcular porcentaje ocupado por cada día
    for (let dia = new Date(inicio); dia <= fin; dia.setDate(dia.getDate() + 1)) {
      let porcentajeOcupadoDelDia = 0;

      for (const dist of distribuciones) {
        const distInicio = new Date(dist.fechaInicio);
        const distFin = new Date(dist.fechaFin);

        // Verificar si el día está dentro del rango de la distribución
        if (dia >= distInicio && dia <= distFin) {
          porcentajeOcupadoDelDia += (dist.porcentaje ?? 0);
        }
      }

      const porcentajeLibreDelDia = Math.max(0, 100 - porcentajeOcupadoDelDia);
      
      // Actualizar el mínimo porcentaje libre
      if (porcentajeLibreDelDia < porcentajeMinimoLibre) {
        porcentajeMinimoLibre = porcentajeLibreDelDia;
      }

      // Acumular horas sin asignar (asumiendo 8 horas por día laboral)
      const horasPorDia = 8;
      horasTotalesSinAsignar += (porcentajeLibreDelDia / 100) * horasPorDia;
    }

    return {
      perfilId,
      porcentajeMinimoLibre: Number(porcentajeMinimoLibre.toFixed(2)),
      horasSinAsignar: Number(horasTotalesSinAsignar.toFixed(2)),
    };
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
