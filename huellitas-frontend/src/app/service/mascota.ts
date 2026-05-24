import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { API_BASE_URL } from "../core/api.config";

export interface Mascotas {
  idMascota?: number;
  nombre: string;
  especie: string;
  raza: string;
  numeroChip?: string | null;
  fotoUrl?: string | null;
  alergias?: string | null;
  enfermedadesCronicas?: string | null;
  medicacionHabitual?: string | null;
  observacionesInternas?: string | null;
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
  numeroChip?: string | null;
  fotoUrl?: string | null;
  alergias?: string | null;
  enfermedadesCronicas?: string | null;
  medicacionHabitual?: string | null;
  observacionesInternas?: string | null;
  fechaNacimiento: string | null;
  peso: number | null;
  sexo: string;
  cliente?: { idCliente: number };
};

@Injectable({ providedIn: 'root' })
export class MascotaService {
  private api = `${API_BASE_URL}/mascotas`;

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
  totalMascotas(): Observable<number> {
    return this.http.get<number>(`${this.api}/total`);
  }
}
