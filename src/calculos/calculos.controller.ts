import {
  Controller,
  Get,
  BadRequestException,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { DistribucionesService } from '../distribuciones/services/distribuciones.service';

@ApiTags('cálculos')
@Controller('calculos')
export class CalculosController {
  constructor(private readonly distribucionesService: DistribucionesService) {}

  @Get('porcentaje-libre')
  @ApiOperation({
    summary: 'Obtener porcentaje libre (con perfilId hardcodeado)',
  })
  @ApiQuery({
    name: 'fechaInicio',
    required: true,
    type: String,
    example: '2025-02-13',
  })
  @ApiQuery({
    name: 'fechaFin',
    required: true,
    type: String,
    example: '2025-12-31',
  })
  @ApiResponse({
    status: 200,
    description: 'Porcentajes libres devueltos correctamente',
  })
  async getPorcentajeLibreHardcoded(
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
  ) {
    const perfilId = 3; 

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    if (isNaN(inicio.getTime()) || isNaN(fin.getTime()) || inicio > fin) {
      throw new BadRequestException('Rango de fechas inválido');
    }

    console.log('➡️ Ejecutando cálculo con perfilId:', perfilId);
    return this.distribucionesService.getPorcentajeLibre(perfilId, inicio, fin);
  }
}
