import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { BehaviorSubject, catchError, combineLatest, map, Observable, of, shareReplay, startWith, Subject, switchMap } from 'rxjs';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { Cita, CitaService, EstadoCita } from '../../service/cita';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../auth/auth.service';
import { VeterinarioService, veterinario } from '../../service/veterinario';
import { extraerMensajeError } from '../../core/http-error';
import { coincideFiltroFecha, fechaHoraCita, FiltroFechaAgenda, isoLocal, normalizarEstadoCita } from '../../core/agenda-utils';
import { PermissionService } from '../../core/permission.service';

type VistaCitas = 'agenda' | 'semana' | 'calendario' | 'tabla';

interface OpcionEstado {
  value: EstadoCita;
  label: string;
}

interface DiaCalendario {
  fecha: Date;
  iso: string;
  numero: number;
  esMesActual: boolean;
  esHoy: boolean;
  citas: Cita[];
}

@Component({
  selector: 'app-citas',
  imports: [CommonModule, HttpClientModule],
  templateUrl: './citas.html',
  styleUrl: './citas.css',
})
export class CitasComponent {

  private refrescar$ = new Subject<void>();
  private buscarTerm$ = new Subject<string>();
  private estadoFiltro$ = new BehaviorSubject<EstadoCita | 'todas'>('todas');
  private veterinarioFiltro$ = new BehaviorSubject<number | 'todos'>('todos');
  private fechaFiltro$ = new BehaviorSubject<FiltroFechaAgenda>('todas');
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  citas$!: Observable<Cita[]>;
  citasFiltrados$!: Observable<Cita[]>
  resumen$!: Observable<Record<EstadoCita, number>>;
  errorMsg = '';
  successMsg = '';
  enviandoRecordatorios = false;
  vista: VistaCitas = 'agenda';
  estadoActivo: EstadoCita | 'todas' = 'todas';
  veterinarioActivo: number | 'todos' = 'todos';
  fechaActiva: FiltroFechaAgenda = 'todas';
  veterinarios: veterinario[] = [];
  duracionesCitas = new Map<number, number>();
  fechaCalendario = new Date();
  fechaSemana = new Date();
  diasSemana = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

  mostrandoConfirmacion = false;
  seleccionado: Cita | null = null;

  readonly estados: OpcionEstado[] = [
    { value: 'programada', label: 'Programada' },
    { value: 'confirmada', label: 'Confirmada' },
    { value: 'en_consulta', label: 'En consulta' },
    { value: 'realizada', label: 'Realizada' },
    { value: 'cancelada', label: 'Cancelada' }
  ];

  constructor(
    private citaService: CitaService,
    private veterinarioService: VeterinarioService,
    private authService: AuthService,
    private permissions: PermissionService
  ) { }

  get puedeGestionarCitas(): boolean {
    return this.permissions.canManageCitas;
  }

  get puedeEnviarRecordatorios(): boolean {
    return this.authService.isAdmin() || this.authService.isRecepcion();
  }

  get esCliente(): boolean {
    return this.authService.isCliente();
  }

