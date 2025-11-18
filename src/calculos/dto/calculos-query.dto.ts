import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class CalculosQueryDto {
  @ApiProperty({ example: '2025-01-01', description: 'Fecha de inicio (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  fechaInicio: string;

  @ApiProperty({ example: '2025-12-31', description: 'Fecha fin (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  fechaFin: string;

  @ApiProperty({ enum: ['real', 'estimacion', 'mixta'], description: 'Tipo de datos a calcular' })
  @IsEnum(['real', 'estimacion', 'mixta'])
  @IsNotEmpty()
  tipoDato: 'real' | 'estimacion' | 'mixta';

  @ApiPropertyOptional({ example: '1,2,3', description: 'IDs de perfiles separados por coma' })
  @IsOptional()
  @IsString()
  perfiles?: string;

  @ApiPropertyOptional({ example: '1,2,3', description: 'IDs de proyectos separados por coma' })
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