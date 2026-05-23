import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api.config';

export interface Tratamiento {
  idTratamiento?: number;
  nombre: string;
  descripcion: string;
  dosis: string;
  duracion: string;
  medicamento: string;


  nombreMascota: string;

  consulta: {
    idConsulta: number;
  };
}

@Injectable({ providedIn: 'root' })
@Injectable({
  providedIn: 'root'
})
export class TratamientoService {

  private api = `${API_BASE_URL}/tratamientos`;

  constructor(private http: HttpClient) {}

  getTratamientos(): Observable<Tratamiento[]> {
    return this.http.get<Tratamiento[]>(this.api);
  }
  crearTratamiento(tratamiento: Tratamiento): Observable<Tratamiento> {
    return this.http.post<Tratamiento>(this.api, tratamiento);
  }

  actualizarTratamiento(id: number, body: Partial<Tratamiento>): Observable<Tratamiento> {
    return this.http.put<Tratamiento>(`${this.api}/${id}`, body);
  }

  getTratamiento(id: number): Observable<Tratamiento> {
    return this.http.get<Tratamiento>(`${this.api}/${id}`);
  }

  getTratamientosPorMascota(idMascota: number): Observable<Tratamiento[]> {
    return this.http.get<Tratamiento[]>(
      `${this.api}/mascota/${idMascota}`
    );
  }
  crear(tratamiento: any): Observable<Tratamiento> {
    return this.http.post<Tratamiento>(this.api, tratamiento);
  }
  eliminarTratamiento(idTratamiento: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${idTratamiento}`);
  }
}

