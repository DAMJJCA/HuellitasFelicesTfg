import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

export interface Cita {
  idCita?: number;
  fecha: string;
  hora: string;
  estado: string;
  motivo: string;

  mascota: {
    idMascota: number;
    nombre?: string;
  };

  veterinario: {
    idVeterinario: number;
    nombre?: string;
  };
}
export type CrearCitaDto = Omit<Cita, 'idCita'>;

@Injectable({providedIn: 'root'})
export class CitaService {
  private api = 'http://localhost:8080/api/citas';

  constructor(private http: HttpClient) {}

  getCitas(): Observable<Cita[]> {
    return this.http.get<Cita[]>(this.api);
  }
  crearCita(cita: CrearCitaDto): Observable<Cita> {
    return this.http.post<Cita>(this.api, cita);
  }
  eliminarCita(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
  actualizarCita(id: number, body: Partial<CrearCitaDto>): Observable<Cita> {
    return this.http.put<Cita>(`${this.api}/${id}`, body);
  }
  getCita(id: number): Observable<Cita> {
    return this.http.get<Cita>(`${this.api}/${id}`);
  }
}
