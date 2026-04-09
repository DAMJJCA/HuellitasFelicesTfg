import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

/**
 * Modelo de Tratamiento
 * Debe coincidir con el backend (JPA)
 */
export interface Tratamiento {
  idTratamiento?: number;
  nombre: string;
  descripcion: string;
  dosis: string;
  duracion: string;
  medicamento: string;

  // Relación con consulta (el backend espera un objeto)
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

  /**
   * ✅ Obtener TODOS los tratamientos
   * Usado en la página de tratamientos (solo lectura)
   */
  getTratamientos(): Observable<Tratamiento[]> {
    return this.http.get<Tratamiento[]>(this.api);
  }

  /**
   *  Obtener tratamientos por mascota
   */
  getTratamientosPorMascota(idMascota: number): Observable<Tratamiento[]> {
    return this.http.get<Tratamiento[]>(
      `${this.api}/mascota/${idMascota}`
    );
  }

  /**
   *  Crear tratamiento
   */
  crear(tratamiento: Tratamiento): Observable<Tratamiento> {
    return this.http.post<Tratamiento>(this.api, tratamiento);
  }

  /**
   *  Eliminar tratamiento (opcional)
   */
  eliminarTratamiento(idTratamiento: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${idTratamiento}`);
  }
}
