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

  volver() {
    this.router.navigate(['/mascotas']);
  }

  editar() {
    const id = this.mascota()?.idMascota;
    if (id) this.router.navigate(['/mascotas', id, 'editar']);
  }

  crearCita() {
    this.router.navigate(['/citas/crear']);
  }

  irPreventivos() {
    this.router.navigate(['/preventivos']);
  }

  irDocumentos() {
    this.router.navigate(['/documentos-medicos']);
  }

  abrirDocumento(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer');
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
