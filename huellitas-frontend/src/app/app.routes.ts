import { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell/shell';
import { authGuard } from './auth/auth.guard';  //Proteccion de rutas
import { adminGuard } from './auth/admin.guard';
import { staffGuard } from './auth/staff.guard';
import { nonVeterinarioGuard } from './auth/non-veterinario.guard';

export const routes: Routes = [
  // ZONA PÚBLICA
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./pages/inicio/inicio').then(m => m.InicioComponent)
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login').then(m => m.LoginComponent)
  },
  {
    path: 'registro',
    loadComponent: () =>
      import('./pages/registro/registro').then(m => m.RegistroComponent)
  },

  // ZONA INTERNA CON SHELL
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard], //Proteccion de rutas
    children: [
      // clientes
      {
        path: 'clientes/nuevo',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./pages/clientes/nvcliente/nvcliente').then(m => m.NvClienteComponent)
      },
      {
        path: 'clientes/:id/editar',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./pages/clientes/mcliente/mcliente').then(m => m.MClienteComponent)
      },
      {
        path: 'clientes',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./pages/clientes/clientes').then(m => m.ClientesComponent)
      },

      // mascotas
      {
        path: 'mascotas',
        loadComponent: () =>
          import('./pages/mascotas/mascotas').then(m => m.MascotasComponent)
      },
      {
        path: 'mascotas/nueva',
        canActivate: [nonVeterinarioGuard],
        loadComponent: () =>
          import('./pages/mascotas/nvmascota/nvmascota').then(m => m.NvmascotaComponent)
      },
      {
        path: 'mascotas/:id/editar',
        canActivate: [nonVeterinarioGuard],
        loadComponent: () =>
          import('./pages/mascotas/mmascota/mmascota').then(m => m.MmascotaComponent)
      },

      // modulo admin - veterinarios
      {
        path: 'admin/veterinarios',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./pages/veterinarios/veterinarios').then(m => m.VeterinariosComponent)
      },
      {
        path: 'admin/veterinarios/nuevo',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./pages/veterinarios/nvveterinario/nvveterinario').then(m => m.NvVeterinarioComponent)
      },
      {
        path: 'admin/veterinarios/:id/editar',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./pages/veterinarios/mveterinario/mveterinario').then(m => m.MveterinarioComponent)
      },

      // citas
      {
        path: 'citas',
        loadComponent: () =>
          import('./pages/citas/citas').then(m => m.CitasComponent)
      },
      {
        path: 'citas/crear',
        canActivate: [nonVeterinarioGuard],
        loadComponent: () =>
          import('./pages/citas/nvcita/nvcita').then(m => m.NvcitaComponent)
      },
      {
        path: 'citas/:id/editar',
        canActivate: [nonVeterinarioGuard],
        loadComponent: () =>
          import('./pages/citas/mcita/mcita').then(m => m.McitaComponent)
      },

      // consultas
      {
        path: 'consultas',
        canActivate: [staffGuard],
        loadComponent: () =>
          import('./pages/consultas/consultas').then(m => m.ConsultasComponent)
      },
      {
        path: 'consultas/:id/editar',
        canActivate: [staffGuard],
        loadComponent: () =>
          import('./pages/consultas/mconsulta/mconsulta').then(m => m.MconsultaComponent)
      },

      // tratamientos
      {
        path: 'tratamientos',
        canActivate: [staffGuard],
        loadComponent: () =>
          import('./pages/tratamientos/tratamientos').then(m => m.TratamientosComponent)
      },

      // historial
      {
        path: 'historial',
        loadComponent: () =>
          import('./pages/historial/historial').then(m => m.HistorialComponent)
      },

      // dashboard
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard').then(m => m.DashboardComponent)
      }
    ]
  },

  { path: '**', redirectTo: '' }
];
