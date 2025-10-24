// api-laboral-back/src/auth/strategies/jwt.strategy.ts

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

// Define la estructura mínima del payload que esperas en el token
interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      // Fallar rápido con mensaje claro si falta la variable de entorno
      throw new Error('JWT_SECRET no está definido en las variables de entorno');
    }

    // Configuración de Passport para la estrategia 'jwt'
    super({
      // Método para extraer el JWT del encabezado 'Authorization: Bearer <token>'
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), 
      // Ignorar tokens expirados (generalmente false, pero lo dejamos true para la demo, aunque el guard lo gestiona)
      ignoreExpiration: false, 
      // Secreto usado para verificar la firma del token de acceso
      secretOrKey: secret, 
    });
  }

  // Método que se llama después de que el token ha sido validado con el secreto
  async validate(payload: JwtPayload) {
    // Aquí puedes buscar el usuario en la DB si lo necesitas,
    // pero para tokens de acceso, a menudo es suficiente con devolver el payload.
    // Esto inyecta el 'payload' en el objeto request (req.user)
    return { 
        id: payload.id, 
        email: payload.email, 
        role: payload.role 
    };
    
    // Si la validación falla (ej. usuario inactivo), lanza:
    // throw new UnauthorizedException();
  }
}