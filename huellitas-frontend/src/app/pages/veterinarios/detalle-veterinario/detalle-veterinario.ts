import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, forkJoin, of, switchMap } from 'rxjs';

import { Cita, CitaService } from '../../../service/cita';
import { veterinario, VeterinarioService } from '../../../service/veterinario';

@Component({
  selector: 'app-detalle-veterinario',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detalle-veterinario.html'
})
export class DetalleVeterinarioComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private veterinarioService = inject(VeterinarioService);
  private citaService = inject(CitaService);

  veterinario = signal<veterinario | null>(null);
  citas = signal<Cita[]>([]);
  cargando = signal(true);
  errorMsg = signal('');

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = Number(params.get('id'));
        if (Number.isNaN(id)) {
          this.errorMsg.set('Veterinario no valido.');
          this.cargando.set(false);
          return of(null);
        }
        return forkJoin({
          veterinario: this.veterinarioService.getVeterinario(id),
          citas: this.citaService.getCitas().pipe(catchError(() => of([] as Cita[])))
        });
      })
    ).subscribe({
      next: data => {
        if (!data) return;
        const idVeterinario = data.veterinario.idVeterinario;
        this.veterinario.set(data.veterinario);
        this.citas.set(data.citas
          .filter(c => c.veterinario?.idVeterinario === idVeterinario)
          .sort((a, b) => `${b.fecha}T${b.hora || ''}`.localeCompare(`${a.fecha}T${a.hora || ''}`)));
        this.cargando.set(false);
      },
      error: err => {
        console.error('Error cargando ficha de veterinario', err);
        this.errorMsg.set('No se pudo cargar la ficha del veterinario.');
        this.cargando.set(false);
      }
    });
  }

  volver(): void {
    this.router.navigate(['/admin/veterinarios']);
  }

  editar(): void {
    const id = this.veterinario()?.idVeterinario;
    if (id) this.router.navigate(['/admin/veterinarios', id, 'editar']);
  }

  formatearFecha(fecha: string | null | undefined): string {
    if (!fecha) return 'Sin fecha';
    const date = new Date(`${fecha}T00:00:00`);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  }
}
