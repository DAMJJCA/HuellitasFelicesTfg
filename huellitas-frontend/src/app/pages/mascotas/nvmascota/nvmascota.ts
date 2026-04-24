import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { MascotaService } from '../../../service/mascota';
import { ClienteService } from '../../../service/cliente';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-nvmascota',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nvmascota.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NvmascotaComponent implements OnInit {

  mascota: any = {
    nombre: '',
    especie: '',
    raza: '',
    fechaNacimiento: '',
    peso: null,
    sexo: '',
    idCliente: ''
  };

  clientes = signal<any[]>([]);
  cargando = signal<boolean>(false);
  error = signal<string>('');
  success = signal<string>('');

  constructor(
    private readonly mascotaService: MascotaService,
    private readonly clienteService: ClienteService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  get esCliente(): boolean {
    return this.authService.isCliente();
  }

  ngOnInit(): void {
    if (this.esCliente) {
      return;
    }

    this.clienteService.getClientes().subscribe({
      next: c => this.clientes.set(c),
      error: () => this.error.set('Error cargando la lista de duenos')
    });
  }

  onSubmit(form: any) {
    this.error.set('');
    this.success.set('');

    if (form.invalid || (!this.esCliente && !this.mascota.idCliente)) {
      this.error.set('Por favor selecciona un dueno valido.');
      return;
    }

    this.cargando.set(true);

    const dto = {
      nombre: this.mascota.nombre,
      especie: this.mascota.especie,
      raza: this.mascota.raza,
      fechaNacimiento: this.mascota.fechaNacimiento,
      peso: this.mascota.peso,
      sexo: this.mascota.sexo,
      cliente: this.esCliente
        ? undefined
        : {
            idCliente: Number(this.mascota.idCliente)
          }
    };

    this.mascotaService.crearMascota(dto).subscribe({
      next: () => {
        this.success.set('Mascota creada correctamente.');
        this.cargando.set(false);
        setTimeout(() => this.router.navigate(['/mascotas']), 600);
      },
      error: err => {
        console.error('Error creando mascota', err);
        this.error.set(err?.error?.message ?? 'No se pudo crear la mascota.');
        this.cargando.set(false);
      }
    });
  }

  cancelar() {
    this.router.navigate(['/mascotas']);
  }
}
