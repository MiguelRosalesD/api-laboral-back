import { Injectable, NestMiddleware } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';

@Injectable()
export class CreateUploadsFolderMiddleware implements NestMiddleware {
  async use(req: any, res: any, next: () => void) {
    const uploadDir = path.join(process.cwd(), 'uploads');

    try {
      await fs.mkdir(uploadDir, { recursive: true });
    } catch (error) {
      console.warn(`No se pudo crear la carpeta de uploads: ${error.message}`);
    }

    next();
  }
}
