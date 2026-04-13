import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  templateUrl: './sidebar.html',
  imports: [RouterModule, CommonModule]
})
export class SidebarComponent {

  constructor(private router: Router) {}

  menuItems = [
    { label: 'Dashboard', route: '/dashboard' },
    { label: 'Clientes', route: '/clientes' },
    { label: 'Mascotas', route: '/mascotas' },
    { label: 'Veterinarios', route: '/veterinarios' },
    { label: 'Citas', route: '/citas' },
    { label: 'Consultas', route: '/consultas' },
    { label: 'Tratamientos', route: '/tratamientos' },
    { label: 'Historial médico' , route: '/historial' }
  ];

  logout() {
    // Aquí se cierra la sesión
    console.log('Sesión cerrada');

    this.router.navigate(['/login']);
  }
}