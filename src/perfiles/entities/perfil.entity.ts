import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Distribucion } from '../../distribuciones/entities/distribucion.entity';
import { Registro } from '../../registros/entities/registro.entity';

@Entity('perfiles')
export class Perfil {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  dni: string;

  @OneToMany(() => Distribucion, (distribucion) => distribucion.perfil)
  distribuciones: Distribucion[];

  @OneToMany(() => Registro, (registro) => registro.perfil)
  registros: Registro[];
}
