import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { DistribucionesService } from '../services/distribuciones.service';
import { CreateDistribucionDto } from '../dto/create-distribucion.dto';
import { UpdateDistribucionDto } from '../dto/update-distribucion.dto';
import { Distribucion } from '../entities/distribucion.entity';

@ApiTags('distribuciones')
@Controller('distribuciones')
export class DistribucionesController {
  constructor(private readonly distribucionesService: DistribucionesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva distribución' })
  @ApiBody({ type: CreateDistribucionDto })
  @ApiResponse({ status: 201, description: 'Distribución creada correctamente' })
  async create(@Body() createDto: CreateDistribucionDto) {
    return this.distribucionesService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las distribuciones' })
  @ApiResponse({ status: 200, description: 'Lista completa de distribuciones', type: [Distribucion] })
  async findAll(): Promise<Distribucion[]> {
    return this.distribucionesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una distribución por ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Distribución encontrada' })
  @ApiResponse({ status: 404, description: 'Distribución no encontrada' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Distribucion> {
    return this.distribucionesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una distribución existente' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({ type: UpdateDistribucionDto })
  @ApiResponse({ status: 200, description: 'Distribución actualizada correctamente' })
  @ApiResponse({ status: 404, description: 'Distribución no encontrada' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateDistribucionDto) {
    return this.distribucionesService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una distribución por ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Distribución eliminada correctamente' })
  @ApiResponse({ status: 404, description: 'Distribución no encontrada' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.distribucionesService.remove(id);
  }
}
