import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Observable, Subject, combineLatest, startWith, map } from 'rxjs';

import { MascotaService, Mascotas } from '../../service/mascota';
import { ConsultaService, Consulta } from '../../service/consulta';
import { TratamientoService, Tratamiento } from '../../service/tratamiento';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './historial.html'
})
export class HistorialComponent {

  private mascotaService = inject(MascotaService);
  private consultaService = inject(ConsultaService);
  private tratamientoService = inject(TratamientoService);

  mascotas$!: Observable<Mascotas[]>;

  consultas$!: Observable<Consulta[]>;
  tratamientos$!: Observable<Tratamiento[]>;

  consultasFiltradas$!: Observable<Consulta[]>;
  tratamientosFiltrados$!: Observable<Tratamiento[]>;

  private buscar$ = new Subject<string>();

  mascotaSeleccionadaId: number | null = null;

  ngOnInit(): void {
    this.mascotas$ = this.mascotaService.getMascotas();
  }

  seleccionarMascota(idMascota: string): void {
    if (!idMascota) {
      this.mascotaSeleccionadaId = null;
      return;
    }

    this.mascotaSeleccionadaId = Number(idMascota);

    this.consultas$ = this.consultaService
      .getConsultasPorMascota(this.mascotaSeleccionadaId);

    this.tratamientos$ = this.tratamientoService
      .getTratamientosPorMascota(this.mascotaSeleccionadaId);

    this.consultasFiltradas$ = combineLatest([
      this.consultas$,
      this.buscar$.pipe(startWith(''))
    ]).pipe(
      map(([lista, term]) => {
        const t = term.toLowerCase();
        return lista.filter(c =>
          c.nombreMascota?.toLowerCase().includes(t) ||
          c.diagnostico?.toLowerCase().includes(t) ||
          c.observaciones?.toLowerCase().includes(t)
        );
      })
    );

    this.tratamientosFiltrados$ = combineLatest([
      this.tratamientos$,
      this.buscar$.pipe(startWith(''))
    ]).pipe(
      map(([lista, term]) => {
        const t = term.toLowerCase();
        return lista.filter(tr =>
          tr.nombreMascota?.toLowerCase().includes(t) ||
          tr.nombre.toLowerCase().includes(t) ||
          tr.medicamento.toLowerCase().includes(t) ||
          tr.descripcion.toLowerCase().includes(t)
        );
      })
    );
  }

  onBuscar(valor: string): void {
    this.buscar$.next(valor);
  }
}