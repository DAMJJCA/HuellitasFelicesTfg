import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';

import { AuthService } from '../../auth/auth.service';
import { extraerMensajeError } from '../../core/http-error';
import { StatusMessageComponent } from '../../shared/status-message/status-message';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, StatusMessageComponent],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil {
  private authService = inject(AuthService);

  imagen = signal(this.authService.profileImage());
  errorMsg = signal('');
  successMsg = signal('');
  guardando = signal(false);

  get nombre(): string {
    return this.authService.userDisplayName();
  }

  get rol(): string {
    return this.authService.userRoleLabel();
  }

  get email(): string {
    return this.authService.currentUser()?.email || 'Sin email';
  }

  seleccionarImagen(event: Event): void {
    this.errorMsg.set('');
    this.successMsg.set('');

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.errorMsg.set('Selecciona una imagen válida.');
      return;
    }

    if (file.size > 1024 * 1024) {
      this.errorMsg.set('La imagen no puede superar 1 MB.');
      return;
    }

    this.guardando.set(true);
    this.authService.uploadProfileImage(file).subscribe({
      next: () => {
        this.guardando.set(false);
        this.imagen.set(this.authService.profileImage());
        this.successMsg.set('Imagen de perfil actualizada.');
      },
      error: () => this.guardarImagenLocalCompatible(file)
    });
  }

  quitarImagen(): void {
    this.errorMsg.set('');
    this.successMsg.set('');
    this.guardando.set(true);
    this.authService.clearProfileImage().subscribe({
      next: () => {
        this.guardando.set(false);
        this.imagen.set(this.authService.profileImage());
        this.successMsg.set('Imagen de perfil restablecida.');
      },
      error: err => {
        this.guardando.set(false);
        this.errorMsg.set(extraerMensajeError(err, 'No se pudo restablecer la imagen.'));
      }
    });
  }

  private guardarImagenLocalCompatible(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      this.authService.saveProfileImage(dataUrl).subscribe({
        next: () => {
          this.guardando.set(false);
          this.imagen.set(this.authService.profileImage());
          this.successMsg.set('Imagen guardada en el perfil. Configura Supabase Storage para guardar archivos reales.');
        },
        error: err => {
          this.guardando.set(false);
          this.errorMsg.set(extraerMensajeError(err, 'No se pudo guardar la imagen de perfil.'));
        }
      });
    };
    reader.onerror = () => {
      this.guardando.set(false);
      this.errorMsg.set('No se pudo leer la imagen.');
    };
    reader.readAsDataURL(file);
  }
}
