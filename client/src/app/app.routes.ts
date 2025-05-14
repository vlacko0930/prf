import { Routes } from '@angular/router';
import { HomeComponent } from './components/shared/home/home.component';
import { NotFoundComponent } from './components/shared/not-found/not-found.component';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { ProfileComponent } from './components/auth/profile/profile.component';
import { LeaderboardComponent } from './components/shared/leaderboard/leaderboard.component';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { PlayerGuard } from './guards/player.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'leaderboard', component: LeaderboardComponent },
  
  
  {
    path: 'admin',
    loadChildren: () => import('./components/admin/admin.routes').then(m => m.ADMIN_ROUTES),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'games',
    loadChildren: () => import('./components/player/player.routes').then(m => m.PLAYER_ROUTES),
    canActivate: [AuthGuard, PlayerGuard]
  },
  
  
  { path: '**', component: NotFoundComponent }
];
