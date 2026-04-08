import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CitaService, CrearCitaDto } from '../../../service/cita';
import { MascotaService, Mascotas } from '../../../service/mascota';
import { VeterinarioService } from '../../../service/veterinario';
import { Router } from '@angular/router';

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

  mascotas: Mascotas[] = [];
  veterinarios: any[] = [];

  cargando = false;
  error = '';
  success = '';

  constructor(
    private readonly citaService: CitaService,
    private readonly mascotaService: MascotaService,
    private readonly veterinarioService: VeterinarioService,
    private readonly router: Router
  ) { }

  ngOnInit(): void {
    this.mascotaService.getMascotas().subscribe({
      next: m => this.mascotas = m,
      error: () => this.error = 'Error cargando mascotas.'
    });

    this.veterinarioService.getVeterinarios().subscribe({
      next: v => this.veterinarios = v,
      error: () => this.error = 'Error cargando veterinarios.'
    });
  }

  onSubmit(form: any) {
    this.error = '';
    this.success = '';

    if (form.invalid || !this.cita.idMascota || !this.cita.idVeterinario) {
      this.error = 'Por favor selecciona una mascota y un veterinario.';
      return;
    }

    this.cargando = true;

    const dto: CrearCitaDto = {
      fecha: this.cita.fecha,
      hora: this.cita.hora,
      motivo: this.cita.motivo,
      estado: this.cita.estado,
      mascota: { idMascota: Number(this.cita.idMascota) },
      veterinario: { idVeterinario: Number(this.cita.idVeterinario) }
    };

    this.citaService.crearCita(dto).subscribe({
      next: () => {
        this.success = 'Cita creada exitosamente.';
        this.cargando = false;
        setTimeout(() => this.router.navigate(['/citas']), 600);
      },
      error: () => {
        this.error = 'Error creando la cita.';
        this.cargando = false;
      }
    });
  }

  cancelar() {
    this.router.navigate(['/citas']);
  }
}
