import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

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

@Injectable({
  providedIn: 'root'
})
export class TratamientoService {

  private api = 'http://localhost:8080/api/tratamientos';

  constructor(private http: HttpClient) {}

  getTratamientos(): Observable<Tratamiento[]> {
    return this.http.get<Tratamiento[]>(this.api);
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