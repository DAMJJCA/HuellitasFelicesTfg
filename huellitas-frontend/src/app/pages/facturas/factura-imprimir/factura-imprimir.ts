import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { Factura, FacturaService } from '../../../service/factura';

@Component({
  selector: 'app-factura-imprimir',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './factura-imprimir.html'
})
export class FacturaImprimirComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private facturaService = inject(FacturaService);

  factura = signal<Factura | null>(null);
  cargando = signal(true);
  errorMsg = signal('');
  generadoEn = new Date();

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = Number(params.get('id'));
        if (Number.isNaN(id)) {
          this.errorMsg.set('Factura no valida.');
          this.cargando.set(false);
          return of(null);
        }
        return this.facturaService.obtener(id).pipe(
          catchError(err => {
            console.error('Error cargando factura', err);
            this.errorMsg.set('No se pudo cargar la factura.');
            this.cargando.set(false);
            return of(null);
          })
        );
      })
    ).subscribe(factura => {
      if (!factura) return;
      this.factura.set(factura);
      this.cargando.set(false);
    });
  }

  imprimir(): void {
    window.print();
  }

  volver(): void {
    this.router.navigate(['/facturas']);
  }

  formatoImporte(valor: number | undefined): string {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(valor || 0);
  }

  formatearFecha(fecha: string | null | undefined): string {
    if (!fecha) return 'Sin fecha';
    const date = new Date(`${fecha}T00:00:00`);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  }
}
