import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, combineLatest, map, Observable, of, shareReplay, startWith, Subject, switchMap } from 'rxjs';
import { veterinario, VeterinarioService } from '../../service/veterinario';

@Component({
  selector: 'app-veterinarios',
  imports: [CommonModule,HttpClientModule],
  templateUrl: './veterinarios.html',
  styleUrl: './veterinarios.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VeterinariosComponent {

  private refrescar$ = new Subject<void>();
  private buscarTerm$ = new Subject<string>();
  private router = inject(Router);

  veterinarios$!: Observable<veterinario[]>;
  veterinariosFiltrados$!: Observable<veterinario[]>;
  errorMsg = '';

  mostrandoConfirmacion = false;
  seleccionado: veterinario | null = null;

  constructor(private veterinarioService: VeterinarioService) {}

  ngOnInit(): void {
    this.veterinarios$ = this.refrescar$.pipe(
      startWith(void 0),
      switchMap(() => this.veterinarioService.getVeterinarios()),
      catchError(err => {
        console.error('ERROR cargando veterinarios', err);
        this.errorMsg = 'No se pudieron cargar los veterinarios.';
        return of([] as veterinario[]);
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.veterinariosFiltrados$ = combineLatest([
      this.veterinarios$,
      this.buscarTerm$.pipe(startWith(''))
    ]).pipe(
      map(([lista, term]) => {
        const t = term.trim().toLowerCase();
        if (!t) return lista;
        return lista.filter(c =>
          (c.nombre ?? '').toLowerCase().includes(t) ||
          (c.especialidad ?? '').toLowerCase().includes(t)||
          (c.email ?? '').toLowerCase().includes(t) ||
          (c.telefono ?? '').toLowerCase().includes(t)
        );
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  onBuscar(term: string) {
    this.buscarTerm$.next(term);
  }

  recargar() {
    this.refrescar$.next();
  }

  crear() {
    this.router.navigate(['/admin/veterinarios/nuevo']);
  }

  editar(c: veterinario) {
    if (!c.idVeterinario) return;
    this.router.navigate(['/admin/veterinarios', c.idVeterinario, 'editar']);
  }

  abrirEliminar(c: veterinario) {
    this.seleccionado = c;
    this.mostrandoConfirmacion = true;
  }

  cancelarEliminar() {
    this.mostrandoConfirmacion = false;
  }

  confirmarEliminar() {
    if (!this.seleccionado || !this.seleccionado.idVeterinario) return;
    this.veterinarioService.eliminarVeterinario(this.seleccionado.idVeterinario).subscribe({
      next: () => {
        this.mostrandoConfirmacion = false;
        this.seleccionado = null;
        this.recargar();
      },
      error: err => {
        console.error('ERROR eliminando veterinario', err);
        this.errorMsg = 'No se pudo eliminar el veterinario.';
      }
    });
  }
}
