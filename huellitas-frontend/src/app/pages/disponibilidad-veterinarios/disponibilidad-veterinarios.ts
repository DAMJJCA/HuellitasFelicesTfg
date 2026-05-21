import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import {
  DisponibilidadVeterinario,
  DisponibilidadVeterinarioDto,
  DisponibilidadVeterinarioService
} from '../../service/disponibilidad-veterinario';
import { VeterinarioService, veterinario } from '../../service/veterinario';

@Component({
  selector: 'app-disponibilidad-veterinarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './disponibilidad-veterinarios.html'
})
export class DisponibilidadVeterinariosComponent {
  private disponibilidadService = inject(DisponibilidadVeterinarioService);
  private veterinarioService = inject(VeterinarioService);

  disponibilidades = signal<DisponibilidadVeterinario[]>([]);
  veterinarios = signal<veterinario[]>([]);
  cargando = signal(false);
  errorMsg = '';
  successMsg = '';
  editandoId: number | null = null;

  dias = [
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miercoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sabado' },
    { value: 7, label: 'Domingo' }
  ];

  form: DisponibilidadVeterinarioDto = this.formVacio();

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando.set(true);
    this.errorMsg = '';

    forkJoin({
      disponibilidades: this.disponibilidadService.getDisponibilidades(),
      veterinarios: this.veterinarioService.getVeterinarios()
    }).subscribe({
      next: data => {
        this.disponibilidades.set(data.disponibilidades);
        this.veterinarios.set(data.veterinarios);
        if (!this.form.idVeterinario && data.veterinarios[0]?.idVeterinario) {
          this.form.idVeterinario = data.veterinarios[0].idVeterinario;
        }
        this.cargando.set(false);
      },
      error: err => {
        console.error('Error cargando disponibilidad', err);
        this.errorMsg = 'No se pudo cargar la disponibilidad.';
        this.cargando.set(false);
      }
    });
  }

  guardar(): void {
    this.errorMsg = '';
    this.successMsg = '';

    if (!this.form.idVeterinario || !this.form.diaSemana || !this.form.horaInicio || !this.form.horaFin) {
      this.errorMsg = 'Completa veterinario, dia y tramo horario.';
      return;
    }

    if (this.form.horaInicio >= this.form.horaFin) {
      this.errorMsg = 'La hora de inicio debe ser anterior a la hora de fin.';
      return;
    }

    const request$ = this.editandoId
      ? this.disponibilidadService.actualizarDisponibilidad(this.editandoId, this.form)
      : this.disponibilidadService.crearDisponibilidad(this.form);

    request$.subscribe({
      next: () => {
        this.successMsg = this.editandoId ? 'Disponibilidad actualizada.' : 'Disponibilidad creada.';
        this.cancelarEdicion();
        this.cargarDatos();
      },
      error: err => {
        console.error('Error guardando disponibilidad', err);
        this.errorMsg = this.extraerMensajeError(err, 'No se pudo guardar la disponibilidad.');
      }
    });
  }

  editar(item: DisponibilidadVeterinario): void {
    if (!item.idDisponibilidad) return;
    this.editandoId = item.idDisponibilidad;
    this.form = {
      idVeterinario: item.idVeterinario,
      diaSemana: item.diaSemana,
      horaInicio: item.horaInicio,
      horaFin: item.horaFin,
      activo: item.activo
    };
  }

  eliminar(item: DisponibilidadVeterinario): void {
    if (!item.idDisponibilidad) return;
    this.disponibilidadService.eliminarDisponibilidad(item.idDisponibilidad).subscribe({
      next: () => {
        this.successMsg = 'Disponibilidad eliminada.';
        this.cargarDatos();
      },
      error: err => {
        console.error('Error eliminando disponibilidad', err);
        this.errorMsg = 'No se pudo eliminar la disponibilidad.';
      }
    });
  }

  cancelarEdicion(): void {
    const idVeterinario = this.veterinarios()[0]?.idVeterinario || 0;
    this.editandoId = null;
    this.form = this.formVacio(idVeterinario);
  }

  etiquetaDia(dia: number): string {
    return this.dias.find(d => d.value === dia)?.label || 'Dia';
  }

  nombreVeterinario(idVeterinario: number): string {
    return this.veterinarios().find(v => v.idVeterinario === idVeterinario)?.nombre || 'Veterinario';
  }

  disponibilidadesOrdenadas(): DisponibilidadVeterinario[] {
    return [...this.disponibilidades()].sort((a, b) =>
      `${a.nombreVeterinario || ''}-${a.diaSemana}-${a.horaInicio}`.localeCompare(`${b.nombreVeterinario || ''}-${b.diaSemana}-${b.horaInicio}`)
    );
  }

  private formVacio(idVeterinario = 0): DisponibilidadVeterinarioDto {
    return {
      idVeterinario,
      diaSemana: 1,
      horaInicio: '09:00',
      horaFin: '14:00',
      activo: true
    };
  }

  private extraerMensajeError(err: any, fallback: string): string {
    return err?.error?.detail || err?.error?.message || err?.error?.error || fallback;
  }
}
