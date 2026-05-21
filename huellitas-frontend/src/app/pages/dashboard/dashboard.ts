import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../auth/auth.service';
import { Cita, CitaService, EstadoCita } from '../../service/cita';
import { ConsultaService } from '../../service/consulta';
import { MascotaService } from '../../service/mascota';
import { Preventivo, PreventivoService } from '../../service/preventivo';

type DiaCalendario = {
  fecha: Date;
  numero: number;
  esHoy: boolean;
  citas: {
    hora: string;
    mascota: string;
    estado: string;
  }[];
};

type EstadoResumen = {
  estado: EstadoCita;
  label: string;
  total: number;
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html'
})
export class DashboardComponent {

  private citaService = inject(CitaService);
  private consultaService = inject(ConsultaService);
  private mascotaService = inject(MascotaService);
  private preventivoService = inject(PreventivoService);
  private authService = inject(AuthService);
  private router = inject(Router);

  citasHoy = signal<Cita[]>([]);
  proximasCitas = signal<Cita[]>([]);
  consultasHoy = signal(0);
  totalMascotas = signal(0);
  preventivosProximos = signal<Preventivo[]>([]);
  estadosResumen = signal<EstadoResumen[]>([]);

  diasSemana = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
  rangoSemanas = signal<string>('');
  calendario = signal<DiaCalendario[]>([]);
  errorMsg = signal('');
  successMsg = signal('');

  get tituloRol(): string {
    if (this.authService.isCliente()) return 'Panel del cliente';
    if (this.authService.isVeterinario()) return 'Panel veterinario';
    return 'Panel de administracion';
  }

  get descripcionRol(): string {
    if (this.authService.isCliente()) return 'Tus mascotas, citas y cuidados preventivos en un vistazo.';
    if (this.authService.isVeterinario()) return 'Citas asignadas, consultas del dia y seguimiento preventivo.';
    return 'Resumen operativo de la clinica Huellitas Felices.';
  }

  get puedeCrearCitas(): boolean {
    return !this.authService.isVeterinario();
  }

  get esAdmin(): boolean {
    return this.authService.isAdmin();
  }

  get esStaff(): boolean {
    return this.authService.isAdmin() || this.authService.isVeterinario();
  }

  get esCliente(): boolean {
    return this.authService.isCliente();
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    const hoy = new Date();

    this.citaService.getCitas().subscribe({
      next: citas => {
        const ordenadas = [...citas].sort((a, b) => this.fechaHora(a).localeCompare(this.fechaHora(b)));
        this.citasHoy.set(ordenadas.filter(c => this.esHoy(c.fecha)));
        this.proximasCitas.set(ordenadas.filter(c => this.esProximaActiva(c)).slice(0, 6));
        this.estadosResumen.set(this.calcularEstados(ordenadas));
        this.generarCalendarioDosSemanas(hoy, ordenadas);
      },
      error: err => {
        console.error('Error cargando citas del dashboard', err);
        this.errorMsg.set('No se pudieron cargar las citas del dashboard.');
      }
    });

    this.consultaService.getConsultas().subscribe({
      next: consultas => this.consultasHoy.set(consultas.filter(c => this.esHoy(c.fecha)).length),
      error: () => this.consultasHoy.set(0)
    });

    this.mascotaService.getMascotas().subscribe({
      next: mascotas => this.totalMascotas.set(mascotas.length),
      error: () => this.totalMascotas.set(0)
    });

    this.preventivoService.getProximos().subscribe({
      next: preventivos => this.preventivosProximos.set(preventivos.slice(0, 6)),
      error: () => this.preventivosProximos.set([])
    });
  }

  puedeConfirmarRapido(cita: Cita): boolean {
    return this.esCliente && this.normalizarEstado(cita.estado) === 'programada';
  }

  puedeCancelarRapido(cita: Cita): boolean {
    const estado = this.normalizarEstado(cita.estado);
    return this.esCliente && (estado === 'programada' || estado === 'confirmada');
  }

  confirmarRapido(cita: Cita) {
    this.actualizarEstadoRapido(cita, 'confirmada', 'Cita confirmada correctamente.');
  }

  cancelarRapido(cita: Cita) {
    this.actualizarEstadoRapido(cita, 'cancelada', 'Cita cancelada correctamente.');
  }

  private actualizarEstadoRapido(cita: Cita, estado: EstadoCita, mensajeOk: string) {
    if (!cita.idCita) return;

    this.errorMsg.set('');
    this.successMsg.set('');
    this.citaService.actualizarEstado(cita.idCita, estado).subscribe({
      next: () => {
        this.successMsg.set(mensajeOk);
        this.cargarDatos();
      },
      error: err => {
        console.error('Error actualizando cita desde dashboard', err);
        this.errorMsg.set(this.extraerMensajeError(err, 'No se pudo actualizar la cita.'));
      }
    });
  }

