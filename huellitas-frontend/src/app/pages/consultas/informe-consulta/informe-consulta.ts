import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, forkJoin, of, switchMap } from 'rxjs';

import { Cita, CitaService } from '../../../service/cita';
import { Consulta, ConsultaService } from '../../../service/consulta';
import { DocumentoMedico, DocumentoMedicoService } from '../../../service/documento-medico';
import { Tratamiento, TratamientoService } from '../../../service/tratamiento';

@Component({
  selector: 'app-informe-consulta',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './informe-consulta.html'
})
export class InformeConsultaComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private consultaService = inject(ConsultaService);
  private citaService = inject(CitaService);
  private tratamientoService = inject(TratamientoService);
  private documentoService = inject(DocumentoMedicoService);

  consulta = signal<Consulta | null>(null);
  cita = signal<Cita | null>(null);
  tratamientos = signal<Tratamiento[]>([]);
  documentos = signal<DocumentoMedico[]>([]);
  cargando = signal(true);
  errorMsg = signal('');
  generadoEn = new Date();

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = Number(params.get('id'));
        if (Number.isNaN(id)) {
          this.errorMsg.set('Consulta no valida.');
          this.cargando.set(false);
          return of(null);
        }

        return this.consultaService.getConsulta(id).pipe(
          switchMap(consulta => {
            if (!consulta.idCita) {
              return of({ consulta, cita: null, tratamientos: [] as Tratamiento[], documentos: [] as DocumentoMedico[] });
            }

            return this.citaService.getCita(consulta.idCita).pipe(
              switchMap(cita => {
                const idMascota = (cita.mascota as any)?.idMascota;
                return forkJoin({
                  consulta: of(consulta),
                  cita: of(cita),
                  tratamientos: this.tratamientoService.getTratamientos().pipe(catchError(() => of([] as Tratamiento[]))),
                  documentos: idMascota
                    ? this.documentoService.getDocumentosPorMascota(idMascota).pipe(catchError(() => of([] as DocumentoMedico[])))
                    : of([] as DocumentoMedico[])
                });
              })
            );
          }),
          catchError(err => {
            console.error('Error cargando informe de consulta', err);
            this.errorMsg.set('No se pudo cargar el informe de consulta.');
            this.cargando.set(false);
            return of(null);
          })
        );
      })
    ).subscribe(data => {
      if (!data) return;
      this.consulta.set(data.consulta);
      this.cita.set(data.cita);
      this.tratamientos.set(data.tratamientos.filter(t => t.consulta?.idConsulta === data.consulta.idConsulta));
      this.documentos.set(data.documentos.filter(d => d.idConsulta === data.consulta.idConsulta));
      this.cargando.set(false);
    });
  }

  imprimir(): void {
    window.print();
  }

  volver(): void {
    const id = this.consulta()?.idConsulta;
    this.router.navigate(id ? ['/consultas', id] : ['/consultas']);
  }

  mascotaNombre(): string {
    const mascota = this.cita()?.mascota as any;
    return mascota?.nombre || this.consulta()?.nombreMascota || 'Sin datos';
  }

  chipMascota(): string {
    const chip = (this.cita()?.mascota as any)?.numeroChip;
    return chip || 'Sin chip registrado';
  }

  duenioNombre(): string {
    const cliente = (this.cita()?.mascota as any)?.cliente;
    return cliente ? `${cliente.nombre} ${cliente.apellidos}`.trim() : 'Sin datos';
  }

  veterinarioNombre(): string {
    return this.cita()?.veterinario?.nombre || 'Sin asignar';
  }

  resumenTratamiento(tratamiento: Tratamiento): string {
    return [tratamiento.medicamento, tratamiento.dosis, tratamiento.duracion].filter(Boolean).join(' - ') || 'Sin pauta registrada';
  }

  formatearFecha(fecha: string | null | undefined): string {
    if (!fecha) return 'Sin fecha';
    const date = new Date(`${fecha}T00:00:00`);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  }

  formatearFechaHora(date: Date): string {
    return `${this.formatearFecha(this.isoLocal(date))} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }

  private isoLocal(date: Date): string {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  }
}
