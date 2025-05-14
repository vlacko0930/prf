import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { GameService } from '../../../services/game.service';
import { Game, GameStatus } from '../../../models/game.model';
import { Observable, catchError, of } from 'rxjs';

@Component({
  selector: 'app-game-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-results.component.html',
  styleUrl: './game-results.component.scss'
})
export class GameResultsComponent implements OnInit {
  gameId: string = '';
  game: Game | null = null;
  results: any[] = [];
  loading: boolean = true;
  error: string | null = null;
  GameStatus = GameStatus;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private gameService: GameService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.gameId = id;
        this.loadGameDetails();
        this.loadGameResults();
      } else {
        this.error = 'Játék azonosító hiányzik';
        this.loading = false;
      }
    });
  }

  loadGameDetails(): void {
    this.gameService.getGameById(this.gameId).pipe(
      catchError(err => {
        this.error = 'Hiba történt a játék betöltésekor: ' + (err.error?.message || err.message);
        this.loading = false;
        return of(null);
      })
    ).subscribe(game => {
      if (game) {
        this.game = game;
        this.loading = false;
      }
    });
  }

  loadGameResults(): void {
    this.gameService.getGameResults(this.gameId).pipe(
      catchError(err => {
        this.error = 'Hiba történt az eredmények betöltésekor: ' + (err.error?.message || err.message);
        this.loading = false;
        return of([]);
      })
    ).subscribe(results => {
      this.results = results;
      this.loading = false;
    });
  }

  getCorrectAnswersCount(result: any): number {
    if (!result || !result.answers || !Array.isArray(result.answers)) {
      return 0;
    }
    
    return result.answers.filter((answer: any) => answer.isCorrect).length;
  }

  backToLobby(): void {
    if (this.game) {
      this.router.navigate(['/player/game-lobby', this.gameId]);
    } else {
      this.router.navigate(['/player/game-list']);
    }
  }

  goToGameList(): void {
    this.router.navigate(['/games']);
  }
}
