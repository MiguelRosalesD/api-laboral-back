import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Registro } from '../entities/registro.entity';
import { CreateRegistroDto } from '../dto/create-registro.dto';
import { UpdateRegistroDto } from '../dto/update-registro.dto';
import { Perfil } from '../../perfiles/entities/perfil.entity';

@Injectable()
export class RegistrosService {
  constructor(
    @InjectRepository(Registro)
    private readonly registroRepository: Repository<Registro>,
    @InjectRepository(Perfil)
    private readonly perfilRepository: Repository<Perfil>,
  ) {}

  async create(createDto: CreateRegistroDto): Promise<Registro> {
    const perfil = await this.perfilRepository.findOne({ where: { id: createDto.id_perfil } });
    if (!perfil) throw new NotFoundException(`Perfil con id ${createDto.id_perfil} no encontrado`);

    const registro = this.registroRepository.create({
      ...createDto,
      perfil,
    });

    return this.registroRepository.save(registro);
  }

  async findAll(): Promise<Registro[]> {
    return this.registroRepository.find();
  }

  async findOne(id: number): Promise<Registro> {
    const registro = await this.registroRepository.findOne({ where: { id } });
    if (!registro) throw new NotFoundException(`Registro con id ${id} no encontrado`);
    return registro;
  }

  async update(id: number, updateDto: UpdateRegistroDto): Promise<Registro> {
    const registro = await this.findOne(id);

    if (updateDto.id_perfil) {
      const perfil = await this.perfilRepository.findOne({ where: { id: updateDto.id_perfil } });
      if (!perfil) throw new NotFoundException(`Perfil con id ${updateDto.id_perfil} no encontrado`);
      registro.perfil = perfil;
    }

    Object.assign(registro, updateDto);
    return this.registroRepository.save(registro);
  }

  async remove(id: number): Promise<void> {
    const registro = await this.findOne(id);
    await this.registroRepository.remove(registro);
  }
}
