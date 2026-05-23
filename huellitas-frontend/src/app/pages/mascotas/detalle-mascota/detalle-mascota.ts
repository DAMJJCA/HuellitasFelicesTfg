import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of, switchMap, catchError } from 'rxjs';

import { AuthService } from '../../../auth/auth.service';
import { Cita, CitaService } from '../../../service/cita';
import { Consulta, ConsultaService } from '../../../service/consulta';
import { DocumentoMedico, DocumentoMedicoService } from '../../../service/documento-medico';
import { MascotaService, Mascotas } from '../../../service/mascota';
import { Preventivo, PreventivoService } from '../../../service/preventivo';
import { Tratamiento, TratamientoService } from '../../../service/tratamiento';

type PestanaFicha = 'resumen' | 'historial' | 'consultas' | 'documentos' | 'preventivos' | 'citas';

type EventoFicha = {
  tipo: 'cita' | 'consulta' | 'tratamiento' | 'preventivo' | 'documento';
  fecha: string;
  hora?: string;
  titulo: string;
  detalle: string;
  estado?: string;
  accion?: () => void;
};

@Component({
  selector: 'app-detalle-mascota',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detalle-mascota.html'
})
export class DetalleMascotaComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private mascotaService = inject(MascotaService);
  private citaService = inject(CitaService);
  private consultaService = inject(ConsultaService);
  private documentoService = inject(DocumentoMedicoService);
  private tratamientoService = inject(TratamientoService);
  private preventivoService = inject(PreventivoService);
  private authService = inject(AuthService);

  mascota = signal<Mascotas | null>(null);
  citas = signal<Cita[]>([]);
  consultas = signal<Consulta[]>([]);
  tratamientos = signal<Tratamiento[]>([]);
  preventivos = signal<Preventivo[]>([]);
  documentos = signal<DocumentoMedico[]>([]);
  errorMsg = signal('');
  cargando = signal(true);
  pestanaActiva = signal<PestanaFicha>('resumen');

  readonly pestanas: { id: PestanaFicha; label: string }[] = [
    { id: 'resumen', label: 'Resumen' },
    { id: 'historial', label: 'Historial' },
    { id: 'consultas', label: 'Consultas' },
    { id: 'documentos', label: 'Documentos' },
    { id: 'preventivos', label: 'Preventivos' },
    { id: 'citas', label: 'Citas' }
  ];

  get puedeGestionarMascota(): boolean {
    return !this.authService.isVeterinario();
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = Number(params.get('id'));
        if (Number.isNaN(id)) {
          this.errorMsg.set('Mascota no valida.');
          this.cargando.set(false);
          return of(null);
        }

        return forkJoin({
          mascota: this.mascotaService.getMascota(id),
          citas: this.citaService.getCitas().pipe(catchError(() => of([] as Cita[]))),
          consultas: this.consultaService.getConsultasPorMascota(id).pipe(catchError(() => of([] as Consulta[]))),
          documentos: this.documentoService.getDocumentosPorMascota(id).pipe(catchError(() => of([] as DocumentoMedico[]))),
          tratamientos: this.tratamientoService.getTratamientosPorMascota(id).pipe(catchError(() => of([] as Tratamiento[]))),
          preventivos: this.preventivoService.getPreventivos().pipe(catchError(() => of([] as Preventivo[])))
        });
      })
    ).subscribe({
      next: data => {
        if (!data) return;
        const idMascota = data.mascota.idMascota;
        this.mascota.set(data.mascota);
        this.citas.set(data.citas
          .filter(c => c.mascota?.idMascota === idMascota)
          .sort((a, b) => this.fechaHora(a).localeCompare(this.fechaHora(b))));
        this.consultas.set([...data.consultas].sort((a, b) => `${b.fecha}T${b.hora || '00:00'}`.localeCompare(`${a.fecha}T${a.hora || '00:00'}`)));
        this.documentos.set([...data.documentos].sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '')));
        this.tratamientos.set(data.tratamientos);
        this.preventivos.set(data.preventivos
          .filter(p => p.idMascota === idMascota)
          .sort((a, b) => (a.proximaDosis || '9999-12-31').localeCompare(b.proximaDosis || '9999-12-31')));
        this.cargando.set(false);
      },
      error: err => {
        console.error('Error cargando ficha de mascota', err);
        this.errorMsg.set('No se pudo cargar la ficha de la mascota.');
        this.cargando.set(false);
      }
    });
  }

  proximasCitas(): Cita[] {
    const ahora = this.isoLocal(new Date());
    return this.citas().filter(c => {
      const estado = this.normalizarEstado(c.estado);
      return !['cancelada', 'realizada', 'completada'].includes(estado) && this.fechaHora(c) >= ahora;
    }).slice(0, 5);
  }

  proximosPreventivos(): Preventivo[] {
    return this.preventivos().filter(p => !!p.proximaDosis).slice(0, 5);
  }

  preventivosVencidos(): Preventivo[] {
    const hoy = this.isoLocal(new Date());
    return this.preventivos().filter(p => !!p.proximaDosis && (p.proximaDosis as string) < hoy);
  }

  cambiarPestana(pestana: PestanaFicha) {
    this.pestanaActiva.set(pestana);
  }

  volver() {
    this.router.navigate(['/mascotas']);
  }

  editar() {
    const id = this.mascota()?.idMascota;
    if (id) this.router.navigate(['/mascotas', id, 'editar']);
  }

  crearCita() {
    const id = this.mascota()?.idMascota;
    if (id) {
      this.router.navigate(['/citas/crear'], { queryParams: { mascota: id } });
      return;
    }
    this.router.navigate(['/citas/crear']);
  }

  irConsultas() {
    this.router.navigate(['/consultas']);
  }

  verConsulta(consulta: Consulta) {
    if (consulta.idConsulta) this.router.navigate(['/consultas', consulta.idConsulta]);
  }

  editarCita(cita: Cita) {
    if (cita.idCita && this.puedeGestionarMascota) this.router.navigate(['/citas', cita.idCita, 'editar']);
  }

  irPreventivos() {
    const id = this.mascota()?.idMascota;
    if (id) {
      this.router.navigate(['/preventivos'], { queryParams: { mascota: id, nuevo: 1 } });
      return;
    }
    this.router.navigate(['/preventivos']);
  }

  irDocumentos() {
    this.router.navigate(['/documentos-medicos']);
  }

  subirDocumento() {
    const id = this.mascota()?.idMascota;
    if (id) {
      this.router.navigate(['/documentos-medicos'], { queryParams: { mascota: id, nuevo: 1 } });
      return;
    }
    this.router.navigate(['/documentos-medicos']);
  }

  exportarHistorial() {
    const id = this.mascota()?.idMascota;
    if (id) this.router.navigate(['/mascotas', id, 'historial-pdf']);
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
          console.error('Error abriendo documento', err);
          this.errorMsg.set('No se pudo abrir el archivo.');
        }
      });
      return;
    }
    window.open(doc.url, '_blank', 'noopener,noreferrer');
  }

  etiquetaTipoDocumento(tipo: string): string {
    const etiquetas: Record<string, string> = {
      analitica: 'Analitica',
      radiografia: 'Radiografia',
      informe: 'Informe',
      receta: 'Receta',
      consentimiento: 'Consentimiento',
      foto: 'Foto',
      otro: 'Otro'
    };
    return etiquetas[tipo] || tipo;
  }

  eventosHistorial(): EventoFicha[] {
    const eventos: EventoFicha[] = [
      ...this.citas().map(cita => ({
        tipo: 'cita' as const,
        fecha: cita.fecha,
        hora: cita.hora,
        titulo: cita.motivo || 'Cita veterinaria',
        detalle: `${cita.veterinario?.nombre || 'Sin veterinario'} - ${this.etiquetaEstado(cita.estado)}`,
        estado: this.etiquetaEstado(cita.estado),
        accion: () => this.editarCita(cita)
      })),
      ...this.consultas().map(consulta => ({
        tipo: 'consulta' as const,
        fecha: consulta.fecha,
        hora: consulta.hora,
        titulo: consulta.diagnostico || 'Consulta medica',
        detalle: consulta.observaciones || 'Sin observaciones',
        accion: () => this.verConsulta(consulta)
      })),
      ...this.tratamientos().map(tratamiento => {
        const consulta = this.consultas().find(c => c.idConsulta === tratamiento.consulta?.idConsulta);
        return {
          tipo: 'tratamiento' as const,
          fecha: consulta?.fecha || '',
          hora: consulta?.hora,
          titulo: tratamiento.nombre || 'Tratamiento',
          detalle: [tratamiento.medicamento, tratamiento.dosis, tratamiento.duracion].filter(Boolean).join(' - ') || 'Sin detalle'
        };
      }),
      ...this.preventivos().flatMap(item => {
        const eventosPreventivos: EventoFicha[] = [];
        if (item.fechaAplicacion) {
          eventosPreventivos.push({
            tipo: 'preventivo',
            fecha: item.fechaAplicacion,
            titulo: item.nombre,
            detalle: item.tipo === 'vacuna' ? 'Vacuna aplicada' : 'Desparasitacion aplicada'
          });
        }
        if (item.proximaDosis) {
          eventosPreventivos.push({
            tipo: 'preventivo',
            fecha: item.proximaDosis,
            titulo: item.nombre,
            detalle: item.tipo === 'vacuna' ? 'Proxima vacuna' : 'Proxima desparasitacion',
            estado: this.estaVencido(item) ? 'Vencido' : 'Pendiente'
          });
        }
        return eventosPreventivos;
      }),
      ...this.documentos().map(doc => ({
        tipo: 'documento' as const,
        fecha: doc.fecha || '',
        titulo: doc.nombre,
        detalle: this.etiquetaTipoDocumento(doc.tipo),
        accion: () => this.abrirDocumento(doc)
      }))
    ];

    return eventos.sort((a, b) => this.fechaEvento(b).localeCompare(this.fechaEvento(a)));
  }

  claseEvento(tipo: EventoFicha['tipo']): string {
    const clases: Record<EventoFicha['tipo'], string> = {
      cita: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-200',
      consulta: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200',
      tratamiento: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-200',
      preventivo: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-200',
      documento: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200'
    };
    return clases[tipo];
  }

  etiquetaEvento(tipo: EventoFicha['tipo']): string {
    const etiquetas: Record<EventoFicha['tipo'], string> = {
      cita: 'Cita',
      consulta: 'Consulta',
      tratamiento: 'Tratamiento',
      preventivo: 'Preventivo',
      documento: 'Documento'
    };
    return etiquetas[tipo];
  }

  estaVencido(item: Preventivo): boolean {
    if (!item.proximaDosis) return false;
    return item.proximaDosis < this.isoLocal(new Date());
  }

  formatearFecha(fecha: string | null | undefined): string {
    if (!fecha) return 'Sin fecha';
    const date = new Date(`${fecha}T00:00:00`);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  }

  edad(fechaNacimiento: string | null): string {
    if (!fechaNacimiento) return 'Sin fecha';
    const nacimiento = new Date(`${fechaNacimiento}T00:00:00`);
    const hoy = new Date();
    let years = hoy.getFullYear() - nacimiento.getFullYear();
    const monthDiff = hoy.getMonth() - nacimiento.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && hoy.getDate() < nacimiento.getDate())) years--;
    return years <= 0 ? 'Menos de 1 ano' : `${years} ano${years === 1 ? '' : 's'}`;
  }

  etiquetaEstado(estado: string): string {
    const normalizado = this.normalizarEstado(estado);
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

  clasePreventivo(item: Preventivo): string {
    if (this.estaVencido(item)) {
      return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200';
    }
    return item.tipo === 'vacuna'
      ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-200'
      : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200';
  }

  etiquetaPreventivo(item: Preventivo): string {
    if (this.estaVencido(item)) return 'Vencido';
    return item.tipo === 'vacuna' ? 'Vacuna' : 'Desparasitacion';
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

  private fechaEvento(evento: EventoFicha): string {
    return `${evento.fecha || '0000-01-01'}T${evento.hora || '00:00'}`;
  }
}
