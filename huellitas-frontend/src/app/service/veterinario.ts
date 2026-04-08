import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

export interface veterinario{
    idVeterinario?: number;
    nombre: string;
    especialidad: string;
    telefono: string;
    email: string;
}
export type CrearVeterinarioDto = Omit<veterinario, 'idVeterinario'>;

@Injectable({ providedIn: 'root' })
export class VeterinarioService {
    private api = 'http://localhost:8080/api/veterinarios';

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

    actualizarVeterinario(id: number, body: Partial<CrearVeterinarioDto>): Observable<veterinario> {
        return this.http.put<veterinario>(`${this.api}/${id}`, body);
    }

    getVeterinario(id: number): Observable<veterinario> {
        return this.http.get<veterinario>(`${this.api}/${id}`);
    }
}
