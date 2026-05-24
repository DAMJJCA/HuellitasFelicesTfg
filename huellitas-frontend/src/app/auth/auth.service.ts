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
  profileImageUrl?: string | null;
}

export interface ProfileResponse {
  email: string;
  nombreUsuario: string;
  rol: string;
  profileImageUrl?: string | null;
}

const TOKEN_KEY = 'huellitas_token';
const USER_KEY = 'huellitas_user';
const PROFILE_IMAGE_KEY = 'huellitas_profile_image';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = `${API_BASE_URL}/auth`;
  private readonly perfilApi = `${API_BASE_URL}/perfil`;

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
    localStorage.removeItem(PROFILE_IMAGE_KEY);
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
    return role ? `Rol: ${role}` : 'Sin sesión';
  }

  profileImage(): string {
    if (typeof window === 'undefined') return 'assets/imgperfil/perfil.jpg';
    return this.currentUser()?.profileImageUrl || localStorage.getItem(PROFILE_IMAGE_KEY) || 'assets/imgperfil/perfil.jpg';
  }

  saveProfileImage(dataUrl: string): Observable<ProfileResponse> {
    localStorage.setItem(PROFILE_IMAGE_KEY, dataUrl);
    return this.http.put<ProfileResponse>(`${this.perfilApi}/imagen`, { profileImageUrl: dataUrl }).pipe(
      tap(profile => this.mergeCurrentUser(profile))
    );
  }

  uploadProfileImage(file: File): Observable<ProfileResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ProfileResponse>(`${this.perfilApi}/imagen/archivo`, formData).pipe(
      tap(profile => {
        localStorage.removeItem(PROFILE_IMAGE_KEY);
        this.mergeCurrentUser(profile);
      })
    );
  }

  clearProfileImage(): Observable<ProfileResponse> {
    localStorage.removeItem(PROFILE_IMAGE_KEY);
    return this.http.delete<ProfileResponse>(`${this.perfilApi}/imagen`).pipe(
      tap(profile => this.mergeCurrentUser(profile))
    );
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

  isRecepcion(): boolean {
    return this.hasRole('recepcion');
  }

  isAuxiliar(): boolean {
    return this.hasRole('auxiliar');
  }

  isAdminOrRecepcion(): boolean {
    return this.isAdmin() || this.isRecepcion();
  }

  isClinicalStaff(): boolean {
    return this.isAdmin() || this.isVeterinario() || this.isAuxiliar();
  }

  isStaff(): boolean {
    return this.isAdmin() || this.isVeterinario() || this.isRecepcion() || this.isAuxiliar();
  }

  private persistSession(response: LoginResponse): void {
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response));
  }

  private mergeCurrentUser(profile: Partial<LoginResponse>): void {
    const current = this.currentUser();
    if (!current) return;
    localStorage.setItem(USER_KEY, JSON.stringify({ ...current, ...profile }));
  }
}
