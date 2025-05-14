import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_URL = 'http://localhost:3000/api/users';

  constructor(private http: HttpClient) { }

  
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.API_URL);
  }

  
  getLeaderboard(limit: number = 10): Observable<User[]> {
    return this.http.get<User[]>(`${this.API_URL}/leaderboard?limit=${limit}`);
  }

  
  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/${id}`);
  }

  
  updateUser(id: string, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.API_URL}/${id}`, user);
  }

  
  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`);
  }

  
  changeUserRole(id: string, role: string): Observable<User> {
    return this.http.patch<User>(`${this.API_URL}/${id}/role`, { role });
  }
}