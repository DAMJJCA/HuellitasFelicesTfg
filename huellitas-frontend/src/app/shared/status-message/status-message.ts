import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-status-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-message.html'
})
export class StatusMessageComponent {
  @Input() type: 'error' | 'success' | 'info' = 'info';
  @Input() message = '';
}
