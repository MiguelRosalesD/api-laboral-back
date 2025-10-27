import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { DistribucionesService } from '../services/distribuciones.service';
import { CreateDistribucionDto } from '../dto/create-distribucion.dto';
import { UpdateDistribucionDto } from '../dto/update-distribucion.dto';
import { Distribucion } from '../entities/distribucion.entity';

@Controller('distribuciones')
export class DistribucionesController {
  constructor(private readonly distribucionesService: DistribucionesService) {}

  @Post()
  create(@Body() createDistribucionDto: CreateDistribucionDto): Promise<Distribucion> {
    return this.distribucionesService.create(createDistribucionDto);
  }

  @Get()
  findAll(): Promise<Distribucion[]> {
    return this.distribucionesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Distribucion> {
    return this.distribucionesService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDistribucionDto: UpdateDistribucionDto,
  ): Promise<Distribucion> {
    return this.distribucionesService.update(id, updateDistribucionDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.distribucionesService.remove(id);
  }
}
