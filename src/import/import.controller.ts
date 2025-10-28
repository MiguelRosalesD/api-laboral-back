import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportService } from './import.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApiConsumes, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('import')
@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('excel')
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
  async uploadExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('No se ha subido ningún archivo');
    }

    const result = await this.importService.processExcel(file.path);

    return {
      message: 'Archivo procesado correctamente',
      totalFilas: result.length,
      datos: result,
    };
  }
}
