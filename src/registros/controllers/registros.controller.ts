// src/registros/controllers/registros.controller.ts

import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe, UseGuards, UseInterceptors } from '@nestjs/common';
import { RegistrosService } from '../services/registros.service';
import { CreateRegistroDto } from '../dto/create-registro.dto';
import { UpdateRegistroDto } from '../dto/update-registro.dto';
import { Registro } from '../entities/registro.entity';

// Importaciones de Seguridad
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guards';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';


@Controller('registros')
// Aplicamos JWT Guard y Roles Guard a nivel de controlador
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(require('../../common/interceptors/auditoria.interceptor').AuditoriaInterceptor)
export class RegistrosController {
  constructor(private readonly registrosService: RegistrosService) {}

  // 1. CREACIÓN (Solo ADMIN)
  @Post()
  @Roles(UserRole.ADMIN) // <--- RESTRINGIDO
  create(@Body() createRegistroDto: CreateRegistroDto): Promise<Registro> {
    return this.registrosService.create(createRegistroDto);
  }

  // 2. LISTADO (Permitido para todos los usuarios autenticados: ADMIN y EMPLOYEE/USER)
  @Get()
  findAll(): Promise<Registro[]> {
    return this.registrosService.findAll();
  }

  // 3. DETALLE (Permitido para todos los usuarios autenticados)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Registro> {
    return this.registrosService.findOne(id);
  }

  // 4. ACTUALIZACIÓN (Solo ADMIN)
  @Put(':id')
  @Roles(UserRole.ADMIN) // <--- RESTRINGIDO
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRegistroDto: UpdateRegistroDto,
  ): Promise<Registro> {
    return this.registrosService.update(id, updateRegistroDto);
  }

  // 5. ELIMINACIÓN (Solo ADMIN)
  @Delete(':id')
  @Roles(UserRole.ADMIN) // <--- RESTRINGIDO
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.registrosService.remove(id);
  }
}