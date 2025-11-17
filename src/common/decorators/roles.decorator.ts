// src/common/decorators/roles.decorator.ts

import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enums/user-role.enum'; // Asumiendo esta ruta

// La clave que usaremos para almacenar los roles en los metadatos
export const ROLES_KEY = 'roles'; 

// Decorador que acepta un array de UserRole
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);