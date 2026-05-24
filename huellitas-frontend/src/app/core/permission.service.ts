import { Injectable } from '@angular/core';
import { AuthService } from '../auth/auth.service';

export type ClinicPermission =
  | 'manageUsers'
  | 'manageClients'
  | 'managePets'
  | 'manageAppointments'
  | 'changeAppointmentStatus'
  | 'manageConsultations'
  | 'manageTreatments'
  | 'manageDocuments'
  | 'managePreventives'
  | 'manageAvailability'
  | 'viewAudit'
  | 'manageInvoices'
  | 'viewDashboard';

const PERMISSION_MATRIX: Record<string, ClinicPermission[]> = {
  admin: [
    'manageUsers',
    'manageClients',
    'managePets',
    'manageAppointments',
    'changeAppointmentStatus',
    'manageConsultations',
    'manageTreatments',
    'manageDocuments',
    'managePreventives',
    'manageAvailability',
    'viewAudit',
    'manageInvoices',
    'viewDashboard'
  ],
  recepcion: [
    'manageClients',
    'managePets',
    'manageAppointments',
    'changeAppointmentStatus',
    'manageAvailability',
    'viewAudit',
    'manageInvoices',
    'viewDashboard'
  ],
  veterinario: [
    'changeAppointmentStatus',
    'manageConsultations',
    'manageTreatments',
    'manageDocuments',
    'managePreventives',
    'viewDashboard'
  ],
  auxiliar: ['manageDocuments', 'managePreventives', 'viewDashboard'],
  cliente: ['manageAppointments', 'viewDashboard']
};

@Injectable({ providedIn: 'root' })
export class PermissionService {
  constructor(private authService: AuthService) {}

  has(permission: ClinicPermission): boolean {
    const role = this.authService.currentUser()?.rol?.toLowerCase() || '';
    return PERMISSION_MATRIX[role]?.includes(permission) ?? false;
  }

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
    return this.has('manageAppointments');
  }

  get canCreateConsulta(): boolean {
    return this.has('manageConsultations');
  }

  get canManageClinicalDocuments(): boolean {
    return this.has('manageDocuments');
  }

  get canViewAudit(): boolean {
    return this.has('viewAudit');
  }

  get canManageClients(): boolean {
    return this.has('manageClients');
  }

  get canManagePreventives(): boolean {
    return this.has('managePreventives');
  }

  get canManageInvoices(): boolean {
    return this.has('manageInvoices');
  }

  get canManageUsers(): boolean {
    return this.has('manageUsers');
  }
}
