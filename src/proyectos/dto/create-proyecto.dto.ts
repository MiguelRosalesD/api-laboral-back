import { IsString, IsNotEmpty, Length } from 'class-validator';

export class CreateProyectoDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  nombre: string;
}
