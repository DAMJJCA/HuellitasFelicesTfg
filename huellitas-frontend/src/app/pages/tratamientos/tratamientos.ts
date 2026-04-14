import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Tratamiento, TratamientoService } from '../../service/tratamiento';
import { Observable, Subject, combineLatest, of } from 'rxjs';
import { catchError, map, shareReplay, startWith, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-tratamientos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tratamientos.html'
})
export class TratamientosComponent {

  private tratamientoService = inject(TratamientoService);
  private router = inject(Router);

  private refrescar$ = new Subject<void>();
  private buscar$ = new Subject<string>();

  tratamientos$!: Observable<Tratamiento[]>;
  tratamientosFiltrados$!: Observable<Tratamiento[]>;

  errorMsg = '';

  // Modal eliminar
  mostrandoEliminar = false;
  seleccionadoEliminar: Tratamiento | null = null;

  // Modal detalle
  mostrandoDetalle = false;
  seleccionadoDetalle: Tratamiento | null = null;

  ngOnInit(): void {

    this.tratamientos$ = this.refrescar$.pipe(
      startWith(void 0),
      switchMap(() => this.tratamientoService.getTratamientos()),
      catchError(err => {
        console.error('Error cargando tratamientos', err);
        this.errorMsg = 'No se pudieron cargar los tratamientos.';
        return of([]);
      }),
      shareReplay(1)
    );

    this.tratamientosFiltrados$ = combineLatest([
      this.tratamientos$,
      this.buscar$.pipe(startWith(''))
    ]).pipe(
      map(([lista, term]) => {
        const t = term.toLowerCase().trim();
        if (!t) return lista;

        return lista.filter(tr =>
          tr.nombre?.toLowerCase().includes(t) ||
          tr.medicamento?.toLowerCase().includes(t) ||
          tr.descripcion?.toLowerCase().includes(t)
        );
      }),
      shareReplay(1)
    );
  }

  // ===== BUSCAR =====
  buscar(valor: string) {
    this.buscar$.next(valor);
  }

  // ===== RECARGAR =====
  recargar() {
    this.refrescar$.next();
  }

  // ===== DETALLE =====
  verDetalle(t: Tratamiento) {
    this.seleccionadoDetalle = t;
    this.mostrandoDetalle = true;
  }

  cerrarDetalle() {
    this.seleccionadoDetalle = null;
    this.mostrandoDetalle = false;
  }

  // ===== ELIMINAR =====
  abrirEliminar(t: Tratamiento) {
    this.seleccionadoEliminar = t;
    this.mostrandoEliminar = true;
  }

  cancelarEliminar() {
    this.seleccionadoEliminar = null;
    this.mostrandoEliminar = false;
  }

  confirmarEliminar() {
    if (!this.seleccionadoEliminar?.idTratamiento) return;

    this.tratamientoService
      .eliminarTratamiento(this.seleccionadoEliminar.idTratamiento)
      .subscribe({
        next: () => {
          this.cancelarEliminar();
          this.recargar();
        },
        error: err => {
          console.error('Error eliminando tratamiento', err);
          this.errorMsg = 'No se pudo eliminar el tratamiento.';
        }
      });
  }
}
