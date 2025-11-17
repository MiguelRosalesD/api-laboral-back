// src/users/entities/user.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum'; // Importar el Enum

@Entity('users') 
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string; 

  @Column()
  nombre: string;

  // CLAVE: El tipo de columna es STRING en la BD, pero usamos el Enum para tipado
  @Column({ type: 'enum', enum: UserRole, default: UserRole.EMPLOYEE }) 
  role: UserRole; 
}