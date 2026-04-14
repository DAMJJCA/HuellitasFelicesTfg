import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
<<<<<<< HEAD
import { Router } from '@angular/router';
=======
>>>>>>> Jorge
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

<<<<<<< HEAD
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
=======
  private tratamientoService = inject(TratamientoService);

  private refrescar$ = new Subject<void>();
  private buscar$ = new Subject<string>();

  tratamientos$!: Observable<Tratamiento[]>;
  tratamientosFiltrados$!: Observable<Tratamiento[]>;

  errorMsg = '';


  mostrandoEliminar = false;
  seleccionadoEliminar: Tratamiento | null = null;


  mostrandoDetalle = false;
  seleccionadoDetalle: Tratamiento | null = null;
>>>>>>> Jorge

  ngOnInit(): void {

    this.tratamientos$ = this.refrescar$.pipe(
      startWith(void 0),
      switchMap(() => this.tratamientoService.getTratamientos()),
      catchError(err => {
<<<<<<< HEAD
        console.error('ERROR cargando tratamientos', err);
        this.errorMsg = 'No se pudieron cargar los tratamientos.';
        return of([]);
      }),
      shareReplay({ bufferSize: 1, refCount: true })
=======
        console.error(err);
        this.errorMsg = 'No se pudieron cargar los tratamientos.';
        return of([]);
      }),
      shareReplay(1)
>>>>>>> Jorge
    );

    this.tratamientosFiltrados$ = combineLatest([
      this.tratamientos$,
<<<<<<< HEAD
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
=======
      this.buscar$.pipe(startWith(''))
    ]).pipe(
      map(([lista, term]) => {
        const t = term.toLowerCase().trim();
        if (!t) return lista;
        return lista.filter(tr =>
          tr.nombre.toLowerCase().includes(t) ||
          tr.medicamento.toLowerCase().includes(t) ||
          tr.descripcion.toLowerCase().includes(t)
        );
      })
    );
  }

  buscar(valor: string) {
    this.buscar$.next(valor);
>>>>>>> Jorge
  }

  recargar() {
    this.refrescar$.next();
  }

<<<<<<< HEAD
  // --------- DETALLE ----------
  verDetalle(t: Tratamiento) {
    this.detalleSeleccionado = t;
=======
  verDetalle(t: Tratamiento) {
    this.seleccionadoDetalle = t;
>>>>>>> Jorge
    this.mostrandoDetalle = true;
  }

  cerrarDetalle() {
<<<<<<< HEAD
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
=======
    this.seleccionadoDetalle = null;
    this.mostrandoDetalle = false;
  }

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
        error: () => {
>>>>>>> Jorge
          this.errorMsg = 'No se pudo eliminar el tratamiento.';
        }
      });
  }
<<<<<<< HEAD
}
=======
}
>>>>>>> Jorge
