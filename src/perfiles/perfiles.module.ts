import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PerfilesService } from './services/perfiles.service';
import { PerfilesController } from './controllers/perfiles.controller';
import { Perfil } from './entities/perfil.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Perfil])],
  controllers: [PerfilesController],
  providers: [PerfilesService],
})
export class PerfilesModule {}
