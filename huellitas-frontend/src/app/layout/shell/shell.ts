import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from "../sidebar/sidebar";

@Component({
  selector: 'app-shell',
  standalone: true,
  templateUrl: './shell.html',
  imports: [RouterOutlet, SidebarComponent]
})
export class ShellComponent {
}
