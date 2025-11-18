// src/import/controllers/import.controller.ts

import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards, // Importación de NestJS para usar Guardias
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportService } from './import.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApiConsumes, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ImportExcelDto } from './dto/import-excel.dto';

// Importaciones de Seguridad
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guards';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';


@ApiTags('import')
@Controller('import')
@UseGuards(JwtAuthGuard, RolesGuard) // Aplicamos las guardias a nivel de controlador/método
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('excel')
  @Roles(UserRole.ADMIN) // <--- RESTRINGIDO: Solo ADMIN puede importar Excel
  @ApiOperation({ summary: 'Subir archivo Excel para procesar registros' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        fechaInicio: {
          type: 'string',
          format: 'date',
          example: '2025-01-01',
        },
        fechaFin: {
          type: 'string',
          format: 'date',
          example: '2025-12-31',
        },
        empresa: {
          type: 'string',
          example: 'DLTCode',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(xls|xlsx)$/)) {
          return callback(new Error('Solo se permiten archivos Excel'), false);
        }
        callback(null, true);
      },
    }),
  )
  async uploadExcel(
    @UploadedFile() file: Express.Multer.File,
    @Body() importExcelDto: ImportExcelDto,
  ) {
    if (!file) {
      // Nota: NestJS/Multer ya manejaría esto, pero es una buena comprobación.
      throw new Error('No se ha subido ningún archivo');
    }

    const result = await this.importService.processExcel(
      file.path,
      importExcelDto.fechaInicio,
      importExcelDto.fechaFin,
      importExcelDto.empresa,
    );

    return {
      message: 'Archivo procesado correctamente',
      totalFilas: result.length,
      datos: result,
    };
  }
}