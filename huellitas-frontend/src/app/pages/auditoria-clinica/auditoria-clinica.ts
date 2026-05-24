import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { extraerMensajeError } from '../../core/http-error';
import { AuditoriaClinica, AuditoriaClinicaService } from '../../service/auditoria-clinica';

@Component({
  selector: 'app-auditoria-clinica',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auditoria-clinica.html'
})
export class AuditoriaClinicaComponent {
  private auditoriaService = inject(AuditoriaClinicaService);

  registros = signal<AuditoriaClinica[]>([]);
  registrosFiltrados = signal<AuditoriaClinica[]>([]);
  cargando = signal(true);
  errorMsg = signal('');
  filtroEntidad = '';
  filtroAccion = '';
  filtroTexto = '';

  ngOnInit(): void {
    this.auditoriaService.recientes().subscribe({
      next: registros => {
        this.registros.set(registros);
        this.aplicarFiltros();
        this.cargando.set(false);
      },
      error: err => {
        this.errorMsg.set(extraerMensajeError(err, 'No se pudo cargar la auditoría clínica.'));
        this.cargando.set(false);
      }
    });
  }

  aplicarFiltros(): void {
    const entidad = this.filtroEntidad.trim().toLowerCase();
    const accion = this.filtroAccion.trim().toLowerCase();
    const texto = this.filtroTexto.trim().toLowerCase();

    this.registrosFiltrados.set(this.registros().filter(item => {
      const coincideEntidad = !entidad || item.entidad.toLowerCase() === entidad;
      const coincideAccion = !accion || item.accion.toLowerCase() === accion;
      const contenido = `${item.entidad} ${item.idEntidad} ${item.accion} ${item.idUsuario} ${item.rolUsuario} ${item.resumen}`.toLowerCase();
      return coincideEntidad && coincideAccion && (!texto || contenido.includes(texto));
    }));
  }

  limpiarFiltros(): void {
    this.filtroEntidad = '';
    this.filtroAccion = '';
    this.filtroTexto = '';
    this.aplicarFiltros();
  }

  entidades(): string[] {
    return [...new Set(this.registros().map(item => item.entidad))].sort();
  }

  acciones(): string[] {
    return [...new Set(this.registros().map(item => item.accion))].sort();
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return 'Sin fecha';
    return new Date(fecha).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  etiquetaAccion(accion: string): string {
    const etiquetas: Record<string, string> = {
      crear: 'Creación',
      editar: 'Edición',
      eliminar: 'Eliminación',
      anular: 'Anulación',
      cambiar_estado: 'Cambio de estado'
    };
    return etiquetas[accion] || accion;
  }
}
