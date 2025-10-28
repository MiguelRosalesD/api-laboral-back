import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { StatusModule } from './status/status.module';
import { PerfilesModule } from './perfiles/perfiles.module';
import { ProyectosModule } from './proyectos/proyectos.module';
import { DistribucionesModule } from './distribuciones/distribuciones.module';
import { RegistrosModule } from './registros/registros.module';
import { ImportModule } from './import/import.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRoot({
      type: process.env.DB_TYPE as any,
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),

    UsersModule,
    AuthModule,
    StatusModule,
    PerfilesModule,
    ProyectosModule,
    DistribucionesModule,
    RegistrosModule,
    ImportModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
