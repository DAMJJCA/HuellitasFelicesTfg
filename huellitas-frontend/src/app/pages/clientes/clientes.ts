import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ClienteService, Cliente } from '../../service/cliente';
import { Observable, Subject, combineLatest, of } from 'rxjs';
import { startWith, switchMap, map, shareReplay, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './clientes.html',
  styleUrls: ['./clientes.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientesComponent {

  private refrescar$ = new Subject<void>();
  private buscarTerm$ = new Subject<string>();
  private router = inject(Router);

  clientes$!: Observable<Cliente[]>;
  clientesFiltrados$!: Observable<Cliente[]>;
  errorMsg = '';

  mostrandoConfirmacion = false;
  seleccionado: Cliente | null = null;

  constructor(private clienteService: ClienteService) {}

  ngOnInit(): void {
    this.clientes$ = this.refrescar$.pipe(
      startWith(void 0),
      switchMap(() => this.clienteService.getClientes()),
      catchError(err => {
        console.error('ERROR cargando clientes', err);
        this.errorMsg = 'No se pudieron cargar los clientes.';
        return of([] as Cliente[]);
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.clientesFiltrados$ = combineLatest([
      this.clientes$,
      this.buscarTerm$.pipe(startWith(''))
    ]).pipe(
      map(([lista, term]) => {
        const t = term.trim().toLowerCase();
        if (!t) return lista;
        return lista.filter(c =>
          (c.nombre ?? '').toLowerCase().includes(t) ||
          (c.apellidos ?? '').toLowerCase().includes(t) ||
          (c.email ?? '').toLowerCase().includes(t) ||
          (c.telefono ?? '').toLowerCase().includes(t)
        );
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  onBuscar(valor: string) { this.buscarTerm$.next(valor); }
  recargar() { this.refrescar$.next(); }


  crear() {
    this.router.navigate(['/clientes/nuevo']);
  }

  editar(c: Cliente) {
    if (!c.idCliente) return;
    this.router.navigate(['/clientes', c.idCliente, 'editar']);
  }

  verFicha(c: Cliente) {
    if (!c.idCliente) return;
    this.router.navigate(['/clientes', c.idCliente]);
  }

  abrirEliminar(c: Cliente) {
    this.seleccionado = c;
    this.mostrandoConfirmacion = true;
  }

  cancelarEliminar() {
    this.mostrandoConfirmacion = false;
    this.seleccionado = null;
  }

  confirmarEliminar() {
    if (!this.seleccionado || this.seleccionado.idCliente === undefined) return;
    this.clienteService.eliminarCliente(this.seleccionado.idCliente).subscribe({
      next: () => {
        this.mostrandoConfirmacion = false;
        this.seleccionado = null;
        this.refrescar$.next();
      },
      error: err => {
        console.error('ERROR eliminando cliente', err);
        this.mostrandoConfirmacion = false;
      }
    });
  }
}
