import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
  currentYear: number = 0;
  isLoggedIn = false;
  isAdmin = false;
  user: User | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.currentYear = new Date().getFullYear();
    
    this.authService.isLoggedIn$.subscribe(isLoggedIn => {
      this.isLoggedIn = isLoggedIn;
    });

    this.authService.currentUser$.subscribe(user => {
      this.user = user;
      this.isAdmin = user?.role === 'admin';
    });
  }
}