import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';

export class CreatePerfilDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  nombre: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 20)
  @Matches(/^\d{8][A-Z]$/, { message: 'DNI minválido'})
  dni: string;
}
