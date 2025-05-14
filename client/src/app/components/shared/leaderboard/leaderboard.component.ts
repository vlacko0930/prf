import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss']
})
export class LeaderboardComponent implements OnInit {
  users: User[] = [];
  loading = true;
  error = '';
  currentUser: User | null = null;

  constructor(
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    this.loadLeaderboard();
  }

  loadLeaderboard(): void {
    this.loading = true;
    this.error = '';

    this.userService.getLeaderboard().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Hiba történt a ranglista betöltése közben.';
        this.loading = false;
        console.error('Leaderboard error:', error);
      }
    });
  }

  isCurrentUser(user: User): boolean {
    return this.currentUser?._id === user._id;
  }
}