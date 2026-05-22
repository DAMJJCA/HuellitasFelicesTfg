import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, Subject, catchError, combineLatest, map, of, shareReplay, startWith, switchMap } from 'rxjs';

import { AuthService } from '../../auth/auth.service';
import { DocumentoMedico, DocumentoMedicoDto, DocumentoMedicoService, TipoDocumentoMedico } from '../../service/documento-medico';
import { MascotaService, Mascotas } from '../../service/mascota';

@Component({
  selector: 'app-documentos-medicos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './documentos-medicos.html'
})
export class DocumentosMedicosComponent {
  private documentoService = inject(DocumentoMedicoService);
  private mascotaService = inject(MascotaService);
  private authService = inject(AuthService);

  private refrescar$ = new Subject<void>();
  private buscar$ = new BehaviorSubject<string>('');
  private tipoFiltro$ = new BehaviorSubject<TipoDocumentoMedico | 'todos'>('todos');

  documentos$ = this.refrescar$.pipe(
    startWith(void 0),
    switchMap(() => this.documentoService.getDocumentos()),
    catchError(err => {
      console.error('Error cargando documentos medicos', err);
      this.errorMsg = 'No se pudieron cargar los documentos. Revisa que la tabla exista en la base de datos.';
      return of([] as DocumentoMedico[]);
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  documentosFiltrados$ = combineLatest([
    this.documentos$,
    this.buscar$,
    this.tipoFiltro$
  ]).pipe(
    map(([lista, term, tipo]) => {
      const texto = term.trim().toLowerCase();
      return lista.filter(doc => {
        const coincideTipo = tipo === 'todos' || doc.tipo === tipo;
        const coincideTexto = !texto ||
          doc.nombre.toLowerCase().includes(texto) ||
          doc.tipo.toLowerCase().includes(texto) ||
          (doc.nombreMascota || '').toLowerCase().includes(texto) ||
          (doc.observaciones || '').toLowerCase().includes(texto);
        return coincideTipo && coincideTexto;
      });
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  mascotas: Mascotas[] = [];
  errorMsg = '';
  successMsg = '';
  tipoActivo: TipoDocumentoMedico | 'todos' = 'todos';
  mostrandoFormulario = false;
  editando: DocumentoMedico | null = null;
  guardando = false;
  archivoSeleccionado: File | null = null;
  maxFecha = this.fechaHoy();

  tipos: { value: TipoDocumentoMedico; label: string }[] = [
    { value: 'analitica', label: 'Analitica' },
    { value: 'radiografia', label: 'Radiografia' },
    { value: 'informe', label: 'Informe' },
    { value: 'receta', label: 'Receta' },
    { value: 'consentimiento', label: 'Consentimiento' },
    { value: 'foto', label: 'Foto' },
    { value: 'otro', label: 'Otro' }
  ];

  form = this.crearFormVacio();

  get puedeGestionar(): boolean {
    return this.authService.isAdmin() || this.authService.isVeterinario();
  }

  ngOnInit(): void {
    this.mascotaService.getMascotas().subscribe({
      next: mascotas => this.mascotas = mascotas,
      error: () => this.errorMsg = 'No se pudieron cargar las mascotas.'
    });
  }

  buscar(valor: string) {
    this.buscar$.next(valor);
  }

  filtrarTipo(tipo: TipoDocumentoMedico | 'todos') {
    this.tipoActivo = tipo;
    this.tipoFiltro$.next(tipo);
  }

  abrirNuevo() {
    this.editando = null;
    this.form = this.crearFormVacio();
    this.archivoSeleccionado = null;
    this.mostrandoFormulario = true;
  }

  abrirEditar(doc: DocumentoMedico) {
    this.editando = doc;
    this.form = {
      idMascota: doc.idMascota ? String(doc.idMascota) : '',
      idConsulta: doc.idConsulta ? String(doc.idConsulta) : '',
      tipo: doc.tipo,
      nombre: doc.nombre,
      url: doc.url,
      fecha: doc.fecha || '',
      observaciones: doc.observaciones || ''
    };
    this.archivoSeleccionado = null;
    this.mostrandoFormulario = true;
  }

  cerrarFormulario() {
    this.mostrandoFormulario = false;
    this.editando = null;
    this.guardando = false;
    this.archivoSeleccionado = null;
  }

  guardar() {
    this.errorMsg = '';
    this.successMsg = '';

    const error = this.validarFormulario();
    if (error) {
      this.errorMsg = error;
      return;
    }

    this.guardando = true;

    if (!this.editando && this.archivoSeleccionado) {
      const formData = this.crearFormData();
      this.documentoService.subirDocumento(formData).subscribe({
        next: () => {
          this.successMsg = 'Documento subido correctamente.';
          this.cerrarFormulario();
          this.refrescar$.next();
        },
        error: err => {
          console.error('Error subiendo documento medico', err);
          this.errorMsg = this.extraerMensajeError(err, 'No se pudo subir el documento.');
          this.guardando = false;
        }
      });
      return;
    }

    const dto: DocumentoMedicoDto = {
      idMascota: Number(this.form.idMascota),
      idConsulta: this.form.idConsulta ? Number(this.form.idConsulta) : null,
      tipo: this.form.tipo,
      nombre: this.form.nombre,
      url: this.form.url,
      fecha: this.form.fecha || null,
      observaciones: this.form.observaciones || null
    };

    const request$ = this.editando?.idDocumento
      ? this.documentoService.actualizarDocumento(this.editando.idDocumento, dto)
      : this.documentoService.crearDocumento(dto);

    request$.subscribe({
      next: () => {
        this.successMsg = this.editando ? 'Documento actualizado correctamente.' : 'Documento creado correctamente.';
        this.cerrarFormulario();
        this.refrescar$.next();
      },
      error: err => {
        console.error('Error guardando documento medico', err);
        this.errorMsg = this.extraerMensajeError(err, 'No se pudo guardar el documento.');
        this.guardando = false;
      }
    });
  }

  eliminar(doc: DocumentoMedico) {
    if (!doc.idDocumento || !confirm('Eliminar este documento medico?')) return;

    this.documentoService.eliminarDocumento(doc.idDocumento).subscribe({
      next: () => {
        this.successMsg = 'Documento eliminado correctamente.';
        this.refrescar$.next();
      },
      error: err => {
        console.error('Error eliminando documento medico', err);
        this.errorMsg = 'No se pudo eliminar el documento.';
      }
    });
  }

  onArchivoSeleccionado(event: Event) {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0] || null;
    this.archivoSeleccionado = archivo;
    if (archivo && !this.form.nombre.trim()) {
      this.form.nombre = archivo.name.replace(/\.[^/.]+$/, '');
    }
  }

  abrirDocumento(doc: DocumentoMedico) {
    if (doc.idDocumento && doc.rutaStorage) {
      this.documentoService.descargarArchivo(doc.idDocumento).subscribe({
        next: blob => {
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank', 'noopener,noreferrer');
          setTimeout(() => URL.revokeObjectURL(url), 60_000);
        },
        error: err => {
          console.error('Error abriendo archivo', err);
          this.errorMsg = 'No se pudo abrir el archivo.';
        }
      });
      return;
    }
    window.open(doc.url, '_blank', 'noopener,noreferrer');
  }

  formatearTamano(bytes: number | null | undefined): string {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  etiquetaTipo(tipo: TipoDocumentoMedico): string {
    return this.tipos.find(t => t.value === tipo)?.label || tipo;
  }

  formatearFecha(fecha: string | null): string {
    if (!fecha) return 'Sin fecha';
    const date = new Date(`${fecha}T00:00:00`);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  }

  private validarFormulario(): string {
    if (!this.form.idMascota || !this.form.tipo || !this.form.nombre) {
      return 'Completa mascota, tipo y nombre.';
    }
    if (!this.editando && !this.archivoSeleccionado && !this.form.url.trim()) {
      return 'Indica una URL o selecciona un archivo.';
    }
    if ((this.editando || !this.archivoSeleccionado) && !this.form.url.trim()) {
      return 'Indica la URL del documento.';
    }
    if (this.form.url && !/^https?:\/\/.+/i.test(this.form.url) && !this.form.url.startsWith('/api/')) {
      return 'La URL debe empezar por http:// o https://.';
    }
    if (this.archivoSeleccionado && !this.archivoValido(this.archivoSeleccionado)) {
      return 'Solo se permiten archivos PDF, JPG, PNG o WEBP.';
    }
    if (this.form.fecha && this.form.fecha > this.maxFecha) {
      return 'La fecha del documento no puede ser futura.';
    }
    return '';
  }

  private crearFormData(): FormData {
    const formData = new FormData();
    formData.append('idMascota', this.form.idMascota);
    if (this.form.idConsulta) formData.append('idConsulta', this.form.idConsulta);
    formData.append('tipo', this.form.tipo);
    formData.append('nombre', this.form.nombre);
    if (this.form.fecha) formData.append('fecha', this.form.fecha);
    if (this.form.observaciones) formData.append('observaciones', this.form.observaciones);
    formData.append('archivo', this.archivoSeleccionado as File);
    return formData;
  }

  private archivoValido(archivo: File): boolean {
    const tiposPermitidos = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    const extensionesPermitidas = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
    const nombre = archivo.name.toLowerCase();
    return tiposPermitidos.includes(archivo.type) || extensionesPermitidas.some(ext => nombre.endsWith(ext));
  }

  private crearFormVacio() {
    return {
      idMascota: '',
      idConsulta: '',
      tipo: 'informe' as TipoDocumentoMedico,
      nombre: '',
      url: '',
      fecha: this.fechaHoy(),
      observaciones: ''
    };
  }

  private fechaHoy(): string {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${(hoy.getMonth() + 1).toString().padStart(2, '0')}-${hoy.getDate().toString().padStart(2, '0')}`;
  }

  private extraerMensajeError(err: any, fallback: string): string {
    return err?.error?.detail || err?.error?.message || err?.error?.error || fallback;
  }
}
