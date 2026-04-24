import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-registro',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './registro.html',
})
export class RegistroComponent {
    nombre = '';
    apellidos = '';
    email = '';
    telefono = '';
    direccion = '';
    password = '';
    repetirPassword = '';
    isSubmitting = false;
    errorMessage = '';
    successMessage = '';

    constructor(
        private readonly authService: AuthService,
        private readonly router: Router
    ) {}

    crearCuenta() {
        this.errorMessage = '';
        this.successMessage = '';

        const nombre = this.nombre.trim();
        const apellidos = this.apellidos.trim();
        const email = this.email.trim().toLowerCase();
        const telefono = this.telefono.trim();
        const direccion = this.direccion.trim();

        if (!nombre || !apellidos || !email || !telefono || !this.password) {
            this.errorMessage = 'Completa los campos obligatorios.';
            return;
        }

        if (this.password.length < 6) {
            this.errorMessage = 'La contrasena debe tener al menos 6 caracteres.';
            return;
        }

        if (this.password !== this.repetirPassword) {
            this.errorMessage = 'Las contrasenas no coinciden.';
            return;
        }

        this.isSubmitting = true;

        this.authService.registerCliente({
            nombre,
            apellidos,
            email,
            telefono,
            direccion,
            password: this.password
        }).subscribe({
            next: () => {
                this.isSubmitting = false;
                this.successMessage = 'Cuenta creada correctamente. Redirigiendo...';
                setTimeout(() => void this.router.navigate(['/dashboard']), 600);
            },
            error: (error: HttpErrorResponse) => {
                this.isSubmitting = false;
                this.errorMessage = this.resolveError(error);
            }
        });
    }

    private resolveError(error: HttpErrorResponse): string {
        if (typeof error.error === 'string' && error.error.trim().length > 0) {
            return error.error;
        }

        if (error.status === 0) {
            return 'No se pudo conectar con el servidor.';
        }

        return 'No se pudo completar el registro.';
    }
}
