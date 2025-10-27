import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../../users/services/users.service';
import { User } from '../../users/entities/user.entity';
import { loginDto, registerDto } from '../dto/auth.dto';

// Duración del token de acceso en ms, para el frontend.
const EXPIRATION_TIME_MS = 
  (parseInt((process.env.JWT_EXPIRATION || '5m').replace('m', '')) * 60 * 1000) || 300000;

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private readonly jwtService: JwtService, // Inyectamos JwtService
  ) {} 
  

  
  async createFrontPayload(payload_user: Omit<User, 'password'>) {
    // Payload simple para ambos tokens
    const tokenPayload: Record<string, unknown> = {
      id: payload_user.id,
      email: payload_user.email,
      role: payload_user.role,
      nombre: payload_user.nombre,
    };

    // Generar token de acceso (usa configuración por defecto del JwtModule)
    const access_token = await this.jwtService.signAsync(tokenPayload as Record<string, any>);

    // Preparar expiresIn del refresh token con el tipo correcto
    const rawRefresh = process.env.JWT_REFRESH_EXPIRATION ?? '7d';
    const refreshExpires: number | import('ms').StringValue = /^\d+$/.test(rawRefresh)
      ? parseInt(rawRefresh, 10)
      : (rawRefresh as import('ms').StringValue);

    const refresh_secret = process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET;

    // Generar token de refresco con su propia configuración
    const refresh_token = await this.jwtService.signAsync(tokenPayload as Record<string, any>, {
      expiresIn: refreshExpires,
      secret: refresh_secret,
    });

    return {
      user: payload_user, // Objeto usuario limpio para NextAuth
      backend_tokens: {
        access_token: access_token,
        refresh_token: refresh_token,
        // Hora exacta de expiración del token de acceso para el cliente (ms)
        expires_in: new Date().setTime(new Date().getTime() + EXPIRATION_TIME_MS), 
      },
    };
  }



  async login(loginDto: loginDto) {
    
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
    
    // Devuelve el objeto usuario sin la contraseña
    const { password, ...result } = user;
    const cleanUserPayload = result as Omit<User, 'password'>; // Aserción de tipo para asegurar compatibilidad

    // Llama a la función para generar el payload con los tokens
    return this.createFrontPayload(cleanUserPayload);
  }
    
  //Delegado a UsersService, como el hasheo
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
      expires_in: new Date().setTime(new Date().getTime() + EXPIRATION_TIME_MS),
    };
  } catch (error) {
    throw new UnauthorizedException('Refresh token inválido o expirado');
  }
}
}