import { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell/shell';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      //clientes
      {
        path: 'clientes/nuevo',
        loadComponent: () =>
          import('./pages/clientes/nvcliente/nvcliente').then(m => m.NvClienteComponent)
      },
      {
        path: 'clientes/:id/editar',
        loadComponent: () =>
          import('./pages/clientes/mcliente/mcliente').then(m => m.MClienteComponent)
      },

      {
        path: 'clientes',
        loadComponent: () =>
          import('./pages/clientes/clientes').then(m => m.ClientesComponent)
      },
      //mascotas
      {
        path: 'mascotas',
        loadComponent: () =>
          import('./pages/mascotas/mascotas').then(m => m.MascotasComponent)
      },
      {
        path: 'mascotas/nueva',
        loadComponent: () =>
          import('./pages/mascotas/nvmascota/nvmascota').then(m => m.NvmascotaComponent)
      },
      {
        path: 'mascotas/:id/editar',
        loadComponent: () =>
          import('./pages/mascotas/mmascota/mmascota').then(m => m.MmascotaComponent)
      },
      //veterinarios
      {
        path: 'veterinarios',
        loadComponent: () =>
          import('./pages/veterinarios/veterinarios').then(m => m.VeterinariosComponent)
      },
      {
        path: 'veterinarios/nuevo',
        loadComponent: () =>
          import('./pages/veterinarios/nvveterinario/nvveterinario').then(m => m.NvVeterinarioComponent)
      },
      {
        path: 'veterinarios/:id/editar',
        loadComponent: () =>
          import('./pages/veterinarios/mveterinario/mveterinario').then(m => m.MveterinarioComponent)
      },
      //citas
      {
        path: 'citas',
        loadComponent: () =>
          import('./pages/citas/citas').then(m => m.CitasComponent)
      },
      {
        path: 'citas/crear',
        loadComponent: () =>
          import('./pages/citas/nvcita/nvcita').then(m => m.NvcitaComponent
          )
      },
      {
        path: 'citas/:id/editar',
        loadComponent: () =>
          import('./pages/citas/mcita/mcita').then(m => m.McitaComponent)
      },
      //consultas
      {
        path: 'consultas',
        loadComponent: () =>
          import('./pages/consultas/consultas').then(m => m.ConsultasComponent)
      },
      {
        path: 'consultas/:id/editar',
        loadComponent: () =>
          import('./pages/consultas/mconsulta/mconsulta').then(m => m.MconsultaComponent)
      },
      //tratamientos
      {
        path: 'tratamientos',
        loadComponent: () =>
<<<<<<< HEAD
          import('./pages/tratamientos/tratamientos').then(m => m.TratamientosComponent)
=======
          import('./pages/tratamientos/tratamientos')
            .then(m => m.TratamientosComponent)
      },
      //historial
      {
        path: 'historial',
        loadComponent: () =>
          import('./pages/historial/historial').then(m => m.HistorialComponent)
      },
      //dashboard
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard').then(m => m.DashboardComponent)
>>>>>>> Jorge
      },
      { path: '**', redirectTo: '' }
    ]
  }
];
