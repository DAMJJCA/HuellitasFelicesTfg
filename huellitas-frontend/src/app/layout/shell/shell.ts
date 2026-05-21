import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GlobalSearchComponent } from '../global-search/global-search';
import { SidebarComponent } from '../sidebar/sidebar';

@Component({
  selector: 'app-shell',
  standalone: true,
  templateUrl: './shell.html',
  imports: [RouterOutlet, SidebarComponent, GlobalSearchComponent]
})
export class ShellComponent {}
