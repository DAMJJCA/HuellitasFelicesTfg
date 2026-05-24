import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  templateUrl: './sidebar.html',
  imports: [RouterModule, CommonModule]
})
export class SidebarComponent {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  get menuItems() {
    if (this.authService.isCliente()) {
      return [
        { label: 'Dashboard', route: '/dashboard' },
        { label: 'Mascotas', route: '/mascotas' },
        { label: 'Citas', route: '/citas' },
        { label: 'Vacunas', route: '/preventivos' },
        { label: 'Documentos', route: '/documentos-medicos' },
        { label: 'Historial medico', route: '/historial' },
        { label: 'Perfil', route: '/perfil' }
      ];
    }

    if (this.authService.isRecepcion()) {
      return [
        { label: 'Dashboard', route: '/dashboard' },
        { label: 'Clientes', route: '/clientes' },
        { label: 'Mascotas', route: '/mascotas' },
        { label: 'Veterinarios', route: '/admin/veterinarios' },
        { label: 'Disponibilidad', route: '/admin/disponibilidad-veterinarios' },
        { label: 'Auditoria', route: '/admin/auditoria-clinica' },
        { label: 'Facturacion', route: '/facturas' },
        { label: 'Citas', route: '/citas' },
        { label: 'Vacunas', route: '/preventivos' },
        { label: 'Historial medico', route: '/historial' },
        { label: 'Perfil', route: '/perfil' }
      ];
    }

    if (this.authService.isVeterinario()) {
      return [
        { label: 'Dashboard', route: '/dashboard' },
        { label: 'Mascotas', route: '/mascotas' },
        { label: 'Citas', route: '/citas' },
        { label: 'Consultas', route: '/consultas' },
        { label: 'Tratamientos', route: '/tratamientos' },
        { label: 'Vacunas', route: '/preventivos' },
        { label: 'Documentos', route: '/documentos-medicos' },
        { label: 'Historial medico', route: '/historial' },
        { label: 'Perfil', route: '/perfil' }
      ];
    }

    if (this.authService.isAuxiliar()) {
      return [
        { label: 'Dashboard', route: '/dashboard' },
        { label: 'Mascotas', route: '/mascotas' },
        { label: 'Citas', route: '/citas' },
        { label: 'Vacunas', route: '/preventivos' },
        { label: 'Documentos', route: '/documentos-medicos' },
        { label: 'Historial medico', route: '/historial' },
        { label: 'Perfil', route: '/perfil' }
      ];
    }

    return [
      { label: 'Dashboard', route: '/dashboard' },
      { label: 'Clientes', route: '/clientes' },
      { label: 'Mascotas', route: '/mascotas' },
      { label: 'Veterinarios', route: '/admin/veterinarios' },
      { label: 'Disponibilidad', route: '/admin/disponibilidad-veterinarios' },
      { label: 'Auditoria', route: '/admin/auditoria-clinica' },
      { label: 'Usuarios', route: '/admin/usuarios' },
      { label: 'Facturacion', route: '/facturas' },
      { label: 'Citas', route: '/citas' },
      { label: 'Consultas', route: '/consultas' },
      { label: 'Tratamientos', route: '/tratamientos' },
      { label: 'Vacunas', route: '/preventivos' },
      { label: 'Documentos', route: '/documentos-medicos' },
      { label: 'Historial medico', route: '/historial' },
      { label: 'Perfil', route: '/perfil' }
    ];
  }

  get nombreUsuario(): string {
    return this.authService.userDisplayName();
  }

  get rolUsuario(): string {
    return this.authService.userRoleLabel();
  }

  get imagenPerfil(): string {
    return this.authService.profileImage();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
