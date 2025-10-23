// api-laboral-back/src/users/users.service.ts

import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // Buscar usuario por email
  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  // Crear un nuevo usuario (lógica de registro)
  async create(userData: Partial<User>): Promise<User> {
    
    // Guardias de campos requeridos
    if (!userData.email || !userData.password) {
        throw new BadRequestException('Email y contraseña son requeridos.');
    }

    // Verificación de email duplicado
    const existingUser = await this.findOneByEmail(userData.email);
    if (existingUser) {
        throw new BadRequestException('El email ya está registrado');
    }

    // Hashing de la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const newUser = this.usersRepository.create({
        ...userData,
        password: hashedPassword,
        role: userData.role || 'user', 
    });

    return this.usersRepository.save(newUser);
  }
}