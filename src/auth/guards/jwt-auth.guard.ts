// api-laboral-back/src/auth/guards/jwt-auth.guard.ts

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// 'jwt' es el nombre que dimos a la estrategia en JwtStrategy
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}