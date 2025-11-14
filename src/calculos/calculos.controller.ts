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
  @ApiOperation({ summary: 'Desglose de nóminas por perfil -> proyecto -> mes' })
  @ApiResponse({ status: 200, description: 'Distribución calculada correctamente' })
  @ApiResponse({ status: 400, description: 'Parámetros inválidos' })
  async getDesglose(@Query() query: CalculosQueryDto) {
    const { fechaInicio, fechaFin, tipoDato, perfiles, proyectos, empresas, contratacion } = query;

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    if (isNaN(inicio.getTime()) || isNaN(fin.getTime()) || inicio > fin) {
      throw new BadRequestException('Rango de fechas inválido');
    }

    const allowedContratacion = ['antiguo', 'nuevo'] as const;
    const filtros = {
      perfiles: perfiles ? perfiles.split(',') : undefined,
      proyectos: proyectos ? proyectos.split(',') : undefined,
      empresas: empresas ? empresas.split(',') : undefined,
      contratacion: contratacion
        ? contratacion
            .split(',')
            .filter((c): c is "antiguo" | "nuevo" => allowedContratacion.includes(c as any))
        : undefined,
    };

    // Obtener perfiles filtrados por nombre si se indica, si no todos
    const perfilesArr = filtros.perfiles
      ? await this.perfilRepository.find({ where: { nombre: In(filtros.perfiles) } })
      : await this.perfilRepository.find();

    // Obtener registros filtrados por los perfiles seleccionados
    const registrosArr = await this.registroRepository.find({
      where: { perfil: In(perfilesArr.map(p => p.id)) }
    });

    return this.calculosService.calcularDistribucion(
      perfilesArr,
      registrosArr,
      { inicio, fin },
      tipoDato as "real" | "estimacion" | "mixta",
      filtros
    );
  }

  @Get('porcentaje-libre')
  @ApiOperation({ summary: 'Porcentaje libre de un perfil en un rango de fechas' })
  @ApiResponse({ status: 200, description: 'Porcentaje libre calculado' })
  @ApiResponse({ status: 400, description: 'Parámetros inválidos' })
  async getPorcentajeLibre(@Query() query: CalculosQueryDto) {
    const { fechaInicio, fechaFin, perfiles } = query;

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    if (isNaN(inicio.getTime()) || isNaN(fin.getTime()) || inicio > fin) {
      throw new BadRequestException('Rango de fechas inválido');
    }

    // Buscar el primer perfil por nombre y obtener su ID
    const perfilNombre = perfiles ? perfiles.split(',')[0] : undefined;
    if (!perfilNombre) throw new BadRequestException('Debes indicar al menos un perfil');

    const perfil = await this.perfilRepository.findOne({ where: { nombre: perfilNombre } });
    if (!perfil) throw new BadRequestException('Perfil no encontrado');

    return this.calculosService.getPorcentajeLibre(
      perfil.id,
      inicio,
      fin
    );
  }
}
