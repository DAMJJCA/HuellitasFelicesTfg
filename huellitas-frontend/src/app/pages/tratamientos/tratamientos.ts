import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
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

  ngOnInit(): void {

    this.tratamientos$ = this.refrescar$.pipe(
      startWith(void 0),
      switchMap(() => this.tratamientoService.getTratamientos()),
      catchError(err => {
        console.error(err);
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
          tr.nombre.toLowerCase().includes(t) ||
          tr.medicamento.toLowerCase().includes(t) ||
          tr.descripcion.toLowerCase().includes(t)
        );
      })
    );
  }

  buscar(valor: string) {
    this.buscar$.next(valor);
  }

  recargar() {
    this.refrescar$.next();
  }

  verDetalle(t: Tratamiento) {
    this.seleccionadoDetalle = t;
    this.mostrandoDetalle = true;
  }

  cerrarDetalle() {
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
          this.errorMsg = 'No se pudo eliminar el tratamiento.';
        }
      });
  }
}