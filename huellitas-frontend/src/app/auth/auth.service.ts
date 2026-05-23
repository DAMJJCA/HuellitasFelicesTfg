import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_BASE_URL } from '../core/api.config';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterClienteRequest {
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  direccion: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  type: string;
  email: string;
  nombreUsuario: string;
  rol: string;
}

const TOKEN_KEY = 'huellitas_token';
const USER_KEY = 'huellitas_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = `${API_BASE_URL}/auth`;

  constructor(private http: HttpClient) {}

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.api}/login`, payload).pipe(
      tap(response => this.persistSession(response))
    );
  }

  registerCliente(payload: RegisterClienteRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.api}/register-cliente`, payload).pipe(
      tap(response => this.persistSession(response))
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  isAuthenticated(): boolean {
    return typeof window !== 'undefined' && !!localStorage.getItem(TOKEN_KEY);
  }

  token(): string | null {
    return typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  }

  currentUser(): LoginResponse | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) as LoginResponse : null;
  }

  userDisplayName(): string {
    return this.currentUser()?.nombreUsuario || 'Administrador';
  }

  userRoleLabel(): string {
    const role = this.currentUser()?.rol;
    return role ? `Rol: ${role}` : 'Sin sesion';
  }

  hasRole(role: string): boolean {
    const currentRole = this.currentUser()?.rol;
    return !!currentRole && currentRole.toLowerCase() === role.toLowerCase();
  }

  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  isCliente(): boolean {
    return this.hasRole('cliente');
  }

  isVeterinario(): boolean {
    return this.hasRole('veterinario');
  }

  private persistSession(response: LoginResponse): void {
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response));
  }
}
