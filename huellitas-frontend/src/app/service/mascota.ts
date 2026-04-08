import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

export interface Mascotas {
  idMascota?: number;
  nombre: string;
  especie: string;
  raza: string;
  fechaNacimiento: string | null;
  peso: number | null;
  sexo: string;
  cliente: {
    idCliente: number;
    nombre: string;
    apellidos: string;
  };
}

export type CrearMascotaDto = {
  nombre: string;
  especie: string;
  raza: string;
  fechaNacimiento: string | null;
  peso: number | null;
  sexo: string;
  cliente: { idCliente: number };
};

@Injectable({ providedIn: 'root' })
export class MascotaService {
  private api = 'http://localhost:8080/api/mascotas';

  constructor(private http: HttpClient) {}

  getMascotas(): Observable<Mascotas[]> {
    return this.http.get<Mascotas[]>(this.api);
  }

  crearMascota(mascota: CrearMascotaDto): Observable<Mascotas> {
    return this.http.post<Mascotas>(this.api, mascota);
  }

  eliminarMascota(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  actualizarMascota(id: number, body: Partial<CrearMascotaDto>): Observable<Mascotas> {
    return this.http.put<Mascotas>(`${this.api}/${id}`, body);
  }

  getMascota(id: number): Observable<Mascotas> {
    return this.http.get<Mascotas>(`${this.api}/${id}`);
  }
}
