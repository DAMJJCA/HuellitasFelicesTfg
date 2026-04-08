import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MascotaService } from '../../../service/mascota';
import { ClienteService } from '../../../service/cliente';
import { map, switchMap, tap, catchError, filter, shareReplay } from 'rxjs';

@Component({
  selector: 'app-mmascota',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './mmascota.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MmascotaComponent implements OnInit {

  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private mascotaService = inject(MascotaService);
  private clienteService = inject(ClienteService);

  form = this.fb.nonNullable.group({
    nombre:    ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    especie:   ['', [Validators.required]],
    raza:      [''],
    fechaNacimiento: [''],
    peso:      [0],
    sexo:      [''],
    idCliente: ['', Validators.required]
  });

  clientes: any[] = [];
  cargando = false;
  errorMsg = '';
  successMsg = '';

  readonly id$ = this.route.paramMap.pipe(
    map(p => Number(p.get('id'))),
    filter(id => !isNaN(id))
  );

  readonly mascota$ = this.id$.pipe(
    switchMap(id => this.mascotaService.getMascota(id)),
    tap(m => {
      this.form.patchValue({
        nombre: m.nombre,
        especie: m.especie,
        raza: m.raza,
        fechaNacimiento: m.fechaNacimiento ?? '',
        peso: m.peso ?? 0,
        sexo: m.sexo ?? '',
        idCliente: String(m.cliente.idCliente)
      });
    }),
    catchError(err => { console.error('ERROR cargando mascota', err); throw err; }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  ngOnInit(): void {
    this.clienteService.getClientes().subscribe({
      next: c => {
        this.clientes = c.map(x => ({
          ...x,
          idCliente: String(x.idCliente)
        }));
      },
      error: () => this.errorMsg = 'Error cargando lista de dueños'
    });
  }

  guardar() {
    this.errorMsg = '';
    this.successMsg = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMsg = 'Por favor, completa los campos requeridos.';
      return;
    }

    const dto = {
      nombre: this.form.value.nombre!,
      especie: this.form.value.especie!,
      raza: this.form.value.raza!,
      fechaNacimiento: this.form.value.fechaNacimiento!,
      peso: Number(this.form.value.peso),
      sexo: this.form.value.sexo!,
      cliente: {
        idCliente: Number(this.form.value.idCliente)
      }
    };

    this.cargando = true;

    this.id$
      .pipe(switchMap(id => this.mascotaService.actualizarMascota(id, dto)))
      .subscribe({
        next: () => {
          this.cargando = false;
          this.successMsg = 'Mascota actualizada correctamente.';
          setTimeout(() => this.router.navigate(['/mascotas']), 500);
        },
        error: (err) => {
          console.error('ERROR actualizando mascota', err);
          this.errorMsg = err?.error?.message ?? 'No se pudo actualizar la mascota.';
          this.cargando = false;
        }
      });
  }

  cancelar() {
    this.router.navigate(['/mascotas']);
  }
}
