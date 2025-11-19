// src/perfiles/controllers/perfiles.controller.ts

import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe, UseGuards, UseInterceptors } from '@nestjs/common';
import { PerfilesService } from '../services/perfiles.service';
import { CreatePerfilDto } from '../dto/create-perfil.dto';
import { UpdatePerfilDto } from '../dto/update-perfil.dto';
import { Perfil } from '../entities/perfil.entity';

// Importaciones de Seguridad
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'; // Importar tu guardia JWT
import { RolesGuard } from '../../common/guards/roles.guards';    // Importar la guardia de roles
import { Roles } from '../../common/decorators/roles.decorator';  // Importar el decorador @Roles
import { UserRole } from '../../common/enums/user-role.enum';     // Importar el Enum de roles


@Controller('perfiles')
// Aplicamos el JWT Guard y el Roles Guard a nivel de controlador para que todos los métodos
// requieran autenticación y pasen por la comprobación de roles.
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(require('../../common/interceptors/auditoria.interceptor').AuditoriaInterceptor)
export class PerfilesController {
  constructor(private readonly perfilesService: PerfilesService) {}

  // 1. CREACIÓN (Solo permitido para ADMIN)
  @Post()
  @Roles(UserRole.ADMIN) // <--- RESTRINGIDO: Solo ADMIN puede crear
  create(@Body() createPerfilDto: CreatePerfilDto): Promise<Perfil> {
    return this.perfilesService.create(createPerfilDto);
  }

  // 2. LISTADO (Permitido para todos los usuarios autenticados: ADMIN y EMPLOYEE/USER)
  // No requiere @Roles, ya que la guardia general (@UseGuards) es suficiente.
  @Get()
  findAll(): Promise<Perfil[]> {
    return this.perfilesService.findAll();
  }

  // 3. DETALLE (Permitido para todos los usuarios autenticados)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Perfil> {
    return this.perfilesService.findOne(id);
  }

  // 4. ACTUALIZACIÓN (Solo permitido para ADMIN)
  @Put(':id')
  @Roles(UserRole.ADMIN) // <--- RESTRINGIDO: Solo ADMIN puede actualizar
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePerfilDto: UpdatePerfilDto,
  ): Promise<Perfil> {
    return this.perfilesService.update(id, updatePerfilDto);
  }

  // 5. ELIMINACIÓN (Solo permitido para ADMIN)
  @Delete(':id')
  @Roles(UserRole.ADMIN) // <--- RESTRINGIDO: Solo ADMIN puede eliminar
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.perfilesService.remove(id);
  }
}