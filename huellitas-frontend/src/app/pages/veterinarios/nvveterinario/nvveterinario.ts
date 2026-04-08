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
    email: ''
  };

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

    this.cargando = true;

    this.veterinarioService.crearVeterinario(this.veterinario).subscribe({
      next: () => {
        this.success = 'Veterinario creado correctamente.';
        this.cargando = false;
        setTimeout(() => this.router.navigate(['/veterinarios']), 500);
      },
      error: (e) => {
        console.error('ERROR creando veterinario', e);
        this.error = e?.error?.message ?? 'No se pudo crear el veterinario.';
        this.cargando = false;
      }
    });
  }

  cancelar() {
    this.router.navigate(['/veterinarios']);
  }
}
``
