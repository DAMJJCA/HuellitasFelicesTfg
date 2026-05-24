import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api.config';

export type RolInterno = 'admin' | 'recepcion' | 'auxiliar';

export interface UsuarioInterno {
  idUsuario: number;
  nombreUsuario: string;
  email: string;
  rol: string;
  activo: boolean;
  creadoEn?: string;
  actualizadoEn?: string;
  profileImageUrl?: string | null;
}

export interface UsuarioInternoRequest {
  nombreUsuario: string;
  email: string;
  password?: string;
  rol: RolInterno;
  activo: boolean;
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private api = `${API_BASE_URL}/usuarios`;

  constructor(private http: HttpClient) {}

  listar(): Observable<UsuarioInterno[]> {
    return this.http.get<UsuarioInterno[]>(this.api);
  }

  crear(payload: UsuarioInternoRequest): Observable<UsuarioInterno> {
    return this.http.post<UsuarioInterno>(this.api, payload);
  }

  actualizar(id: number, payload: UsuarioInternoRequest): Observable<UsuarioInterno> {
    return this.http.put<UsuarioInterno>(`${this.api}/${id}`, payload);
  }

  cambiarActivo(id: number, activo: boolean): Observable<UsuarioInterno> {
    return this.http.patch<UsuarioInterno>(`${this.api}/${id}/activo`, { activo });
  }
}
