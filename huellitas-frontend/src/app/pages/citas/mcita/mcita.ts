import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CitaService } from '../../../service/cita';
import { MascotaService, Mascotas } from '../../../service/mascota';
import { VeterinarioService } from '../../../service/veterinario';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, combineLatest, filter, map, shareReplay, switchMap, tap } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mcita',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './mcita.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class McitaComponent {

  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private citaService = inject(CitaService);
  private mascotaService = inject(MascotaService);
  private veterinarioService = inject(VeterinarioService);

  mascotas: Mascotas[] = [];
  veterinarios: any[] = [];

  form = this.fb.nonNullable.group({
    fecha: ['', Validators.required],
    hora: ['', Validators.required],
    motivo: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
    estado: ['programada', Validators.required],
    idMascota: ['', Validators.required],
    idVeterinario: ['', Validators.required]
  });

  cargando = false;
  errorMsg = '';
  successMsg = '';

  readonly id$ = this.route.paramMap.pipe(
    map(p => Number(p.get('id'))),
    filter(id => !Number.isNaN(id))
  );

  ngOnInit(): void {


    combineLatest([
      this.mascotaService.getMascotas(),
      this.veterinarioService.getVeterinarios(),
      this.id$.pipe(switchMap(id => this.citaService.getCita(id)))
    ])
    .subscribe({
      next: ([mascotas, veterinarios, cita]) => {
        this.mascotas = mascotas;
        this.veterinarios = veterinarios;


        this.form.patchValue({
          fecha: cita.fecha,
          hora: cita.hora,
          motivo: cita.motivo,
          estado: cita.estado,
          idMascota: String(cita.mascota.idMascota),
          idVeterinario: String(cita.veterinario.idVeterinario)
        });
      },
      error: () => this.errorMsg = "Error cargando datos."
    });
  }

  guardar() {

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMsg = 'Por favor corrige los errores del formulario.';
      return;
    }

    const dto = {
      fecha: this.form.value.fecha!,
      hora: this.form.value.hora!,
      motivo: this.form.value.motivo!,
      estado: this.form.value.estado!,
      mascota: { idMascota: Number(this.form.value.idMascota) },
      veterinario: { idVeterinario: Number(this.form.value.idVeterinario) }
    };

    this.cargando = true;

    this.id$
      .pipe(switchMap(id => this.citaService.actualizarCita(id, dto)))
      .subscribe({
        next: () => {
          this.cargando = false;
          this.successMsg = 'Cita actualizada correctamente.';
          setTimeout(() => this.router.navigate(['/citas']), 500);
        },
        error: (err) => {
          this.errorMsg = err?.error?.message ?? 'No se pudo actualizar la cita.';
          this.cargando = false;
        }
      });
  }

  cancelar() {
    this.router.navigate(['/citas']);
  }
}
