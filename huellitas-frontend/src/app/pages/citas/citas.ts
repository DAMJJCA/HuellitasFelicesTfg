import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { catchError, combineLatest, map, Observable, of, shareReplay, startWith, Subject, switchMap } from 'rxjs';
import { Router } from '@angular/router';
import { Cita, CitaService } from '../../service/cita';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-citas',
  imports: [CommonModule, HttpClientModule],
  templateUrl: './citas.html',
  styleUrl: './citas.css',
})
export class CitasComponent {

  private refrescar$ = new Subject<void>();
  private buscarTerm$ = new Subject<string>();
  private router = inject(Router);

  citas$!: Observable<Cita[]>;
  citasFiltrados$!: Observable<Cita[]>
  errorMsg = '';

  mostrandoConfirmacion = false;
  seleccionado: Cita | null = null;

  constructor(private citaService: CitaService) { }

  ngOnInit(): void {
    this.citas$ = this.refrescar$.pipe(
      startWith(void 0),
      switchMap(() => this.citaService.getCitas()),
      catchError(err => {
        console.error('ERROR cargando citas', err);
        this.errorMsg = 'No se pudieron cargar las citas.';
        return of([] as Cita[]);
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.citasFiltrados$ = combineLatest([
      this.citas$,
      this.buscarTerm$.pipe(startWith(''))
    ]).pipe(
      map(([lista, term]) => {
        const t = term.trim().toLowerCase();
        if (!t) return lista;
        return lista.filter(c =>
          (c.motivo ?? '').toLowerCase().includes(t) ||
          (c.estado ?? '').toLowerCase().includes(t) ||
          (c.mascota?.nombre ?? '').toLowerCase().includes(t) ||
          (c.veterinario?.nombre ?? '').toLowerCase().includes(t)
        );
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  onBuscar(valor: string) { this.buscarTerm$.next(valor); }
  recargar() { this.refrescar$.next(); }

  crear() { this.router.navigate(['/citas/crear']); }
  editar(c: Cita) { this.router.navigate(['/citas', c.idCita, 'editar']); }

  abrirEliminar(c: Cita) {
    this.mostrandoConfirmacion = true;
    this.seleccionado = c;
  }

  formatearFecha(fechaIso: string): string {
  if (!fechaIso) return '';
  const fecha = new Date(fechaIso);

  const dia = fecha.getDate().toString().padStart(2, '0');
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const ano = fecha.getFullYear();

  return `${dia}/${mes}/${ano}`;
  }

  cerrarEliminar() {
    this.mostrandoConfirmacion = false;
    this.seleccionado = null;
  }

  confirmarEliminar() {
    if (!this.seleccionado || !this.seleccionado.idCita) return;
    this.citaService.eliminarCita(this.seleccionado.idCita).subscribe({
      next: () => {
        this.cerrarEliminar();
        this.refrescar$.next();
      },
      error: err => {
        console.error('ERROR eliminando cita', err);
        this.errorMsg = 'No se pudo eliminar la cita.';
      }
    });
  }
}
