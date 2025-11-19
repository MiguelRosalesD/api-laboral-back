import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CalculosService } from './calculos.service';
import { CalculosQueryDto } from './dto/calculos-query.dto';
import { Perfil } from '../perfiles/entities/perfil.entity';
import { Registro } from '../registros/entities/registro.entity';

@ApiTags('cálculos')
@Controller('calculos')
export class CalculosController {
  constructor(
    private readonly calculosService: CalculosService,
    @InjectRepository(Perfil)
    private readonly perfilRepository: Repository<Perfil>,
    @InjectRepository(Registro)
    private readonly registroRepository: Repository<Registro>,
  ) {}

  @Get('desglose')
  @ApiOperation({ summary: 'Desglose de nóminas por perfil -> mes -> proyecto' })
  @ApiResponse({ status: 200, description: 'Distribución calculada correctamente' })
  @ApiResponse({ status: 400, description: 'Parámetros inválidos' })
  async getDesglose(@Query() query: CalculosQueryDto) {
    const { fechaInicio, fechaFin, tipoDato, perfiles, proyectos, empresas, contratacion } = query;

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    if (isNaN(inicio.getTime()) || isNaN(fin.getTime()) || inicio > fin) {
      throw new BadRequestException('Rango de fechas inválido');
    }

    // Convertir IDs de strings a números
    const perfilIds = perfiles ? perfiles.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) : undefined;
    const proyectoIds = proyectos ? proyectos.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) : undefined;

    const allowedContratacion = ['antiguo', 'nuevo'] as const;
    const filtros = {
      perfilIds,
      proyectoIds,
      empresas: empresas ? empresas.split(',').map(e => e.trim()) : undefined,
      contratacion: contratacion
        ? contratacion
            .split(',')
            .map(c => c.trim())
            .filter((c): c is "antiguo" | "nuevo" => allowedContratacion.includes(c as any))
        : undefined,
    };

    // Obtener perfiles filtrados por ID si se indica, si no todos
    const wherePerfiles = perfilIds ? { id: In(perfilIds) } : {};
    const perfilesArr = await this.perfilRepository.find({ where: wherePerfiles });

    if (perfilIds && perfilesArr.length === 0) {
      throw new BadRequestException('No se encontraron perfiles con los IDs proporcionados');
    }

    // Obtener registros filtrados por los perfiles seleccionados y opcionalmente por empresa
    const whereRegistros: any = { perfil: In(perfilesArr.map(p => p.id)) };
    if (filtros.empresas && filtros.empresas.length > 0) {
      whereRegistros.empresa = In(filtros.empresas);
    }

    const registrosArr = await this.registroRepository.find({ where: whereRegistros });

    return this.calculosService.calcularDistribucion(
      perfilesArr,
      registrosArr,
      { inicio, fin },
      tipoDato,
      filtros
    );
  }

  @Get('porcentaje-libre')
  @ApiOperation({ summary: 'Porcentaje libre y horas sin asignar de un perfil en un rango de fechas' })
  @ApiResponse({ status: 200, description: 'Porcentaje libre y horas calculadas' })
  @ApiResponse({ status: 400, description: 'Parámetros inválidos' })
  async getPorcentajeLibre(@Query() query: CalculosQueryDto) {
    const { fechaInicio, fechaFin, perfiles } = query;

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    if (isNaN(inicio.getTime()) || isNaN(fin.getTime()) || inicio > fin) {
      throw new BadRequestException('Rango de fechas inválido');
    }

    // Obtener el primer ID de perfil
    const perfilId = perfiles ? parseInt(perfiles.split(',')[0].trim()) : undefined;
    if (!perfilId || isNaN(perfilId)) {
      throw new BadRequestException('Debes indicar al menos un ID de perfil válido');
    }

    const perfil = await this.perfilRepository.findOne({ where: { id: perfilId } });
    if (!perfil) {
      throw new BadRequestException('Perfil no encontrado');
    }

    // Obtener registros del perfil
    const registrosArr = await this.registroRepository.find({ 
      where: { perfil: { id: perfilId } } 
    });

    return this.calculosService.getPorcentajeLibre(
      perfilId,
      inicio,
      fin,
      registrosArr
    );
  }
}
