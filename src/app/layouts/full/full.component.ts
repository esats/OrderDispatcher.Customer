import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-full',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './full.component.html',
  styleUrl: './full.component.css',
})
export class FullComponent {}
