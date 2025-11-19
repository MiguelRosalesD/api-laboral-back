import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PerfilesService } from './services/perfiles.service';
import { PerfilesController } from './controllers/perfiles.controller';
import { Perfil } from './entities/perfil.entity';
import { AuditoriaModule } from '../auditoria/auditoria.module';

@Module({
  imports: [TypeOrmModule.forFeature([Perfil]), AuditoriaModule],
  controllers: [PerfilesController],
  providers: [PerfilesService],
})
export class PerfilesModule {}
