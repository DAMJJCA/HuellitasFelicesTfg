import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface DisponibilidadVeterinario {
  idDisponibilidad?: number;
  idVeterinario: number;
  nombreVeterinario?: string;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  activo: boolean;
}

export type DisponibilidadVeterinarioDto = Omit<DisponibilidadVeterinario, 'idDisponibilidad' | 'nombreVeterinario'>;

export type TipoExcepcionDisponibilidad = 'disponible' | 'no_disponible';

export interface ExcepcionDisponibilidadVeterinario {
  idExcepcion?: number;
  idVeterinario: number;
  nombreVeterinario?: string;
  fecha: string;
  tipo: TipoExcepcionDisponibilidad;
  horaInicio: string | null;
  horaFin: string | null;
  motivo: string | null;
  activo: boolean;
}

export type ExcepcionDisponibilidadVeterinarioDto = Omit<ExcepcionDisponibilidadVeterinario, 'idExcepcion' | 'nombreVeterinario'>;

@Injectable({ providedIn: 'root' })
export class DisponibilidadVeterinarioService {
  private api = 'http://localhost:8080/api/disponibilidad-veterinarios';

  constructor(private http: HttpClient) {}

  getDisponibilidades(): Observable<DisponibilidadVeterinario[]> {
    return this.http.get<DisponibilidadVeterinario[]>(this.api);
  }

  getDisponibilidadVeterinario(idVeterinario: number): Observable<DisponibilidadVeterinario[]> {
    return this.http.get<DisponibilidadVeterinario[]>(`${this.api}/veterinario/${idVeterinario}`);
  }

  crearDisponibilidad(body: DisponibilidadVeterinarioDto): Observable<DisponibilidadVeterinario> {
    return this.http.post<DisponibilidadVeterinario>(this.api, body);
  }

  actualizarDisponibilidad(id: number, body: DisponibilidadVeterinarioDto): Observable<DisponibilidadVeterinario> {
    return this.http.put<DisponibilidadVeterinario>(`${this.api}/${id}`, body);
  }

  eliminarDisponibilidad(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  getExcepciones(): Observable<ExcepcionDisponibilidadVeterinario[]> {
    return this.http.get<ExcepcionDisponibilidadVeterinario[]>(`${this.api}/excepciones`);
  }

  getExcepcionesVeterinario(idVeterinario: number): Observable<ExcepcionDisponibilidadVeterinario[]> {
    return this.http.get<ExcepcionDisponibilidadVeterinario[]>(`${this.api}/veterinario/${idVeterinario}/excepciones`);
  }

  crearExcepcion(body: ExcepcionDisponibilidadVeterinarioDto): Observable<ExcepcionDisponibilidadVeterinario> {
    return this.http.post<ExcepcionDisponibilidadVeterinario>(`${this.api}/excepciones`, body);
  }

  actualizarExcepcion(id: number, body: ExcepcionDisponibilidadVeterinarioDto): Observable<ExcepcionDisponibilidadVeterinario> {
    return this.http.put<ExcepcionDisponibilidadVeterinario>(`${this.api}/excepciones/${id}`, body);
  }

  eliminarExcepcion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/excepciones/${id}`);
  }
}
