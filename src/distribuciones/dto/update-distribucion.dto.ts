import { PartialType } from '@nestjs/mapped-types';
import { CreateDistribucionDto } from './create-distribucion.dto';

export class UpdateDistribucionDto extends PartialType(CreateDistribucionDto) {}
