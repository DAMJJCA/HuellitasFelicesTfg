import { CommonModule } from '@angular/common';
import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConsultaService } from '../../../service/consulta';
import { QuillModule } from 'ngx-quill';

@Component({
  selector: 'app-mconsulta',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, QuillModule],
  templateUrl: './mconsulta.html'
})
export class MconsultaComponent {

  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private consultaService = inject(ConsultaService);
  private cdr = inject(ChangeDetectorRef);

  // 🔒 NO modificables
  idConsulta!: number;
  fecha = '';
  hora = '';
  idCita!: number;

  // ✅ Formulario (solo campos editables)
  form = this.fb.nonNullable.group({
    diagnostico: [''],
    observaciones: [''],
    tratamiento: [false]
  });

  cargando = false;
  errorMsg = '';
  successMsg = '';

  // ✅ Toolbar del editor (igual al de la imagen)
  editorModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ header: 1 }, { header: 2 }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ indent: '-1' }, { indent: '+1' }],
      [{ align: [] }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean']
    ]
  };

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (Number.isNaN(id)) {
      this.errorMsg = 'ID de consulta inválido.';
      return;
    }

    this.idConsulta = id;

    this.consultaService.getConsulta(id).subscribe({
      next: c => {
        // ✅ Datos solo lectura
        this.fecha = c.fecha;
        this.hora = c.hora;
        this.idCita = c.cita.idCita;

        // ✅ Datos editables
        this.form.patchValue({
          diagnostico: c.diagnostico ?? '',
          observaciones: c.observaciones ?? '',
          tratamiento: c.tratamiento ?? false
        });

        // ✅ Forzar render
        this.cdr.detectChanges();
      },
      error: () => this.errorMsg = 'No se pudo cargar la consulta.'
    });
  }

  guardar(): void {
    if (this.form.invalid) return;

    const dto = {
      diagnostico: this.form.value.diagnostico,
      observaciones: this.form.value.observaciones,
      tratamiento: this.form.value.tratamiento
    };

    this.cargando = true;
    this.errorMsg = '';
    this.successMsg = '';

    this.consultaService.actualizarConsulta(this.idConsulta, dto).subscribe({
      next: () => {
        this.cargando = false;
        this.successMsg = 'Consulta actualizada correctamente.';
        setTimeout(() => this.router.navigate(['/consultas']), 400);
      },
      error: () => {
        this.cargando = false;
        this.errorMsg = 'Error guardando la consulta.';
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/consultas']);
  }
}
