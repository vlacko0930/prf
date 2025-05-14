import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  loading: boolean = true;
  updating: boolean = false;
  error: string = '';
  success: string = '';
  newPassword: string = '';
  confirmPassword: string = '';

  constructor(
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.loading = true;
    this.authService.getProfile().subscribe({
      next: (user) => {
        this.user = user;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Hiba történt a profil betöltésekor.';
        this.loading = false;
        console.error('Profil betöltési hiba:', error);
      }
    });
  }

  onSubmit(form: NgForm): void {
    if (form.invalid || (this.newPassword && this.newPassword !== this.confirmPassword)) {
      return;
    }

    if (!this.user || !this.user._id) {
      this.error = 'Nincs érvényes felhasználói profil.';
      return;
    }

    this.updating = true;
    this.error = '';
    this.success = '';

    
    const updatedUser: Partial<User> = {
      username: this.user.username,
      email: this.user.email
    };

    
    if (this.newPassword) {
      updatedUser.password = this.newPassword;
    }

    this.userService.updateUser(this.user._id, updatedUser).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.success = 'A profil adatok sikeresen frissítve!';
        this.updating = false;
        this.newPassword = '';
        this.confirmPassword = '';
      },
      error: (error) => {
        this.error = error?.error?.message || 'Hiba történt a profil frissítésekor.';
        this.updating = false;
        console.error('Profil frissítési hiba:', error);
      }
    });
  }

  getGameStatusText(status: string): string {
    switch (status) {
      case 'pending':
        return 'Függőben';
      case 'active':
        return 'Aktív';
      case 'completed':
        return 'Befejezett';
      default:
        return status;
    }
  }

  getGameScore(game: any): string {
    if (!game.results || !game.results.length) {
      return 'Nincs eredmény';
    }

    const currentUserId = this.user?._id;
    const userResult = game.results.find((result: any) => 
      result.player === currentUserId || result.player?._id === currentUserId
    );

    return userResult ? `${userResult.score} pont` : 'Nincs eredmény';
  }
}