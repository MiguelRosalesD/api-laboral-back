import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('auditoria')
@Index(['usuario'])
@Index(['entidad', 'entidadId'])
@Index(['fecha'])
export class Auditoria {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  usuario: string;

  @Column({ length: 10 })
  accion: 'CREATE' | 'UPDATE' | 'DELETE';

  @Column({ length: 50 })
  entidad: 'Perfil' | 'Proyecto' | 'Distribucion' | 'Registro';

  @Column()
  entidadId: number;

  @Column({ type: 'text', nullable: true })
  detalles?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha: Date;

  @Column({ length: 45, nullable: true })
  ip?: string;
}
