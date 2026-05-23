import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api.config';

export type TipoPreventivo = 'vacuna' | 'desparasitacion';

export interface Preventivo {
  idRegistro?: number;
  idMascota: number;
  nombreMascota?: string;
  idVeterinario?: number | null;
  nombreVeterinario?: string | null;
  tipo: TipoPreventivo;
  nombre: string;
  fechaAplicacion: string | null;
  proximaDosis: string | null;
  observaciones: string | null;
}

export type PreventivoDto = Omit<Preventivo, 'idRegistro' | 'nombreMascota' | 'nombreVeterinario'>;

export interface ReminderResponse {
  encontradas: number;
  enviadas: number;
  omitidas: number;
  mensaje: string;
}

@Injectable({ providedIn: 'root' })
export class PreventivoService {
  private api = `${API_BASE_URL}/preventivos`;

  constructor(private http: HttpClient) {}

  getPreventivos(): Observable<Preventivo[]> {
    return this.http.get<Preventivo[]>(this.api);
  }

  getProximos(): Observable<Preventivo[]> {
    return this.http.get<Preventivo[]>(`${this.api}/proximos`);
  }

  crearPreventivo(body: PreventivoDto): Observable<Preventivo> {
    return this.http.post<Preventivo>(this.api, body);
  }

  actualizarPreventivo(id: number, body: PreventivoDto): Observable<Preventivo> {
    return this.http.put<Preventivo>(`${this.api}/${id}`, body);
  }

  eliminarPreventivo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  enviarRecordatoriosProximasDosis(): Observable<ReminderResponse> {
    return this.http.post<ReminderResponse>(`${this.api}/recordatorios/proximas-dosis`, {});
  }
}
