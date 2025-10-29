import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiQuery, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CalculosService } from './calculos.service';
import { Perfil } from '../perfiles/entities/perfil.entity';
import { Registro } from '../registros/entities/registro.entity';
import { Distribucion } from '../distribuciones/entities/distribucion.entity';
import { IsDateString, IsEnum, IsOptional, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';
import { ResultadoConsulta } from './types/calculos.types';

// Query params DTO
class CalculosQueryParams {
  @IsDateString()
  fechaInicio: Date;

  @IsDateString()
  fechaFin: Date;

  @IsEnum(['real', 'estimacion', 'mixta'])
  tipoDato: 'real' | 'estimacion' | 'mixta';

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value?.split(','))
  perfiles?: string[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value?.split(','))
  proyectos?: string[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value?.split(','))
  empresas?: string[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value?.split(','))
  contratacion?: ('antiguo' | 'nuevo')[];
}

@ApiTags('calculos')
@Controller('calculos')
export class CalculosController {
  constructor(
    private readonly calculosService: CalculosService,
    @InjectRepository(Perfil)
    private readonly perfilRepo: Repository<Perfil>,
    @InjectRepository(Registro)
    private readonly registroRepo: Repository<Registro>,
    @InjectRepository(Distribucion)
    private readonly distribucionRepo: Repository<Distribucion>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Obtener cálculos de distribución' })
  @ApiQuery({ 
    name: 'fechaInicio', 
    required: true, 
    type: String,
    example: '2025-10-01',
    description: 'Fecha de inicio en formato YYYY-MM-DD' 
  })
  @ApiQuery({ 
    name: 'fechaFin', 
    required: true, 
    type: String,
    example: '2025-10-31',
    description: 'Fecha fin en formato YYYY-MM-DD' 
  })
  @ApiQuery({ 
    name: 'tipoDato', 
    required: true, 
    enum: ['real', 'estimacion', 'mixta'],
    description: 'Tipo de datos a calcular' 
  })
  @ApiQuery({ 
    name: 'perfiles', 
    required: false, 
    type: String,
    example: 'perfil1,perfil2',
    description: 'Lista de nombres de perfiles separados por comas' 
  })
  @ApiQuery({ 
    name: 'proyectos', 
    required: false, 
    type: String,
    example: 'proyecto1,proyecto2',
    description: 'Lista de nombres de proyectos separados por comas' 
  })
  @ApiQuery({ 
    name: 'empresas', 
    required: false, 
    type: String,
    example: 'empresa1,empresa2',
    description: 'Lista de nombres de empresas separados por comas' 
  })
  @ApiQuery({ 
    name: 'contratacion', 
    required: false, 
    type: String,
    example: 'antiguo,nuevo',
    description: 'Tipos de contratación separados por comas (antiguo/nuevo)' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Cálculos realizados correctamente',
    type: ResultadoConsulta
  })
  async calcular(@Query() queryParams: CalculosQueryParams): Promise<ResultadoConsulta> {
    // Validar fechas
    const fechaInicio = new Date(queryParams.fechaInicio);
    const fechaFin = new Date(queryParams.fechaFin);

    if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
      throw new BadRequestException('Fechas inválidas');
    }

    // Obtener todos los perfiles
    const perfiles = await this.perfilRepo.find({
      select: ['id', 'nombre', 'dni'],
    });

    // Obtener registros y distribuciones
    const [registros, distribuciones] = await Promise.all([
      this.registroRepo.find({
        relations: ['perfil'],
        select: ['id', 'fechaInicio', 'fechaFin', 'horas', 'devengado', 'aportacion', 'empresa', 'tipoDato'],
      }),
      this.distribucionRepo.find({
        relations: ['perfil', 'proyecto'],
        select: ['id', 'fechaInicio', 'fechaFin', 'porcentaje', 'estado'],
      }),
    ]);

    // Calcular distribución
    return this.calculosService.calcularDistribucion(
      perfiles,
      registros,
      distribuciones,
      { inicio: fechaInicio, fin: fechaFin },
      queryParams.tipoDato,
      {
        perfiles: queryParams.perfiles,
        proyectos: queryParams.proyectos,
        empresas: queryParams.empresas,
        contratacion: queryParams.contratacion,
      }
    );
  }
}
