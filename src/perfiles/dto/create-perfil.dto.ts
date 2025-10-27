import { IsString, IsNotEmpty, Length } from 'class-validator';

export class CreatePerfilDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  nombre: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 20)
  dni: string;
}
