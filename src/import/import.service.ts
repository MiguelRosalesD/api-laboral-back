import { Injectable, BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { Perfil } from '../perfiles/entities/perfil.entity';
import { Registro } from '../registros/entities/registro.entity';

@Injectable()
export class ImportService {
  constructor(
    @InjectRepository(Perfil) private readonly perfilRepo: Repository<Perfil>,
    @InjectRepository(Registro) private readonly registroRepo: Repository<Registro>,
  ) {}

  async processExcel(filePath: string) {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[1];
      if (!sheetName) throw new BadRequestException('No se encontró la hoja 2 en el Excel');

      const sheet = workbook.Sheets[sheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: null });
      const results: Registro[] = [];
      
      for (const row of rows) {
        const nombre = String(row['__EMPTY_2'] ?? '').trim();
        const dni = String(row['__EMPTY_3'] ?? '').trim();
        const devengado = parseFloat(row['__EMPTY_7'] ?? 0);
        const aportacion = parseFloat(row['__EMPTY_12'] ?? 0);

         if (!nombre || !dni || nombre=='TRABAJADOR') continue;
        // Buscar si el perfil existe
        let perfil = await this.perfilRepo.findOne({ where: { dni } });
        if (!perfil) {
          perfil = this.perfilRepo.create({ nombre, dni });
          perfil = await this.perfilRepo.save(perfil);
        }

        // Crear registro con DeepPartial
        const registroData: any = {
          perfil,
          tipoDato: 'real',
          devengado,
          aportacion,
          horas: 1800,
          fechaInicio: new Date(),
          fechaFin: new Date(),
          empresa: 'DLTCode',
          multiplicadorInferior: 0.34,
          multiplicadorSuperior: 0.32,
        };

        const registro = this.registroRepo.create(registroData);
        const savedRegistro = await this.registroRepo.save(registro as any as Registro);

        results.push(savedRegistro); 
      }

      return results;
    } catch (err) {
      throw new BadRequestException(`Error procesando Excel: ${err.message ?? err}`);
    }
  }
}
