import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { loginDto, registerDto } from '../dto/auth.dto';

@ApiTags('auth')

@Controller('auth') // /auth
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login') // POST /auth/login
  @ApiOperation({ summary: 'Logear al usuario'})
  async login(@Body() loginDto:loginDto) {

    // Pasa las credenciales al servicio para validar
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas o usuario no encontrado');
    }

    // Devolvemos el objeto usuario para crear la sesión en el front
    return user;
  }

  @Post('register') // POST /auth/register
  @ApiOperation({ summary: 'Registrar nuevo usuario'})
  async register (@Body() registerDto:registerDto){
    const user = await this.authService.create(registerDto)

    return user;

  }
}