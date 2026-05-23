import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './empty-state.html'
})
export class EmptyStateComponent {
  @Input({ required: true }) title = '';
  @Input() description = '';
}
