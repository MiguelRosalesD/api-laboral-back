export interface RegistroAuditoria {
  id: number;
  usuario: string;
  accion: 'CREATE' | 'UPDATE' | 'DELETE';
  entidad: 'Perfil' | 'Proyecto' | 'Distribucion' | 'Registro';
  entidadId: number;
  detalles?: string;
  fecha: string;
  ip?: string;
}
