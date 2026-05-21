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
  estados = [
    { value: 'programada', label: 'Programada' },
    { value: 'confirmada', label: 'Confirmada' },
    { value: 'cancelada', label: 'Cancelada' }
  ];

  error = signal<string>('');
  success = signal<string>('');
  minFecha = this.fechaHoy();

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

    const errorFecha = this.validarFechaHora();
    if (errorFecha) {
      this.error.set(errorFecha);
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
      error: (err) => {
        this.error.set(this.extraerMensajeError(err, 'Error creando la cita.'));
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
    if (!this.cita.fecha || !this.cita.hora) return 'Indica fecha y hora de la cita.';

    const ahora = new Date();
    const fechaHora = new Date(`${this.cita.fecha}T${this.cita.hora}`);
    if (fechaHora < ahora && this.cita.estado !== 'cancelada') {
      return 'No se puede crear una cita activa en una fecha u hora pasada.';
    }

    return '';
  }

  private fechaHoy(): string {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${(hoy.getMonth() + 1).toString().padStart(2, '0')}-${hoy.getDate().toString().padStart(2, '0')}`;
  }
}
