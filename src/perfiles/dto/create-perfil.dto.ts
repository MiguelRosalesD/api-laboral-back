import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';

export class CreatePerfilDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  nombre: string;

  @IsString()
  @IsNotEmpty()
  @Length(9, 9)  // DNI length is always 9
  @Matches(/^[0-9]{8}[A-Z]$/, { message: 'DNI debe tener 8 números seguidos de una letra mayúscula' })
  dni: string;
}
