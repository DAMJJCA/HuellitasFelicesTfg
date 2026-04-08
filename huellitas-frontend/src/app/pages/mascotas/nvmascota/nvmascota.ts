import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MascotaService } from '../../../service/mascota';
import { ClienteService } from '../../../service/cliente';

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

  clientes: any[] = [];
  cargando = false;
  error = '';
  success = '';

  constructor(
    private readonly mascotaService: MascotaService,
    private readonly clienteService: ClienteService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.clienteService.getClientes().subscribe({
      next: (c) => this.clientes = c,
      error: () => this.error = 'Error cargando la lista de dueños'
    });
  }

  onSubmit(f: any) {
    this.error = '';
    this.success = '';

    if (f.invalid || !this.mascota.idCliente) {
      this.error = 'Por favor selecciona un dueño válido.';
      return;
    }

    this.cargando = true;

    const dto = {
      nombre: this.mascota.nombre,
      especie: this.mascota.especie,
      raza: this.mascota.raza,
      fechaNacimiento: this.mascota.fechaNacimiento,
      peso: this.mascota.peso,
      sexo: this.mascota.sexo,
      cliente: {
        idCliente: Number(this.mascota.idCliente)
      }
    };

    this.mascotaService.crearMascota(dto).subscribe({
      next: () => {
        this.success = 'Mascota creada correctamente.';
        this.cargando = false;
        setTimeout(() => this.router.navigate(['/mascotas']), 600);
      },
      error: (err) => {
        console.error('Error creando mascota', err);
        this.error = err?.error?.message ?? 'No se pudo crear la mascota.';
        this.cargando = false;
      }
    });
  }

  cancelar() {
    this.router.navigate(['/mascotas']);
  }
}
``
