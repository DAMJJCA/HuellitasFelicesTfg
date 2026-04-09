import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

export interface Consulta {
  idConsulta: number;
  fecha: string;
  hora: string;
  diagnostico: string;
  observaciones: string;
  tratamiento: boolean;

  // ✅ vienen directo del backend
  idCita: number;
  nombreMascota: string;
}

@Injectable({ providedIn: 'root' })
export class ConsultaService {

  private api = 'http://localhost:8080/api/consultas';

  constructor(private http: HttpClient) { }

  getConsultas(): Observable<Consulta[]> {
    return this.http.get<Consulta[]>(this.api);
  }

  getConsulta(id: number): Observable<Consulta> {
    return this.http.get<Consulta>(`${this.api}/${id}`);
  }

  getConsultasPorMascota(idMascota: number) {
    return this.http.get<Consulta[]>(
      `${this.api}/mascota/${idMascota}`
    );
  }

  actualizarConsulta(id: number, body: Partial<Consulta>): Observable<Consulta> {
    return this.http.put<Consulta>(`${this.api}/${id}`, body);
  }

  eliminarConsulta(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
