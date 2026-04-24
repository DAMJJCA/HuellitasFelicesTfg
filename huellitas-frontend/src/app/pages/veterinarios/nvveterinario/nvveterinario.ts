import { CrearVeterinarioDto } from './../../../service/veterinario';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { VeterinarioService } from '../../../service/veterinario';
import { Router } from '@angular/router';

@Component({
  selector: 'app-nvveterinario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nvveterinario.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NvVeterinarioComponent {

  veterinario: CrearVeterinarioDto = {
    nombre: '',
    especialidad: '',
    telefono: '',
    email: '',
    password: ''
  };
  repetirPassword = '';

  cargando = false;
  error = '';
  success = '';

  constructor(
    private readonly veterinarioService: VeterinarioService,
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

    if (this.veterinario.password.length < 6) {
      this.error = 'La contrasena debe tener al menos 6 caracteres.';
      return;
    }

    if (this.veterinario.password !== this.repetirPassword) {
      this.error = 'Las contrasenas no coinciden.';
      return;
    }

    this.cargando = true;

    this.veterinarioService.crearVeterinario(this.veterinario).subscribe({
      next: () => {
        this.success = 'Veterinario creado correctamente.';
        this.cargando = false;
        setTimeout(() => this.router.navigate(['/admin/veterinarios']), 500);
      },
      error: (e) => {
        console.error('ERROR creando veterinario', e);
        this.error = e?.error?.message ?? 'No se pudo crear el veterinario.';
        this.cargando = false;
      }
    });
  }

  cancelar() {
    this.router.navigate(['/admin/veterinarios']);
  }
}
