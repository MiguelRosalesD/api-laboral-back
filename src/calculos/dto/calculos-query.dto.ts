import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class CalculosQueryDto {
  @ApiProperty({ example: '2025-01-01', description: 'Fecha de inicio (YYYY-MM-DD)' })
  @IsDateString()
  fechaInicio: string;

  @ApiProperty({ example: '2025-12-31', description: 'Fecha fin (YYYY-MM-DD)' })
  @IsDateString()
  fechaFin: string;

  @ApiProperty({ enum: ['real', 'estimacion', 'mixta'], description: 'Tipo de datos a calcular' })
  @IsEnum(['real', 'estimacion', 'mixta'])
  tipoDato: string;

  @ApiPropertyOptional({ example: 'Juan,Pedro', description: 'Nombres de perfiles separados por coma' })
  @IsOptional()
  @IsString()
  perfiles?: string;

  @ApiPropertyOptional({ example: 'ProyectoA,ProyectoB', description: 'Nombres de proyectos separados por coma' })
  @IsOptional()
  @IsString()
  proyectos?: string;

  @ApiPropertyOptional({ example: 'EmpresaX,EmpresaY', description: 'Nombres de empresas separados por coma' })
  @IsOptional()
  @IsString()
  empresas?: string;

  @ApiPropertyOptional({ example: 'antiguo,nuevo', description: 'Tipo de contratación separados por coma' })
  @IsOptional()
  @IsString()
  contratacion?: string;
}