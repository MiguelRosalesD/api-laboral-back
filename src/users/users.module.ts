// src/users/users.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './services/users.service';
// Importa Controllers, si los tienes

@Module({
  imports: [
    // Asegúrate de importar la entidad User
    TypeOrmModule.forFeature([User]),
  ],
  providers: [UsersService],
  // Exportamos UsersService para que AuthService pueda usarlo
  exports: [UsersService, TypeOrmModule.forFeature([User])],
})
export class UsersModule {}