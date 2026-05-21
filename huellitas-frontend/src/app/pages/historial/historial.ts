import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { catchError, forkJoin, of } from 'rxjs';

import { Cita, CitaService } from '../../service/cita';
import { Consulta, ConsultaService } from '../../service/consulta';
import { MascotaService, Mascotas } from '../../service/mascota';
import { Preventivo, PreventivoService } from '../../service/preventivo';
import { Tratamiento, TratamientoService } from '../../service/tratamiento';

type TipoEvento = 'cita' | 'consulta' | 'tratamiento' | 'vacuna' | 'desparasitacion';

type EventoHistorial = {
  tipo: TipoEvento;
  fecha: string;
  hora?: string;
  titulo: string;
  subtitulo: string;
  descripcion?: string;
  estado?: string;
};

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './historial.html'
})
export class HistorialComponent {

  private mascotaService = inject(MascotaService);
  private citaService = inject(CitaService);
  private consultaService = inject(ConsultaService);
  private tratamientoService = inject(TratamientoService);
  private preventivoService = inject(PreventivoService);

  mascotas = signal<Mascotas[]>([]);
  mascotaSeleccionada = signal<Mascotas | null>(null);
  eventos = signal<EventoHistorial[]>([]);
  eventosFiltrados = signal<EventoHistorial[]>([]);
  errorMsg = signal('');
  cargando = signal(false);
  terminoBusqueda = '';
  terminoMascota = '';
  tipoActivo: TipoEvento | 'todos' = 'todos';

  ngOnInit(): void {
    this.mascotaService.getMascotas().subscribe({
      next: mascotas => this.mascotas.set(mascotas),
      error: () => this.errorMsg.set('No se pudieron cargar las mascotas.')
    });
  }

  seleccionarMascota(idMascota: string): void {
    this.errorMsg.set('');
    this.eventos.set([]);
    this.eventosFiltrados.set([]);

    if (!idMascota) {
      this.mascotaSeleccionada.set(null);
      return;
    }

    const id = Number(idMascota);
    const mascota = this.mascotas().find(m => m.idMascota === id) || null;
    this.mascotaSeleccionada.set(mascota);
    this.cargando.set(true);

    forkJoin({
      citas: this.citaService.getCitas().pipe(catchError(() => of([] as Cita[]))),
      consultas: this.consultaService.getConsultasPorMascota(id).pipe(catchError(() => of([] as Consulta[]))),
      tratamientos: this.tratamientoService.getTratamientosPorMascota(id).pipe(catchError(() => of([] as Tratamiento[]))),
      preventivos: this.preventivoService.getPreventivos().pipe(catchError(() => of([] as Preventivo[])))
    }).subscribe({
      next: data => {
        const eventos = [
          ...this.mapearCitas(data.citas.filter(c => c.mascota?.idMascota === id)),
          ...this.mapearConsultas(data.consultas),
          ...this.mapearTratamientos(data.tratamientos, data.consultas),
          ...this.mapearPreventivos(data.preventivos.filter(p => p.idMascota === id))
        ].sort((a, b) => this.fechaOrden(b).localeCompare(this.fechaOrden(a)));

        this.eventos.set(eventos);
        this.aplicarFiltros();
        this.cargando.set(false);
      },
      error: err => {
        console.error('Error cargando historial', err);
        this.errorMsg.set('No se pudo cargar el historial medico.');
        this.cargando.set(false);
      }
    });
  }

  onBuscar(valor: string): void {
    this.terminoBusqueda = valor;
    this.aplicarFiltros();
  }

  onBuscarMascota(valor: string): void {
    this.terminoMascota = valor;
  }

  mascotasFiltradas(): Mascotas[] {
    const termino = this.normalizarTexto(this.terminoMascota);
    if (!termino) return this.mascotas();

    return this.mascotas().filter(mascota =>
      this.textoBusquedaMascota(mascota).includes(termino)
    );
  }

  etiquetaMascota(mascota: Mascotas): string {
    const duenio = mascota.cliente
      ? `${mascota.cliente.nombre} ${mascota.cliente.apellidos}`.trim()
      : 'Sin duenio';
    const especie = mascota.especie || 'Sin especie';
    const id = mascota.idMascota ? `#${mascota.idMascota}` : 'Sin ID';
    return `${mascota.nombre} - ${duenio} - ${especie} - ${id}`;
  }

  filtrarTipo(tipo: TipoEvento | 'todos') {
    this.tipoActivo = tipo;
    this.aplicarFiltros();
  }

  totalPorTipo(tipo: TipoEvento): number {
    return this.eventos().filter(e => e.tipo === tipo).length;
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return 'Sin fecha';
    const date = new Date(`${fecha}T00:00:00`);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  }

  etiquetaTipo(tipo: TipoEvento): string {
    const etiquetas: Record<TipoEvento, string> = {
      cita: 'Cita',
      consulta: 'Consulta',
      tratamiento: 'Tratamiento',
      vacuna: 'Vacuna',
      desparasitacion: 'Desparasitacion'
    };
    return etiquetas[tipo];
  }

