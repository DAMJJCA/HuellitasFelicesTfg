import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api.config';

export interface AuditoriaClinica {
  idAuditoria: number;
  entidad: string;
  idEntidad: number | null;
  accion: string;
  idUsuario: number | null;
  rolUsuario: string | null;
  resumen: string | null;
  creadoEn: string;
}

@Injectable({ providedIn: 'root' })
export class AuditoriaClinicaService {
  private api = `${API_BASE_URL}/auditoria-clinica`;

  constructor(private http: HttpClient) {}

  recientes(): Observable<AuditoriaClinica[]> {
    return this.http.get<AuditoriaClinica[]>(this.api);
  }
}
