import { IsDateString, IsNotEmpty } from 'class-validator';
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
}
