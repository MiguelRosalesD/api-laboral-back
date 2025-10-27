import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Perfil } from '../../perfiles/entities/perfil.entity';
import { Proyecto } from '../../proyectos/entities/proyecto.entity';

@Entity('distribuciones')
export class Distribucion {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => Perfil, (perfil) => perfil.distribuciones, { eager: true })
  perfil: Perfil;

  @ManyToOne(() => Proyecto, (proyecto) => proyecto.distribuciones, { eager: true })
  proyecto: Proyecto;

  @Column({ type: 'date' })
  fechaInicio: Date;

  @Column({ type: 'date' })
  fechaFin: Date;

  @Column({ type: 'float' })
  porcentaje: number;

  @Column({ type: 'varchar', length: 10 })
  estado: 'antiguo' | 'nuevo';
}
