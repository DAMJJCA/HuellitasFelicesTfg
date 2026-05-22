import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, forkJoin, of, switchMap } from 'rxjs';

import { Cita, CitaService } from '../../../service/cita';
import { Consulta, ConsultaService } from '../../../service/consulta';
import { DocumentoMedico, DocumentoMedicoDto, DocumentoMedicoService, TipoDocumentoMedico } from '../../../service/documento-medico';
import { Tratamiento, TratamientoService } from '../../../service/tratamiento';

@Component({
  selector: 'app-detalle-consulta',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './detalle-consulta.html'
})
export class DetalleConsultaComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private consultaService = inject(ConsultaService);
  private citaService = inject(CitaService);
  private tratamientoService = inject(TratamientoService);
  private documentoService = inject(DocumentoMedicoService);

  consulta = signal<Consulta | null>(null);
  cita = signal<Cita | null>(null);
  tratamientos = signal<Tratamiento[]>([]);
  documentos = signal<DocumentoMedico[]>([]);
  cargando = signal(true);
  errorMsg = signal('');
  successMsg = signal('');
  mostrandoDocumentoForm = signal(false);
  archivoDocumento: File | null = null;

  tiposDocumento: { value: TipoDocumentoMedico; label: string }[] = [
    { value: 'analitica', label: 'Analitica' },
    { value: 'radiografia', label: 'Radiografia' },
    { value: 'informe', label: 'Informe' },
    { value: 'receta', label: 'Receta' },
    { value: 'consentimiento', label: 'Consentimiento' },
    { value: 'foto', label: 'Foto' },
    { value: 'otro', label: 'Otro' }
  ];

  documentoForm: DocumentoMedicoDto = this.documentoFormVacio();

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = Number(params.get('id'));
        if (Number.isNaN(id)) {
          this.errorMsg.set('Consulta no valida.');
          this.cargando.set(false);
          return of(null);
        }

        return this.consultaService.getConsulta(id).pipe(
          switchMap(consulta => {
            if (!consulta.idCita) {
              return of({ consulta, cita: null, tratamientos: [] as Tratamiento[], documentos: [] as DocumentoMedico[] });
            }

            return this.citaService.getCita(consulta.idCita).pipe(
              switchMap(cita => {
                const idMascota = (cita.mascota as any)?.idMascota;
                return forkJoin({
                  consulta: of(consulta),
                  cita: of(cita),
                  tratamientos: this.tratamientoService.getTratamientos().pipe(
                    catchError(() => of([] as Tratamiento[]))
                  ),
                  documentos: idMascota
                    ? this.documentoService.getDocumentosPorMascota(idMascota).pipe(catchError(() => of([] as DocumentoMedico[])))
                    : of([] as DocumentoMedico[])
                });
              })
            );
          }),
          catchError(err => {
            console.error('Error cargando detalle de consulta', err);
            this.errorMsg.set('No se pudo cargar la consulta.');
            this.cargando.set(false);
            return of(null);
          })
        );
      })
    ).subscribe(data => {
      if (!data) return;
      this.consulta.set(data.consulta);
      this.cita.set(data.cita);
      this.tratamientos.set(data.tratamientos.filter(t => t.consulta?.idConsulta === data.consulta.idConsulta));
      this.documentos.set(data.documentos.filter(d => !d.idConsulta || d.idConsulta === data.consulta.idConsulta));
      this.cargando.set(false);
    });
  }

  editar(): void {
    const id = this.consulta()?.idConsulta;
    if (id) this.router.navigate(['/consultas', id, 'editar']);
  }

  volver(): void {
    this.router.navigate(['/consultas']);
  }

  abrirDocumento(url: string): void {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  abrirDocumentoMedico(doc: DocumentoMedico): void {
    if (doc.idDocumento && doc.rutaStorage) {
      this.documentoService.descargarArchivo(doc.idDocumento).subscribe({
        next: blob => {
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank', 'noopener,noreferrer');
          setTimeout(() => URL.revokeObjectURL(url), 60_000);
        },
        error: err => {
          console.error('Error abriendo archivo de consulta', err);
          this.errorMsg.set('No se pudo abrir el archivo.');
        }
      });
      return;
    }
    window.open(doc.url, '_blank', 'noopener,noreferrer');
  }

  abrirDocumentoForm(): void {
    this.errorMsg.set('');
    this.successMsg.set('');
    this.documentoForm = this.documentoFormVacio();
    this.archivoDocumento = null;
    this.mostrandoDocumentoForm.set(true);
  }

  cancelarDocumentoForm(): void {
    this.mostrandoDocumentoForm.set(false);
    this.documentoForm = this.documentoFormVacio();
    this.archivoDocumento = null;
  }

  guardarDocumento(): void {
    this.errorMsg.set('');
    this.successMsg.set('');

    const idMascota = (this.cita()?.mascota as any)?.idMascota;
    const idConsulta = this.consulta()?.idConsulta;
    if (!idMascota || !idConsulta) {
      this.errorMsg.set('No se pudo identificar la mascota o la consulta.');
      return;
    }
    if (!this.documentoForm.nombre.trim()) {
      this.errorMsg.set('Indica el nombre del documento.');
      return;
    }
    if (!this.archivoDocumento && !this.documentoForm.url.trim()) {
      this.errorMsg.set('Indica una URL o selecciona un archivo.');
      return;
    }
    if (this.archivoDocumento && !this.archivoValido(this.archivoDocumento)) {
      this.errorMsg.set('Solo se permiten archivos PDF, JPG, PNG o WEBP.');
      return;
    }

    if (this.archivoDocumento) {
      this.documentoService.subirDocumento(this.crearDocumentoFormData(idMascota, idConsulta)).subscribe({
        next: doc => {
          this.documentos.set([doc, ...this.documentos()]);
          this.successMsg.set('Documento subido y asociado a la consulta.');
          this.cancelarDocumentoForm();
        },
        error: err => {
          console.error('Error subiendo documento desde consulta', err);
          this.errorMsg.set(this.extraerMensajeError(err, 'No se pudo subir el documento.'));
        }
      });
      return;
    }

    const payload: DocumentoMedicoDto = {
      ...this.documentoForm,
      idMascota,
      idConsulta,
      fecha: this.documentoForm.fecha || null,
      observaciones: this.documentoForm.observaciones || null
    };

    this.documentoService.crearDocumento(payload).subscribe({
      next: doc => {
        this.documentos.set([doc, ...this.documentos()]);
        this.successMsg.set('Documento asociado a la consulta.');
        this.cancelarDocumentoForm();
      },
      error: err => {
        console.error('Error creando documento desde consulta', err);
        this.errorMsg.set(this.extraerMensajeError(err, 'No se pudo guardar el documento.'));
      }
    });
  }

  onArchivoDocumentoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.archivoDocumento = input.files?.[0] || null;
    if (this.archivoDocumento && !this.documentoForm.nombre.trim()) {
      this.documentoForm.nombre = this.archivoDocumento.name.replace(/\.[^/.]+$/, '');
    }
  }

  formatearTamano(bytes: number | null | undefined): string {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  formatearFecha(fecha: string | null | undefined): string {
    if (!fecha) return 'Sin fecha';
    const date = new Date(`${fecha}T00:00:00`);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  }

  mascotaNombre(): string {
    return (this.cita()?.mascota as any)?.nombre || this.consulta()?.nombreMascota || 'Mascota';
  }

  duenioNombre(): string {
    const cliente = (this.cita()?.mascota as any)?.cliente;
    return cliente ? `${cliente.nombre} ${cliente.apellidos}` : 'Sin datos';
  }

  resumenTratamiento(tratamiento: Tratamiento): string {
    return [tratamiento.dosis, tratamiento.duracion, tratamiento.descripcion].filter(Boolean).join(' - ') || 'Sin detalle';
  }

  private documentoFormVacio(): DocumentoMedicoDto {
    return {
      idMascota: 0,
      idConsulta: null,
      tipo: 'informe',
      nombre: '',
      url: '',
      fecha: this.isoLocal(new Date()),
      observaciones: ''
    };
  }

  private crearDocumentoFormData(idMascota: number, idConsulta: number): FormData {
    const formData = new FormData();
    formData.append('idMascota', String(idMascota));
    formData.append('idConsulta', String(idConsulta));
    formData.append('tipo', this.documentoForm.tipo);
    formData.append('nombre', this.documentoForm.nombre);
    if (this.documentoForm.fecha) formData.append('fecha', this.documentoForm.fecha);
    if (this.documentoForm.observaciones) formData.append('observaciones', this.documentoForm.observaciones);
    formData.append('archivo', this.archivoDocumento as File);
    return formData;
  }

  private archivoValido(archivo: File): boolean {
    const tiposPermitidos = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    const extensionesPermitidas = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
    const nombre = archivo.name.toLowerCase();
    return tiposPermitidos.includes(archivo.type) || extensionesPermitidas.some(ext => nombre.endsWith(ext));
  }

  private isoLocal(date: Date): string {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  }

  private extraerMensajeError(err: any, fallback: string): string {
    if (typeof err?.error === 'string' && err.error.trim()) {
      return err.error;
    }
    return err?.error?.detail || err?.error?.message || err?.error?.error || fallback;
  }
}
