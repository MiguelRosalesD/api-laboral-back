import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DistribucionesService } from './services/distribuciones.service';
import { DistribucionesController } from './controllers/distribuciones.controller';
import { Distribucion } from './entities/distribucion.entity';
import { Perfil } from '../perfiles/entities/perfil.entity';
import { Proyecto } from '../proyectos/entities/proyecto.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Distribucion, Perfil, Proyecto])],
  controllers: [DistribucionesController],
  providers: [DistribucionesService],
})
export class DistribucionesModule {}