  claseTipo(tipo: TipoEvento): string {
    const clases: Record<TipoEvento, string> = {
      cita: 'bg-sky-100 text-sky-800 ring-sky-200 dark:bg-sky-900/30 dark:text-sky-200 dark:ring-sky-700',
      consulta: 'bg-indigo-100 text-indigo-800 ring-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-200 dark:ring-indigo-700',
      tratamiento: 'bg-violet-100 text-violet-800 ring-violet-200 dark:bg-violet-900/30 dark:text-violet-200 dark:ring-violet-700',
      vacuna: 'bg-teal-100 text-teal-800 ring-teal-200 dark:bg-teal-900/30 dark:text-teal-200 dark:ring-teal-700',
      desparasitacion: 'bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:ring-amber-700'
    };
    return clases[tipo];
  }

  claseEstado(estado: string | undefined): string {
    const normalizado = (estado || '').toLowerCase().replace(/[- ]/g, '_');
    const clases: Record<string, string> = {
      programada: 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-200',
      confirmada: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200',
      en_consulta: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200',
      realizada: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100',
      completada: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100',
      cancelada: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200'
    };
    return clases[normalizado] || 'bg-slate-50 text-slate-700 dark:bg-slate-700 dark:text-slate-100';
  }

  private aplicarFiltros() {
    const t = this.normalizarTexto(this.terminoBusqueda);
    const filtrados = this.eventos().filter(evento => {
      const coincideTipo = this.tipoActivo === 'todos' || evento.tipo === this.tipoActivo;
      const coincideTexto = !t ||
        this.normalizarTexto(evento.titulo).includes(t) ||
        this.normalizarTexto(evento.subtitulo).includes(t) ||
        this.normalizarTexto(evento.descripcion || '').includes(t) ||
        this.normalizarTexto(evento.estado || '').includes(t);
      return coincideTipo && coincideTexto;
    });

    this.eventosFiltrados.set(filtrados);
  }

  private mapearCitas(citas: Cita[]): EventoHistorial[] {
    return citas.map(cita => ({
      tipo: 'cita',
      fecha: cita.fecha,
      hora: cita.hora,
      titulo: cita.motivo || 'Cita veterinaria',
      subtitulo: `Veterinario: ${cita.veterinario?.nombre || 'Sin asignar'}`,
      descripcion: `Estado de la cita: ${this.etiquetaEstado(cita.estado)}`,
      estado: this.etiquetaEstado(cita.estado)
    }));
  }

  private mapearConsultas(consultas: Consulta[]): EventoHistorial[] {
    return consultas.map(consulta => ({
      tipo: 'consulta',
      fecha: consulta.fecha,
      hora: consulta.hora,
      titulo: consulta.diagnostico || 'Consulta medica',
      subtitulo: consulta.tratamiento ? 'Consulta con tratamiento' : 'Consulta sin tratamiento',
      descripcion: consulta.observaciones || 'Sin observaciones'
    }));
  }

  private mapearTratamientos(tratamientos: Tratamiento[], consultas: Consulta[]): EventoHistorial[] {
    return tratamientos.map(tratamiento => {
      const consulta = consultas.find(c => c.idConsulta === tratamiento.consulta?.idConsulta);
      return {
        tipo: 'tratamiento',
        fecha: consulta?.fecha || '',
        hora: consulta?.hora,
        titulo: tratamiento.nombre || 'Tratamiento',
        subtitulo: tratamiento.medicamento || 'Sin medicamento',
        descripcion: [tratamiento.dosis, tratamiento.duracion, tratamiento.descripcion].filter(Boolean).join(' - ')
      };
    });
  }

  private mapearPreventivos(preventivos: Preventivo[]): EventoHistorial[] {
    return preventivos.flatMap(preventivo => {
      const eventos: EventoHistorial[] = [];
      if (preventivo.fechaAplicacion) {
        eventos.push({
          tipo: preventivo.tipo,
          fecha: preventivo.fechaAplicacion,
          titulo: preventivo.nombre,
          subtitulo: preventivo.tipo === 'vacuna' ? 'Vacuna aplicada' : 'Desparasitacion aplicada',
          descripcion: preventivo.observaciones || undefined
        });
      }
      if (preventivo.proximaDosis) {
        eventos.push({
          tipo: preventivo.tipo,
          fecha: preventivo.proximaDosis,
          titulo: preventivo.nombre,
          subtitulo: 'Proxima dosis',
          descripcion: preventivo.observaciones || undefined,
          estado: 'Pendiente'
        });
      }
      return eventos;
    });
  }

  private fechaOrden(evento: EventoHistorial): string {
    return `${evento.fecha || '0000-01-01'}T${evento.hora || '00:00'}`;
  }

  private etiquetaEstado(estado: string): string {
    const normalizado = (estado || 'programada').toLowerCase().replace(/[- ]/g, '_');
    const etiquetas: Record<string, string> = {
      programada: 'Programada',
      confirmada: 'Confirmada',
      en_consulta: 'En consulta',
      realizada: 'Realizada',
      completada: 'Completada',
      cancelada: 'Cancelada'
    };
    return etiquetas[normalizado] || estado;
  }

  private textoBusquedaMascota(mascota: Mascotas): string {
    const duenio = mascota.cliente
      ? `${mascota.cliente.nombre} ${mascota.cliente.apellidos} ${mascota.cliente.idCliente}`
      : '';
    return this.normalizarTexto([
      mascota.idMascota,
      mascota.nombre,
      mascota.especie,
      mascota.raza,
      duenio
    ].filter(Boolean).map(String).join(' '));
  }

  private normalizarTexto(valor: string): string {
    return valor
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }
}
