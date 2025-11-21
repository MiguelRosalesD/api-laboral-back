import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuditoriaService } from '../services/auditoria.service';
import { AuditoriaQueryDto } from '../dto/auditoria-query.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guards';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { Auditoria } from '../entities/auditoria.entity';

@Controller('auditoria')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @Get()
  async findAll(@Query() query: AuditoriaQueryDto): Promise<Auditoria[]> {
    return this.auditoriaService.findAll(query);
  }

  @Get(':id')
  async findById(@Param('id') id: number): Promise<Auditoria | undefined> {
    return this.auditoriaService.findById(id);
  }

  @Get(':entidad/:entidadId')
  async findByEntidad(
    @Param('entidad') entidad: 'Perfil' | 'Proyecto' | 'Distribucion' | 'Registro' | 'ImportExcel',
    @Param('entidadId') entidadId: number,
  ): Promise<Auditoria[]> {
    return this.auditoriaService.findByEntidad(entidad, entidadId);
  }
}
