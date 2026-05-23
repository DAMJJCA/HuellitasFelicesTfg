import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './page-header.html'
})
export class PageHeaderComponent {
  @Input({ required: true }) title = '';
  @Input() description = '';
}
