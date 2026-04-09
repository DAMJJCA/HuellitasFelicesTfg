import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Tratamiento, TratamientoService } from '../../service/tratamiento';
import { Subject, Observable, of, combineLatest } from 'rxjs';
import { catchError, map, shareReplay, startWith, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-tratamientos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tratamientos.html'
})
export class TratamientosComponent {

  private refrescar$ = new Subject<void>();
  private buscarTerm$ = new Subject<string>();
  private router = inject(Router);
  private tratamientoService = inject(TratamientoService);

  tratamientos$!: Observable<Tratamiento[]>;
  tratamientosFiltrados$!: Observable<Tratamiento[]>;
  errorMsg = '';

  // Modal eliminar
  mostrandoConfirmacion = false;
  seleccionado: Tratamiento | null = null;

  // Modal detalle
  mostrandoDetalle = false;
  detalleSeleccionado: Tratamiento | null = null;

  ngOnInit(): void {

    this.tratamientos$ = this.refrescar$.pipe(
      startWith(void 0),
      switchMap(() => this.tratamientoService.getTratamientos()),
      catchError(err => {
        console.error('ERROR cargando tratamientos', err);
        this.errorMsg = 'No se pudieron cargar los tratamientos.';
        return of([]);
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.tratamientosFiltrados$ = combineLatest([
      this.tratamientos$,
      this.buscarTerm$.pipe(startWith(''))
    ]).pipe(
      map(([lista, term]) => {
        const t = term.trim().toLowerCase();
        if (!t) return lista;

        return lista.filter(tr =>
          tr.nombre.toLowerCase().includes(t) ||
          tr.descripcion.toLowerCase().includes(t) ||
          tr.medicamento.toLowerCase().includes(t)
        );
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  onBuscar(valor: string) {
    this.buscarTerm$.next(valor);
  }

  recargar() {
    this.refrescar$.next();
  }

  // --------- DETALLE ----------
  verDetalle(t: Tratamiento) {
    this.detalleSeleccionado = t;
    this.mostrandoDetalle = true;
  }

  cerrarDetalle() {
    this.detalleSeleccionado = null;
    this.mostrandoDetalle = false;
  }

  // --------- ELIMINAR ----------
  abrirEliminar(t: Tratamiento) {
    this.seleccionado = t;
    this.mostrandoConfirmacion = true;
  }

  cancelarEliminar() {
    this.seleccionado = null;
    this.mostrandoConfirmacion = false;
  }

  confirmarEliminar() {
    if (!this.seleccionado?.idTratamiento) return;

    this.tratamientoService.eliminarTratamiento(this.seleccionado.idTratamiento)
      .subscribe({
        next: () => {
          this.cancelarEliminar();
          this.refrescar$.next();
        },
        error: err => {
          console.error('ERROR eliminando tratamiento', err);
          this.errorMsg = 'No se pudo eliminar el tratamiento.';
        }
      });
  }
}
