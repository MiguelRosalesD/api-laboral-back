import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { loginDto, registerDto } from '../dto/auth.dto';

@ApiTags('auth')

@Controller('auth') // /auth
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login') // POST /auth/login
  @ApiOperation({ summary: 'Logear al usuario'})
  
  async login(@Body() loginDto: loginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register') // POST /auth/register
  @ApiOperation({ summary: 'Registrar nuevo usuario'})
  
  async register (@Body() registerDto: registerDto){
    return this.authService.register(registerDto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refrescar el token de acceso usando el refresh token' })
  async refresh(@Body('refresh_token') refreshToken: string) {
    return this.authService.refresh(refreshToken);
}
}