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

  menuItems = [
    { label: 'Dashboard', route: '/dashboard' },
    { label: 'Clientes', route: '/clientes' },
    { label: 'Mascotas', route: '/mascotas' },
    { label: 'Veterinarios', route: '/veterinarios' },
    { label: 'Citas', route: '/citas' },
    { label: 'Consultas', route: '/consultas' },
    { label: 'Tratamientos', route: '/tratamientos' },
    { label: 'Historial medico', route: '/historial' }
  ];

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