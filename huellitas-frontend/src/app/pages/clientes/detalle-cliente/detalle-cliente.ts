import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, forkJoin, of, switchMap } from 'rxjs';

import { Cita, CitaService } from '../../../service/cita';
import { Cliente, ClienteService } from '../../../service/cliente';
import { MascotaService, Mascotas } from '../../../service/mascota';

@Component({
  selector: 'app-detalle-cliente',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detalle-cliente.html'
})
export class DetalleClienteComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private clienteService = inject(ClienteService);
  private mascotaService = inject(MascotaService);
  private citaService = inject(CitaService);

  cliente = signal<Cliente | null>(null);
  mascotas = signal<Mascotas[]>([]);
  citas = signal<Cita[]>([]);
  cargando = signal(true);
  errorMsg = signal('');

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = Number(params.get('id'));
        if (Number.isNaN(id)) {
          this.errorMsg.set('Cliente no valido.');
          this.cargando.set(false);
          return of(null);
        }
        return forkJoin({
          cliente: this.clienteService.getCliente(id),
          mascotas: this.mascotaService.getMascotas().pipe(catchError(() => of([] as Mascotas[]))),
          citas: this.citaService.getCitas().pipe(catchError(() => of([] as Cita[])))
        });
      })
    ).subscribe({
      next: data => {
        if (!data) return;
        const idCliente = data.cliente.idCliente;
        const mascotas = data.mascotas.filter(m => m.cliente?.idCliente === idCliente);
        const idsMascotas = new Set(mascotas.map(m => m.idMascota));
        this.cliente.set(data.cliente);
        this.mascotas.set(mascotas);
        this.citas.set(data.citas.filter(c => idsMascotas.has(c.mascota?.idMascota)).sort((a, b) => `${b.fecha}T${b.hora || ''}`.localeCompare(`${a.fecha}T${a.hora || ''}`)));
        this.cargando.set(false);
      },
      error: err => {
        console.error('Error cargando ficha de cliente', err);
        this.errorMsg.set('No se pudo cargar la ficha del cliente.');
        this.cargando.set(false);
      }
    });
  }

  volver(): void {
    this.router.navigate(['/clientes']);
  }

  editar(): void {
    const id = this.cliente()?.idCliente;
    if (id) this.router.navigate(['/clientes', id, 'editar']);
  }

  verMascota(mascota: Mascotas): void {
    if (mascota.idMascota) this.router.navigate(['/mascotas', mascota.idMascota]);
  }

  formatearFecha(fecha: string | null | undefined): string {
    if (!fecha) return 'Sin fecha';
    const date = new Date(`${fecha}T00:00:00`);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  }
}
