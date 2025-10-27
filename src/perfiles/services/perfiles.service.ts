import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Perfil } from '../entities/perfil.entity';
import { CreatePerfilDto } from '../dto/create-perfil.dto';
import { UpdatePerfilDto } from '../dto/update-perfil.dto';

@Injectable()
export class PerfilesService {
  constructor(
    @InjectRepository(Perfil)
    private readonly perfilRepository: Repository<Perfil>,
  ) {}

  async create(createPerfilDto: CreatePerfilDto): Promise<Perfil> {
    const perfil = this.perfilRepository.create(createPerfilDto);
    return this.perfilRepository.save(perfil);
  }

  async findAll(): Promise<Perfil[]> {
    return this.perfilRepository.find();
  }

  async findOne(id: number): Promise<Perfil> {
    const perfil = await this.perfilRepository.findOne({ where: { id } });
    if (!perfil) throw new NotFoundException(`Perfil con id ${id} no encontrado`);
    return perfil;
  }

  async update(id: number, updatePerfilDto: UpdatePerfilDto): Promise<Perfil> {
    const perfil = await this.findOne(id);
    Object.assign(perfil, updatePerfilDto);
    return this.perfilRepository.save(perfil);
  }

  async remove(id: number): Promise<void> {
    const perfil = await this.findOne(id);
    await this.perfilRepository.remove(perfil);
  }
}