  ngOnInit(): void {
    this.aplicarFiltrosDesdeRuta();

    this.citas$ = this.refrescar$.pipe(
      startWith(void 0),
      switchMap(() => this.citaService.getCitas()),
      map(citas => [...citas].sort((a, b) => this.compararCitas(a, b))),
      catchError(err => {
        console.error('ERROR cargando citas', err);
        this.errorMsg = 'No se pudieron cargar las citas.';
        return of([] as Cita[]);
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.citasFiltrados$ = combineLatest([
      this.citas$,
      this.buscarTerm$.pipe(startWith('')),
      this.estadoFiltro$,
      this.veterinarioFiltro$,
      this.fechaFiltro$
    ]).pipe(
      map(([lista, term, estado, veterinario, fecha]) => {
        const t = term.trim().toLowerCase();
        return lista.filter(c => {
          const coincideEstado = estado === 'todas' || this.normalizarEstado(c.estado) === estado;
          const coincideVeterinario = veterinario === 'todos' || c.veterinario?.idVeterinario === veterinario;
          const coincideFecha = this.coincideFiltroFecha(c.fecha, fecha);
          const coincideTexto = !t ||
          (c.motivo ?? '').toLowerCase().includes(t) ||
          (c.estado ?? '').toLowerCase().includes(t) ||
          (c.mascota?.nombre ?? '').toLowerCase().includes(t) ||
          (c.mascota?.numeroChip ?? '').toLowerCase().includes(t) ||
          (c.veterinario?.nombre ?? '').toLowerCase().includes(t);

          return coincideEstado && coincideVeterinario && coincideFecha && coincideTexto;
        });
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.resumen$ = this.citas$.pipe(
      map(citas => this.estados.reduce((acc, estado) => {
        acc[estado.value] = citas.filter(c => this.normalizarEstado(c.estado) === estado.value).length;
        return acc;
      }, {
        programada: 0,
        confirmada: 0,
        en_consulta: 0,
        realizada: 0,
        cancelada: 0
      } as Record<EstadoCita, number>))
    );

    this.veterinarioService.getVeterinarios().subscribe({
      next: veterinarios => this.veterinarios = veterinarios,
      error: () => this.veterinarios = []
    });

    this.citaService.getDuraciones().subscribe({
      next: duraciones => this.duracionesCitas = new Map(duraciones.map(item => [item.idCita, item.duracionMinutos])),
      error: () => this.duracionesCitas = new Map()
    });
  }

  onBuscar(valor: string) { this.buscarTerm$.next(valor); }
  recargar() { this.refrescar$.next(); }
  cambiarVista(vista: VistaCitas) { this.vista = vista; }

  get tituloSemana(): string {
    const dias = this.diasSemanaVista([]);
    if (dias.length === 0) return '';
    const inicio = dias[0].fecha;
    const fin = dias[6].fecha;
    return `${inicio.getDate()} ${inicio.toLocaleDateString('es-ES', { month: 'short' })} - ${fin.getDate()} ${fin.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}`;
  }

  get tituloCalendario(): string {
    return this.fechaCalendario.toLocaleDateString('es-ES', {
      month: 'long',
      year: 'numeric'
    });
  }

  cambiarMes(delta: number) {
    const nuevaFecha = new Date(this.fechaCalendario);
    nuevaFecha.setMonth(nuevaFecha.getMonth() + delta);
    this.fechaCalendario = nuevaFecha;
  }

  irHoy() {
    this.fechaCalendario = new Date();
    this.fechaSemana = new Date();
  }

  cambiarSemana(delta: number) {
    const nuevaFecha = new Date(this.fechaSemana);
    nuevaFecha.setDate(nuevaFecha.getDate() + (delta * 7));
    this.fechaSemana = nuevaFecha;
  }

  diasSemanaVista(citas: Cita[]): DiaCalendario[] {
    const base = new Date(this.fechaSemana);
    const diaSemana = base.getDay() === 0 ? 7 : base.getDay();
    const inicio = new Date(base);
    inicio.setDate(base.getDate() - (diaSemana - 1));

    return Array.from({ length: 7 }, (_, index) => {
      const fecha = new Date(inicio);
      fecha.setDate(inicio.getDate() + index);
      const iso = this.isoLocal(fecha);

      return {
        fecha,
        iso,
        numero: fecha.getDate(),
        esMesActual: true,
        esHoy: iso === this.isoLocal(new Date()),
        citas: citas.filter(cita => cita.fecha === iso).sort((a, b) => (a.hora || '').localeCompare(b.hora || ''))
      };
    });
  }

  diasCalendario(citas: Cita[]): DiaCalendario[] {
    const base = new Date(this.fechaCalendario.getFullYear(), this.fechaCalendario.getMonth(), 1);
    const inicio = new Date(base);
    const diaSemana = inicio.getDay() === 0 ? 7 : inicio.getDay();
    inicio.setDate(inicio.getDate() - (diaSemana - 1));

    return Array.from({ length: 42 }, (_, index) => {
      const fecha = new Date(inicio);
      fecha.setDate(inicio.getDate() + index);
      const iso = this.isoLocal(fecha);

      return {
        fecha,
        iso,
        numero: fecha.getDate(),
        esMesActual: fecha.getMonth() === this.fechaCalendario.getMonth(),
        esHoy: iso === this.isoLocal(new Date()),
        citas: citas.filter(cita => cita.fecha === iso).sort((a, b) => (a.hora || '').localeCompare(b.hora || ''))
      };
    });
  }

  filtrarEstado(estado: EstadoCita | 'todas') {
    this.estadoActivo = estado;
    this.estadoFiltro$.next(estado);
  }

  filtrarVeterinario(valor: string) {
    this.veterinarioActivo = valor === 'todos' ? 'todos' : Number(valor);
    this.veterinarioFiltro$.next(this.veterinarioActivo);
  }

  filtrarFecha(filtro: FiltroFechaAgenda) {
    this.fechaActiva = filtro;
    this.fechaFiltro$.next(filtro);
  }

  crear() { this.router.navigate(['/citas/crear']); }
  editar(c: Cita) { this.router.navigate(['/citas', c.idCita, 'editar']); }
  verMascota(c: Cita) {
    if (c.mascota?.idMascota) this.router.navigate(['/mascotas', c.mascota.idMascota]);
  }
  iniciarConsulta(c: Cita) {
    if (!c.idCita) return;
    this.errorMsg = '';
    this.successMsg = '';
    this.citaService.actualizarEstado(c.idCita, 'en_consulta').subscribe({
      next: cita => {
        const idConsulta = cita.consulta?.idConsulta;
        if (idConsulta) {
          this.router.navigate(['/consultas', idConsulta, 'editar'], { queryParams: { iniciar: 1 } });
          return;
        }
        this.successMsg = 'Consulta iniciada. Abre la consulta desde el listado.';
        this.refrescar$.next();
      },
      error: err => this.errorMsg = extraerMensajeError(err, 'No se pudo iniciar la consulta.')
    });
  }

  abrirEliminar(c: Cita) {
    this.mostrandoConfirmacion = true;
    this.seleccionado = c;
  }

  formatearFecha(fechaIso: string): string {
  if (!fechaIso) return '';
  const fecha = new Date(`${fechaIso}T00:00:00`);

  const dia = fecha.getDate().toString().padStart(2, '0');
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const ano = fecha.getFullYear();

  return `${dia}/${mes}/${ano}`;
  }

  etiquetaEstado(estado: string): string {
    return this.estados.find(e => e.value === this.normalizarEstado(estado))?.label ?? estado;
  }

  duracionCita(cita: Cita): number {
    return cita.idCita ? (this.duracionesCitas.get(cita.idCita) || cita.duracionMinutos || 30) : (cita.duracionMinutos || 30);
  }

  etiquetaMascota(cita: Cita): string {
    const mascota = cita.mascota;
    if (!mascota) return 'Mascota';
    const chip = mascota.numeroChip ? `Chip ${mascota.numeroChip}` : 'Sin chip';
    return `${mascota.nombre} - ${chip}`;
  }

  clasesEstado(estado: string): string {
    const estadoNormalizado = this.normalizarEstado(estado);
    const clases: Record<EstadoCita, string> = {
      programada: 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-900/30 dark:text-sky-200 dark:ring-sky-700',
      confirmada: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:ring-emerald-700',
      en_consulta: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:ring-amber-700',
      realizada: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-700 dark:text-slate-100 dark:ring-slate-600',
      cancelada: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-200 dark:ring-rose-700'
    };

    return clases[estadoNormalizado];
  }

  puedeCambiarEstado(cita: Cita, estado: EstadoCita): boolean {
    if (!cita.idCita || this.normalizarEstado(cita.estado) === estado) return false;
    if (this.authService.isCliente()) {
      return this.normalizarEstado(cita.estado) === 'programada' && (estado === 'confirmada' || estado === 'cancelada')
        || this.normalizarEstado(cita.estado) === 'confirmada' && estado === 'cancelada';
    }
    return this.transicionesPermitidas(this.normalizarEstado(cita.estado)).includes(estado);
  }

  puedeConfirmarRapido(cita: Cita): boolean {
    return this.esCliente && this.normalizarEstado(cita.estado) === 'programada';
  }

  puedeCancelarRapido(cita: Cita): boolean {
    const estado = this.normalizarEstado(cita.estado);
    return this.esCliente && (estado === 'programada' || estado === 'confirmada');
  }

  confirmarRapido(cita: Cita) {
    this.actualizarEstado(cita, 'confirmada', 'Cita confirmada correctamente.');
  }

  cancelarRapido(cita: Cita) {
    this.actualizarEstado(cita, 'cancelada', 'Cita cancelada correctamente.');
  }

  actualizarEstado(cita: Cita, estado: EstadoCita, mensajeOk = '') {
    if (!cita.idCita || !this.puedeCambiarEstado(cita, estado)) return;

    this.errorMsg = '';
    this.successMsg = '';
    this.citaService.actualizarEstado(cita.idCita, estado).subscribe({
      next: () => {
        this.successMsg = mensajeOk;
        this.refrescar$.next();
      },
      error: err => {
        console.error('ERROR actualizando estado', err);
        this.errorMsg = extraerMensajeError(err, 'No se pudo actualizar el estado de la cita.');
      }
    });
  }

  enviarRecordatorios() {
    if (!this.puedeEnviarRecordatorios || this.enviandoRecordatorios) return;

    this.errorMsg = '';
    this.successMsg = '';
    this.enviandoRecordatorios = true;

    this.citaService.enviarRecordatoriosProximas().subscribe({
      next: response => {
        this.enviandoRecordatorios = false;
        this.successMsg = `${response.mensaje} Encontradas: ${response.encontradas}. Enviadas: ${response.enviadas}. Omitidas: ${response.omitidas}.`;
      },
      error: err => {
        console.error('ERROR enviando recordatorios', err);
        this.enviandoRecordatorios = false;
        this.errorMsg = extraerMensajeError(err, 'No se pudieron enviar los recordatorios.');
      }
    });
  }

  cerrarEliminar() {
    this.mostrandoConfirmacion = false;
    this.seleccionado = null;
  }

  confirmarEliminar() {
    if (!this.seleccionado || !this.seleccionado.idCita) return;
    this.citaService.eliminarCita(this.seleccionado.idCita).subscribe({
      next: () => {
        this.cerrarEliminar();
        this.refrescar$.next();
      },
      error: err => {
        console.error('ERROR eliminando cita', err);
        this.errorMsg = extraerMensajeError(err, 'No se pudo eliminar la cita.');
      }
    });
  }

  normalizarEstado(estado: string): EstadoCita {
    return normalizarEstadoCita(estado);
  }

  private compararCitas(a: Cita, b: Cita): number {
    return fechaHoraCita(a).localeCompare(fechaHoraCita(b));
  }

  private coincideFiltroFecha(fecha: string, filtro: FiltroFechaAgenda): boolean {
    return coincideFiltroFecha(fecha, filtro);
  }

  private isoLocal(date: Date): string {
    return isoLocal(date);
  }

  private aplicarFiltrosDesdeRuta(): void {
    const params = this.route.snapshot.queryParamMap;
    const estado = params.get('estado');
    const fecha = params.get('fecha');
    const vista = params.get('vista');

    if (this.esEstadoFiltro(estado)) {
      this.estadoActivo = estado;
      this.estadoFiltro$.next(estado);
    }

    if (this.esFiltroFecha(fecha)) {
      this.fechaActiva = fecha;
      this.fechaFiltro$.next(fecha);
    }

    if (this.esVista(vista)) {
      this.vista = vista;
    }
  }

  private esEstadoFiltro(valor: string | null): valor is EstadoCita | 'todas' {
    return valor === 'todas' || this.estados.some(estado => estado.value === valor);
  }

  private esFiltroFecha(valor: string | null): valor is FiltroFechaAgenda {
    return valor === 'todas' || valor === 'hoy' || valor === 'manana' || valor === 'semana';
  }

  private esVista(valor: string | null): valor is VistaCitas {
    return valor === 'agenda' || valor === 'semana' || valor === 'calendario' || valor === 'tabla';
  }

  private transicionesPermitidas(estado: EstadoCita): EstadoCita[] {
    const transiciones: Record<EstadoCita, EstadoCita[]> = {
      programada: ['confirmada', 'en_consulta', 'cancelada'],
      confirmada: ['en_consulta', 'cancelada'],
      en_consulta: ['realizada', 'cancelada'],
      realizada: [],
      cancelada: []
    };
    return transiciones[estado] ?? [];
  }

}
