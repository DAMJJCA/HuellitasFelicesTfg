import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { CitaService, Cita } from '../../service/cita';
import { ConsultaService } from '../../service/consulta';
import { MascotaService } from '../../service/mascota';

type DiaCalendario = {
  fecha: Date;
  numero: number;
  citas: {
    hora: string;
    mascota: string;
    estado: string;
  }[];
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html'
})
export class DashboardComponent {

  private citaService = inject(CitaService);
  private consultaService = inject(ConsultaService);
  private mascotaService = inject(MascotaService);
  private router = inject(Router);

  citasHoy = signal(0);
  consultasHoy = signal(0);
  totalMascotas = signal(0);
  citasCanceladas = signal(0);

  diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  rangoSemanas = signal<string>('');
  calendario = signal<DiaCalendario[]>([]);

  ngOnInit(): void {
    const hoy = new Date();


    this.citaService.getCitas().subscribe(citas => {

      this.citasHoy.set(
        citas.filter(c => this.esHoy(c.fecha)).length
      );

      this.citasCanceladas.set(
        citas.filter(c => c.estado?.toLowerCase() === 'cancelada').length
      );

      this.generarCalendarioDosSemanas(hoy, citas);
    });

    this.consultaService.getConsultas().subscribe(consultas => {
      this.consultasHoy.set(
        consultas.filter(c => this.esHoy(c.fecha)).length
      );
    });

    this.mascotaService.getMascotas().subscribe(mascotas => {
      this.totalMascotas.set(mascotas.length);
    });
  }

  // CALENDARIO
  private generarCalendarioDosSemanas(hoy: Date, citas: Cita[]) {

    const base = new Date(hoy);

    // dias
    const diaSemana = base.getDay() === 0 ? 7 : base.getDay();
    base.setDate(base.getDate() - (diaSemana - 1));

    const inicio = new Date(base);
    const resultado: DiaCalendario[] = [];

    for (let i = 0; i < 14; i++) {
      const fechaDia = new Date(inicio);
      fechaDia.setDate(inicio.getDate() + i);

      const citasDia = citas
        .filter(c => this.esMismoDia(c.fecha, fechaDia))
        .map(c => ({
          hora: c.hora,
          mascota: c.mascota?.nombre ?? 'Mascota',
          estado: c.estado
        }));

      resultado.push({
        fecha: fechaDia,
        numero: fechaDia.getDate(),
        citas: citasDia
      });
    }

    // Texto: de fecha
    const fin = resultado[13].fecha;
    this.rangoSemanas.set(
      `${inicio.getDate()} ${inicio.toLocaleDateString('es-ES', { month: 'short' })}
       – ${fin.getDate()} ${fin.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}`
        .replace(/\s+/g, ' ')
    );

    this.calendario.set(resultado);
  }


  private esHoy(fecha: string): boolean {
    if (!fecha) return false;
    const f = new Date(fecha);
    const hoy = new Date();

    return (
      f.getDate() === hoy.getDate() &&
      f.getMonth() === hoy.getMonth() &&
      f.getFullYear() === hoy.getFullYear()
    );
  }

  private esMismoDia(fecha: string, ref: Date): boolean {
    const f = new Date(fecha);
    return (
      f.getDate() === ref.getDate() &&
      f.getMonth() === ref.getMonth() &&
      f.getFullYear() === ref.getFullYear()
    );
  }

  // BOTONES
  irACrearCita() {
    this.router.navigate(['/citas/crear']);
  }

  irAHistorial() {
    this.router.navigate(['/historial']);
  }

  irATratamientos() {
    this.router.navigate(['/tratamientos']);
  }
}
