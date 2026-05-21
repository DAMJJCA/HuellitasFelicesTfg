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
    this.mostrandoFormulario = true;
  }

  cerrarFormulario() {
    this.mostrandoFormulario = false;
    this.editando = null;
    this.guardando = false;
  }

  guardar() {
    this.errorMsg = '';
    this.successMsg = '';

    const error = this.validarFormulario();
    if (error) {
      this.errorMsg = error;
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

    this.guardando = true;
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

  abrirUrl(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer');
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
    if (!this.form.idMascota || !this.form.tipo || !this.form.nombre || !this.form.url) {
      return 'Completa mascota, tipo, nombre y URL.';
    }
    if (!/^https?:\/\/.+/i.test(this.form.url)) {
      return 'La URL debe empezar por http:// o https://.';
    }
    if (this.form.fecha && this.form.fecha > this.maxFecha) {
      return 'La fecha del documento no puede ser futura.';
    }
    return '';
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
