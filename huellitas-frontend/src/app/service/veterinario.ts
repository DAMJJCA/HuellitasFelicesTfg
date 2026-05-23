import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { API_BASE_URL } from "../core/api.config";

export interface veterinario{
    idVeterinario?: number;
    nombre: string;
    especialidad: string;
    telefono: string;
    email: string;
}
export interface CrearVeterinarioDto {
    nombre: string;
    especialidad: string;
    telefono: string;
    email: string;
    password: string;
}
export type ActualizarVeterinarioDto = Omit<CrearVeterinarioDto, 'password'>;

@Injectable({ providedIn: 'root' })
export class VeterinarioService {
    private api = `${API_BASE_URL}/veterinarios`;

    constructor(private http: HttpClient) {}

    getVeterinarios(): Observable<veterinario[]> {
        return this.http.get<veterinario[]>(this.api);
    }

    crearVeterinario(veterinario: CrearVeterinarioDto): Observable<veterinario> {
        return this.http.post<veterinario>(this.api, veterinario);
    }

    eliminarVeterinario(id: number): Observable<void> {
        return this.http.delete<void>(`${this.api}/${id}`);
    }

    actualizarVeterinario(id: number, body: Partial<ActualizarVeterinarioDto>): Observable<veterinario> {
        return this.http.put<veterinario>(`${this.api}/${id}`, body);
    }

    getVeterinario(id: number): Observable<veterinario> {
        return this.http.get<veterinario>(`${this.api}/${id}`);
    }
}
