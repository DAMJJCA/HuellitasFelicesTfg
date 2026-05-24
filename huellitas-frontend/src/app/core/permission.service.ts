import { Injectable } from '@angular/core';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  constructor(private authService: AuthService) {}

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  get isCliente(): boolean {
    return this.authService.isCliente();
  }

  get isVeterinario(): boolean {
    return this.authService.isVeterinario();
  }

  get isRecepcion(): boolean {
    return this.authService.isRecepcion();
  }

  get isAuxiliar(): boolean {
    return this.authService.isAuxiliar();
  }

  get isStaff(): boolean {
    return this.authService.isStaff();
  }

  get canManageCitas(): boolean {
    return this.isAdmin || this.isRecepcion || this.isCliente;
  }

  get canCreateConsulta(): boolean {
    return this.isAdmin || this.isVeterinario;
  }

  get canManageClinicalDocuments(): boolean {
    return this.isAdmin || this.isVeterinario || this.isAuxiliar;
  }

  get canViewAudit(): boolean {
    return this.isAdmin || this.isRecepcion;
  }

  get canManageClients(): boolean {
    return this.isAdmin || this.isRecepcion;
  }

  get canManagePreventives(): boolean {
    return this.isAdmin || this.isVeterinario || this.isAuxiliar;
  }
}
