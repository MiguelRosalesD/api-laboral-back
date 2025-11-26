import { Injectable, BadRequestException } from '@nestjs/common';
import { Registro } from '../registros/entities/registro.entity';
import { DistribucionesService } from '../distribuciones/services/distribuciones.service';
import { Perfil } from '../perfiles/entities/perfil.entity';
import { ResultadoConsulta, ResultadoPerfil, ResultadoMes, ResultadoProyecto, ResultadoPorcentajeLibre } from './types/calculos.types';

@Injectable()
export class CalculosService {
  constructor(private readonly distribucionesService: DistribucionesService) {}

  // Calcular desglose de nóminas por perfil -> mes -> proyecto
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

      // Obtener distribuciones para el perfil en el rango completo
      const todasDistribuciones = await this.distribucionesService.getDistribucionesPorPerfil(
        perfil.id,
        consultaInicio,
        consultaFin,
      );

      // Filtrar distribuciones por proyectos y contratación
      const distribucionesFiltradas = todasDistribuciones.filter((dist) => {
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

      // Estructura: Mes -> Proyecto
      const mesesMap: Record<string, { proyectosMap: Record<string, ResultadoProyecto>, totalDevengado: number, totalAportacion: number, totalHoras: number }> = {};
      
      // Estructura para acumular horas libres por mes y empresa (con devengado y aportación)
      const horasLibresMap: Record<string, Record<string, { horas: number, devengado: number, aportacion: number }>> = {}; // mesKey -> empresa -> { horas, devengado, aportacion }

      let totalDevengadoPerfil = 0;
      let totalAportacionPerfil = 0;
      let totalHorasPerfil = 0;

      // Iterar día a día en el rango de consulta
      let diaIteracion = new Date(consultaInicio);
      while (diaIteracion <= consultaFin) {
        const diaActual = new Date(diaIteracion);
        const mesKey = `${diaActual.getFullYear()}-${String(diaActual.getMonth() + 1).padStart(2, '0')}`;

        // Buscar el registro para este día (priorizando real sobre estimación día a día)
        const registroDelDia = this.buscarRegistroParaDiaMejorado(diaActual, registrosPerfil, tipoDato);
        if (!registroDelDia) {
          diaIteracion.setDate(diaIteracion.getDate() + 1);
          continue;
        }

        // Calcular horas/devengado/aportación por día del registro
        const diasDelRegistro = this.diasEntre(new Date(registroDelDia.fechaInicio), new Date(registroDelDia.fechaFin));
        const horasPorDia = registroDelDia.horas / diasDelRegistro;
        const devengadoPorDia = registroDelDia.devengado / diasDelRegistro;
        const aportacionPorDia = registroDelDia.aportacion / diasDelRegistro;

        // Buscar distribuciones activas para este día
        const distribucionesDelDia = distribucionesFiltradas.filter((dist) => {
          const distInicio = new Date(dist.fechaInicio);
          const distFin = new Date(dist.fechaFin);
          return diaActual >= distInicio && diaActual <= distFin;
        });

        // Inicializar mes si no existe
        if (!mesesMap[mesKey]) {
          mesesMap[mesKey] = {
            proyectosMap: {},
            totalDevengado: 0,
            totalAportacion: 0,
            totalHoras: 0,
          };
        }

        // Distribuir horas/devengado/aportación según porcentajes de distribuciones
        let horasAsignadasDelDia = 0;
        
        for (const dist of distribucionesDelDia) {
          const porcentaje = (typeof dist.porcentaje === 'number' ? dist.porcentaje : Number(dist.porcentaje)) / 100;
          const proyectoNombre = (dist as any).proyecto?.nombre ?? 'Sin proyecto';

          if (!mesesMap[mesKey].proyectosMap[proyectoNombre]) {
            mesesMap[mesKey].proyectosMap[proyectoNombre] = {
              proyecto: proyectoNombre,
              devengado: 0,
              aportacion: 0,
              horas: 0,
              empresa: registroDelDia.empresa ?? 'Sin empresa',
              tipoContratacion: dist.estado ?? 'sin estado',
            };
          }

          const horasAsignadas = horasPorDia * porcentaje;
          const devengadoAsignado = devengadoPorDia * porcentaje;
          const aportacionAsignada = aportacionPorDia * porcentaje;

          mesesMap[mesKey].proyectosMap[proyectoNombre].horas += horasAsignadas;
          mesesMap[mesKey].proyectosMap[proyectoNombre].devengado += devengadoAsignado;
          mesesMap[mesKey].proyectosMap[proyectoNombre].aportacion += aportacionAsignada;

          mesesMap[mesKey].totalHoras += horasAsignadas;
          mesesMap[mesKey].totalDevengado += devengadoAsignado;
          mesesMap[mesKey].totalAportacion += aportacionAsignada;

          totalHorasPerfil += horasAsignadas;
          totalDevengadoPerfil += devengadoAsignado;
          totalAportacionPerfil += aportacionAsignada;
          
          horasAsignadasDelDia += horasAsignadas;
        }

        // Calcular horas libres del día
        const horasLibresDelDia = horasPorDia - horasAsignadasDelDia;
        
        if (horasLibresDelDia > 0) {
          const empresaDelRegistro = registroDelDia.empresa ?? 'Sin empresa';
          
          // Calcular costo por hora del registro
          const costoHoraDiaDevengado = registroDelDia.devengado / registroDelDia.horas;
          const costoHoraDiaAportacion = registroDelDia.aportacion / registroDelDia.horas;
          
          // Calcular devengado y aportación de horas libres
          const devengadoHorasLibres = horasLibresDelDia * costoHoraDiaDevengado;
          const aportacionHorasLibres = horasLibresDelDia * costoHoraDiaAportacion;
          
          // Inicializar estructuras si no existen
          if (!horasLibresMap[mesKey]) {
            horasLibresMap[mesKey] = {};
          }
          if (!horasLibresMap[mesKey][empresaDelRegistro]) {
            horasLibresMap[mesKey][empresaDelRegistro] = {
              horas: 0,
              devengado: 0,
              aportacion: 0
            };
          }
          
          // Acumular horas libres, devengado y aportación por mes y empresa
          horasLibresMap[mesKey][empresaDelRegistro].horas += horasLibresDelDia;
          horasLibresMap[mesKey][empresaDelRegistro].devengado += devengadoHorasLibres;
          horasLibresMap[mesKey][empresaDelRegistro].aportacion += aportacionHorasLibres;
          
          // También sumar al total del mes y perfil
          mesesMap[mesKey].totalHoras += horasLibresDelDia;
          mesesMap[mesKey].totalDevengado += devengadoHorasLibres;
          mesesMap[mesKey].totalAportacion += aportacionHorasLibres;
          
          totalHorasPerfil += horasLibresDelDia;
          totalDevengadoPerfil += devengadoHorasLibres;
          totalAportacionPerfil += aportacionHorasLibres;
        }

        // Avanzar al siguiente día
        diaIteracion.setDate(diaIteracion.getDate() + 1);
      }

      // Convertir a estructura final y ordenar por mes
      const mesesResult: ResultadoMes[] = Object.keys(mesesMap)
        .sort() // Ordenar cronológicamente (YYYY-MM se ordena alfabéticamente)
        .map((mesKey) => {
          const mesData = mesesMap[mesKey];
          
          // Agregar proyectos "Horas sin asignar" para cada empresa con horas libres
          if (horasLibresMap[mesKey]) {
            for (const [empresa, horasLibresData] of Object.entries(horasLibresMap[mesKey])) {
              if (horasLibresData.horas > 0) {
                const keyHorasLibres = `Horas sin asignar - ${empresa}`;
                mesData.proyectosMap[keyHorasLibres] = {
                  proyecto: 'Horas sin asignar',
                  devengado: horasLibresData.devengado,
                  aportacion: horasLibresData.aportacion,
                  horas: horasLibresData.horas,
                  empresa: empresa,
                  tipoContratacion: 'sin estado',
                };
              }
            }
          }
          
          return {
            mes: mesKey,
            proyectos: Object.values(mesData.proyectosMap).map((p) => ({
              ...p,
              horas: Number(p.horas.toFixed(2)),
              devengado: Number(p.devengado.toFixed(2)),
              aportacion: Number(p.aportacion.toFixed(2)),
            })),
            totalDevengado: Number(mesData.totalDevengado.toFixed(2)),
            totalAportacion: Number(mesData.totalAportacion.toFixed(2)),
            totalHoras: Number(mesData.totalHoras.toFixed(2)),
          };
        });

      resultadosPerfiles.push({
        perfil: perfil.nombre,
        meses: mesesResult,
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
   * Calcula día a día usando registros reales y priorizando sobre estimaciones.
   */
  async getPorcentajeLibre(perfilId: number, inicio: Date, fin: Date, registros: Registro[]): Promise<ResultadoPorcentajeLibre> {
    if (!perfilId || isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      throw new BadRequestException('Parámetros inválidos');
    }

    // Obtener distribuciones del perfil en el rango
    const distribuciones = await this.distribucionesService.findDistribucionesPorPerfil(
      perfilId,
      inicio,
      fin,
    );

    // Filtrar registros que solapen con el rango
    const registrosPerfil = registros.filter((r) =>
      this.rangoSolapado(new Date(r.fechaInicio), new Date(r.fechaFin), inicio, fin),
    );
    
    let porcentajeMinimoLibre = 100;
    let horasTotalesSinAsignar = 0;

    // Calcular día a día
    for (let dia = new Date(inicio); dia <= fin; dia.setDate(dia.getDate() + 1)) {
      const diaActual = new Date(dia);

      // Buscar el registro para este día (priorizando real sobre estimación día a día)
      const registroDelDia = this.buscarRegistroParaDiaMejorado(diaActual, registrosPerfil, 'mixta');
      if (!registroDelDia) continue;

      // Calcular horas por día del registro
      const diasDelRegistro = this.diasEntre(new Date(registroDelDia.fechaInicio), new Date(registroDelDia.fechaFin));
      const horasPorDia = registroDelDia.horas / diasDelRegistro;

      // Calcular porcentaje ocupado del día
      let porcentajeOcupadoDelDia = 0;
      for (const dist of distribuciones) {
        const distInicio = new Date(dist.fechaInicio);
        const distFin = new Date(dist.fechaFin);

        if (diaActual >= distInicio && diaActual <= distFin) {
          porcentajeOcupadoDelDia += (dist.porcentaje ?? 0);
        }
      }

      const porcentajeLibreDelDia = Math.max(0, 100 - porcentajeOcupadoDelDia);
      
      // Actualizar el mínimo porcentaje libre
      if (porcentajeLibreDelDia < porcentajeMinimoLibre) {
        porcentajeMinimoLibre = porcentajeLibreDelDia;
      }

      // Acumular horas sin asignar basadas en el registro
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
  /**
   * Busca el registro apropiado para un día específico.
   * Prioriza registros reales sobre estimaciones DÍA A DÍA (no por mes).
   * 
   * LÓGICA MEJORADA:
   * - real: Solo registros reales para ese día
   * - estimacion: Solo registros estimados para ese día
   * - mixta: Prioriza real si existe para ESE DÍA específico, sino usa estimación
   */
  private buscarRegistroParaDiaMejorado(
    dia: Date,
    registros: Registro[],
    tipoDato: 'real' | 'estimacion' | 'mixta',
  ): Registro | null {
    // Filtrar registros que incluyan este día específico
    const registrosValidos = registros.filter((r) => {
      const inicio = new Date(r.fechaInicio);
      const fin = new Date(r.fechaFin);
      return dia >= inicio && dia <= fin;
    });

    if (registrosValidos.length === 0) return null;

    // Lógica de priorización según tipoDato
    if (tipoDato === 'real') {
      // Solo reales
      return registrosValidos.find((r) => r.tipoDato === 'real') ?? null;
    } else if (tipoDato === 'estimacion') {
      // Solo estimaciones
      return registrosValidos.find((r) => r.tipoDato === 'estimacion') ?? null;
    } else {
      // Modo mixta: priorizar real si existe para ESE DÍA específico
      const registroReal = registrosValidos.find((r) => r.tipoDato === 'real');
      if (registroReal) {
        return registroReal;
      }
      
      // Si no hay real para este día, usar estimación
      const registroEstimado = registrosValidos.find((r) => r.tipoDato === 'estimacion');
      if (registroEstimado) {
        return registroEstimado;
      }
      
      // Fallback: cualquier registro disponible
      return registrosValidos[0];
    }
  }

  /**
   * MÉTODO ANTIGUO - Mantenido por compatibilidad pero ya no se usa
   * @deprecated Usar buscarRegistroParaDiaMejorado en su lugar
   */
  private buscarRegistroParaDia(
    dia: Date,
    registros: Registro[],
    tipoDato: 'real' | 'estimacion' | 'mixta',
    mesesConReales: Set<string>,
  ): Registro | null {
    const mesKey = `${dia.getFullYear()}-${String(dia.getMonth() + 1).padStart(2, '0')}`;

    // Filtrar registros que incluyan este día
    const registrosValidos = registros.filter((r) => {
      const inicio = new Date(r.fechaInicio);
      const fin = new Date(r.fechaFin);
      return dia >= inicio && dia <= fin;
    });

    if (registrosValidos.length === 0) return null;

    // Lógica de priorización según tipoDato
    if (tipoDato === 'real') {
      return registrosValidos.find((r) => r.tipoDato === 'real') ?? null;
    } else if (tipoDato === 'estimacion') {
      return registrosValidos.find((r) => r.tipoDato === 'estimacion') ?? null;
    } else {
      // Modo mixta: priorizar real si existe para ese mes
      if (mesesConReales.has(mesKey)) {
        return registrosValidos.find((r) => r.tipoDato === 'real') ?? null;
      } else {
        return registrosValidos.find((r) => r.tipoDato === 'estimacion') ?? registrosValidos[0];
      }
    }
  }

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
