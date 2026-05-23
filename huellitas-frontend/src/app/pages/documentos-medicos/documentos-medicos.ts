import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Subject, catchError, combineLatest, map, of, shareReplay, startWith, switchMap } from 'rxjs';

import { AuthService } from '../../auth/auth.service';
import { Consulta, ConsultaService } from '../../service/consulta';
import { DocumentoMedico, DocumentoMedicoDto, DocumentoMedicoService, TipoDocumentoMedico } from '../../service/documento-medico';
import { MascotaService, Mascotas } from '../../service/mascota';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state';
import { PageHeaderComponent } from '../../shared/page-header/page-header';

@Component({
  selector: 'app-documentos-medicos',
  standalone: true,
  imports: [CommonModule, FormsModule, EmptyStateComponent, PageHeaderComponent],
  templateUrl: './documentos-medicos.html'
})
export class DocumentosMedicosComponent {
  private documentoService = inject(DocumentoMedicoService);
  private mascotaService = inject(MascotaService);
  private consultaService = inject(ConsultaService);
  private authService = inject(AuthService);
  private sanitizer = inject(DomSanitizer);
  private route = inject(ActivatedRoute);

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
          this.etiquetaMascotaPorId(doc.idMascota).toLowerCase().includes(texto) ||
          (doc.observaciones || '').toLowerCase().includes(texto);
        return coincideTipo && coincideTexto;
      });
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  mascotas: Mascotas[] = [];
  consultasMascota: Consulta[] = [];
  errorMsg = '';
  successMsg = '';
  tipoActivo: TipoDocumentoMedico | 'todos' = 'todos';
  mostrandoFormulario = false;
  editando: DocumentoMedico | null = null;
  guardando = false;
  cargandoConsultas = false;
  archivoSeleccionado: File | null = null;
  documentoPendienteEliminar: DocumentoMedico | null = null;
  previewUrl: string | null = null;
  previewResourceUrl: SafeResourceUrl | null = null;
  previewTipo: string | null = null;
  previewNombre = '';
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
    const mascotaParam = this.route.snapshot.queryParamMap.get('mascota');
    const abrirNuevo = this.route.snapshot.queryParamMap.get('nuevo') === '1';

    this.mascotaService.getMascotas().subscribe({
      next: mascotas => {
        this.mascotas = mascotas;
        if (mascotaParam && abrirNuevo && this.puedeGestionar) {
          this.abrirNuevo(mascotaParam);
        }
      },
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

  abrirNuevo(idMascota = '') {
    this.editando = null;
    this.form = this.crearFormVacio();
    this.consultasMascota = [];
    if (idMascota) {
      this.form.idMascota = idMascota;
      this.cargarConsultasMascota(idMascota);
    }
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
    this.cargarConsultasMascota(this.form.idMascota);
    this.archivoSeleccionado = null;
    this.mostrandoFormulario = true;
  }

  cerrarFormulario() {
    this.mostrandoFormulario = false;
    this.editando = null;
    this.guardando = false;
    this.archivoSeleccionado = null;
  }

  onMascotaDocumentoChange(idMascota: string) {
    this.form.idMascota = idMascota;
    this.form.idConsulta = '';
    this.cargarConsultasMascota(idMascota);
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

  abrirEliminar(doc: DocumentoMedico) {
    this.documentoPendienteEliminar = doc;
  }

  cancelarEliminar() {
    this.documentoPendienteEliminar = null;
  }

  confirmarEliminar() {
    const doc = this.documentoPendienteEliminar;
    if (!doc?.idDocumento) return;

    this.documentoService.eliminarDocumento(doc.idDocumento).subscribe({
      next: () => {
        this.successMsg = 'Documento eliminado correctamente.';
        this.documentoPendienteEliminar = null;
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
    this.errorMsg = '';
    this.cerrarPreview();

    if (doc.idDocumento && doc.rutaStorage) {
      this.documentoService.descargarArchivo(doc.idDocumento).subscribe({
        next: blob => {
          const url = URL.createObjectURL(blob);
          this.previewUrl = url;
          this.previewResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
          this.previewTipo = doc.mimeType || blob.type;
          this.previewNombre = doc.nombre;
        },
        error: err => {
          console.error('Error abriendo archivo', err);
          this.errorMsg = 'No se pudo abrir el archivo.';
        }
      });
      return;
    }

    this.previewUrl = doc.url;
    this.previewResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(doc.url);
    this.previewTipo = this.tipoDesdeUrl(doc.url);
    this.previewNombre = doc.nombre;
  }

  cerrarPreview() {
    if (this.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(this.previewUrl);
    }
    this.previewUrl = null;
    this.previewResourceUrl = null;
    this.previewTipo = null;
    this.previewNombre = '';
  }

  esPreviewPdf(): boolean {
    return this.previewTipo === 'application/pdf' || (this.previewUrl || '').toLowerCase().includes('.pdf');
  }

  esPreviewImagen(): boolean {
    return !!this.previewTipo?.startsWith('image/') || /\.(jpg|jpeg|png|webp)(\?|$)/i.test(this.previewUrl || '');
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

  etiquetaMascotaPorId(idMascota: number): string {
    const mascota = this.mascotas.find(m => m.idMascota === idMascota);
    if (!mascota) return '';
    return this.etiquetaMascota(mascota);
  }

  etiquetaMascota(mascota: Mascotas): string {
    const duenio = mascota.cliente ? `${mascota.cliente.nombre} ${mascota.cliente.apellidos}` : 'Sin duenio';
    const chip = mascota.numeroChip ? `Chip ${mascota.numeroChip}` : 'Sin chip';
    return `${mascota.nombre} - ${chip} - ${duenio} - ${mascota.especie || 'Sin especie'} - #${mascota.idMascota}`;
  }

  etiquetaConsulta(consulta: Consulta): string {
    const fecha = consulta.fecha ? this.formatearFecha(consulta.fecha) : 'Sin fecha';
    const diagnostico = consulta.diagnostico?.trim() || 'Sin diagnostico';
    return `${fecha} ${consulta.hora || ''} - ${diagnostico} - #${consulta.idConsulta}`;
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

  private cargarConsultasMascota(idMascota: string) {
    this.consultasMascota = [];
    if (!idMascota || !this.puedeGestionar) return;

    this.cargandoConsultas = true;
    this.consultaService.getConsultasPorMascota(Number(idMascota)).subscribe({
      next: consultas => {
        this.consultasMascota = consultas.sort((a, b) => `${b.fecha || ''}${b.hora || ''}`.localeCompare(`${a.fecha || ''}${a.hora || ''}`));
        this.cargandoConsultas = false;
      },
      error: err => {
        console.error('Error cargando consultas de mascota', err);
        this.consultasMascota = [];
        this.cargandoConsultas = false;
      }
    });
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

  private tipoDesdeUrl(url: string): string {
    const limpia = url.toLowerCase().split('?')[0];
    if (limpia.endsWith('.pdf')) return 'application/pdf';
    if (limpia.endsWith('.jpg') || limpia.endsWith('.jpeg')) return 'image/jpeg';
    if (limpia.endsWith('.png')) return 'image/png';
    if (limpia.endsWith('.webp')) return 'image/webp';
    return 'external/url';
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
