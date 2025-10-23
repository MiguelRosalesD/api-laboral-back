import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth') // /auth
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login') // POST /auth/login
  async login(@Body() loginDto: any) {

    // Pasa las credenciales al servicio para validar
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas o usuario no encontrado');
    }

    // Devolvemos el objeto usuario para crear la sesión en el front
    return user;
  }
}