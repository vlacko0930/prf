import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';
import { User, UserRole } from '../models/user.model';
import { environment } from '../../environments/environment';


interface AuthResponse {
  _id: string;
  username: string;
  email: string;
  role: UserRole;
  score: number;
  games: string[];
  token: string;
}


interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();
  
  constructor(private http: HttpClient) { 
    this.loadUserFromStorage();
  }
  
  
  checkAuthStatus(): void {
    const token = this.getToken();
    if (token) {
      this.isLoggedInSubject.next(true);
      
      
      if (!this.getCurrentUser()) {
        this.getProfile().subscribe({
          next: (user) => {
            
            const authUser: User = {
              ...user,
              name: user.username 
            };
            localStorage.setItem('user', JSON.stringify(authUser));
            this.currentUserSubject.next(authUser);
          },
          error: () => {
            
            this.logout();
          }
        });
      }
    } else {
      this.isLoggedInSubject.next(false);
    }
  }
  
  
  login(data: LoginData): Observable<AuthResponse>;
  login(email: string, password: string): Observable<AuthResponse>;
  login(emailOrData: string | LoginData, password?: string): Observable<AuthResponse> {
    let loginData: { email: string, password: string };
    
    if (typeof emailOrData === 'string' && password) {
      loginData = { email: emailOrData, password };
    } else {
      loginData = emailOrData as LoginData;
    }
    
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, loginData)
      .pipe(
        tap(response => {
          this.setSession(response);
          this.isLoggedInSubject.next(true);
        })
      );
  }
  
  
  register(data: RegisterData): Observable<AuthResponse>;
  register(username: string, email: string, password: string): Observable<AuthResponse>;
  register(usernameOrData: string | RegisterData, email?: string, password?: string): Observable<AuthResponse> {
    let registerData: { username: string, email: string, password: string };
    
    if (typeof usernameOrData === 'string' && email && password) {
      registerData = { username: usernameOrData, email, password };
    } else {
      registerData = usernameOrData as RegisterData;
    }
    
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, registerData)
      .pipe(
        tap(response => {
          this.setSession(response);
          this.isLoggedInSubject.next(true);
        })
      );
  }
  
  
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.isLoggedInSubject.next(false);
  }
  
  
  getToken(): string | null {
    return localStorage.getItem('token');
  }
  
  
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
  
  
  isLoggedIn(): boolean {
    return !!this.getToken();
  }
  
  
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return !!user && user.role === UserRole.ADMIN;
  }
  
  
  isPlayer(): boolean {
    const user = this.getCurrentUser();
    return !!user && user.role === UserRole.PLAYER;
  }
  
  
  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/profile`);
  }
  
  
  hasRole(role: UserRole): boolean {
    const user = this.getCurrentUser();
    return !!user && user.role === role;
  }
  
  
  private setSession(authResult: AuthResponse): void {
    localStorage.setItem('token', authResult.token);
    
    const user: User = {
      _id: authResult._id,
      username: authResult.username,
      name: authResult.username, 
      email: authResult.email,
      role: authResult.role,
      score: authResult.score,
      games: authResult.games || []
    };
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }
  
  
  private loadUserFromStorage(): void {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    
    if (token && userJson) {
      try {
        const user = JSON.parse(userJson);
        this.currentUserSubject.next(user);
        this.isLoggedInSubject.next(true);
      } catch (error) {
        console.error('Hiba a felhasználói adatok betöltése során:', error);
        this.logout(); 
      }
    }
  }
}