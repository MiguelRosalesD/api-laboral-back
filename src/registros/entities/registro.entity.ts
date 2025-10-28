import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Perfil } from '../../perfiles/entities/perfil.entity';

@Entity('registros')
export class Registro {
  @PrimaryGeneratedColumn('increment')
  id: number;

  /* @Column()
  perfil_id: number; */

  @ManyToOne(() => Perfil, (perfil) => perfil.registros, { eager: true })
  /* @JoinColumn({ name: 'perfil_id' }) */
  perfil: Perfil;

  @Column({ type: 'varchar', length: 20 })
  tipoDato:  'real' | 'estimacion';

  @Column({ type: 'float' })
  devengado: number;

  @Column({ type: 'float' })
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
