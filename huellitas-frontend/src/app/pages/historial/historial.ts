import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';

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

  consultas: Consulta[] = [];
  tratamientos: Tratamiento[] = [];

  mascotaSeleccionadaId: number | null = null;
  cargando = false;

  ngOnInit(): void {
    //  Cargar mascotas para el filtro
    this.mascotas$ = this.mascotaService.getMascotas();
  }

  seleccionarMascota(idMascota: string): void {

    if (!idMascota) {
      this.consultas = [];
      this.tratamientos = [];
      this.mascotaSeleccionadaId = null;
      return;
    }

    this.mascotaSeleccionadaId = Number(idMascota);
    this.cargando = true;

    //  Obtener consultas por mascota
    this.consultaService
      .getConsultasPorMascota(this.mascotaSeleccionadaId)
      .subscribe({
        next: c => {
          this.consultas = c;
          this.cargando = false;
        },
        error: () => {
          this.consultas = [];
          this.cargando = false;
        }
      });

    //  Obtener tratamientos por mascota
    this.tratamientoService
      .getTratamientosPorMascota(this.mascotaSeleccionadaId)
      .subscribe({
        next: t => this.tratamientos = t,
        error: () => this.tratamientos = []
      });
  }
}
