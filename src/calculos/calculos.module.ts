import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalculosService } from './calculos.service';
import { CalculosController } from './calculos.controller';
import { Perfil } from '../perfiles/entities/perfil.entity';
import { Registro } from '../registros/entities/registro.entity';
import { Distribucion } from '../distribuciones/entities/distribucion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Perfil, Registro, Distribucion])],
  providers: [CalculosService],
  controllers: [CalculosController],
  exports: [CalculosService],
})
export class CalculosModule {}
