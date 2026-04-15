import { CommonModule } from '@angular/common';
import {ChangeDetectionStrategy,Component,signal} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { CitaService, CrearCitaDto } from '../../../service/cita';
import { MascotaService, Mascotas } from '../../../service/mascota';
import { VeterinarioService } from '../../../service/veterinario';

@Component({
  selector: 'app-nvcita',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nvcita.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NvcitaComponent {

  cita: any = {
    fecha: '',
    hora: '',
    motivo: '',
    estado: 'programada',
    idMascota: '',
    idVeterinario: ''
  };


  mascotas = signal<Mascotas[]>([]);
  veterinarios = signal<any[]>([]);

  error = signal<string>('');
  success = signal<string>('');

  constructor(
    private readonly citaService: CitaService,
    private readonly mascotaService: MascotaService,
    private readonly veterinarioService: VeterinarioService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {

    this.mascotaService.getMascotas().subscribe({
      next: m => this.mascotas.set(m),
      error: () => this.error.set('Error cargando mascotas.')
    });

    this.veterinarioService.getVeterinarios().subscribe({
      next: v => this.veterinarios.set(v),
      error: () => this.error.set('Error cargando veterinarios.')
    });
  }

  onSubmit(form: any) {
    this.error.set('');
    this.success.set('');

    if (form.invalid || !this.cita.idMascota || !this.cita.idVeterinario) {
      this.error.set('Por favor selecciona una mascota y un veterinario.');
      return;
    }

    const dto: CrearCitaDto = {
      fecha: this.cita.fecha,
      hora: this.cita.hora,
      motivo: this.cita.motivo,
      estado: this.cita.estado,
      mascota: {
        idMascota: Number(this.cita.idMascota)
      },
      veterinario: {
        idVeterinario: Number(this.cita.idVeterinario)
      }
    };

    this.citaService.crearCita(dto).subscribe({
      next: () => {
        this.success.set('Cita creada exitosamente.');
        setTimeout(() => this.router.navigate(['/citas']), 600);
      },
      error: () => {
        this.error.set('Error creando la cita.');
      }
    });
  }

  cancelar() {
    this.router.navigate(['/citas']);
  }
}
