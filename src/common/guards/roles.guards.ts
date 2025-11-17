// src/common/guards/roles.guard.ts

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums/user-role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Obtener los roles REQUERIDOS del método o clase (usando el decorador @Roles)
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(), // Verifica el método del controlador
      context.getClass(),   // Verifica la clase del controlador
    ]);

    // Si no hay roles definidos (ej. un endpoint público), permitir el acceso
    if (!requiredRoles) {
      return true;
    }

    // 2. Obtener el usuario autenticado (inyectado por JwtAuthGuard en req.user)
    const { user } = context.switchToHttp().getRequest();
    
    // El objeto 'user' viene del payload del JWT. 
    // Debe tener la propiedad 'role' (ej. { id: '...', email: '...', role: 'admin' })

    // 3. Verificar si el rol del usuario incluye alguno de los roles requeridos
    const hasRequiredRole = requiredRoles.some((role) => user.role === role);

    // Permitir acceso si el usuario tiene el rol necesario
    return hasRequiredRole; 
  }
}