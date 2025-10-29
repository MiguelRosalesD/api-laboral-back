import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Distribucion } from '../entities/distribucion.entity';
import { CreateDistribucionDto } from '../dto/create-distribucion.dto';
import { UpdateDistribucionDto } from '../dto/update-distribucion.dto';
import { Perfil } from '../../perfiles/entities/perfil.entity';
import { Proyecto } from '../../proyectos/entities/proyecto.entity';

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

  async create(createDto: CreateDistribucionDto) {
    const perfil = await this.perfilRepository.findOne({ where: { id: createDto.perfilId } });
    if (!perfil) throw new NotFoundException(`Perfil con id ${createDto.perfilId} no encontrado`);

    const proyecto = await this.proyectoRepository.findOne({ where: { id: createDto.proyectoId } });
    if (!proyecto) throw new NotFoundException(`Proyecto con id ${createDto.proyectoId} no encontrado`);

    const distribucion = this.distribucionRepository.create({
      ...createDto,
      perfil,
      proyecto,
    });

    return this.distribucionRepository.save(distribucion);
  }

  async findAll(): Promise<Distribucion[]> {
    return this.distribucionRepository.find();
  }

  async findOne(id: number): Promise<Distribucion> {
    const distribucion = await this.distribucionRepository.findOne({ where: { id } });
    if (!distribucion) throw new NotFoundException(`Distribución con id ${id} no encontrada`);
    return distribucion;
  }

  async update(id: number, updateDto: UpdateDistribucionDto) {
    const distribucion = await this.findOne(id);

    if (updateDto.perfilId) {
      const perfil = await this.perfilRepository.findOne({ where: { id: updateDto.perfilId } });
      if (!perfil) throw new NotFoundException(`Perfil con id ${updateDto.perfilId} no encontrado`);
      distribucion.perfil = perfil;
    }

    if (updateDto.proyectoId) {
      const proyecto = await this.proyectoRepository.findOne({ where: { id: updateDto.proyectoId } });
      if (!proyecto) throw new NotFoundException(`Proyecto con id ${updateDto.proyectoId} no encontrado`);
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
