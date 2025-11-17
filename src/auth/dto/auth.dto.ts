// src/auth/dto/auth.dto.ts

import { IsString, IsEmail, IsEnum } from 'class-validator';
import { UserRole } from '../../common/enums/user-role.enum'; // Importar el Enum

export class loginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class registerDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsEnum(UserRole, { message: 'El rol debe ser Admin o User.' })
  role: UserRole;
}