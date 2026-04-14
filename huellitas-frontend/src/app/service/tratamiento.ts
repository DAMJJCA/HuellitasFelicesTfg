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

<<<<<<< HEAD
=======
  nombreMascota: string;

>>>>>>> Jorge
  consulta: {
    idConsulta: number;
  };
}

<<<<<<< HEAD
@Injectable({ providedIn: 'root' })
=======
@Injectable({
  providedIn: 'root'
})
>>>>>>> Jorge
export class TratamientoService {

  private api = 'http://localhost:8080/api/tratamientos';

  constructor(private http: HttpClient) {}

  getTratamientos(): Observable<Tratamiento[]> {
    return this.http.get<Tratamiento[]>(this.api);
  }
<<<<<<< HEAD

  crearTratamiento(tratamiento: Tratamiento): Observable<Tratamiento> {
    return this.http.post<Tratamiento>(this.api, tratamiento);
  }

  eliminarTratamiento(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  actualizarTratamiento(id: number, body: Partial<Tratamiento>): Observable<Tratamiento> {
    return this.http.put<Tratamiento>(`${this.api}/${id}`, body);
  }

  getTratamiento(id: number): Observable<Tratamiento> {
    return this.http.get<Tratamiento>(`${this.api}/${id}`);
  }
}
=======
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
>>>>>>> Jorge
