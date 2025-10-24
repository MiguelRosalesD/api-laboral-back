import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../../users/services/users.service';
import { User } from '../../users/entities/user.entity';
import { loginDto, registerDto } from '../dto/auth.dto';
import { InjectRepository } from '@nestjs/typeorm'; 
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {} 
  
  async login(loginDto: loginDto): Promise<Omit<User, 'password'>> {
    
    // Busca el usuario por email (delegado a UsersService)
    const user = await this.usersService.findOneByEmail(loginDto.email);

    // Manejo de excepción centralizado
    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas o usuario no encontrado');
    }
    
    // Compara la contraseña
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales incorrectas o usuario no encontrado');
    }
    
    // Devuelve el objeto usuario sin la contraseña, rest operator, que no spread
    const { password, ...result } = user;
    return result; 
  }
    
  //Delegado a UsersService, como el hasheo
  async register(userData: registerDto): Promise<User> {
    return this.usersService.create(userData);
  }
}