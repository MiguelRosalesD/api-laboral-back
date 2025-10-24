// api-laboral-back/src/status/status.module.ts

import { Module } from '@nestjs/common';
import { StatusController } from './status.controller';

@Module({
  controllers: [StatusController],
})
export class StatusModule {}