  irACrearCita() {
    this.router.navigate([this.puedeCrearCitas ? '/citas/crear' : '/citas']);
  }

  irACitas() {
    this.router.navigate(['/citas']);
  }

  irAClientes() {
    this.router.navigate(['/clientes']);
  }

  irAVeterinarios() {
    this.router.navigate(['/admin/veterinarios']);
  }

  irAHistorial() {
    this.router.navigate(['/historial']);
  }

  irATratamientos() {
    this.router.navigate(['/tratamientos']);
  }

  irAPreventivos() {
    this.router.navigate(['/preventivos']);
  }

  formatearFecha(fecha: string | null | undefined): string {
    if (!fecha) return 'Sin fecha';
    const date = new Date(`${fecha}T00:00:00`);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  }

  etiquetaEstado(estado: string): string {
    const etiquetas: Record<string, string> = {
      programada: 'Programadas',
      confirmada: 'Confirmadas',
      en_consulta: 'En consulta',
      realizada: 'Realizadas',
      cancelada: 'Canceladas',
      completada: 'Completadas'
    };
    return etiquetas[this.normalizarEstado(estado)] || estado;
  }

  claseEstado(estado: string): string {
    const clases: Record<string, string> = {
      programada: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-200',
      confirmada: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200',
      en_consulta: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
      realizada: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100',
      completada: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100',
      cancelada: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200'
    };
    return clases[this.normalizarEstado(estado)] || 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100';
  }

  private generarCalendarioDosSemanas(hoy: Date, citas: Cita[]) {
    const base = new Date(hoy);
    const diaSemana = base.getDay() === 0 ? 7 : base.getDay();
    base.setDate(base.getDate() - (diaSemana - 1));

    const inicio = new Date(base);
    const resultado: DiaCalendario[] = [];

    for (let i = 0; i < 14; i++) {
      const fechaDia = new Date(inicio);
      fechaDia.setDate(inicio.getDate() + i);

      const citasDia = citas
        .filter(c => this.esMismoDia(c.fecha, fechaDia))
        .map(c => ({
          hora: c.hora,
          mascota: c.mascota?.nombre ?? 'Mascota',
          estado: c.estado
        }));

      resultado.push({
        fecha: fechaDia,
        numero: fechaDia.getDate(),
        esHoy: this.esMismoDia(this.isoLocal(hoy), fechaDia),
        citas: citasDia
      });
    }

    const fin = resultado[13].fecha;
    this.rangoSemanas.set(
      `${inicio.getDate()} ${inicio.toLocaleDateString('es-ES', { month: 'short' })} - ${fin.getDate()} ${fin.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}`
    );

    this.calendario.set(resultado);
  }

  private calcularEstados(citas: Cita[]): EstadoResumen[] {
    const estados: { estado: EstadoCita; label: string }[] = [
      { estado: 'programada', label: 'Programadas' },
      { estado: 'confirmada', label: 'Confirmadas' },
      { estado: 'en_consulta', label: 'En consulta' },
      { estado: 'realizada', label: 'Realizadas' },
      { estado: 'cancelada', label: 'Canceladas' }
    ];

    return estados.map(item => ({
      ...item,
      total: citas.filter(c => this.normalizarEstado(c.estado) === item.estado).length
    }));
  }

  private esHoy(fecha: string): boolean {
    return this.esMismoDia(fecha, new Date());
  }

  private esMismoDia(fecha: string, ref: Date): boolean {
    if (!fecha) return false;
    const f = new Date(`${fecha}T00:00:00`);
    return f.getDate() === ref.getDate() && f.getMonth() === ref.getMonth() && f.getFullYear() === ref.getFullYear();
  }

  private esProximaActiva(cita: Cita): boolean {
    const estado = this.normalizarEstado(cita.estado);
    if (estado === 'cancelada' || estado === 'realizada' || estado === 'completada') return false;
    return this.fechaHora(cita) >= this.isoLocal(new Date());
  }

  private fechaHora(cita: Cita): string {
    return `${cita.fecha}T${cita.hora || '00:00'}`;
  }

  private isoLocal(date: Date): string {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  }

  private normalizarEstado(estado: string): string {
    return (estado || 'programada').trim().toLowerCase().replace(/[- ]/g, '_');
  }

  private extraerMensajeError(err: any, fallback: string): string {
    return err?.error?.detail || err?.error?.message || err?.error?.error || fallback;
  }
}
