import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, forkJoin, of, switchMap } from 'rxjs';

import { Cita, CitaService } from '../../../service/cita';
import { Consulta, ConsultaService } from '../../../service/consulta';
import { DocumentoMedico, DocumentoMedicoService } from '../../../service/documento-medico';
import { MascotaService, Mascotas } from '../../../service/mascota';
import { Preventivo, PreventivoService } from '../../../service/preventivo';
import { Tratamiento, TratamientoService } from '../../../service/tratamiento';

@Component({
  selector: 'app-historial-pdf',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './historial-pdf.html'
})
export class HistorialPdfComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private mascotaService = inject(MascotaService);
  private citaService = inject(CitaService);
  private consultaService = inject(ConsultaService);
  private tratamientoService = inject(TratamientoService);
  private preventivoService = inject(PreventivoService);
  private documentoService = inject(DocumentoMedicoService);

  mascota = signal<Mascotas | null>(null);
  citas = signal<Cita[]>([]);
  consultas = signal<Consulta[]>([]);
  tratamientos = signal<Tratamiento[]>([]);
  preventivos = signal<Preventivo[]>([]);
  documentos = signal<DocumentoMedico[]>([]);
  cargando = signal(true);
  errorMsg = signal('');
  generadoEn = new Date();

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
          tratamientos: this.tratamientoService.getTratamientosPorMascota(id).pipe(catchError(() => of([] as Tratamiento[]))),
          preventivos: this.preventivoService.getPreventivos().pipe(catchError(() => of([] as Preventivo[]))),
          documentos: this.documentoService.getDocumentosPorMascota(id).pipe(catchError(() => of([] as DocumentoMedico[])))
        });
      })
    ).subscribe({
      next: data => {
        if (!data) return;
        const idMascota = data.mascota.idMascota;
        this.mascota.set(data.mascota);
        this.citas.set(data.citas.filter(c => c.mascota?.idMascota === idMascota).sort((a, b) => this.fechaHora(b).localeCompare(this.fechaHora(a))));
        this.consultas.set(data.consultas.sort((a, b) => `${b.fecha}T${b.hora || '00:00'}`.localeCompare(`${a.fecha}T${a.hora || '00:00'}`)));
        this.tratamientos.set(data.tratamientos);
        this.preventivos.set(data.preventivos.filter(p => p.idMascota === idMascota));
        this.documentos.set(data.documentos);
        this.cargando.set(false);
      },
      error: err => {
        console.error('Error cargando informe de historial', err);
        this.errorMsg.set('No se pudo cargar el informe.');
        this.cargando.set(false);
      }
    });
  }

  imprimir(): void {
    window.print();
  }

  volver(): void {
    const id = this.mascota()?.idMascota;
    this.router.navigate(id ? ['/mascotas', id] : ['/mascotas']);
  }

  formatearFecha(fecha: string | null | undefined): string {
    if (!fecha) return 'Sin fecha';
    const date = new Date(`${fecha}T00:00:00`);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  }

  formatearFechaHora(date: Date): string {
    return `${this.formatearFecha(this.isoLocal(date))} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }

  resumenTratamiento(tratamiento: Tratamiento): string {
    return [tratamiento.dosis, tratamiento.duracion, tratamiento.descripcion].filter(Boolean).join(' - ') || 'Sin detalle';
  }

  private fechaHora(cita: Cita): string {
    return `${cita.fecha}T${cita.hora || '00:00'}`;
  }

  private isoLocal(date: Date): string {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  }
}
