import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  registerData = {
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  };
  
  loading = false;
  error = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(form: NgForm): void {
    if (form.invalid || this.registerData.password !== this.registerData.confirmPassword) {
      return;
    }

    this.loading = true;
    this.error = '';

    const { username, email, password } = this.registerData;

    this.authService.register({ username, email, password }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/login'], { 
          queryParams: { 
            registered: 'success' 
          } 
        });
      },
      error: (error) => {
        this.loading = false;
        this.error = error?.error?.message || 'Regisztrációs hiba történt. Kérjük, próbáld újra.';
        console.error('Registration error:', error);
      }
    });
  }
}