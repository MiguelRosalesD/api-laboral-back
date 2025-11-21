import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Distribucion } from '../entities/distribucion.entity';
import { CreateDistribucionDto } from '../dto/create-distribucion.dto';
import { UpdateDistribucionDto } from '../dto/update-distribucion.dto';

@Injectable()
export class DistribucionesService {
  constructor(
    @InjectRepository(Distribucion)
    private readonly distribucionRepo: Repository<Distribucion>,
  ) {}

  async create(dto: CreateDistribucionDto) {
    const dist = this.distribucionRepo.create({
      perfil: { id: dto.perfilId } as any,
      proyecto: { id: dto.proyectoId } as any,
      fechaInicio: dto.fechaInicio,
      fechaFin: dto.fechaFin,
      porcentaje: dto.porcentaje,
      estado: dto.estado,
    });
    const saved = await this.distribucionRepo.save(dist);
    // Recargar con relaciones para el interceptor
    return this.distribucionRepo.findOne({ 
      where: { id: saved.id }, 
      relations: ['perfil', 'proyecto'] 
    });
  }

  findAll() {
    return this.distribucionRepo.find({ relations: ['perfil', 'proyecto'] });
  }

  async findOne(id: number) {
    const dist = await this.distribucionRepo.findOne({ where: { id }, relations: ['perfil', 'proyecto'] });
    if (!dist) throw new NotFoundException('Distribución no encontrada');
    return dist;
  }

  async update(id: number, dto: UpdateDistribucionDto) {
    const dist = await this.findOne(id);
    Object.assign(dist, dto);
    return this.distribucionRepo.save(dist);
  }

  async remove(id: number) {
    const dist = await this.findOne(id);
    await this.distribucionRepo.remove(dist);
    // Devolver la distribución eliminada para el interceptor
    return dist;
  }

  async getDistribucionesPorPerfil(
    perfilId: number,
    inicio: Date,
    fin: Date,
    filtros?: any,
): Promise<Distribucion[]> {
  const allDistribuciones = await this.findAll();
  return allDistribuciones.filter((d) => {
    const dPerfilId = d.perfil?.id;
    if (dPerfilId !== perfilId) return false;
    const solapa = !(d.fechaFin < inicio || d.fechaInicio > fin);
    return solapa;
  });
}

async findDistribucionesPorPerfil(
  perfilId: number,
  inicio: Date,
  fin: Date,
): Promise<Distribucion[]> {
  return this.getDistribucionesPorPerfil(perfilId, inicio, fin);
}
}
