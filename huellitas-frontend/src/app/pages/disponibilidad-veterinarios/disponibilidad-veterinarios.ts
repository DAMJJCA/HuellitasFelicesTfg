import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import {
  DisponibilidadVeterinario,
  DisponibilidadVeterinarioDto,
  DisponibilidadVeterinarioService,
  ExcepcionDisponibilidadVeterinario,
  ExcepcionDisponibilidadVeterinarioDto,
  TipoExcepcionDisponibilidad
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
  excepciones = signal<ExcepcionDisponibilidadVeterinario[]>([]);
  veterinarios = signal<veterinario[]>([]);
  cargando = signal(false);
  errorMsg = '';
  successMsg = '';
  editandoId: number | null = null;
  editandoExcepcionId: number | null = null;
  minFecha = this.fechaHoy();

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
  excepcionForm: ExcepcionDisponibilidadVeterinarioDto = this.excepcionFormVacio();

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando.set(true);
    this.errorMsg = '';

    forkJoin({
      disponibilidades: this.disponibilidadService.getDisponibilidades(),
      excepciones: this.disponibilidadService.getExcepciones(),
      veterinarios: this.veterinarioService.getVeterinarios()
    }).subscribe({
      next: data => {
        this.disponibilidades.set(data.disponibilidades);
        this.excepciones.set(data.excepciones);
        this.veterinarios.set(data.veterinarios);
        if (!this.form.idVeterinario && data.veterinarios[0]?.idVeterinario) {
          this.form.idVeterinario = data.veterinarios[0].idVeterinario;
        }
        if (!this.excepcionForm.idVeterinario && data.veterinarios[0]?.idVeterinario) {
          this.excepcionForm.idVeterinario = data.veterinarios[0].idVeterinario;
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

  guardarExcepcion(): void {
    this.errorMsg = '';
    this.successMsg = '';

    if (!this.excepcionForm.idVeterinario || !this.excepcionForm.fecha || !this.excepcionForm.tipo) {
      this.errorMsg = 'Completa veterinario, fecha y tipo de excepcion.';
      return;
    }

    const payload = this.normalizarExcepcionForm();
    if (payload.tipo === 'disponible') {
      if (!payload.horaInicio || !payload.horaFin) {
        this.errorMsg = 'Indica hora de inicio y fin para una excepcion disponible.';
        return;
      }
      if (payload.horaInicio >= payload.horaFin) {
        this.errorMsg = 'La hora de inicio debe ser anterior a la hora de fin.';
        return;
      }
    }

    const request$ = this.editandoExcepcionId
      ? this.disponibilidadService.actualizarExcepcion(this.editandoExcepcionId, payload)
      : this.disponibilidadService.crearExcepcion(payload);

    request$.subscribe({
      next: () => {
        this.successMsg = this.editandoExcepcionId ? 'Excepcion actualizada.' : 'Excepcion creada.';
        this.cancelarEdicionExcepcion();
        this.cargarDatos();
      },
      error: err => {
        console.error('Error guardando excepcion', err);
        this.errorMsg = this.extraerMensajeError(err, 'No se pudo guardar la excepcion.');
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

  editarExcepcion(item: ExcepcionDisponibilidadVeterinario): void {
    if (!item.idExcepcion) return;
    this.editandoExcepcionId = item.idExcepcion;
    this.excepcionForm = {
      idVeterinario: item.idVeterinario,
      fecha: item.fecha,
      tipo: item.tipo,
      horaInicio: item.horaInicio,
      horaFin: item.horaFin,
      motivo: item.motivo,
      activo: item.activo
    };
  }

  eliminarExcepcion(item: ExcepcionDisponibilidadVeterinario): void {
    if (!item.idExcepcion) return;
    this.disponibilidadService.eliminarExcepcion(item.idExcepcion).subscribe({
      next: () => {
        this.successMsg = 'Excepcion eliminada.';
        this.cargarDatos();
      },
      error: err => {
        console.error('Error eliminando excepcion', err);
        this.errorMsg = 'No se pudo eliminar la excepcion.';
      }
    });
  }

  cancelarEdicion(): void {
    const idVeterinario = this.veterinarios()[0]?.idVeterinario || 0;
    this.editandoId = null;
    this.form = this.formVacio(idVeterinario);
  }

  cancelarEdicionExcepcion(): void {
    const idVeterinario = this.veterinarios()[0]?.idVeterinario || 0;
    this.editandoExcepcionId = null;
    this.excepcionForm = this.excepcionFormVacio(idVeterinario);
  }

  onTipoExcepcionChange(tipo: TipoExcepcionDisponibilidad): void {
    this.excepcionForm.tipo = tipo;
    if (tipo === 'no_disponible') {
      this.excepcionForm.horaInicio = null;
      this.excepcionForm.horaFin = null;
    } else {
      this.excepcionForm.horaInicio ||= '09:00';
      this.excepcionForm.horaFin ||= '14:00';
    }
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

  excepcionesOrdenadas(): ExcepcionDisponibilidadVeterinario[] {
    return [...this.excepciones()].sort((a, b) =>
      `${b.fecha}-${a.nombreVeterinario || ''}-${a.horaInicio || ''}`.localeCompare(`${a.fecha}-${b.nombreVeterinario || ''}-${b.horaInicio || ''}`)
    );
  }

  etiquetaTipoExcepcion(tipo: TipoExcepcionDisponibilidad): string {
    return tipo === 'disponible' ? 'Horario especial' : 'No disponible';
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

  private excepcionFormVacio(idVeterinario = 0): ExcepcionDisponibilidadVeterinarioDto {
    return {
      idVeterinario,
      fecha: this.fechaHoy(),
      tipo: 'no_disponible',
      horaInicio: null,
      horaFin: null,
      motivo: '',
      activo: true
    };
  }

  private normalizarExcepcionForm(): ExcepcionDisponibilidadVeterinarioDto {
    return {
      ...this.excepcionForm,
      horaInicio: this.excepcionForm.tipo === 'disponible' ? this.excepcionForm.horaInicio : null,
      horaFin: this.excepcionForm.tipo === 'disponible' ? this.excepcionForm.horaFin : null,
      motivo: this.excepcionForm.motivo || null
    };
  }

  private fechaHoy(): string {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${(hoy.getMonth() + 1).toString().padStart(2, '0')}-${hoy.getDate().toString().padStart(2, '0')}`;
  }

  private extraerMensajeError(err: any, fallback: string): string {
    if (typeof err?.error === 'string' && err.error.trim()) {
      return err.error;
    }
    return err?.error?.detail || err?.error?.message || err?.error?.error || fallback;
  }
}
