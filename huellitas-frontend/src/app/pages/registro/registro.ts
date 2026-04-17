import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-registro',
    standalone: true,
    imports: [RouterModule, FormsModule],
    templateUrl: './registro.html',
})
export class RegistroComponent {
    nombre = '';
    apellidos = '';
    email = '';
    telefono = '';
    password = '';
    repetirPassword = '';

    crearCuenta() {
        alert('Registro pendiente de conectar con backend y base de datos.');
    }
}