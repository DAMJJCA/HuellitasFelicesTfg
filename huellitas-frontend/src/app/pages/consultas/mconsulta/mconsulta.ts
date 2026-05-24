import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { extraerMensajeError } from '../../../core/http-error';
import { CitaService } from '../../../service/cita';
import { Consulta, ConsultaService } from '../../../service/consulta';
import { TratamientoService } from '../../../service/tratamiento';
import { FormFieldErrorComponent } from '../../../shared/form-field-error/form-field-error';
import { StatusMessageComponent } from '../../../shared/status-message/status-message';

@Component({
  selector: 'app-mconsulta',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormFieldErrorComponent, StatusMessageComponent],
  templateUrl: './mconsulta.html'
})
export class MconsultaComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private consultaService = inject(ConsultaService);
  private tratamientoService = inject(TratamientoService);
  private citaService = inject(CitaService);
  private cdr = inject(ChangeDetectorRef);

  idConsulta!: number;
  fecha = '';
  hora = '';
  idCita!: number;
  nombreMascota = '';

  form = this.fb.nonNullable.group({
    diagnostico: ['', [Validators.maxLength(1000)]],
    observaciones: ['', [Validators.maxLength(1500)]],
    tratamiento: [false]
  });

  tratamientoForm = this.fb.nonNullable.group({
    nombre: [''],
    medicamento: [''],
    dosis: [''],
    duracion: [''],
    descripcion: ['', [Validators.maxLength(1000)]]
  });

  cargando = false;
  errorMsg = '';
  successMsg = '';
  finalizarAlGuardar = false;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (Number.isNaN(id)) {
      this.errorMsg = 'ID de consulta inválido.';
      return;
    }

    this.idConsulta = id;

    this.consultaService.getConsulta(id).subscribe({
      next: (c: Consulta) => {
        this.fecha = c.fecha;
        this.hora = c.hora;
        this.idCita = c.idCita ?? 0;
        this.nombreMascota = c.nombreMascota;

        this.form.patchValue({
          diagnostico: c.diagnostico ?? '',
          observaciones: c.observaciones ?? '',
          tratamiento: c.tratamiento ?? false
        });

        this.cdr.detectChanges();
      },
      error: err => {
        this.errorMsg = extraerMensajeError(err, 'No se pudo cargar la consulta.');
      }
    });
  }

  guardar(finalizar = false): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMsg = 'Revisa el diagnostico y las observaciones antes de guardar.';
      return;
    }

    if (finalizar && !this.form.value.diagnostico?.trim()) {
      this.errorMsg = 'Para finalizar la consulta debes completar el diagnostico.';
      return;
    }

    if (this.form.value.tratamiento === true && !this.tratamientoValido()) {
      this.errorMsg = 'Para crear un tratamiento indica nombre, medicamento, dosis y duracion.';
      return;
    }

    this.cargando = true;
    this.errorMsg = '';
    this.successMsg = '';
    this.finalizarAlGuardar = finalizar;

    this.consultaService.actualizarConsulta(this.idConsulta, this.form.getRawValue()).subscribe({
      next: () => {
        if (this.form.value.tratamiento === true) {
          const t = this.tratamientoForm.getRawValue();
          const tratamiento = {
            nombre: t.nombre,
            medicamento: t.medicamento,
            dosis: t.dosis,
            duracion: t.duracion,
            descripcion: t.descripcion,
            consulta: { idConsulta: this.idConsulta }
          };

          this.tratamientoService.crear(tratamiento).subscribe({
            next: () => this.finalizarGuardado(true),
            error: err => {
              this.cargando = false;
              this.errorMsg = extraerMensajeError(err, 'Error creando el tratamiento.');
            }
          });
          return;
        }

        this.finalizarGuardado(false);
      },
      error: err => {
        this.cargando = false;
        this.errorMsg = extraerMensajeError(err, 'Error guardando la consulta.');
      }
    });
  }

  finalizarGuardado(conTratamiento: boolean): void {
    if (this.finalizarAlGuardar && this.idCita) {
      this.citaService.actualizarEstado(this.idCita, 'realizada').subscribe({
        next: () => this.mostrarGuardado(conTratamiento, true),
        error: err => {
          this.cargando = false;
          this.errorMsg = extraerMensajeError(err, 'La consulta se guardó, pero no se pudo marcar la cita como realizada.');
        }
      });
      return;
    }

    this.mostrarGuardado(conTratamiento, false);
  }

  cancelar(): void {
    this.router.navigate(['/consultas']);
  }

  private mostrarGuardado(conTratamiento: boolean, finalizada: boolean): void {
    this.cargando = false;
    const mensaje = conTratamiento
      ? 'Consulta y tratamiento guardados correctamente.'
      : 'Consulta guardada correctamente.';
    this.successMsg = finalizada ? `${mensaje} Cita marcada como realizada.` : mensaje;

    setTimeout(() => {
      this.router.navigate(['/consultas', this.idConsulta]);
    }, 400);
  }

  private tratamientoValido(): boolean {
    const t = this.tratamientoForm.getRawValue();
    return Boolean(t.nombre.trim() && t.medicamento.trim() && t.dosis.trim() && t.duracion.trim());
  }
}
