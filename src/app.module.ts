// api-laboral-back/src/app.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// Importamos los módulos de funcionalidad que ya generamos (aunque estén vacíos)
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [

    ConfigModule.forRoot({
      isGlobal: true, 
    }),

    TypeOrmModule.forRoot({
      // Usamos las variables del .env que ConfigModule cargó
      type: process.env.DB_TYPE as any, 
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432', 10), // Convierte el puerto a número y le ponemos un default para evitar errores
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      
      // Busca todas las Entidades (modelos de DB) en la carpeta del proyecto
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      
      // IMPORTANTE: SOLO para desarrollo. Crea las tablas automáticamente.
      synchronize: true, 
    }),

    UsersModule, 
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}