import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ActualizarVeterinarioDto, veterinario, VeterinarioService } from '../../../service/veterinario';
import { catchError, filter, map, Observable, shareReplay, switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-mveterinario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './mveterinario.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MveterinarioComponent {

  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private veterinarioService = inject(VeterinarioService);

  form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    especialidad: ['', Validators.required],
    telefono: ['', Validators.required],
    email: ['', Validators.email]
  });

  readonly id$: Observable<number> = this.route.paramMap.pipe(
    map(p => Number(p.get('id'))),
    filter(id => !Number.isNaN(id))
  );

  readonly veterinario$: Observable<veterinario> = this.id$.pipe(
    switchMap(id => this.veterinarioService.getVeterinario(id)),
    tap(v => {
      const dto: ActualizarVeterinarioDto = {
        nombre: v.nombre ?? '',
        especialidad: v.especialidad ?? '',
        telefono: v.telefono ?? '',
        email: v.email ?? ''
      };
      this.form.patchValue(dto);
    }),
    catchError(err => { console.error('ERROR cargando veterinario', err); throw err; }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  saving = false;
  errorMsg = '';
  successMsg = '';

  guardar() {
    this.errorMsg = '';
    this.successMsg = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMsg = 'Por favor, completa los campos requeridos.';
      return;
    }

    const dto: ActualizarVeterinarioDto = {
      nombre: this.form.value.nombre!,
      especialidad: this.form.value.especialidad!,
      telefono: this.form.value.telefono!,
      email: this.form.value.email!
    };

    this.saving = true;

    this.id$.pipe(
      switchMap(id => this.veterinarioService.actualizarVeterinario(id, dto))
    ).subscribe({
      next: () => {
        this.successMsg = 'Veterinario actualizado correctamente.';
        this.saving = false;
        setTimeout(() => this.router.navigate(['/admin/veterinarios']), 500);
      },
      error: (e) => {
        console.error('ERROR actualizando veterinario', e);
        this.errorMsg = e?.error?.message ?? 'No se pudo actualizar.';
        this.saving = false;
      }
    });
  }

  cancelar() {
    this.router.navigate(['/admin/veterinarios']);
  }
}
