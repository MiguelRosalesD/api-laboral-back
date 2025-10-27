import { PartialType } from '@nestjs/swagger';
import { CreateDistribucionDto } from './create-distribucion.dto';

export class UpdateDistribucionDto extends PartialType(CreateDistribucionDto) {}
