import { IsInt, IsNumber, IsDateString, IsString, IsIn, IsNotEmpty } from 'class-validator';
import { Min, Max } from 'class-validator';

export class CreateDistribucionDto {
  @IsInt()
  @IsNotEmpty()
  perfilId: number;  // Changed from id_perfil

  @IsInt()
  @IsNotEmpty()
  proyectoId: number;  // Changed from id_proyecto

  @IsDateString()
  @IsNotEmpty()
  fechaInicio: Date;

  @IsDateString()
  @IsNotEmpty()
  fechaFin: Date;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Max(100)
  porcentaje: number;

  @IsString()
  @IsIn(['antiguo', 'nuevo'])
  @IsNotEmpty()
  estado: 'antiguo' | 'nuevo';
}
