import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../../users/services/users.service';
import { User } from '../../users/entities/user.entity';
import { loginDto, registerDto } from '../dto/auth.dto';

// Duración del token de acceso en ms, para el frontend.
const EXPIRATION_TIME_MS = 
  (parseInt((process.env.JWT_EXPIRATION || '5m').replace('m', '').replace('h', '').replace('d', '')) * 60 * 1000);

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {} 

  async createFrontPayload(payload_user: Omit<User, 'password'>) {
    // Payload para tokens
    const tokenPayload: Record<string, unknown> = {
      id: payload_user.id,
      email: payload_user.email,
      role: payload_user.role,
      nombre: payload_user.nombre,
    };

    // Generar access token
    const access_token = await this.jwtService.signAsync(tokenPayload as Record<string, any>);

    // Configurar refresh token
    const rawRefresh = process.env.JWT_REFRESH_EXPIRATION ?? '7d';
    const refreshExpires: number | import('ms').StringValue = /^\d+$/.test(rawRefresh)
      ? parseInt(rawRefresh, 10)
      : (rawRefresh as import('ms').StringValue);

    const refresh_secret = process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET;

    // Generar refresh token
    const refresh_token = await this.jwtService.signAsync(tokenPayload as Record<string, any>, {
      expiresIn: refreshExpires,
      secret: refresh_secret,
    });

    return {
      user: payload_user,
      backend_tokens: {
        access_token: access_token,
        refresh_token: refresh_token,
        expires_in: Date.now() + EXPIRATION_TIME_MS,
      },
    };
  }

  async login(loginDto: loginDto) {
    // Buscar usuario por email
    const user = await this.usersService.findOneByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas o usuario no encontrado');
    }
    
    // Validar contraseña
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales incorrectas o usuario no encontrado');
    }
    
    // Remover password del objeto usuario
    const { password, ...result } = user;
    const cleanUserPayload = result as Omit<User, 'password'>;

    // Generar payload con tokens
    return this.createFrontPayload(cleanUserPayload);
  }
    
  async register(userData: registerDto): Promise<User> {
    return this.usersService.create(userData);
  }

  async refresh(refreshToken: string) {
    try {
      const refresh_secret = process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET;

      // Verificar que el refresh token es válido
      const payload = await this.jwtService.verifyAsync(refreshToken, { secret: refresh_secret });

      // Buscar usuario en la base de datos (por seguridad)
      const user = await this.usersService.findOneByEmail(payload.email);
      if (!user) throw new UnauthorizedException('Usuario no encontrado');

      // Crear un nuevo access token
      const tokenPayload = {
        id: user.id,
        email: user.email,
        role: user.role,
        nombre: user.nombre,
      };

      const access_token = await this.jwtService.signAsync(tokenPayload);

      // Devuelve solo el nuevo token y la nueva fecha de expiración
      return {
        access_token,
        expires_in: Date.now() + EXPIRATION_TIME_MS,
      };
    } catch (error) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }
  }
}