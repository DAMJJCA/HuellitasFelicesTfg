import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../auth/auth.service';
import { Cita, CitaService, EstadoCita } from '../../service/cita';
import { ConsultaService } from '../../service/consulta';
import { MascotaService, Mascotas } from '../../service/mascota';
import { Preventivo, PreventivoService } from '../../service/preventivo';
import { extraerMensajeError } from '../../core/http-error';

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

type AvisoOperativo = {
  titulo: string;
  descripcion: string;
  tipo: 'critico' | 'aviso' | 'info';
  accion: string;
  destino: () => void;
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
  mascotasSinChip = signal<Mascotas[]>([]);
  citasPendientesConfirmar = signal<Cita[]>([]);
  preventivosProximos = signal<Preventivo[]>([]);
  estadosResumen = signal<EstadoResumen[]>([]);
  avisosOperativos = signal<AvisoOperativo[]>([]);

  diasSemana = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
  rangoSemanas = signal<string>('');
  calendario = signal<DiaCalendario[]>([]);
  errorMsg = signal('');
  successMsg = signal('');
  recordatorioEnviando = signal<number | null>(null);

  get tituloRol(): string {
    if (this.authService.isCliente()) return 'Panel del cliente';
    if (this.authService.isVeterinario()) return 'Panel veterinario';
    if (this.authService.isRecepcion()) return 'Panel de recepcion';
    if (this.authService.isAuxiliar()) return 'Panel auxiliar';
    return 'Panel de administracion';
  }

  get descripcionRol(): string {
    if (this.authService.isCliente()) return 'Tus mascotas, citas y cuidados preventivos en un vistazo.';
    if (this.authService.isVeterinario()) return 'Citas asignadas, consultas del dia y seguimiento preventivo.';
    if (this.authService.isRecepcion()) return 'Gestion operativa de agenda, clientes, recordatorios y disponibilidad.';
    if (this.authService.isAuxiliar()) return 'Apoyo clinico para documentos, preventivos e historial.';
    return 'Resumen operativo de la clinica Huellitas Felices.';
  }

  get puedeCrearCitas(): boolean {
    return this.authService.isAdmin() || this.authService.isRecepcion() || this.authService.isCliente();
  }

  get esAdmin(): boolean {
    return this.authService.isAdmin();
  }

  get esStaff(): boolean {
    return this.authService.isAdmin() || this.authService.isVeterinario() || this.authService.isAuxiliar();
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
        this.citasPendientesConfirmar.set(ordenadas.filter(c => this.normalizarEstado(c.estado) === 'programada' && this.fechaHora(c) >= this.isoLocal(new Date())).slice(0, 5));
        this.estadosResumen.set(this.calcularEstados(ordenadas));
        this.generarCalendarioDosSemanas(hoy, ordenadas);
        this.actualizarAvisos();
      },
      error: err => {
        console.error('Error cargando citas del dashboard', err);
        this.errorMsg.set(extraerMensajeError(err, 'No se pudieron cargar las citas del dashboard.'));
      }
    });

    this.consultaService.getConsultas().subscribe({
      next: consultas => this.consultasHoy.set(consultas.filter(c => this.esHoy(c.fecha)).length),
      error: () => this.consultasHoy.set(0)
    });

    this.mascotaService.getMascotas().subscribe({
      next: mascotas => {
        this.totalMascotas.set(mascotas.length);
        this.mascotasSinChip.set(mascotas.filter(m => !m.numeroChip).slice(0, 5));
        this.actualizarAvisos();
      },
      error: () => this.totalMascotas.set(0)
    });

    this.preventivoService.getProximos().subscribe({
      next: preventivos => {
        this.preventivosProximos.set(preventivos.slice(0, 6));
        this.actualizarAvisos();
      },
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
        this.errorMsg.set(extraerMensajeError(err, 'No se pudo actualizar la cita.'));
      }
    });
  }

  irACrearCita() {
    this.router.navigate([this.puedeCrearCitas ? '/citas/crear' : '/citas']);
  }

  irACitas() {
    this.router.navigate(['/citas']);
  }

  irACitaPendiente(cita: Cita) {
    if (cita.idCita && (this.authService.isAdmin() || this.authService.isRecepcion() || this.authService.isCliente())) {
      this.router.navigate(['/citas', cita.idCita, 'editar']);
      return;
    }

    this.router.navigate(['/citas'], {
      queryParams: {
        estado: 'programada',
        fecha: 'semana',
        vista: 'agenda'
      }
    });
  }

  puedeEnviarRecordatorioCita(): boolean {
    return this.authService.isAdmin() || this.authService.isRecepcion();
  }

  contactoDueno(cita: Cita): string {
    const cliente = cita.mascota?.cliente;
    if (!cliente) return 'Dueño sin datos de contacto';
    const nombre = [cliente.nombre, cliente.apellidos].filter(Boolean).join(' ') || 'Dueño';
    const telefono = cliente.telefono || 'sin telefono';
    return `${nombre} - ${telefono}`;
  }

  telefonoDueno(cita: Cita): string {
    return cita.mascota?.cliente?.telefono || '';
  }

  emailDueno(cita: Cita): string {
    return cita.mascota?.cliente?.email || '';
  }

  llamarDueno(cita: Cita) {
    const telefono = this.telefonoDueno(cita);
    if (telefono) window.location.href = `tel:${telefono}`;
  }

  enviarRecordatorioCita(cita: Cita) {
    if (!cita.idCita || this.recordatorioEnviando() === cita.idCita) return;

    this.errorMsg.set('');
    this.successMsg.set('');
    this.recordatorioEnviando.set(cita.idCita);
    this.citaService.enviarRecordatorioCita(cita.idCita).subscribe({
      next: response => {
        this.recordatorioEnviando.set(null);
        this.successMsg.set(`${response.mensaje} Enviadas: ${response.enviadas}. Omitidas: ${response.omitidas}.`);
      },
      error: err => {
        this.recordatorioEnviando.set(null);
        this.errorMsg.set(extraerMensajeError(err, 'No se pudo enviar el recordatorio de la cita.'));
      }
    });
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

  irAMascotas() {
    this.router.navigate(['/mascotas']);
  }

  irAPreventivos() {
    this.router.navigate(['/preventivos']);
  }

  irAMascota(idMascota?: number) {
    if (idMascota) this.router.navigate(['/mascotas', idMascota]);
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

  claseAviso(tipo: AvisoOperativo['tipo']): string {
    const clases = {
      critico: 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-100',
      aviso: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-100',
      info: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-900/20 dark:text-sky-100'
    };
    return clases[tipo];
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

  private actualizarAvisos(): void {
    const avisos: AvisoOperativo[] = [];

    if (this.citasPendientesConfirmar().length > 0) {
      avisos.push({
        titulo: 'Citas pendientes de confirmar',
        descripcion: `${this.citasPendientesConfirmar().length} cita(s) proximas siguen sin confirmar.`,
        tipo: 'aviso',
        accion: 'Abrir agenda',
        destino: () => this.irACitas()
      });
    }

    if (this.mascotasSinChip().length > 0) {
      avisos.push({
        titulo: 'Mascotas sin chip',
        descripcion: `${this.mascotasSinChip().length} ficha(s) necesitan identificacion por chip.`,
        tipo: 'critico',
        accion: 'Revisar mascotas',
        destino: () => this.irAMascotas()
      });
    }

    if (this.preventivosProximos().length > 0) {
      avisos.push({
        titulo: 'Preventivos proximos',
        descripcion: `${this.preventivosProximos().length} vacuna(s) o desparasitacion(es) requieren seguimiento.`,
        tipo: 'info',
        accion: 'Ver preventivos',
        destino: () => this.irAPreventivos()
      });
    }

    if (this.citasHoy().some(cita => this.normalizarEstado(cita.estado) === 'en_consulta')) {
      avisos.push({
        titulo: 'Consultas en curso',
        descripcion: 'Hay citas marcadas como en consulta pendientes de finalizar.',
        tipo: 'aviso',
        accion: 'Ver citas de hoy',
        destino: () => this.irACitas()
      });
    }

    this.avisosOperativos.set(avisos.slice(0, 4));
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

}
