import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { RegistrosService } from '../services/registros.service';
import { CreateRegistroDto } from '../dto/create-registro.dto';
import { UpdateRegistroDto } from '../dto/update-registro.dto';
import { Registro } from '../entities/registro.entity';

@Controller('registros')
export class RegistrosController {
  constructor(private readonly registrosService: RegistrosService) {}

  @Post()
  create(@Body() createRegistroDto: CreateRegistroDto): Promise<Registro> {
    return this.registrosService.create(createRegistroDto);
  }

  @Get()
  findAll(): Promise<Registro[]> {
    return this.registrosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Registro> {
    return this.registrosService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRegistroDto: UpdateRegistroDto,
  ): Promise<Registro> {
    return this.registrosService.update(id, updateRegistroDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.registrosService.remove(id);
  }
}
