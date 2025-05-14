import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';
import { UserRole } from '../models/user.model';

export const AdminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  if (authService.isLoggedIn() && authService.hasRole(UserRole.ADMIN)) {
    return true;
  }

  
  router.navigate(['/']);
  return false;
};