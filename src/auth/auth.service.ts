import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

//Método de validación de usuarios mediante email y pass, se pasa sin hash y busca y compara la plana 'pass' con el hash 'user.password'

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

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
}