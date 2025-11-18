import { IsDateString, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ImportExcelDto {
  @ApiProperty({ description: 'Fecha de inicio para todos los registros', example: '2025-01-01' })
  @IsDateString()
  @IsNotEmpty()
  fechaInicio: string;

  @ApiProperty({ description: 'Fecha de fin para todos los registros', example: '2025-12-31' })
  @IsDateString()
  @IsNotEmpty()
  fechaFin: string;

  @ApiProperty({ description: 'Nombre de la empresa para todos los registros', example: 'DLTCode' })
  @IsString()
  @IsNotEmpty()
  empresa: string;
}
