import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Auditoria } from '../entities/auditoria.entity';
import { AuditoriaQueryDto } from '../dto/auditoria-query.dto';

@Injectable()
export class AuditoriaService {
  constructor(
    @InjectRepository(Auditoria)
    private readonly auditoriaRepo: Repository<Auditoria>,
  ) {}

  async create(data: Partial<Auditoria>): Promise<Auditoria> {
    const registro = this.auditoriaRepo.create(data);
    return this.auditoriaRepo.save(registro);
  }

  async findAll(query: AuditoriaQueryDto): Promise<Auditoria[]> {
    const qb = this.auditoriaRepo.createQueryBuilder('auditoria');
    if (query.usuario) qb.andWhere('auditoria.usuario = :usuario', { usuario: query.usuario });
    if (query.accion) qb.andWhere('auditoria.accion = :accion', { accion: query.accion });
    if (query.entidad) qb.andWhere('auditoria.entidad = :entidad', { entidad: query.entidad });
    if (query.fechaInicio) qb.andWhere('auditoria.fecha >= :fechaInicio', { fechaInicio: query.fechaInicio });
    if (query.fechaFin) qb.andWhere('auditoria.fecha <= :fechaFin', { fechaFin: query.fechaFin });
    return qb.orderBy('auditoria.fecha', 'DESC').getMany();
  }

  async findById(id: number): Promise<Auditoria | undefined> {
    const result = await this.auditoriaRepo.findOne({ where: { id } });
    return result === null ? undefined : result;
  }

  async findByEntidad(entidad: Auditoria['entidad'], entidadId: number): Promise<Auditoria[]> {
    return this.auditoriaRepo.find({ where: { entidad: entidad, entidadId }, order: { fecha: 'DESC' } });
  }
}
