import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Distribucion } from '../entities/distribucion.entity';
import { CreateDistribucionDto } from '../dto/create-distribucion.dto';
import { UpdateDistribucionDto } from '../dto/update-distribucion.dto';
import { Perfil } from '../../perfiles/entities/perfil.entity';
import { Proyecto } from '../../proyectos/entities/proyecto.entity';
import { addMonths, isBefore, isAfter, startOfMonth, endOfMonth, max, min } from 'date-fns';

@Injectable()
export class DistribucionesService {
  constructor(
    @InjectRepository(Distribucion)
    private readonly distribucionRepository: Repository<Distribucion>,
    @InjectRepository(Perfil)
    private readonly perfilRepository: Repository<Perfil>,
    @InjectRepository(Proyecto)
    private readonly proyectoRepository: Repository<Proyecto>,
  ) {}

  // Auxiliar: genera los meses dentro de un rango
  private generarMesesRango(fechaInicio: Date, fechaFin: Date): Date[] {
    const meses: Date[] = [];
    let fecha = startOfMonth(fechaInicio);
    while (isBefore(fecha, fechaFin) || fecha.getTime() === fechaFin.getTime()) {
      meses.push(fecha);
      fecha = addMonths(fecha, 1);
    }
    return meses;
  }

  // Calcular el porcentaje libre por mes para validación en create()
  private async calcularPorcentajeLibrePorMes(
    perfilId: number,
    fechaInicio: Date,
    fechaFin: Date,
  ) {
    const distribuciones = await this.distribucionRepository.find({
      where: { perfil: { id: perfilId } },
    });

    const meses = this.generarMesesRango(fechaInicio, fechaFin);
    const resultado: Record<string, number> = {};

    for (const mes of meses) {
      const inicioMes = startOfMonth(mes);
      const finMes = endOfMonth(mes);

      const activas = distribuciones.filter(
        (d) =>
          !(isAfter(d.fechaInicio, finMes) || isBefore(d.fechaFin, inicioMes)),
      );

      const totalAsignado = activas.reduce((sum, d) => sum + d.porcentaje, 0);
      resultado[mes.toISOString().slice(0, 7)] = Math.max(0, 100 - totalAsignado);
    }

    return resultado;
  }

  // Endpoint /porcentaje-libre: devuelve los rangos de días con el mismo % libre
  async getPorcentajeLibre(perfilId: number, fechaInicio: Date, fechaFin: Date) {
    const perfil = await this.perfilRepository.findOne({ where: { id: perfilId } });
    if (!perfil) throw new NotFoundException(`Perfil con id ${perfilId} no encontrado`);

    const distribuciones = await this.distribucionRepository.find({
      where: { perfil: { id: perfilId } },
    });

    if (!distribuciones.length) {
      return {
        perfilId,
        perfilNombre: perfil.nombre,
        porcentajeLibreTotal: 100,
        rangosLibres: [
          { porcentaje: 100, fechaInicio, fechaFin },
        ],
      };
    }

    const mapaOcupacion: Record<string, number> = {};

    distribuciones.forEach((d) => {
      const inicio = max([new Date(d.fechaInicio), fechaInicio]);
      const fin = min([new Date(d.fechaFin), fechaFin]);

      if (isAfter(inicio, fechaFin) || isBefore(fin, fechaInicio)) return;

      for (
        let dIter = new Date(inicio);
        dIter <= fin;
        dIter.setDate(dIter.getDate() + 1)
      ) {
        const key = dIter.toISOString().split('T')[0];
        mapaOcupacion[key] = (mapaOcupacion[key] || 0) + d.porcentaje;
      }
    });

    const rangosLibres: { porcentaje: number; fechaInicio: Date; fechaFin: Date }[] = [];
    let actual: { porcentaje: number; fechaInicio: Date; fechaFin: Date } | null = null;

    for (
      let dIter = new Date(fechaInicio);
      dIter <= fechaFin;
      dIter.setDate(dIter.getDate() + 1)
    ) {
      const key = dIter.toISOString().split('T')[0];
      const ocupado = mapaOcupacion[key] || 0;
      const libre = Math.max(0, 100 - ocupado);

      if (!actual) {
        actual = { porcentaje: libre, fechaInicio: new Date(dIter), fechaFin: new Date(dIter) };
      } else if (actual.porcentaje === libre) {
        actual.fechaFin = new Date(dIter);
      } else {
        rangosLibres.push(actual);
        actual = { porcentaje: libre, fechaInicio: new Date(dIter), fechaFin: new Date(dIter) };
      }
    }
    if (actual) rangosLibres.push(actual);

    const porcentajeLibreTotal =
      rangosLibres.length > 0 ? Math.min(...rangosLibres.map((r) => r.porcentaje)) : 100;

    return {
      perfilId,
      perfilNombre: perfil.nombre,
      porcentajeLibreTotal,
      rangosLibres,
    };
  }

