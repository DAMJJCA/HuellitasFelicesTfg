import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export type TipoDocumentoMedico = 'analitica' | 'radiografia' | 'informe' | 'receta' | 'consentimiento' | 'foto' | 'otro';

export interface DocumentoMedico {
  idDocumento?: number;
  idMascota: number;
  nombreMascota?: string;
  idConsulta?: number | null;
  tipo: TipoDocumentoMedico;
  nombre: string;
  url: string;
  fecha: string | null;
  observaciones: string | null;
}

export type DocumentoMedicoDto = Omit<DocumentoMedico, 'idDocumento' | 'nombreMascota'>;

@Injectable({ providedIn: 'root' })
export class DocumentoMedicoService {
  private api = 'http://localhost:8080/api/documentos-medicos';

  constructor(private http: HttpClient) {}

  getDocumentos(): Observable<DocumentoMedico[]> {
    return this.http.get<DocumentoMedico[]>(this.api);
  }

  getDocumentosPorMascota(idMascota: number): Observable<DocumentoMedico[]> {
    return this.http.get<DocumentoMedico[]>(`${this.api}/mascota/${idMascota}`);
  }

  crearDocumento(body: DocumentoMedicoDto): Observable<DocumentoMedico> {
    return this.http.post<DocumentoMedico>(this.api, body);
  }

  actualizarDocumento(id: number, body: DocumentoMedicoDto): Observable<DocumentoMedico> {
    return this.http.put<DocumentoMedico>(`${this.api}/${id}`, body);
  }

  eliminarDocumento(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
