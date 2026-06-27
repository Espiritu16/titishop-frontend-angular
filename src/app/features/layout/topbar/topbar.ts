import { Component } from '@angular/core';
import { AuthService } from '../../../core/auth.service';
import { ThemeService } from '../../../core/theme.service';

@Component({
  selector: 'app-topbar',
  imports: [],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
})
export class Topbar {
  constructor(public auth: AuthService, public theme: ThemeService) {}

  toggleTheme(): void {
    this.theme.toggle();
  }
}
