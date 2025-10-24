import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../../users/users.service';
import { User } from '../../users/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

//Método de validación de usuarios mediante email y pass, se pasa sin hash y busca y compara la plana 'pass' con el hash 'user.password'

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService,
              @InjectRepository(User)
              private usersRepository: Repository<User>,) {}
  

  async validateUser(email: string, pass: string): Promise<Omit<User, 'password'> | null> {

    const user = await this.usersService.findOneByEmail(email);

    if (user) {
      const isPasswordValid = await bcrypt.compare(pass, user.password);

      if (isPasswordValid) {
        const { password, ...result } = user;
        return result;
      }
    }
    return null;
  }
   // Crear un nuevo usuario (lógica de registro)
  async create(userData: Partial<User>): Promise<User> {
    
    // Guardias de campos requeridos
    if (!userData.email || !userData.password) {
        throw new BadRequestException('Email y contraseña son requeridos.');
    }

    // Verificación de email duplicado
    const existingUser = await this.usersService.findOneByEmail(userData.email);
    if (existingUser) {
        throw new BadRequestException('El email ya está registrado');
    }

    // Hashing de la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const newUser = this.usersRepository.create({
        ...userData,
        password: hashedPassword,
        role: 'user', 
    });

    return this.usersRepository.save(newUser);
  }
}