import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ClienteService, Cliente, CrearClienteDto } from '../../../service/cliente';
import { Observable } from 'rxjs';
import { map, switchMap, tap, filter, shareReplay, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-mcliente',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './mcliente.html',

  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MClienteComponent {

  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private clienteService = inject(ClienteService);

  form = this.fb.nonNullable.group({
    nombre:    ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    apellidos: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    telefono:  ['', [Validators.required, Validators.pattern(/^[0-9+\-\s]{6,20}$/)]],
    email:     ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    direccion: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
  });

  readonly id$: Observable<number> = this.route.paramMap.pipe(
    map(p => Number(p.get('id'))),
    filter(id => !Number.isNaN(id))
  );

    readonly cliente$: Observable<Cliente> = this.id$.pipe(
    switchMap(id => this.clienteService.getCliente(id)),
    tap(c => {
      const dto: CrearClienteDto = {
        nombre:    c?.nombre ?? '',
        apellidos: c?.apellidos ?? '',
        telefono:  c?.telefono ?? '',
        email:     c?.email ?? '',
        direccion: c?.direccion ?? ''
      };
      this.form.patchValue(dto);
    }),
    catchError(err => { console.error('ERROR cargando cliente', err); throw err; }),
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

    this.saving = true;

    this.id$.pipe(
      switchMap(id => this.clienteService.actualizarCliente(id, this.form.getRawValue()))
    ).subscribe({
      next: () => {
        this.saving = false;
        this.successMsg = 'Cliente actualizado correctamente.';
        setTimeout(() => this.router.navigate(['/clientes']), 400);
      },
      error: (err) => {
        console.error('ERROR actualizando cliente', err);
        this.saving = false;
        this.errorMsg = err?.error?.message ?? 'No se pudo actualizar el cliente.';
      }
    });
  }

  cancelar() {
    this.router.navigate(['/clientes']);
  }
}
