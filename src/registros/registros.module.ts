import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrosService } from './services/registros.service';
import { RegistrosController } from './controllers/registros.controller';
import { Registro } from './entities/registro.entity';
import { Perfil } from '../perfiles/entities/perfil.entity';
import { AuditoriaModule } from '../auditoria/auditoria.module';

@Module({
  imports: [TypeOrmModule.forFeature([Registro, Perfil]), AuditoriaModule],
  controllers: [RegistrosController],
  providers: [RegistrosService],
})
export class RegistrosModule {}
