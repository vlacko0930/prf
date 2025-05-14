import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { GameService } from '../../../services/game.service';
import { AuthService } from '../../../services/auth.service';
import { Game } from '../../../models/game.model';

@Component({
  selector: 'app-game-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './game-list.component.html',
  styleUrls: ['./game-list.component.scss']
})
export class GameListComponent implements OnInit {
  games: Game[] = [];
  filteredGames: Game[] = [];
  loading = true;
  error = '';
  searchTerm = '';
  activeFilters = {
    status: 'all'
  };
  
  currentUserId = '';

  constructor(
    private gameService: GameService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user && user._id) {
        this.currentUserId = user._id;
      }
    });
    
    this.loadGames();
  }

  loadGames(): void {
    this.loading = true;
    this.error = '';

    this.gameService.getGames().subscribe({
      next: (games) => {
        this.games = games;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Hiba történt a játékok betöltése közben.';
        this.loading = false;
        console.error('Game loading error:', error);
      }
    });
  }

  onSearch(): void {
    this.applyFilters();
  }

  onFilterChange(filterType: string, value: string): void {
    if (filterType === 'status') {
      this.activeFilters.status = value;
    }
    
    this.applyFilters();
  }

  applyFilters(): void {
    let result = [...this.games];

    
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      result = result.filter(game => {
        const titleMatch = game.title && game.title.toLowerCase().includes(searchLower);
        const quizTitleMatch = game.quiz && typeof game.quiz !== 'string' && 
                              game.quiz.title && game.quiz.title.toLowerCase().includes(searchLower);
        return titleMatch || quizTitleMatch;
      });
    }

    
    if (this.activeFilters.status !== 'all') {
      result = result.filter(game => game.status === this.activeFilters.status);
    }

    this.filteredGames = result;
  }

  onJoinGame(game: Game): void {
    if (game.status === 'completed') {
      this.router.navigate(['/games/results', game._id]);
    } else if (game.status === 'active') {
      this.router.navigate(['/games/play', game._id]);
    } else {
      this.router.navigate(['/games/join', game._id]);
    }
  }

  canJoinGame(game: Game): boolean {
    if (game.status === 'completed') {
      return true; 
    }
    
    if (game.status === 'active') {
      
      return game.players && game.players.some(player => player === this.currentUserId);
    }
    
    return game.status === 'pending';
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'all':
        return 'Mind';
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

  getStatusClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'bg-warning';
      case 'active':
        return 'bg-success';
      case 'completed':
        return 'bg-info';
      default:
        return 'bg-secondary';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'bg-warning text-dark';
      case 'active':
        return 'bg-success';
      case 'completed':
        return 'bg-info';
      default:
        return 'bg-secondary';
    }
  }

  getActionText(status: string): string {
    switch (status) {
      case 'pending':
        return 'Csatlakozás';
      case 'active':
        
        const activeGame = this.games.find(g => g.status === 'active' && 
          g.players && g.players.some(p => 
            typeof p === 'object' && p.user && p.user._id === this.currentUserId && p.isCompleted
          ));
          
        if (activeGame) {
          return 'Eredmények';
        }
        return 'Folytatás';
      case 'completed':
        return 'Eredmények';
      default:
        return 'Részletek';
    }
  }

  getActionIcon(status: string): string {
    switch (status) {
      case 'pending':
        return 'bi bi-play-fill';
      case 'active':
        return 'bi bi-controller';
      case 'completed':
        return 'bi bi-trophy';
      default:
        return 'bi bi-info-circle';
    }
  }
}
