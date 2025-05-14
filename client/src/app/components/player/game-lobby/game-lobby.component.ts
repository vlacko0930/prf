import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { GameService } from '../../../services/game.service';
import { AuthService } from '../../../services/auth.service';
import { SocketService } from '../../../services/socket.service';
import { Game, Player } from '../../../models/game.model';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-game-lobby',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './game-lobby.component.html',
  styleUrls: ['./game-lobby.component.scss']
})
export class GameLobbyComponent implements OnInit, OnDestroy {
  game: Game | null = null;
  loading = true;
  error: string | null = null;
  joined = false;
  isHost = false;
  currentUserId = '';
  playerCount = 0;
  countdown: number | null = null;
  countdownInterval: any;
  errorMessage: string = '';
  joining: boolean = false;
  
  
  private isLoadingGame = false;
  private lastLoadTime = 0;
  private lastPlayerUpdate = 0;
  
  
  socketSubscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private gameService: GameService,
    private authService: AuthService,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user && user._id) {
        this.currentUserId = user._id;
      }
    });

    this.route.params.subscribe(params => {
      const gameId = params['id'];
      if (gameId) {
        
        this.socketService.joinGame(gameId);
        
        
        this.setupSocketListeners(gameId);
        
        
        this.loadGame(gameId);
      }
    });
  }

  ngOnDestroy(): void {
    
    this.socketSubscriptions.forEach(sub => sub.unsubscribe());
    
    
    if (this.game && this.game._id) {
      this.socketService.leaveGame(this.game._id);
    }
    
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  
  setupSocketListeners(gameId: string): void {
    
    const stateSubscription = this.socketService.onGameStateUpdated()
      .subscribe(data => {
        if (data && data.gameId === gameId) {
          
          
          if (data.status === 'active') {
            
            this.router.navigate(['/games/play', gameId]);
          } else if (data.updateType === 'playerJoined' || data.updateType === 'playerLeft') {
            
            
            const now = Date.now();
            if (now - this.lastPlayerUpdate > 2000) { 
              this.lastPlayerUpdate = now;
              this.loadGame(gameId);
            }
          } else if (data.game) {
            
            if (this.gameHasChanged(this.game, data.game)) {
              this.updateGameData(data.game);
            }
          }
        }
      });
      
    
    const playerJoinedSubscription = this.socketService.onPlayerJoined()
      .subscribe(data => {
        if (data && data.gameId === gameId) {
          
          const now = Date.now();
          if (now - this.lastPlayerUpdate > 2000) { 
            this.lastPlayerUpdate = now;
            this.loadGame(gameId);
          }
        }
      });
      
    this.socketSubscriptions.push(stateSubscription, playerJoinedSubscription);
  }

  loadGame(gameId: string): void {
    
    if (this.isLoadingGame) return;
    
    const now = Date.now();
    if (now - this.lastLoadTime < 1500) { 
      return;
    }
    
    this.isLoadingGame = true;
    this.lastLoadTime = now;
    
    this.loading = true;
    this.error = null;
    
    
    this.gameService.getGame(gameId).subscribe({
      next: (game) => {
        if (this.gameHasChanged(this.game, game)) {
          this.updateGameData(game);
        }
        this.loading = false;
        this.isLoadingGame = false;
      },
      error: (error) => {
        this.error = 'Hiba történt a játék adatainak betöltésekor.';
        this.loading = false;
        this.isLoadingGame = false;
        console.error('Game loading error:', error);
      }
    });
  }
  
  
  private gameHasChanged(oldGame: Game | null, newGame: Game): boolean {
    
    if (!oldGame) return true;
    
    
    if (oldGame.status !== newGame.status) return true;
    if (oldGame.players?.length !== newGame.players?.length) return true;
    if (oldGame.startTime !== newGame.startTime) return true;
    if (oldGame.endTime !== newGame.endTime) return true;
    
    
    return false;
  }
  
  updateGameData(game: Game): void {
    this.game = game;
    
    if (game.players && Array.isArray(game.players)) {
      
      
      let isPlayerJoined = false;
      
      if (typeof game.players[0] === 'string') {
        
        isPlayerJoined = game.players.some(playerId => playerId === this.currentUserId);
      } else {
        
        isPlayerJoined = game.players.some(player => {
          
          if (player && typeof player === 'object' && player.user) {
            return player.user._id === this.currentUserId;
          }
          
          return false;
        });
      }
      
      this.joined = isPlayerJoined;
      
      
      if (!isPlayerJoined && game.status === 'pending' && !this.joining) {
        this.autoJoinGame();
      }
      
      this.playerCount = game.players.length;
    }
    
    
    
    const hostId = typeof game.host === 'string'
      ? game.host
      : game.host?._id;
    
    
    this.isHost = this.currentUserId === hostId;
    
    
    if (game.startTime) {
      this.updateCountdown(new Date(game.startTime));
    }
  }

  
  autoJoinGame(): void {
    if (!this.game || !this.game._id) return;
    
    
    if (this.joining) return;
    this.joining = true;
    
    this.gameService.joinGame(this.game._id).subscribe({
      next: (game) => {
        this.joining = false;
        this.updateGameData(game);
        this.joined = true;
      },
      error: (error) => {
        this.joining = false;
        
        console.warn('Auto join game warning:', error);
      }
    });
  }

  joinGame(): void {
    if (!this.game || !this.game._id) return;
    
    
    if (this.joining) return;
    this.joining = true;
    
    this.gameService.joinGame(this.game._id).subscribe({
      next: (game) => {
        this.joining = false;
        this.updateGameData(game);
        this.joined = true;
        
        
        if (this.game && this.game._id) {
          this.socketService.updateGameState({
            gameId: this.game._id,
            updateType: 'playerJoined',
            playerId: this.currentUserId
          });
        }
      },
      error: (error) => {
        this.joining = false;
        this.errorMessage = 'Hiba történt a játékhoz való csatlakozás során: ' + 
          (error.error?.message || 'Ismeretlen hiba');
        console.error('Join game error:', error);
      }
    });
  }

  startGame(): void {
    if (!this.game || !this.game._id || !this.isHost) return;
    
    this.gameService.startGame(this.game._id).subscribe({
      next: (game) => {
        
        if (this.game && this.game._id) {
          this.socketService.updateGameState({
            gameId: this.game._id,
            updateType: 'gameStarted',
            status: 'active'
          });
        }
        
        this.router.navigate(['/games/play', this.game?._id]);
      },
      error: (error) => {
        this.errorMessage = 'Hiba történt a játék indításakor: ' + 
          (error.error?.message || 'Ismeretlen hiba');
        console.error('Start game error:', error);
      }
    });
  }

  updateCountdown(startTime: Date): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    const updateTime = () => {
      const now = new Date();
      const diff = startTime.getTime() - now.getTime();
      
      if (diff <= 0) {
        clearInterval(this.countdownInterval);
        this.countdown = 0;
        
        const currentTime = Date.now();
        if (currentTime - this.lastLoadTime > 2000) { 
          this.lastLoadTime = currentTime;
          if (this.game && this.game._id) {
            this.loadGame(this.game._id);
          }
        }
        return;
      }
      
      this.countdown = Math.floor(diff / 1000);
    };
    
    updateTime();
    
    this.countdownInterval = setInterval(updateTime, 2000);
  }

  formatCountdown(): string {
    if (this.countdown === null) return '';
    
    const minutes = Math.floor(this.countdown / 60);
    const seconds = this.countdown % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  goBack(): void {
    this.router.navigate(['/games']);
  }
}
