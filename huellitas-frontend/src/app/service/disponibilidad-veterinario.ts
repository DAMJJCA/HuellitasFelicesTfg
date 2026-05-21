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
}
