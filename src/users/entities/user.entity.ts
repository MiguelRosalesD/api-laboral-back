// api-laboral-back/src/users/entities/user.entity.ts

import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

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

  @Column({ default: 'user' })
  role: string; 
}