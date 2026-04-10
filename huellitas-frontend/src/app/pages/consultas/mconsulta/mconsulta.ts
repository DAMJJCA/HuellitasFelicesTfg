import { CommonModule } from '@angular/common';
import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConsultaService, Consulta } from '../../../service/consulta';
import { TratamientoService } from '../../../service/tratamiento';

@Component({
  selector: 'app-mconsulta',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './mconsulta.html'
})
export class MconsultaComponent {

  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private consultaService = inject(ConsultaService);
  private tratamientoService = inject(TratamientoService);
  private cdr = inject(ChangeDetectorRef);

  // 🔒 NO modificables
  idConsulta!: number;
  fecha = '';
  hora = '';
  idCita!: number;
  nombreMascota = '';

  // 🩺 Formulario de consulta
  form = this.fb.nonNullable.group({
    diagnostico: [''],
    observaciones: [''],
    tratamiento: [false]
  });

  // 💊 FORMULARIO DE TRATAMIENTO ✅ (FALTABA)
  tratamientoForm = this.fb.nonNullable.group({
    nombre: [''],
    descripcion: [''],
    dosis: [''],
    duracion: [''],
    medicamento: ['']
  });

  cargando = false;
  errorMsg = '';
  successMsg = '';

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
        this.idCita = c.idCita;
        this.nombreMascota = c.nombreMascota;

        this.form.patchValue({
          diagnostico: c.diagnostico ?? '',
          observaciones: c.observaciones ?? '',
          tratamiento: c.tratamiento ?? false
        });

        this.cdr.detectChanges();
      },
      error: () => this.errorMsg = 'No se pudo cargar la consulta.'
    });
  }

  guardar(): void {
    if (this.form.invalid) return;

    this.cargando = true;
    this.errorMsg = '';

    // Actualizar consulta
    this.consultaService
      .actualizarConsulta(this.idConsulta, this.form.getRawValue())
      .subscribe({
        next: () => {

          // Crear tratamiento si aplica 
          if (this.form.value.tratamiento === true) {

            const t = this.tratamientoForm.getRawValue();

            const tratamiento = {
              nombre: t.nombre,
              descripcion: t.descripcion,
              dosis: t.dosis,
              duracion: t.duracion,
              medicamento: t.medicamento,
              consulta: {
                idConsulta: this.idConsulta
              }
            };

            this.tratamientoService.crear(tratamiento).subscribe({
              next: () => this.finalizar(),
              error: () => {
                this.cargando = false;
                this.errorMsg = 'Error creando el tratamiento.';
              }
            });

          } else {
            this.finalizar();
          }
        },
        error: () => {
          this.cargando = false;
          this.errorMsg = 'Error guardando la consulta.';
        }
      });
  }

  finalizar(): void {
    this.cargando = false;
    this.successMsg = 'Consulta guardada correctamente.';
    setTimeout(() => this.router.navigate(['/consultas']), 400);
  }

  cancelar(): void {
    this.router.navigate(['/consultas']);
  }
}