import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

export interface Cliente {
  idCliente?: number;
  nombre: string;
  apellidos: string;
  telefono: string;
  email: string;
  direccion: string;
  fechaRegistro?: string;
}
export type CrearClienteDto = Omit<Cliente, 'idCliente' | 'fechaRegistro'>;

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private api = 'http://localhost:8080/api/clientes';

  constructor(private http: HttpClient) {}

  getClientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(this.api);
  }

  crearCliente(cliente: CrearClienteDto): Observable<Cliente> {
    return this.http.post<Cliente>(this.api, cliente);
  }

  eliminarCliente(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  actualizarCliente(id: number, body: Partial<CrearClienteDto>): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.api}/${id}`, body);
  }

  getCliente(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.api}/${id}`);
  }
}
