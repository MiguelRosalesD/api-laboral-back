import { ApiProperty } from '@nestjs/swagger';

export class ResultadoProyectoMes {
  @ApiProperty({ example: '2025-10', description: 'Mes del resultado (YYYY-MM)' })
  mes: string;

  @ApiProperty({ example: 'Proyecto A', description: 'Nombre del proyecto' })
  proyecto: string;

  @ApiProperty({ example: 1000.50, description: 'Importe devengado' })
  devengado: number;

  @ApiProperty({ example: 250.25, description: 'Importe de aportación' })
  aportacion: number;

  @ApiProperty({ example: 160, description: 'Total de horas' })
  horas: number;

  @ApiProperty({ example: 'Empresa X', description: 'Nombre de la empresa' })
  empresa: string;

  @ApiProperty({ example: 'nuevo', enum: ['antiguo', 'nuevo'], description: 'Tipo de contratación' })
  tipoContratacion: string;
}

export class ResultadoPerfil {
  @ApiProperty({ example: 'Juan Pérez', description: 'Nombre del perfil' })
  perfil: string;

  @ApiProperty({ type: [ResultadoProyectoMes], description: 'Lista de resultados por proyecto y mes' })
  proyectos: ResultadoProyectoMes[];

  @ApiProperty({ example: 2500.75, description: 'Total devengado del perfil' })
  totalDevengado: number;

  @ApiProperty({ example: 625.25, description: 'Total aportación del perfil' })
  totalAportacion: number;

  @ApiProperty({ example: 320, description: 'Total horas del perfil' })
  totalHoras: number;

  @ApiProperty({ example: 0, description: 'Horas sin asignar' })
  horasNoAsignadas: number;
}

export class ResultadoConsulta {
  @ApiProperty({ type: [ResultadoPerfil], description: 'Lista de resultados por perfil' })
  perfiles: ResultadoPerfil[];

  @ApiProperty({
    type: 'object',
    properties: {
      devengado: { type: 'number', example: 5000.50 },
      aportacion: { type: 'number', example: 1250.75 },
      horas: { type: 'number', example: 640 },
      horasNoAsignadas: { type: 'number', example: 0 }
    },
    description: 'Totales globales de la consulta'
  })
  totalGlobal: {
    devengado: number;
    aportacion: number;
    horas: number;
    horasNoAsignadas: number;
  };
}