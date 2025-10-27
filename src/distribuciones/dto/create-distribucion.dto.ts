import { IsInt, IsNumber, IsDateString, IsString, IsIn, IsNotEmpty } from 'class-validator';

export class CreateDistribucionDto {
  @IsInt()
  @IsNotEmpty()
  id_perfil: number;

  @IsInt()
  @IsNotEmpty()
  id_proyecto: number;

  @IsDateString()
  @IsNotEmpty()
  fechaInicio: Date;

  @IsDateString()
  @IsNotEmpty()
  fechaFin: Date;

  @IsNumber()
  @IsNotEmpty()
  porcentaje: number;

  @IsString()
  @IsIn(['antiguo', 'nuevo'])
  @IsNotEmpty()
  estado: 'antiguo' | 'nuevo';
}
