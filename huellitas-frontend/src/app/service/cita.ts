import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

export type EstadoCita = 'programada' | 'confirmada' | 'en_consulta' | 'realizada' | 'cancelada';

export interface ReminderResponse {
  encontradas: number;
  enviadas: number;
  omitidas: number;
  mensaje: string;
}

export interface Cita {
  idCita?: number;
  fecha: string;
  hora: string;
  duracionMinutos?: number;
  estado: EstadoCita | string;
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

export interface CitaDuracion {
  idCita: number;
  duracionMinutos: number;
}

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
  actualizarEstado(id: number, estado: EstadoCita): Observable<Cita> {
    return this.http.patch<Cita>(`${this.api}/${id}/estado`, { estado });
  }
  enviarRecordatoriosProximas(): Observable<ReminderResponse> {
    return this.http.post<ReminderResponse>(`${this.api}/recordatorios/proximas`, {});
  }
  getCita(id: number): Observable<Cita> {
    return this.http.get<Cita>(`${this.api}/${id}`);
  }
  getDuraciones(): Observable<CitaDuracion[]> {
    return this.http.get<CitaDuracion[]>('http://localhost:8080/api/citas-duraciones');
  }
  guardarDuracion(idCita: number, duracionMinutos: number): Observable<CitaDuracion> {
    return this.http.put<CitaDuracion>(`http://localhost:8080/api/citas-duraciones/${idCita}`, { duracionMinutos });
  }
}
