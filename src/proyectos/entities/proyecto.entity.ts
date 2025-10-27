import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Distribucion } from '../../distribuciones/entities/distribucion.entity';

@Entity('proyectos')
export class Proyecto {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @OneToMany(() => Distribucion, (distribucion) => distribucion.proyecto)
  distribuciones: Distribucion[];
}
