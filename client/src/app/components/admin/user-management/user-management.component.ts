import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { User, UserRole } from '../../../models/user.model';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss'
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  searchTerm: string = '';
  isLoading = false;
  error: string | null = null;
  
  selectedUser: User | null = null;
  
  constructor(private userService: UserService) {}
  
  ngOnInit(): void {
    this.loadUsers();
  }
  
  loadUsers(): void {
    this.isLoading = true;
    this.error = null;
    
    this.userService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.filteredUsers = [...this.users];
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Hiba történt a felhasználók betöltése során';
        this.isLoading = false;
        console.error(err);
      }
    });
  }
  
  filterUsers(): void {
    if (!this.searchTerm.trim()) {
      this.filteredUsers = [...this.users];
      return;
    }
    
    const term = this.searchTerm.toLowerCase().trim();
    this.filteredUsers = this.users.filter(user => 
      user.username?.toLowerCase().includes(term) || 
      user.email?.toLowerCase().includes(term)
    );
  }
  
  selectUser(user: User): void {
    this.selectedUser = user;
  }
  
  clearSelection(): void {
    this.selectedUser = null;
  }
  
  toggleAdminRole(user: User): void {
    
    const newRole = user.role === UserRole.ADMIN ? UserRole.PLAYER : UserRole.ADMIN;
    
    const updatedUser = { ...user, role: newRole };
    
    if (user._id) {
      this.userService.updateUser(user._id, updatedUser).subscribe({
        next: (updated) => {
          const index = this.users.findIndex(u => u._id === updated._id);
          if (index !== -1) {
            this.users[index] = updated;
            this.filterUsers();
            
            if (this.selectedUser && this.selectedUser._id === updated._id) {
              this.selectedUser = updated;
            }
          }
        },
        error: (err) => {
          console.error('Hiba a felhasználó szerepkörének módosításakor', err);
        }
      });
    }
  }
  
  deleteUser(user: User): void {
    if (confirm(`Biztosan törölni szeretné ${user.username} felhasználót?`)) {
      if (user._id) {
        this.userService.deleteUser(user._id).subscribe({
          next: () => {
            this.users = this.users.filter(u => u._id !== user._id);
            this.filteredUsers = this.filteredUsers.filter(u => u._id !== user._id);
            
            if (this.selectedUser && this.selectedUser._id === user._id) {
              this.selectedUser = null;
            }
          },
          error: (err) => {
            console.error('Hiba a felhasználó törlésekor', err);
          }
        });
      }
    }
  }

  isAdmin(user: User): boolean {
    return user.role === UserRole.ADMIN;
  }
}
