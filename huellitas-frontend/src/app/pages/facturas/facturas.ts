import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Cliente, ClienteService } from '../../service/cliente';
import { EstadoFactura, Factura, FacturaLinea, FacturaService } from '../../service/factura';

@Component({
  selector: 'app-facturas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './facturas.html'
})
export class FacturasComponent implements OnInit {
  private facturaService = inject(FacturaService);
  private clienteService = inject(ClienteService);
  private router = inject(Router);

  facturas = signal<Factura[]>([]);
  clientes: Cliente[] = [];
  errorMsg = '';
  successMsg = '';
  guardando = false;

  idCliente: number | null = null;
  idCita: number | null = null;
  impuestoPorcentaje = 21;
  descuentoPorcentaje = 0;
  notas = '';
  lineas: FacturaLinea[] = [{ concepto: 'Consulta veterinaria', cantidad: 1, precioUnitario: 30 }];

  totalBorrador = computed(() => this.lineas.reduce((sum, linea) => sum + this.totalLinea(linea), 0));
  descuentoBorrador = computed(() => this.totalBorrador() * (Number(this.descuentoPorcentaje || 0) / 100));
  baseBorrador = computed(() => this.totalBorrador() - this.descuentoBorrador());
  impuestosBorrador = computed(() => this.baseBorrador() * (Number(this.impuestoPorcentaje || 0) / 100));
  totalConImpuestos = computed(() => this.baseBorrador() + this.impuestosBorrador());

  ngOnInit(): void {
    this.cargar();
    this.clienteService.getClientes().subscribe({
      next: clientes => this.clientes = clientes,
      error: () => this.errorMsg = 'No se pudieron cargar los clientes para facturacion.'
    });
  }

  cargar(): void {
    this.errorMsg = '';
    this.facturaService.listar().subscribe({
      next: facturas => this.facturas.set(facturas),
      error: err => this.errorMsg = err?.error?.detail || err?.error?.message || 'No se pudieron cargar las facturas.'
    });
  }

  crear(): void {
    if (!this.idCliente) {
      this.errorMsg = 'Selecciona un cliente.';
      return;
    }

    this.errorMsg = '';
    this.successMsg = '';
    this.guardando = true;
    this.facturaService.crear({
      idCliente: Number(this.idCliente),
      idCita: this.idCita ? Number(this.idCita) : null,
      impuestoPorcentaje: Number(this.impuestoPorcentaje || 0),
      descuentoPorcentaje: Number(this.descuentoPorcentaje || 0),
      notas: this.notas || null,
      lineas: this.lineas
    }).subscribe({
      next: factura => {
        this.successMsg = `Factura ${factura.numero || factura.idFactura} creada.`;
        this.guardando = false;
        this.resetForm();
        this.cargar();
      },
      error: err => {
        this.guardando = false;
        this.errorMsg = err?.error?.detail || err?.error?.message || 'No se pudo crear la factura.';
      }
    });
  }

  cambiarEstado(factura: Factura, estado: EstadoFactura): void {
    this.facturaService.cambiarEstado(factura.idFactura, estado).subscribe({
      next: actualizada => {
        this.facturas.update(lista => lista.map(item => item.idFactura === actualizada.idFactura ? actualizada : item));
      },
      error: err => this.errorMsg = err?.error?.detail || err?.error?.message || 'No se pudo actualizar la factura.'
    });
  }

  imprimir(factura: Factura): void {
    this.router.navigate(['/facturas', factura.idFactura, 'imprimir']);
  }

  agregarLinea(): void {
    this.lineas = [...this.lineas, { concepto: '', cantidad: 1, precioUnitario: 0 }];
  }

  quitarLinea(index: number): void {
    if (this.lineas.length === 1) return;
    this.lineas = this.lineas.filter((_, i) => i !== index);
  }

  totalLinea(linea: FacturaLinea): number {
    return Number(linea.cantidad || 0) * Number(linea.precioUnitario || 0);
  }

  formatoImporte(valor: number | undefined): string {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(valor || 0);
  }

  claseEstado(estado: string): string {
    const clases: Record<string, string> = {
      borrador: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100',
      emitida: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-100',
      pagada: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100',
      cancelada: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-100'
    };
    return clases[estado] || clases['borrador'];
  }

  private resetForm(): void {
    this.idCliente = null;
    this.idCita = null;
    this.impuestoPorcentaje = 21;
    this.descuentoPorcentaje = 0;
    this.notas = '';
    this.lineas = [{ concepto: 'Consulta veterinaria', cantidad: 1, precioUnitario: 30 }];
  }
}
