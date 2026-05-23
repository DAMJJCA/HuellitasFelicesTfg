import { CommonModule } from '@angular/common';
import {ChangeDetectionStrategy,Component,signal} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { Cita, CitaService, CrearCitaDto } from '../../../service/cita';
import {
  DisponibilidadVeterinario,
  DisponibilidadVeterinarioService,
  ExcepcionDisponibilidadVeterinario
} from '../../../service/disponibilidad-veterinario';
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
    duracionMinutos: 30,
    idMascota: '',
    idVeterinario: ''
  };


  mascotas = signal<Mascotas[]>([]);
  veterinarios = signal<any[]>([]);
  citasExistentes = signal<Cita[]>([]);
  duracionesCitas = signal<Map<number, number>>(new Map());
  disponibilidad = signal<DisponibilidadVeterinario[]>([]);
  excepciones = signal<ExcepcionDisponibilidadVeterinario[]>([]);
  huecosDisponibles = signal<string[]>([]);
  mensajeHuecos = signal<string>('');
  estados = [
    { value: 'programada', label: 'Programada' },
    { value: 'confirmada', label: 'Confirmada' },
    { value: 'cancelada', label: 'Cancelada' }
  ];
  duraciones = [15, 30, 45, 60];

  error = signal<string>('');
  success = signal<string>('');
  minFecha = this.fechaHoy();

  constructor(
    private readonly citaService: CitaService,
    private readonly disponibilidadService: DisponibilidadVeterinarioService,
    private readonly mascotaService: MascotaService,
    private readonly veterinarioService: VeterinarioService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const mascotaParam = this.route.snapshot.queryParamMap.get('mascota');
    if (mascotaParam) {
      this.cita.idMascota = mascotaParam;
    }

    this.mascotaService.getMascotas().subscribe({
      next: m => this.mascotas.set(m),
      error: () => this.error.set('Error cargando mascotas.')
    });

    this.veterinarioService.getVeterinarios().subscribe({
      next: v => this.veterinarios.set(v),
      error: () => this.error.set('Error cargando veterinarios.')
    });

    this.citaService.getCitas().subscribe({
      next: citas => {
        this.citasExistentes.set(citas);
        this.actualizarHuecos();
      },
      error: () => this.citasExistentes.set([])
    });

    this.citaService.getDuraciones().subscribe({
      next: duraciones => {
        this.duracionesCitas.set(new Map(duraciones.map(item => [item.idCita, item.duracionMinutos])));
        this.actualizarHuecos();
      },
      error: () => this.duracionesCitas.set(new Map())
    });

    this.disponibilidadService.getDisponibilidades().subscribe({
      next: disponibilidad => {
        this.disponibilidad.set(disponibilidad);
        this.actualizarHuecos();
      },
      error: () => this.disponibilidad.set([])
    });

    this.disponibilidadService.getExcepciones().subscribe({
      next: excepciones => {
        this.excepciones.set(excepciones);
        this.actualizarHuecos();
      },
      error: () => this.excepciones.set([])
    });
  }

  actualizarHuecos(): void {
    this.mensajeHuecos.set('');
    this.huecosDisponibles.set([]);

    const idVeterinario = Number(this.cita.idVeterinario);
    if (!idVeterinario || !this.cita.fecha) {
      this.mensajeHuecos.set('Selecciona veterinario y fecha para ver huecos disponibles.');
      return;
    }

    const excepcionesDia = this.excepciones()
      .filter(item => item.idVeterinario === idVeterinario && item.fecha === this.cita.fecha && item.activo);

    const diaSemana = this.diaSemanaIso(this.cita.fecha);
    const tramos = excepcionesDia.length > 0
      ? excepcionesDia
        .filter(item => item.tipo === 'disponible' && item.horaInicio && item.horaFin)
        .map(item => ({ horaInicio: item.horaInicio!, horaFin: item.horaFin! }))
      : this.disponibilidad()
      .filter(item => item.idVeterinario === idVeterinario && item.diaSemana === diaSemana && item.activo);

    if (tramos.length === 0) {
      this.mensajeHuecos.set(excepcionesDia.length > 0
        ? 'Este veterinario tiene una excepcion de no disponibilidad para esa fecha.'
        : 'Este veterinario no tiene disponibilidad configurada para ese dia. Puedes introducir la hora manualmente.');
      return;
    }

    const ocupadas = 
      this.citasExistentes()
        .filter(cita =>
          cita.veterinario?.idVeterinario === idVeterinario &&
          cita.fecha === this.cita.fecha &&
          this.citaOcupaHorario(cita))
        .map(cita => ({
          hora: this.normalizarHora(cita.hora),
          duracion: cita.idCita ? (this.duracionesCitas().get(cita.idCita) || 30) : 30
        }));

    const ahora = new Date();
    const huecos = tramos
      .flatMap(tramo => this.generarHuecosTramo(tramo.horaInicio, tramo.horaFin))
      .filter((hora, index, lista) => lista.indexOf(hora) === index)
      .filter(hora => this.tramoDisponible(hora, Number(this.cita.duracionMinutos) || 30, ocupadas))
      .filter(hora => new Date(`${this.cita.fecha}T${hora}`) >= ahora)
      .sort();

    this.huecosDisponibles.set(huecos);
    if (huecos.length === 0) {
      this.mensajeHuecos.set('No quedan huecos libres para ese veterinario y fecha.');
    }
  }

  seleccionarHueco(hora: string): void {
    this.cita.hora = hora;
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
      duracionMinutos: Number(this.cita.duracionMinutos) || 30,
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
      next: cita => {
        if (!cita.idCita) {
          this.success.set('Cita creada exitosamente.');
          setTimeout(() => this.router.navigate(['/citas']), 600);
          return;
        }

        this.citaService.guardarDuracion(cita.idCita, Number(this.cita.duracionMinutos) || 30).subscribe({
          next: () => {
            this.success.set('Cita creada exitosamente.');
            setTimeout(() => this.router.navigate(['/citas']), 600);
          },
          error: err => this.error.set(this.extraerMensajeError(err, 'La cita se creo, pero no se pudo guardar la duracion.'))
        });
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

  private diaSemanaIso(fecha: string): number {
    const date = new Date(`${fecha}T00:00:00`);
    return date.getDay() === 0 ? 7 : date.getDay();
  }

  private generarHuecosTramo(inicio: string, fin: string): string[] {
    const huecos: string[] = [];
    let actual = this.minutosDesdeHora(inicio);
    const limite = this.minutosDesdeHora(fin);

    while (actual < limite) {
      huecos.push(this.horaDesdeMinutos(actual));
      actual += 30;
    }

    return huecos;
  }

  private minutosDesdeHora(hora: string): number {
    const [horas, minutos] = this.normalizarHora(hora).split(':').map(Number);
    return (horas * 60) + minutos;
  }

  private horaDesdeMinutos(total: number): string {
    const horas = Math.floor(total / 60).toString().padStart(2, '0');
    const minutos = (total % 60).toString().padStart(2, '0');
    return `${horas}:${minutos}`;
  }

  private normalizarHora(hora: string): string {
    return (hora || '').slice(0, 5);
  }

  private citaOcupaHorario(cita: Cita): boolean {
    const estado = (cita.estado || '').toLowerCase().replace(/[- ]/g, '_');
    return ['programada', 'confirmada', 'en_consulta'].includes(estado);
  }

  private tramoDisponible(hora: string, duracion: number, ocupadas: { hora: string; duracion: number }[]): boolean {
    const inicio = this.minutosDesdeHora(hora);
    const fin = inicio + duracion;
    return !ocupadas.some(ocupada => {
      const inicioOcupada = this.minutosDesdeHora(ocupada.hora);
      const finOcupada = inicioOcupada + ocupada.duracion;
      return inicio < finOcupada && inicioOcupada < fin;
    });
  }
}
