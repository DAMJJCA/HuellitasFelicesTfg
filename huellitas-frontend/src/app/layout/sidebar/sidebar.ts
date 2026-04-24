import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
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
        { label: 'Historial medico', route: '/historial' }
      ];
    }

    if (this.authService.isVeterinario()) {
      return [
        { label: 'Dashboard', route: '/dashboard' },
        { label: 'Mascotas', route: '/mascotas' },
        { label: 'Citas', route: '/citas' },
        { label: 'Consultas', route: '/consultas' },
        { label: 'Tratamientos', route: '/tratamientos' },
        { label: 'Historial medico', route: '/historial' }
      ];
    }

    const adminItems = [
      { label: 'Dashboard', route: '/dashboard' },
      { label: 'Clientes', route: '/clientes' },
      { label: 'Mascotas', route: '/mascotas' },
      { label: 'Veterinarios', route: '/admin/veterinarios' },
      { label: 'Citas', route: '/citas' },
      { label: 'Consultas', route: '/consultas' },
      { label: 'Tratamientos', route: '/tratamientos' },
      { label: 'Historial medico', route: '/historial' }
    ];

    return adminItems;
  }

  get nombreUsuario(): string {
    return this.authService.userDisplayName();
  }

  get rolUsuario(): string {
    return this.authService.userRoleLabel();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
