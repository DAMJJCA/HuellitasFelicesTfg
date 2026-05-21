import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CitaService, EstadoCita } from '../../../service/cita';
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
  estados = [
    { value: 'programada', label: 'Programada' },
    { value: 'confirmada', label: 'Confirmada' },
    { value: 'en_consulta', label: 'En consulta' },
    { value: 'realizada', label: 'Realizada' },
    { value: 'cancelada', label: 'Cancelada' }
  ];

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
  minFecha = this.fechaHoy();

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

    const errorFecha = this.validarFechaHora();
    if (errorFecha) {
      this.errorMsg = errorFecha;
      return;
    }

    const dto = {
      fecha: this.form.value.fecha!,
      hora: this.form.value.hora!,
      motivo: this.form.value.motivo!,
      estado: this.form.value.estado! as EstadoCita,
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
          this.errorMsg = this.extraerMensajeError(err, 'No se pudo actualizar la cita.');
          this.cargando = false;
        }
      });
  }

  cancelar() {
    this.router.navigate(['/citas']);
  }

  private extraerMensajeError(err: any, fallback: string): string {
    return err?.error?.detail || err?.error?.message || err?.error?.error || fallback;
  }

  private validarFechaHora(): string {
    const fecha = this.form.value.fecha;
    const hora = this.form.value.hora;
    const estado = this.form.value.estado;
    if (!fecha || !hora) return 'Indica fecha y hora de la cita.';

    if (estado === 'programada' || estado === 'confirmada' || estado === 'en_consulta') {
      const fechaHora = new Date(`${fecha}T${hora}`);
      if (fechaHora < new Date()) {
        return 'No se puede guardar una cita activa en una fecha u hora pasada.';
      }
    }

    return '';
  }

  private fechaHoy(): string {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${(hoy.getMonth() + 1).toString().padStart(2, '0')}-${hoy.getDate().toString().padStart(2, '0')}`;
  }
}
