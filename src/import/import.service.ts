import { Injectable, BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Perfil } from '../perfiles/entities/perfil.entity';
import { Registro } from '../registros/entities/registro.entity';
import { promises as fs } from 'fs';

@Injectable()
export class ImportService {
  constructor(
    @InjectRepository(Perfil)
    private readonly perfilRepo: Repository<Perfil>,
    @InjectRepository(Registro)
    private readonly registroRepo: Repository<Registro>,
  ) {}

  async processExcel(filePath: string) {
    try {
      const workbook = XLSX.readFile(filePath);

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new BadRequestException('El archivo Excel no contiene hojas válidas');
      }

      const results: Registro[] = [];

      //  Recorremos todas las hojas del Excel
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: null });

        for (const row of rows) {
          const nombre = String(row['__EMPTY_2'] ?? '').trim();
          const dni = String(row['__EMPTY_3'] ?? '').trim();
          const devengado = parseFloat(row['__EMPTY_7'] ?? 0);
          const aportacion = parseFloat(row['__EMPTY_12'] ?? 0);

          // Saltar filas vacías o encabezados
          if (!nombre || !dni || nombre.toUpperCase() === 'TRABAJADOR') continue;

          //  Buscar o crear perfil
          let perfil = await this.perfilRepo.findOne({ where: { dni } });
          if (!perfil) {
            perfil = this.perfilRepo.create({ nombre, dni });
            perfil = await this.perfilRepo.save(perfil);
          }

          //  Crear registro asociado
          const registroData: Partial<Registro> = {
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
          const savedRegistro = await this.registroRepo.save(registro);

          results.push(savedRegistro);
        }
      }

      //  Borrar el archivo Excel después de procesarlo
      await fs.unlink(filePath).catch(() => {
        console.warn(`⚠️ No se pudo eliminar el archivo temporal: ${filePath}`);
      });

      return results;
    } catch (err) {
      // Intentar limpiar incluso en caso de error
      await fs.unlink(filePath).catch(() => {});
      throw new BadRequestException(`Error procesando Excel: ${err.message ?? err}`);
    }
  }
}
