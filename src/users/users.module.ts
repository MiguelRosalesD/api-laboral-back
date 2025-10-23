// api-laboral-back/src/users/users.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity'; //

@Module({
  // Necesitas la Entidad aquí para que TypeORM sepa que existe
  imports: [TypeOrmModule.forFeature([User])], 
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}