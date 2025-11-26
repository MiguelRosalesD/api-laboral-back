import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditoriaService } from '../../auditoria/services/auditoria.service';

@Injectable()
export class AuditoriaInterceptor implements NestInterceptor {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { user, method, url, body, ip } = request;

    return next.handle().pipe(
      tap((response) => {
        // No auditar rutas de autenticación ni status
        if (url.includes('/auth/') || url.includes('/status')) {
          return;
        }

        // Solo auditar CUD (Create, Update, Delete)
        let accion: 'CREATE' | 'UPDATE' | 'DELETE' | undefined;
        if (method === 'POST') accion = 'CREATE';
        else if (method === 'PATCH' || method === 'PUT') accion = 'UPDATE';
        else if (method === 'DELETE') accion = 'DELETE';
        else return;

        // Mapear rutas a entidades
        const entityMap: Record<string, 'Perfil' | 'Proyecto' | 'Distribucion' | 'Registro' | 'ImportExcel'> = {
          'perfiles': 'Perfil',
          'proyectos': 'Proyecto',
          'distribuciones': 'Distribucion',
          'registros': 'Registro',
          'import': 'ImportExcel',
        };

        // Extraer entidad e ID de la URL
        const match = url.match(/\/(perfiles|proyectos|distribuciones|registros|import)(?:\/(excel|\d+))?/);
        if (!match) return;

        const routeName = match[1];
        const entidad = entityMap[routeName];
        
        let entidadId: number | undefined;
        if (accion === 'CREATE') {
          // Para imports usar timestamp
          if (routeName === 'import') {
            entidadId = Date.now();
          } else {
            entidadId = response?.id;
          }
        } else {
          // Para UPDATE y DELETE, el ID siempre está en la URL
          entidadId = match[2] ? Number(match[2]) : undefined;
        }

        if (!entidad || !entidadId) {
          console.warn(`[AuditoriaInterceptor] No se pudo extraer entidad o ID. Entidad: ${entidad}, ID: ${entidadId}, URL: ${url}, Método: ${method}`);
          return;
        }

        // No auditar si no hay usuario autenticado
        if (!user?.email) {
          console.warn('[AuditoriaInterceptor] No hay usuario autenticado');
          return;
        }

        // Generar detalles más legibles
        let detalles = '';
        if (accion === 'CREATE') {
          // Diferentes entidades tienen diferentes campos identificadores
          let identificador = '';
          if (response?.nombre) {
            identificador = `: ${response.nombre}`;
          } else if (routeName === 'distribuciones' && response?.perfil && response?.proyecto) {
            identificador = `: ${response.perfil.nombre} - ${response.proyecto.nombre}`;
          } else if (routeName === 'registros' && response?.perfil) {
            identificador = `: ${response.perfil.nombre}`;
          } else if (routeName === 'import' && response?.totalFilas) {
            identificador = `: ${response.totalFilas} registros importados`;
          }
          detalles = `Creado nuevo ${entidad}${identificador}`;
        } else if (accion === 'UPDATE') {
          let identificador = '';
          if (response?.nombre) {
            identificador = `: ${response.nombre}`;
          } else if (routeName === 'distribuciones' && response?.perfil && response?.proyecto) {
            identificador = `: ${response.perfil.nombre} - ${response.proyecto.nombre}`;
          } else if (routeName === 'registros' && response?.perfil) {
            identificador = `: ${response.perfil.nombre}`;
          }
          detalles = `Actualizado ${entidad}${identificador}`;
        } else if (accion === 'DELETE') {
          let identificador = '';
          if (response?.nombre) {
            identificador = `: ${response.nombre}`;
          } else if (routeName === 'distribuciones' && response?.perfil && response?.proyecto) {
            identificador = `: ${response.perfil.nombre} - ${response.proyecto.nombre}`;
          } else if (routeName === 'registros' && response?.perfil) {
            identificador = `: ${response.perfil.nombre}`;
          } else {
            identificador = ` #${entidadId}`;
          }
          detalles = `Eliminado ${entidad}${identificador}`;
        }

        // Ejecutar sin await para no bloquear la respuesta
        this.auditoriaService.create({
          usuario: user.email,
          accion,
          entidad,
          entidadId,
          detalles,
          fecha: new Date(),
          ip: ip || request.connection?.remoteAddress || request.socket?.remoteAddress,
        }).catch((err) => {
          console.error('[AuditoriaInterceptor] Error al crear registro de auditoría:', err);
        });
      }),
    );
  }
}