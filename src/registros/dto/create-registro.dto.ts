import { IsInt, IsNumber, IsDateString, IsString, IsIn, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateRegistroDto {
  @IsInt()
  @IsNotEmpty()
  id_perfil: number;

  @IsIn(['real', 'estimacion'])
  @IsNotEmpty()
  tipoDato: 'real' | 'estimacion';

  @IsInt()
  @IsNotEmpty()
  devengado: number;

  @IsInt()
  @IsNotEmpty()
  aportacion: number;

  @IsInt()
  @IsNotEmpty()
  horas: number;

  @IsDateString()
  @IsNotEmpty()
  fechaInicio: Date;

  @IsDateString()
  @IsNotEmpty()
  fechaFin: Date;

  @IsString()
  @IsNotEmpty()
  empresa: string;

  @IsNumber()
  @IsNotEmpty()
  multiplicadorInferior: number;

  @IsNumber()
  @IsNotEmpty()
  multiplicadorSuperior: number;
}
