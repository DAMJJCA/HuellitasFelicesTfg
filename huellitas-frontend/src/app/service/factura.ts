import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api.config';

export type EstadoFactura = 'borrador' | 'emitida' | 'pagada' | 'cancelada';

export interface FacturaLinea {
  idLinea?: number;
  concepto: string;
  cantidad: number;
  precioUnitario: number;
  total?: number;
}

export interface Factura {
  idFactura: number;
  idCliente: number;
  cliente: string;
  idCita?: number | null;
  numero?: string | null;
  fecha: string;
  estado: EstadoFactura;
  baseImponible: number;
  impuestos: number;
  total: number;
  notas?: string | null;
  creadoEn?: string;
  lineas?: FacturaLinea[] | null;
}

export interface FacturaRequest {
  idCliente: number;
  idCita?: number | null;
  notas?: string | null;
  lineas: FacturaLinea[];
}

@Injectable({ providedIn: 'root' })
export class FacturaService {
  private api = `${API_BASE_URL}/facturas`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Factura[]> {
    return this.http.get<Factura[]>(this.api);
  }

  obtener(id: number): Observable<Factura> {
    return this.http.get<Factura>(`${this.api}/${id}`);
  }

  crear(payload: FacturaRequest): Observable<Factura> {
    return this.http.post<Factura>(this.api, payload);
  }

  cambiarEstado(id: number, estado: EstadoFactura): Observable<Factura> {
    return this.http.patch<Factura>(`${this.api}/${id}/estado`, { estado });
  }
}
