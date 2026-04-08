import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { ClienteService, CrearClienteDto } from '../../../service/cliente';

@Component({
  selector: 'app-nvcliente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nvcliente.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NvClienteComponent {

  cliente: CrearClienteDto = {
    nombre: '',
    apellidos: '',
    telefono: '',
    email: '',
    direccion: ''
  };

  cargando = false;
  error = '';
  success = '';

  constructor(
    private readonly clienteService: ClienteService,
    private readonly router: Router
  ) {}

  onSubmit(form: NgForm) {
    this.error = '';
    this.success = '';

    if (form.invalid) {
      form.control.markAllAsTouched();
      this.error = 'Por favor, completa los campos requeridos.';
      return;
    }

    try {
      this.cargando = true;
      this.clienteService.crearCliente(this.cliente).subscribe({
        next: () => {
          this.success = 'Cliente creado correctamente.';
          setTimeout(() => this.router.navigate(['/clientes']), 500);
        },
        error: (e: any) => {
          console.error('ERROR creando cliente', e);
        }
      });
    } catch (e: any) {
      console.error('ERROR creando cliente', e);
      this.error = e?.error?.message ?? 'No se pudo crear el cliente.';
    } finally {
      this.cargando = false;
    }
  }

  cancelar() {
    this.router.navigate(['/clientes']);
  }
}
