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

  // Crear usuario
  async create(registerDto: registerDto): Promise<User> {
    const { password, email, name, role } = registerDto;

    // Generar hash de contraseña
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear entidad
    const newUser = this.usersRepository.create({
      email,
      nombre: name,
      password: hashedPassword,
      role: role || UserRole.EMPLOYEE,
    });

    try {
      // Guardar en BD
      await this.usersRepository.save(newUser);
      
      // Devolver usuario sin password
      const { password: _, ...result } = newUser;
      return result as User;
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      
      // Email duplicado
      if (error.code === '23505' || error.detail?.includes('already exists')) { 
        throw new ConflictException('El correo electrónico ya está registrado.');
      }
      throw new InternalServerErrorException(`Error al registrar: ${error.message || error}`);
    }
  }

  // Buscar usuario por email
  async findOneByEmail(email: string): Promise<User | undefined> {
    
    const user = await this.usersRepository.findOne({ 
      where: { email },
    });
    
    return user ?? undefined;
  }
}