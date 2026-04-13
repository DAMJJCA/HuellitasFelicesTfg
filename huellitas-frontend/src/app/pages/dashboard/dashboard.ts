import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { CitaService } from '../../service/cita';
import { ConsultaService } from '../../service/consulta';
import { MascotaService } from '../../service/mascota';

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

  citasHoy = 0;
  consultasHoy = 0;
  totalMascotas = 0;
  citasCanceladas = 0;

  ngOnInit(): void {
    const hoy = new Date();

    // ✅ CITAS
    this.citaService.getCitas().subscribe(citas => {
      this.citasHoy = citas.filter(c => this.esHoy(c.fecha)).length;
      this.citasCanceladas = citas.filter(
        c => c.estado?.toLowerCase() === 'cancelada'
      ).length;
    });

    // ✅ CONSULTAS
    this.consultaService.getConsultas().subscribe(consultas => {
      this.consultasHoy = consultas.filter(c => this.esHoy(c.fecha)).length;
    });

    // ✅ TOTAL MASCOTAS
    this.mascotaService.getMascotas().subscribe(mascotas => {
      this.totalMascotas = mascotas.length;
    });
  }

  // ✅ FUNCIÓN SEGURA PARA COMPARAR FECHAS
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
}