import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, Observable, of, combineLatest } from 'rxjs';
import { startWith, switchMap, catchError, map } from 'rxjs/operators';
import { Consulta, ConsultaService } from '../../service/consulta';
import { PageHeaderComponent } from '../../shared/page-header/page-header';

@Component({
  selector: 'app-consultas',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent],
  templateUrl: './consultas.html'
})
export class ConsultasComponent {

  private refrescar$ = new Subject<void>();
  private buscar$ = new Subject<string>();
  private router = inject(Router);
  private consultaService = inject(ConsultaService);

  consultas$!: Observable<Consulta[]>;
  consultasFiltradas$!: Observable<Consulta[]>;
  errorMsg = '';

  ngOnInit(): void {

    this.consultas$ = this.refrescar$.pipe(
      startWith(void 0),
      switchMap(() => this.consultaService.getConsultas()),
      catchError(err => {
        console.error(err);
        this.errorMsg = 'Error cargando consultas';
        return of([]);
      })
    );

    this.consultasFiltradas$ = combineLatest([
      this.consultas$,
      this.buscar$.pipe(startWith(''))
    ]).pipe(
      map(([lista, term]) => {
        const t = term.toLowerCase();
        return lista.filter(c =>
          (c.nombreMascota ?? '').toLowerCase().includes(t) ||
          (c.diagnostico ?? '').toLowerCase().includes(t) ||
          (c.observaciones ?? '').toLowerCase().includes(t)
        );
      })
    );
  }

  buscar(v: string) {
    this.buscar$.next(v);
  }

  editar(c: Consulta) {
    this.router.navigate(['/consultas', c.idConsulta, 'editar']);
  }

  verDetalle(c: Consulta) {
    this.router.navigate(['/consultas', c.idConsulta]);
  }

  verInforme(c: Consulta) {
    this.router.navigate(['/consultas', c.idConsulta, 'informe']);
  }
}
