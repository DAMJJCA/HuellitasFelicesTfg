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
    if (!this.puedeEditar || !this.esRolInterno(usuario.rol)) return;
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
