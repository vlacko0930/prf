import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginData = {
    email: '',
    password: ''
  };
  
  loading = false;
  error = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(form: NgForm): void {
    if (form.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.login(this.loginData).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/profile']);
      },
      error: (error) => {
        this.loading = false;
        this.error = error?.error?.message || 'Bejelentkezési hiba történt. Kérjük, ellenőrizd az adataid.';
        console.error('Login error:', error);
      }
    });
  }
}