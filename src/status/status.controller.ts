// api-laboral-back/src/status/status.controller.ts

import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

@Controller('status')
export class StatusController {
  /**
   * Endpoint de prueba simple para verificar que la API está viva y respondiendo.
   * No requiere autenticación.
   * @returns Mensaje de estado.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  checkStatus() {
    return { 
      message: 'API está activa y funcionando.',
      timestamp: new Date().toISOString()
    };
  }
}