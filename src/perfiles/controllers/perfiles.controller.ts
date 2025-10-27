import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { PerfilesService } from '../services/perfiles.service';
import { CreatePerfilDto } from '../dto/create-perfil.dto';
import { UpdatePerfilDto } from '../dto/update-perfil.dto';
import { Perfil } from '../entities/perfil.entity';

@Controller('perfiles')
export class PerfilesController {
  constructor(private readonly perfilesService: PerfilesService) {}

  @Post()
  create(@Body() createPerfilDto: CreatePerfilDto): Promise<Perfil> {
    return this.perfilesService.create(createPerfilDto);
  }

  @Get()
  findAll(): Promise<Perfil[]> {
    return this.perfilesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Perfil> {
    return this.perfilesService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePerfilDto: UpdatePerfilDto,
  ): Promise<Perfil> {
    return this.perfilesService.update(id, updatePerfilDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.perfilesService.remove(id);
  }
}
