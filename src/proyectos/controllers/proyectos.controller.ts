import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ProyectosService } from '../services/proyectos.service';
import { CreateProyectoDto } from '../dto/create-proyecto.dto';
import { UpdateProyectoDto } from '../dto/update-proyecto.dto';
import { Proyecto } from '../entities/proyecto.entity';

@Controller('proyectos')
export class ProyectosController {
  constructor(private readonly proyectosService: ProyectosService) {}

  @Post()
  create(@Body() createProyectoDto: CreateProyectoDto): Promise<Proyecto> {
    return this.proyectosService.create(createProyectoDto);
  }

  @Get()
  findAll(): Promise<Proyecto[]> {
    return this.proyectosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Proyecto> {
    return this.proyectosService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProyectoDto: UpdateProyectoDto,
  ): Promise<Proyecto> {
    return this.proyectosService.update(id, updateProyectoDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.proyectosService.remove(id);
  }
}
