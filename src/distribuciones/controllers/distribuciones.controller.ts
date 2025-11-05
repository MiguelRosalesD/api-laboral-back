import { Controller, Get, Post, Patch, Delete, Param, Body, Query, BadRequestException, ParseIntPipe, } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiParam, ApiBody, } from '@nestjs/swagger';
import { DistribucionesService } from '../services/distribuciones.service';
import { CreateDistribucionDto } from '../dto/create-distribucion.dto';
import { UpdateDistribucionDto } from '../dto/update-distribucion.dto';
import { Distribucion } from '../entities/distribucion.entity';

@ApiTags('distribuciones')
@Controller('distribuciones')
export class DistribucionesController {
  constructor(private readonly distribucionesService: DistribucionesService) {}

  // Crear distribución
  @Post()
  @ApiOperation({ summary: 'Crear una nueva distribución' })
  @ApiBody({ type: CreateDistribucionDto })
  @ApiResponse({ status: 201, description: 'Distribución creada correctamente' })
  async create(@Body() createDto: CreateDistribucionDto) {
    return this.distribucionesService.create(createDto);
  }

  // Obtener todas las distribuciones
  @Get()
  @ApiOperation({ summary: 'Listar todas las distribuciones' })
  @ApiResponse({
    status: 200,
    description: 'Lista completa de distribuciones',
    type: [Distribucion],
  })
  async findAll(): Promise<Distribucion[]> {
    return this.distribucionesService.findAll();
  }

  // Obtener una distribución por ID
  @Get(':id')
  @ApiOperation({ summary: 'Obtener una distribución por ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Distribución encontrada' })
  @ApiResponse({ status: 404, description: 'Distribución no encontrada' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Distribucion> {
    return this.distribucionesService.findOne(id);
  }

  // Actualizar una distribución
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una distribución existente' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({ type: UpdateDistribucionDto })
  @ApiResponse({ status: 200, description: 'Distribución actualizada correctamente' })
  @ApiResponse({ status: 404, description: 'Distribución no encontrada' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateDistribucionDto,
  ) {
    return this.distribucionesService.update(id, updateDto);
  }

  // Eliminar una distribución
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una distribución por ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Distribución eliminada correctamente' })
  @ApiResponse({ status: 404, description: 'Distribución no encontrada' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.distribucionesService.remove(id);
  }

  // Obtener porcentaje libre por perfil en un rango de fechas
@Get('porcentaje-libre')
@ApiOperation({
  summary: 'Obtener los porcentajes de trabajo libres de un perfil en un rango de fechas',
})
@ApiQuery({
  name: 'perfilId',
  required: false,
  type: String,
  example: '3',
  description: 'ID del perfil (por defecto 3 si no se envía)',
})
@ApiQuery({
  name: 'fechaInicio',
  required: true,
  type: String,
  example: '2025-02-13',
  description: 'Fecha de inicio del rango (YYYY-MM-DD)',
})
@ApiQuery({
  name: 'fechaFin',
  required: true,
  type: String,
  example: '2025-12-31',
  description: 'Fecha de fin del rango (YYYY-MM-DD)',
})
@ApiResponse({ status: 200, description: 'Porcentajes obtenidos correctamente' })
@ApiResponse({ status: 400, description: 'Parámetros inválidos' })
async getPorcentajeLibre(@Query() query: Record<string, any>) {
  const perfilId = query.perfilId ? Number(query.perfilId) : 3;
  const inicio = new Date(query.fechaInicio);
  const fin = new Date(query.fechaFin);

  if (isNaN(perfilId) || isNaN(inicio.getTime()) || isNaN(fin.getTime()) || inicio > fin) {
    throw new BadRequestException('Parámetros inválidos');
  }

  return this.distribucionesService.getPorcentajeLibre(perfilId, inicio, fin);
}
}
