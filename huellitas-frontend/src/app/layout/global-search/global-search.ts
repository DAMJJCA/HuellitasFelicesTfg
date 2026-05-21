import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';

import { AuthService } from '../../auth/auth.service';
import { Cita, CitaService } from '../../service/cita';
import { Cliente, ClienteService } from '../../service/cliente';
import { Consulta, ConsultaService } from '../../service/consulta';
import { DocumentoMedico, DocumentoMedicoService } from '../../service/documento-medico';
import { MascotaService, Mascotas } from '../../service/mascota';
import { Preventivo, PreventivoService } from '../../service/preventivo';
import { Tratamiento, TratamientoService } from '../../service/tratamiento';
import { veterinario, VeterinarioService } from '../../service/veterinario';

type TipoResultado =
  | 'Mascota'
  | 'Cliente'
  | 'Cita'
  | 'Veterinario'
  | 'Consulta'
  | 'Tratamiento'
  | 'Documento'
  | 'Preventivo';

type ResultadoBusqueda = {
  tipo: TipoResultado;
  titulo: string;
  detalle: string;
  ruta: string;
  queryParams?: Record<string, string>;
  texto: string;
};

@Component({
  selector: 'app-global-search',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './global-search.html'
})
export class GlobalSearchComponent {
  private mascotaService = inject(MascotaService);
  private clienteService = inject(ClienteService);
  private citaService = inject(CitaService);
  private veterinarioService = inject(VeterinarioService);
  private consultaService = inject(ConsultaService);
  private tratamientoService = inject(TratamientoService);
  private documentoService = inject(DocumentoMedicoService);
  private preventivoService = inject(PreventivoService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private elementRef = inject(ElementRef<HTMLElement>);

  termino = signal('');
  resultados = signal<ResultadoBusqueda[]>([]);
  abierto = signal(false);
  cargando = signal(false);
  errorMsg = signal('');

  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.abierto.set(false);
    }
  }

  buscar(valor: string): void {
    this.termino.set(valor);
    this.errorMsg.set('');
    this.abierto.set(true);

    if (this.timeoutId) clearTimeout(this.timeoutId);

    const termino = valor.trim();
    if (termino.length < 2) {
      this.resultados.set([]);
      this.cargando.set(false);
      return;
    }

    this.cargando.set(true);
    this.timeoutId = setTimeout(() => this.ejecutarBusqueda(termino), 250);
  }

  navegar(resultado: ResultadoBusqueda): void {
    this.abierto.set(false);
    this.termino.set('');
    this.resultados.set([]);
    this.router.navigate([resultado.ruta], { queryParams: resultado.queryParams });
  }

  etiquetaGrupo(tipo: TipoResultado): string {
    const etiquetas: Record<TipoResultado, string> = {
      Mascota: 'Mascotas',
      Cliente: 'Clientes',
      Cita: 'Citas',
      Veterinario: 'Veterinarios',
      Consulta: 'Consultas',
      Tratamiento: 'Tratamientos',
      Documento: 'Documentos',
      Preventivo: 'Vacunas y desparasitaciones'
    };
    return etiquetas[tipo];
  }

  grupos(): { tipo: TipoResultado; items: ResultadoBusqueda[] }[] {
    const orden: TipoResultado[] = ['Mascota', 'Cliente', 'Cita', 'Veterinario', 'Consulta', 'Tratamiento', 'Documento', 'Preventivo'];
    return orden
      .map(tipo => ({
        tipo,
        items: this.resultados().filter(resultado => resultado.tipo === tipo)
      }))
      .filter(grupo => grupo.items.length > 0);
  }

  private ejecutarBusqueda(termino: string): void {
    forkJoin({
      mascotas: this.mascotaService.getMascotas().pipe(catchError(() => of([] as Mascotas[]))),
      citas: this.citaService.getCitas().pipe(catchError(() => of([] as Cita[]))),
      preventivos: this.preventivoService.getPreventivos().pipe(catchError(() => of([] as Preventivo[]))),
      documentos: this.documentoService.getDocumentos().pipe(catchError(() => of([] as DocumentoMedico[]))),
      clientes: this.authService.isAdmin()
        ? this.clienteService.getClientes().pipe(catchError(() => of([] as Cliente[])))
        : of([] as Cliente[]),
      veterinarios: this.authService.isAdmin()
        ? this.veterinarioService.getVeterinarios().pipe(catchError(() => of([] as veterinario[])))
        : of([] as veterinario[]),
      consultas: this.esStaff()
        ? this.consultaService.getConsultas().pipe(catchError(() => of([] as Consulta[])))
        : of([] as Consulta[]),
      tratamientos: this.esStaff()
        ? this.tratamientoService.getTratamientos().pipe(catchError(() => of([] as Tratamiento[])))
        : of([] as Tratamiento[])
    }).subscribe({
      next: data => {
        const todos = [
          ...this.mapearMascotas(data.mascotas),
          ...this.mapearClientes(data.clientes),
          ...this.mapearCitas(data.citas),
          ...this.mapearVeterinarios(data.veterinarios),
          ...this.mapearConsultas(data.consultas),
          ...this.mapearTratamientos(data.tratamientos),
          ...this.mapearDocumentos(data.documentos),
          ...this.mapearPreventivos(data.preventivos)
        ];

        const normalizado = this.normalizar(termino);
        this.resultados.set(todos
          .filter(resultado => resultado.texto.includes(normalizado))
          .slice(0, 24));
        this.cargando.set(false);
      },
      error: () => {
        this.errorMsg.set('No se pudo completar la busqueda.');
        this.cargando.set(false);
      }
    });
  }

  private mapearMascotas(mascotas: Mascotas[]): ResultadoBusqueda[] {
    return mascotas.map(mascota => {
      const duenio = mascota.cliente ? `${mascota.cliente.nombre} ${mascota.cliente.apellidos}` : 'Sin duenio';
      const id = mascota.idMascota || 0;
      return {
        tipo: 'Mascota',
        titulo: `${mascota.nombre} #${id}`,
        detalle: `${duenio} - ${mascota.especie || 'Sin especie'} - ${mascota.raza || 'Sin raza'}`,
        ruta: `/mascotas/${id}`,
        texto: this.normalizar(`${id} ${mascota.nombre} ${mascota.especie} ${mascota.raza} ${duenio} ${mascota.cliente?.idCliente || ''}`)
      };
    });
  }

  private mapearClientes(clientes: Cliente[]): ResultadoBusqueda[] {
    return clientes.map(cliente => ({
      tipo: 'Cliente',
      titulo: `${cliente.nombre} ${cliente.apellidos}`,
      detalle: `${cliente.email || 'Sin email'} - ${cliente.telefono || 'Sin telefono'} - #${cliente.idCliente}`,
      ruta: '/clientes',
      texto: this.normalizar(`${cliente.idCliente} ${cliente.nombre} ${cliente.apellidos} ${cliente.email} ${cliente.telefono} ${cliente.direccion}`)
    }));
  }

  private mapearCitas(citas: Cita[]): ResultadoBusqueda[] {
    return citas.map(cita => ({
      tipo: 'Cita',
      titulo: `${cita.mascota?.nombre || 'Mascota'} - ${cita.fecha} ${cita.hora}`,
      detalle: `${cita.motivo || 'Sin motivo'} - ${cita.estado} - ${cita.veterinario?.nombre || 'Sin veterinario'} - #${cita.idCita}`,
      ruta: this.authService.isVeterinario() ? '/citas' : `/citas/${cita.idCita}/editar`,
      texto: this.normalizar(`${cita.idCita} ${cita.fecha} ${cita.hora} ${cita.estado} ${cita.motivo} ${cita.mascota?.nombre} ${cita.mascota?.idMascota} ${cita.veterinario?.nombre} ${cita.veterinario?.idVeterinario}`)
    }));
  }

  private mapearVeterinarios(veterinarios: veterinario[]): ResultadoBusqueda[] {
    return veterinarios.map(vet => ({
      tipo: 'Veterinario',
      titulo: `${vet.nombre} #${vet.idVeterinario}`,
      detalle: `${vet.especialidad || 'Sin especialidad'} - ${vet.email || 'Sin email'}`,
      ruta: '/admin/veterinarios',
      texto: this.normalizar(`${vet.idVeterinario} ${vet.nombre} ${vet.especialidad} ${vet.email} ${vet.telefono}`)
    }));
  }

  private mapearConsultas(consultas: Consulta[]): ResultadoBusqueda[] {
    return consultas.map(consulta => ({
      tipo: 'Consulta',
      titulo: `${consulta.nombreMascota || 'Mascota'} - ${consulta.diagnostico || 'Consulta'}`,
      detalle: `${consulta.fecha} ${consulta.hora || ''} - #${consulta.idConsulta}`,
      ruta: `/consultas/${consulta.idConsulta}/editar`,
      texto: this.normalizar(`${consulta.idConsulta} ${consulta.idCita} ${consulta.nombreMascota} ${consulta.diagnostico} ${consulta.observaciones} ${consulta.fecha} ${consulta.hora}`)
    }));
  }

  private mapearTratamientos(tratamientos: Tratamiento[]): ResultadoBusqueda[] {
    return tratamientos.map(tratamiento => ({
      tipo: 'Tratamiento',
      titulo: tratamiento.nombre || 'Tratamiento',
      detalle: `${tratamiento.nombreMascota || 'Mascota'} - ${tratamiento.medicamento || 'Sin medicamento'} - #${tratamiento.idTratamiento}`,
      ruta: '/tratamientos',
      texto: this.normalizar(`${tratamiento.idTratamiento} ${tratamiento.nombre} ${tratamiento.nombreMascota} ${tratamiento.medicamento} ${tratamiento.dosis} ${tratamiento.duracion} ${tratamiento.descripcion} ${tratamiento.consulta?.idConsulta}`)
    }));
  }

  private mapearDocumentos(documentos: DocumentoMedico[]): ResultadoBusqueda[] {
    return documentos.map(documento => ({
      tipo: 'Documento',
      titulo: documento.nombre,
      detalle: `${documento.nombreMascota || 'Mascota'} - ${documento.tipo} - ${documento.fecha || 'Sin fecha'} - #${documento.idDocumento}`,
      ruta: '/documentos-medicos',
      texto: this.normalizar(`${documento.idDocumento} ${documento.idMascota} ${documento.idConsulta} ${documento.nombreMascota} ${documento.nombre} ${documento.tipo} ${documento.fecha} ${documento.observaciones} ${documento.url}`)
    }));
  }

  private mapearPreventivos(preventivos: Preventivo[]): ResultadoBusqueda[] {
    return preventivos.map(preventivo => ({
      tipo: 'Preventivo',
      titulo: preventivo.nombre,
      detalle: `${preventivo.nombreMascota || 'Mascota'} - ${preventivo.tipo} - proxima: ${preventivo.proximaDosis || 'Sin fecha'} - #${preventivo.idRegistro}`,
      ruta: '/preventivos',
      texto: this.normalizar(`${preventivo.idRegistro} ${preventivo.idMascota} ${preventivo.nombreMascota} ${preventivo.tipo} ${preventivo.nombre} ${preventivo.fechaAplicacion} ${preventivo.proximaDosis} ${preventivo.observaciones}`)
    }));
  }

  private esStaff(): boolean {
    return this.authService.isAdmin() || this.authService.isVeterinario();
  }

  private normalizar(valor: unknown): string {
    return String(valor ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }
}
