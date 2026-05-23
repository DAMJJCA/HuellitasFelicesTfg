import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Subject, catchError, combineLatest, map, of, shareReplay, startWith, switchMap } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { MascotaService, Mascotas } from '../../service/mascota';
import { Preventivo, PreventivoDto, PreventivoService, TipoPreventivo } from '../../service/preventivo';
import { VeterinarioService } from '../../service/veterinario';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state';
import { PageHeaderComponent } from '../../shared/page-header/page-header';

@Component({
  selector: 'app-preventivos',
  standalone: true,
  imports: [CommonModule, FormsModule, EmptyStateComponent, PageHeaderComponent],
  templateUrl: './preventivos.html'
})
export class PreventivosComponent {
  private preventivoService = inject(PreventivoService);
  private mascotaService = inject(MascotaService);
  private veterinarioService = inject(VeterinarioService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  private refrescar$ = new Subject<void>();
  private buscar$ = new BehaviorSubject<string>('');
  private tipoFiltro$ = new BehaviorSubject<TipoPreventivo | 'todos'>('todos');

  preventivos$ = this.refrescar$.pipe(
    startWith(void 0),
    switchMap(() => this.preventivoService.getPreventivos()),
    map(lista => [...lista].sort((a, b) => (a.proximaDosis || '9999-12-31').localeCompare(b.proximaDosis || '9999-12-31'))),
    catchError(err => {
      console.error('Error cargando preventivos', err);
      this.errorMsg = 'No se pudieron cargar las vacunas y desparasitaciones. Revisa que la tabla exista en la base de datos.';
      return of([] as Preventivo[]);
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  preventivosFiltrados$ = combineLatest([
    this.preventivos$,
    this.buscar$,
    this.tipoFiltro$
  ]).pipe(
    map(([lista, term, tipo]) => {
      const texto = term.trim().toLowerCase();
      return lista.filter(item => {
        const coincideTipo = tipo === 'todos' || item.tipo === tipo;
        const coincideTexto = !texto ||
          item.nombre.toLowerCase().includes(texto) ||
          (item.nombreMascota || '').toLowerCase().includes(texto) ||
          this.etiquetaMascotaPorId(item.idMascota).toLowerCase().includes(texto) ||
          (item.nombreVeterinario || '').toLowerCase().includes(texto) ||
          (item.observaciones || '').toLowerCase().includes(texto);
        return coincideTipo && coincideTexto;
      });
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  mascotas: Mascotas[] = [];
  veterinarios: any[] = [];
  errorMsg = '';
  successMsg = '';
  tipoActivo: TipoPreventivo | 'todos' = 'todos';
  mostrandoFormulario = false;
  editando: Preventivo | null = null;
  guardando = false;
  enviandoRecordatorios = false;

  form = this.crearFormVacio();

  get puedeGestionar(): boolean {
    return this.authService.isAdmin() || this.authService.isVeterinario();
  }

  get puedeEnviarRecordatorios(): boolean {
    return this.authService.isAdmin();
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

    if (this.puedeGestionar) {
      this.veterinarioService.getVeterinarios().subscribe({
        next: veterinarios => this.veterinarios = veterinarios,
        error: () => this.errorMsg = 'No se pudieron cargar los veterinarios.'
      });
    }
  }

  buscar(valor: string) {
    this.buscar$.next(valor);
  }

  filtrarTipo(tipo: TipoPreventivo | 'todos') {
    this.tipoActivo = tipo;
    this.tipoFiltro$.next(tipo);
  }

  abrirNuevo(idMascota = '') {
    this.editando = null;
    this.form = this.crearFormVacio();
    if (idMascota) this.form.idMascota = idMascota;
    this.mostrandoFormulario = true;
  }

  abrirEditar(item: Preventivo) {
    this.editando = item;
    this.form = {
      idMascota: item.idMascota ? String(item.idMascota) : '',
      idVeterinario: item.idVeterinario ? String(item.idVeterinario) : '',
      tipo: item.tipo,
      nombre: item.nombre,
      fechaAplicacion: item.fechaAplicacion || '',
      proximaDosis: item.proximaDosis || '',
      observaciones: item.observaciones || ''
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

    if (!this.form.idMascota || !this.form.nombre || !this.form.tipo) {
      this.errorMsg = 'Completa mascota, tipo y nombre.';
      return;
    }

    const errorFechas = this.validarFechas();
    if (errorFechas) {
      this.errorMsg = errorFechas;
      return;
    }

    const dto: PreventivoDto = {
      idMascota: Number(this.form.idMascota),
      idVeterinario: this.form.idVeterinario ? Number(this.form.idVeterinario) : null,
      tipo: this.form.tipo,
      nombre: this.form.nombre,
      fechaAplicacion: this.form.fechaAplicacion || null,
      proximaDosis: this.form.proximaDosis || null,
      observaciones: this.form.observaciones || null
    };

    this.guardando = true;
    const request$ = this.editando?.idRegistro
      ? this.preventivoService.actualizarPreventivo(this.editando.idRegistro, dto)
      : this.preventivoService.crearPreventivo(dto);

    request$.subscribe({
      next: () => {
        this.successMsg = this.editando ? 'Registro actualizado correctamente.' : 'Registro creado correctamente.';
        this.cerrarFormulario();
        this.refrescar$.next();
      },
      error: err => {
        console.error('Error guardando preventivo', err);
        this.errorMsg = this.extraerMensajeError(err, 'No se pudo guardar el registro.');
        this.guardando = false;
      }
    });
  }

  eliminar(item: Preventivo) {
    if (!item.idRegistro || !confirm('Eliminar este registro preventivo?')) return;

    this.preventivoService.eliminarPreventivo(item.idRegistro).subscribe({
      next: () => {
        this.successMsg = 'Registro eliminado correctamente.';
        this.refrescar$.next();
      },
      error: err => {
        console.error('Error eliminando preventivo', err);
        this.errorMsg = 'No se pudo eliminar el registro.';
      }
    });
  }

  enviarRecordatorios() {
    if (!this.puedeEnviarRecordatorios || this.enviandoRecordatorios) return;

    this.errorMsg = '';
    this.successMsg = '';
    this.enviandoRecordatorios = true;

    this.preventivoService.enviarRecordatoriosProximasDosis().subscribe({
      next: response => {
        this.enviandoRecordatorios = false;
        this.successMsg = `${response.mensaje} Encontradas: ${response.encontradas}. Enviadas: ${response.enviadas}. Omitidas: ${response.omitidas}.`;
      },
      error: err => {
        console.error('Error enviando recordatorios preventivos', err);
        this.enviandoRecordatorios = false;
        this.errorMsg = 'No se pudieron enviar los recordatorios de proximas dosis.';
      }
    });
  }

  formatearFecha(fecha: string | null): string {
    if (!fecha) return 'Sin fecha';
    const date = new Date(`${fecha}T00:00:00`);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  }

  estaProximo(item: Preventivo): boolean {
    if (!item.proximaDosis) return false;
    const hoy = new Date();
    const proxima = new Date(`${item.proximaDosis}T00:00:00`);
    const limite = new Date();
    limite.setDate(hoy.getDate() + 30);
    return proxima <= limite;
  }

  estaVencido(item: Preventivo): boolean {
    if (!item.proximaDosis) return false;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const proxima = new Date(`${item.proximaDosis}T00:00:00`);
    return proxima < hoy;
  }

  etiquetaTipo(tipo: TipoPreventivo): string {
    return tipo === 'vacuna' ? 'Vacuna' : 'Desparasitacion';
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

  private crearFormVacio() {
    return {
      idMascota: '',
      idVeterinario: '',
      tipo: 'vacuna' as TipoPreventivo,
      nombre: '',
      fechaAplicacion: '',
      proximaDosis: '',
      observaciones: ''
    };
  }

  private validarFechas(): string {
    if (!this.form.fechaAplicacion && !this.form.proximaDosis) {
      return 'Indica la fecha de aplicacion o la proxima dosis.';
    }

    if (this.form.fechaAplicacion && this.form.proximaDosis) {
      const aplicacion = new Date(`${this.form.fechaAplicacion}T00:00:00`);
      const proxima = new Date(`${this.form.proximaDosis}T00:00:00`);
      if (proxima < aplicacion) {
        return 'La proxima dosis no puede ser anterior a la fecha de aplicacion.';
      }
    }

    return '';
  }

  private extraerMensajeError(err: any, fallback: string): string {
    return err?.error?.detail || err?.error?.message || err?.error?.error || fallback;
  }
}
