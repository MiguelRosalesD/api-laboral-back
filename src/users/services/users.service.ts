// src/users/services/users.service.ts
import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt'; 
import { User } from '../entities/user.entity'; 
import { registerDto } from '../../auth/dto/auth.dto'; 
import { UserRole } from 'src/common/enums/user-role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // 2.1: CREAR USUARIO (REGISTRO SEGURO)
  async create(registerDto: registerDto): Promise<User> {
    const { password, email, name, role } = registerDto;

    // Generar Salt y Hash la contraseña
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear la entidad con el hash
    const newUser = this.usersRepository.create({
      email,
      nombre: name,
      password: hashedPassword,
      role: role || UserRole.EMPLOYEE,
    });

    try {
      // Guardar en la Base de Datos
      await this.usersRepository.save(newUser);
      
      // Devolver el usuario limpio (sin password)
      const { password: _, ...result } = newUser;
      return result as User;
    } catch (error) {
      // Manejo de error: email duplicado
      if (error.code === '23505' || error.detail?.includes('already exists')) { 
        throw new ConflictException('El correo electrónico ya está registrado.');
      }
      throw new InternalServerErrorException('Error desconocido al registrar.');
    }
  }

  // 2.2: BUSCAR USUARIO POR EMAIL (PARA LOGIN)
  async findOneByEmail(email: string): Promise<User | undefined> {
    
    // Busca el usuario (TypeORM retorna User | null)
    const user = await this.usersRepository.findOne({ 
      where: { email },
    });
    
    // Corrige el error de tipado: convierte 'null' a 'undefined' si no se encuentra.
    return user ?? undefined;
  }
}