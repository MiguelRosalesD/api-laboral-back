import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditoriaService } from '../../auditoria/services/auditoria.service';

@Injectable()
export class AuditoriaInterceptor implements NestInterceptor {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { user, method, url, body, ip } = request;

    return next.handle().pipe(
      tap(async (response) => {
        // Solo auditar operaciones CUD (Create, Update, Delete)
        let accion: 'CREATE' | 'UPDATE' | 'DELETE' | undefined;
        if (method === 'POST') accion = 'CREATE';
        else if (method === 'PATCH' || method === 'PUT') accion = 'UPDATE';
        else if (method === 'DELETE') accion = 'DELETE';
        else return;

        // Mapear rutas plurales a nombres de entidad singulares
        const entityMap: Record<string, 'Perfil' | 'Proyecto' | 'Distribucion' | 'Registro'> = {
          'perfiles': 'Perfil',
          'proyectos': 'Proyecto',
          'distribuciones': 'Distribucion',
          'registros': 'Registro',
        };

        // Extraer entidad e ID de la URL
        // Formato: /perfiles/:id o /perfiles (para POST)
        const match = url.match(/\/(perfiles|proyectos|distribuciones|registros)(?:\/(\d+))?/);
        if (!match) return;

        const routeName = match[1];
        const entidad = entityMap[routeName];
        
        // Para POST, el ID viene en la respuesta
        // Para PUT/PATCH/DELETE, el ID viene en la URL
        let entidadId: number | undefined;
        if (accion === 'CREATE') {
          entidadId = response?.id;
        } else {
          entidadId = match[2] ? Number(match[2]) : undefined;
        }

        if (!entidad || !entidadId) return;

        // No auditar si no hay usuario autenticado
        if (!user?.email) return;

        await this.auditoriaService.create({
          usuario: user.email,
          accion,
          entidad,
          entidadId,
          detalles: JSON.stringify({ body, response }),
          fecha: new Date(),
          ip,
        });
      }),
    );
  }
}
