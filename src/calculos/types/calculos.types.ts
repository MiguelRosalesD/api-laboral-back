import { ApiProperty } from '@nestjs/swagger';

export class ResultadoProyecto {
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

export class ResultadoMes {
  @ApiProperty({ example: '2025-10', description: 'Mes del resultado (YYYY-MM)' })
  mes: string;

  @ApiProperty({ type: [ResultadoProyecto], description: 'Lista de proyectos en este mes' })
  proyectos: ResultadoProyecto[];

  @ApiProperty({ example: 1500.75, description: 'Total devengado en el mes' })
  totalDevengado: number;

  @ApiProperty({ example: 375.25, description: 'Total aportación en el mes' })
  totalAportacion: number;

  @ApiProperty({ example: 240, description: 'Total horas en el mes' })
  totalHoras: number;
}

export class ResultadoPerfil {
  @ApiProperty({ example: 'Juan Pérez', description: 'Nombre del perfil' })
  perfil: string;

  @ApiProperty({ type: [ResultadoMes], description: 'Lista de resultados por mes' })
  meses: ResultadoMes[];

  @ApiProperty({ example: 2500.75, description: 'Total devengado del perfil' })
  totalDevengado: number;

  @ApiProperty({ example: 625.25, description: 'Total aportación del perfil' })
  totalAportacion: number;

  @ApiProperty({ example: 320, description: 'Total horas del perfil' })
  totalHoras: number;
}

export class ResultadoConsulta {
  @ApiProperty({ type: [ResultadoPerfil], description: 'Lista de resultados por perfil' })
  perfiles: ResultadoPerfil[];

  @ApiProperty({
    type: 'object',
    properties: {
      devengado: { type: 'number', example: 5000.50 },
      aportacion: { type: 'number', example: 1250.75 },
      horas: { type: 'number', example: 640 }
    },
    description: 'Totales globales de la consulta'
  })
  totalGlobal: {
    devengado: number;
    aportacion: number;
    horas: number;
  };
}

export class ResultadoPorcentajeLibre {
  @ApiProperty({ example: 1, description: 'ID del perfil consultado' })
  perfilId: number;

  @ApiProperty({ example: 25.5, description: 'Porcentaje mínimo libre en el rango de fechas' })
  porcentajeMinimoLibre: number;

  @ApiProperty({ example: 120.5, description: 'Total de horas sin asignar en el rango de fechas' })
  horasSinAsignar: number;
}