  // Crear con validación de porcentaje y detalle por mes
  async create(createDto: CreateDistribucionDto) {
    const perfil = await this.perfilRepository.findOne({
      where: { id: createDto.perfilId },
    });
    if (!perfil)
      throw new NotFoundException(`Perfil con id ${createDto.perfilId} no encontrado`);

    const proyecto = await this.proyectoRepository.findOne({
      where: { id: createDto.proyectoId },
    });
    if (!proyecto)
      throw new NotFoundException(`Proyecto con id ${createDto.proyectoId} no encontrado`);

    const porcentajeLibre = await this.calcularPorcentajeLibrePorMes(
      createDto.perfilId,
      new Date(createDto.fechaInicio),
      new Date(createDto.fechaFin),
    );

    const mesesNoDisponibles = Object.entries(porcentajeLibre)
      .filter(([_, libre]) => libre < createDto.porcentaje)
      .map(([mes, libre]) => ({ mes, libre }));

    if (mesesNoDisponibles.length > 0) {
      const detalles = mesesNoDisponibles
        .map((m) => `${m.mes} (solo ${m.libre}% libre)`)
        .join(', ');
      throw new BadRequestException(
        `No se puede asignar ${createDto.porcentaje}%. Meses con exceso: ${detalles}`,
      );
    }

    const distribucion = this.distribucionRepository.create({
      ...createDto,
      perfil,
      proyecto,
    });

    const nuevaDistribucion = await this.distribucionRepository.save(distribucion);

    const nuevoLibre = await this.calcularPorcentajeLibrePorMes(
      createDto.perfilId,
      new Date(createDto.fechaInicio),
      new Date(createDto.fechaFin),
    );

    return {
      message: 'Distribución creada correctamente',
      distribucion: nuevaDistribucion,
      porcentajeLibreRestante: nuevoLibre,
    };
  }

  async findAll(): Promise<Distribucion[]> {
    return this.distribucionRepository.find();
  }

  async findOne(id: number): Promise<Distribucion> {
    const distribucion = await this.distribucionRepository.findOne({ where: { id } });
    if (!distribucion)
      throw new NotFoundException(`Distribución con id ${id} no encontrada`);
    return distribucion;
  }

  async update(id: number, updateDto: UpdateDistribucionDto) {
    const distribucion = await this.findOne(id);

    if (updateDto.perfilId) {
      const perfil = await this.perfilRepository.findOne({
        where: { id: updateDto.perfilId },
      });
      if (!perfil)
        throw new NotFoundException(`Perfil con id ${updateDto.perfilId} no encontrado`);
      distribucion.perfil = perfil;
    }

    if (updateDto.proyectoId) {
      const proyecto = await this.proyectoRepository.findOne({
        where: { id: updateDto.proyectoId },
      });
      if (!proyecto)
        throw new NotFoundException(
          `Proyecto con id ${updateDto.proyectoId} no encontrado`,
        );
      distribucion.proyecto = proyecto;
    }

    Object.assign(distribucion, updateDto);
    return this.distribucionRepository.save(distribucion);
  }

  async remove(id: number): Promise<void> {
    const distribucion = await this.findOne(id);
    await this.distribucionRepository.remove(distribucion);
  }
}
