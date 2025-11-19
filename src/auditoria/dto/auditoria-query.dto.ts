import { IsOptional, IsString, IsIn } from 'class-validator';

export class AuditoriaQueryDto {
  @IsOptional()
  @IsString()
  usuario?: string;

  @IsOptional()
  @IsIn(['CREATE', 'UPDATE', 'DELETE'])
  accion?: 'CREATE' | 'UPDATE' | 'DELETE';

  @IsOptional()
  @IsIn(['Perfil', 'Proyecto', 'Distribucion', 'Registro'])
  entidad?: 'Perfil' | 'Proyecto' | 'Distribucion' | 'Registro';

  @IsOptional()
  @IsString()
  fechaInicio?: string;

  @IsOptional()
  @IsString()
  fechaFin?: string;
}
