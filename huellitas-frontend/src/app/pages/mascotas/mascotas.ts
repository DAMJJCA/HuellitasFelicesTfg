import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { catchError, combineLatest, map, Observable, of, shareReplay, startWith, Subject, switchMap } from 'rxjs';
import { Router } from '@angular/router';
import { Mascotas, MascotaService } from '../../service/mascota';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-mascotas',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './mascotas.html',
  styleUrls: ['./mascotas.css'],
})
export class MascotasComponent {

  private refrescar$ = new Subject<void>();
  private buscarTerm$ = new Subject<string>();
  private router = inject(Router);

  mascotas$!: Observable<Mascotas[]>;
  mascotasFiltrados$!: Observable<Mascotas[]>;
  errorMsg = '';

  mostrandoConfirmacion = false;
  seleccionado: Mascotas | null = null;

  constructor(
    private mascotaService: MascotaService,
    private authService: AuthService
  ) {}

  get puedeGestionarMascotas(): boolean {
    return this.authService.isAdmin() || this.authService.isRecepcion() || this.authService.isCliente();
  }

  ngOnInit(): void {
    this.mascotas$ = this.refrescar$.pipe(
      startWith(void 0),
      switchMap(() => this.mascotaService.getMascotas()),
      catchError(err => {
        console.error('ERROR cargando mascotas', err);
        this.errorMsg = 'No se pudieron cargar las mascotas.';
        return of([] as Mascotas[]);
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.mascotasFiltrados$ = combineLatest([
      this.mascotas$,
      this.buscarTerm$.pipe(startWith(''))
    ]).pipe(
      map(([lista, term]) => {
        const t = term.trim().toLowerCase();
        if (!t) return lista;
        return lista.filter(c =>
          (c.nombre ?? '').toLowerCase().includes(t) ||
          (c.numeroChip ?? '').toLowerCase().includes(t) ||
          (c.especie ?? '').toLowerCase().includes(t) ||
          (c.raza ?? '').toLowerCase().includes(t) ||
          (`${c.cliente?.nombre ?? ''} ${c.cliente?.apellidos ?? ''}`).toLowerCase().includes(t)
        );
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  onBuscar(valor: string) { this.buscarTerm$.next(valor); }
  recargar() { this.refrescar$.next(); }

  etiquetaChip(m: Mascotas): string {
    return m.numeroChip?.trim() ? `Chip ${m.numeroChip}` : 'Sin chip';
  }

  crear() { this.router.navigate(['/mascotas/nueva']); }
  verFicha(m: Mascotas) {
    this.router.navigate(['/mascotas', m.idMascota]);
  }
editar(m: Mascotas) {
  this.router.navigate(['/mascotas', m.idMascota, 'editar']);
}
  abrirEliminar(m: Mascotas) {
    this.seleccionado = m;
    this.mostrandoConfirmacion = true;
  }

  cancelarEliminar() {
    this.seleccionado = null;
    this.mostrandoConfirmacion = false;
  }

  confirmarEliminar() {
    if (!this.seleccionado || !this.seleccionado.idMascota) return;
    this.mascotaService.eliminarMascota(this.seleccionado.idMascota).subscribe({
      next: () => {
        this.cancelarEliminar();
        this.refrescar$.next();
      },
      error: err => {
        console.error('ERROR eliminando mascota', err);
        this.errorMsg = 'No se pudo eliminar la mascota.';
      }
    });
  }
}
