import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-form-field-error',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form-field-error.html'
})
export class FormFieldErrorComponent {
  @Input() control: AbstractControl | null = null;
  @Input() label = 'El campo';

  get message(): string {
    const control = this.control;
    if (!control || !control.touched || !control.errors) return '';
    if (control.errors['required']) return `${this.label} es obligatorio.`;
    if (control.errors['minlength']) return `${this.label} es demasiado corto.`;
    if (control.errors['maxlength']) return `${this.label} supera la longitud permitida.`;
    if (control.errors['email']) return `${this.label} no tiene un formato valido.`;
    return `${this.label} no es valido.`;
  }
}
