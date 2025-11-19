// src/proyectos/controllers/proyectos.controller.ts

import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe, UseGuards, UseInterceptors } from '@nestjs/common';
import { ProyectosService } from '../services/proyectos.service';
import { CreateProyectoDto } from '../dto/create-proyecto.dto';
import { UpdateProyectoDto } from '../dto/update-proyecto.dto';
import { Proyecto } from '../entities/proyecto.entity';

// Importaciones de Seguridad
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guards';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';


@Controller('proyectos')
// Aplicamos JWT Guard y Roles Guard a nivel de controlador
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(require('../../common/interceptors/auditoria.interceptor').AuditoriaInterceptor)
export class ProyectosController {
  constructor(private readonly proyectosService: ProyectosService) {}

  // 1. CREACIÓN (Solo ADMIN)
  @Post()
  @Roles(UserRole.ADMIN) // <--- RESTRINGIDO
  create(@Body() createProyectoDto: CreateProyectoDto): Promise<Proyecto> {
    return this.proyectosService.create(createProyectoDto);
  }

  // 2. LISTADO (Permitido para todos los usuarios autenticados: ADMIN y EMPLOYEE/USER)
  @Get()
  findAll(): Promise<Proyecto[]> {
    return this.proyectosService.findAll();
  }

  // 3. DETALLE (Permitido para todos los usuarios autenticados)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Proyecto> {
    return this.proyectosService.findOne(id);
  }

  // 4. ACTUALIZACIÓN (Solo ADMIN)
  @Put(':id')
  @Roles(UserRole.ADMIN) // <--- RESTRINGIDO
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProyectoDto: UpdateProyectoDto,
  ): Promise<Proyecto> {
    return this.proyectosService.update(id, updateProyectoDto);
  }

  // 5. ELIMINACIÓN (Solo ADMIN)
  @Delete(':id')
  @Roles(UserRole.ADMIN) // <--- RESTRINGIDO
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.proyectosService.remove(id);
  }
}