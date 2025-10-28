import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';
import { Perfil } from '../perfiles/entities/perfil.entity';
import { Registro } from '../registros/entities/registro.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Perfil, Registro]), // Repositorios disponibles para el servicio
  ],
  controllers: [ImportController],
  providers: [ImportService],
})
export class ImportModule {}
