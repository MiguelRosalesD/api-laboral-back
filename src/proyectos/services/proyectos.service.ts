import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proyecto } from '../entities/proyecto.entity';
import { CreateProyectoDto } from '../dto/create-proyecto.dto';
import { UpdateProyectoDto } from '../dto/update-proyecto.dto';

@Injectable()
export class ProyectosService {
  constructor(
    @InjectRepository(Proyecto)
    private readonly proyectoRepository: Repository<Proyecto>,
  ) {}

  async create(createProyectoDto: CreateProyectoDto): Promise<Proyecto> {
    const proyecto = this.proyectoRepository.create(createProyectoDto);
    return this.proyectoRepository.save(proyecto);
  }

  async findAll(): Promise<Proyecto[]> {
    return this.proyectoRepository.find();
  }

  async findOne(id: number): Promise<Proyecto> {
    const proyecto = await this.proyectoRepository.findOne({ where: { id } });
    if (!proyecto) throw new NotFoundException(`Proyecto con id ${id} no encontrado`);
    return proyecto;
  }

  async update(id: number, updateProyectoDto: UpdateProyectoDto): Promise<Proyecto> {
    const proyecto = await this.findOne(id);
    Object.assign(proyecto, updateProyectoDto);
    return this.proyectoRepository.save(proyecto);
  }

  async remove(id: number): Promise<void> {
    const proyecto = await this.findOne(id);
    await this.proyectoRepository.remove(proyecto);
  }
}
