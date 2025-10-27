import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Perfil } from '../../perfiles/entities/perfil.entity';

@Entity('registros')
export class Registro {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => Perfil, (perfil) => perfil.registros, { eager: true })
  perfil: Perfil;

  @Column({ type: 'varchar', length: 20 })
  tipoDato:  'real' | 'estimacion';

  @Column({ type: 'int' })
  devengado: number;

  @Column({ type: 'int' })
  aportacion: number;

  @Column({ type: 'int' })
  horas: number;

  @Column({ type: 'date' })
  fechaInicio: Date;

  @Column({ type: 'date' })
  fechaFin: Date;

  @Column({ type: 'varchar', length: 255 })
  empresa: string;

  @Column({ type: 'double precision' })
  multiplicadorInferior: number;

  @Column({ type: 'double precision' })
  multiplicadorSuperior: number;
}
