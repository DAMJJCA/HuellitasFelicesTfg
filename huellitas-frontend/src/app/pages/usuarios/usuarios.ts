import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { UsuarioInterno, UsuarioInternoRequest, UsuarioService, RolInterno } from '../../service/usuario';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.html'
})
export class UsuariosComponent implements OnInit {
  private usuarioService = inject(UsuarioService);
  private authService = inject(AuthService);

  usuarios: UsuarioInterno[] = [];
  filtro: 'todos' | 'internos' | 'clientes' | 'veterinarios' = 'todos';
  busqueda = '';
  errorMsg = '';
  successMsg = '';
  guardando = false;
  editando: UsuarioInterno | null = null;

  form: UsuarioInternoRequest = this.formVacio();

  get puedeEditar(): boolean {
    return this.authService.isAdmin();
  }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.errorMsg = '';
    this.usuarioService.listar().subscribe({
      next: usuarios => this.usuarios = usuarios,
      error: err => this.errorMsg = err?.error?.detail || err?.error?.message || 'No se pudieron cargar los usuarios.'
    });
  }

  usuariosFiltrados(): UsuarioInterno[] {
    const term = this.busqueda.trim().toLowerCase();
    const porTipo = this.usuariosPorTipo();
    if (!term) return porTipo;

    return porTipo.filter(usuario =>
      (usuario.nombreUsuario || '').toLowerCase().includes(term) ||
      (usuario.email || '').toLowerCase().includes(term) ||
      this.etiquetaRol(usuario.rol).toLowerCase().includes(term) ||
      this.vinculo(usuario).toLowerCase().includes(term)
    );
  }

  usuariosPorTipo(): UsuarioInterno[] {
    if (this.filtro === 'internos') {
      return this.usuarios.filter(usuario => !usuario.idCliente && !usuario.idVeterinario);
    }
    if (this.filtro === 'clientes') {
      return this.usuarios.filter(usuario => !!usuario.idCliente);
    }
    if (this.filtro === 'veterinarios') {
      return this.usuarios.filter(usuario => !!usuario.idVeterinario);
    }
    return this.usuarios;
  }

  cambiarFiltro(filtro: 'todos' | 'internos' | 'clientes' | 'veterinarios'): void {
    this.filtro = filtro;
  }

  totalFiltro(filtro: 'todos' | 'internos' | 'clientes' | 'veterinarios'): number {
    if (filtro === 'internos') return this.usuarios.filter(usuario => !usuario.idCliente && !usuario.idVeterinario).length;
    if (filtro === 'clientes') return this.usuarios.filter(usuario => !!usuario.idCliente).length;
    if (filtro === 'veterinarios') return this.usuarios.filter(usuario => !!usuario.idVeterinario).length;
    return this.usuarios.length;
  }

  guardar(): void {
    if (!this.puedeEditar) return;
    this.errorMsg = '';
    this.successMsg = '';
    this.guardando = true;

    const request = { ...this.form };
    if (this.editando && !request.password) {
      delete request.password;
    }

    const peticion = this.editando
      ? this.usuarioService.actualizar(this.editando.idUsuario, request)
      : this.usuarioService.crear(request);

    peticion.subscribe({
      next: () => {
        this.successMsg = this.editando ? 'Usuario actualizado.' : 'Usuario creado.';
        this.cancelarEdicion();
        this.guardando = false;
        this.cargar();
      },
      error: err => {
        this.guardando = false;
        this.errorMsg = err?.error?.detail || err?.error?.message || 'No se pudo guardar el usuario.';
      }
    });
  }

  editar(usuario: UsuarioInterno): void {
    if (!this.puedeEditar || !this.esEditable(usuario)) return;
    this.editando = usuario;
    this.form = {
      nombreUsuario: usuario.nombreUsuario,
      email: usuario.email,
      rol: usuario.rol as RolInterno,
      activo: usuario.activo,
      password: ''
    };
  }

  cancelarEdicion(): void {
    this.editando = null;
    this.form = this.formVacio();
  }

  cambiarActivo(usuario: UsuarioInterno): void {
    if (!this.puedeEditar) return;
    this.usuarioService.cambiarActivo(usuario.idUsuario, !usuario.activo).subscribe({
      next: actualizado => {
        this.usuarios = this.usuarios.map(item => item.idUsuario === actualizado.idUsuario ? actualizado : item);
      },
      error: err => this.errorMsg = err?.error?.detail || err?.error?.message || 'No se pudo cambiar el estado.'
    });
  }

  etiquetaRol(rol: string): string {
    const etiquetas: Record<string, string> = {
      admin: 'Administrador',
      recepcion: 'Recepcion/Gerencia',
      auxiliar: 'Auxiliar',
      veterinario: 'Veterinario',
      cliente: 'Cliente'
    };
    return etiquetas[rol] || rol;
  }

  vinculo(usuario: UsuarioInterno): string {
    if (usuario.idVeterinario) return `Veterinario #${usuario.idVeterinario}`;
    if (usuario.idCliente) return `Cliente #${usuario.idCliente}`;
    return 'Usuario interno';
  }

  esEditable(usuario: UsuarioInterno): boolean {
    return this.esRolInterno(usuario.rol) && !usuario.idCliente && !usuario.idVeterinario;
  }

  private formVacio(): UsuarioInternoRequest {
    return {
      nombreUsuario: '',
      email: '',
      password: '',
      rol: 'recepcion',
      activo: true
    };
  }

  private esRolInterno(rol: string): boolean {
    return ['admin', 'recepcion', 'auxiliar'].includes(rol);
  }
}
