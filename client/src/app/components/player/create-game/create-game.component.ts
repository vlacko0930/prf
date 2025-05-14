import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { QuizService } from '../../../services/quiz.service';
import { GameService } from '../../../services/game.service';
import { Quiz } from '../../../models/quiz.model';

interface GameData {
  title: string;
  quizId: string | null;
  maxPlayers: number;
  timeLimit: number;
  startTime?: string;
  endTime?: string;
  useCustomTimes?: boolean;
}

@Component({
  selector: 'app-create-game',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-game.component.html',
  styleUrls: ['./create-game.component.scss']
})
export class CreateGameComponent implements OnInit {
  gameData: GameData = {
    title: '',
    quizId: null,
    maxPlayers: 10,
    timeLimit: 30,
    startTime: '',
    endTime: '',
    useCustomTimes: false
  };
  
  
  minStartTime: string = '';
  
  quizzes: Quiz[] = [];
  loading = true;
  creating = false;
  error = '';

  constructor(
    private quizService: QuizService,
    private gameService: GameService,
    private router: Router
  ) {
    
    const now = new Date();
    
    
    this.minStartTime = this.formatDateForInput(now);
    
    
    const startTime = new Date(now);
    startTime.setHours(startTime.getHours() + 1);
    startTime.setMinutes(0, 0, 0);
    this.gameData.startTime = this.formatDateForInput(startTime);
    
    
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 2);
    this.gameData.endTime = this.formatDateForInput(endTime);
  }

  ngOnInit(): void {
    this.loadQuizzes();
  }

  
  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  loadQuizzes(): void {
    this.loading = true;
    this.error = '';

    this.quizService.getQuizzes().subscribe({
      next: (quizzes) => {
        this.quizzes = quizzes;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Hiba történt a kvízek betöltése közben.';
        this.loading = false;
        console.error('Quiz loading error:', error);
      }
    });
  }

  onSubmit(form: NgForm): void {
    if (form.invalid) {
      return;
    }
    
    this.creating = true;
    this.error = '';
    
    
    const gameToCreate = {
      title: this.gameData.title,
      quizId: this.gameData.quizId, 
      maxPlayers: this.gameData.maxPlayers,
      timeLimit: this.gameData.timeLimit,
      startTime: this.gameData.useCustomTimes && this.gameData.startTime ? new Date(this.gameData.startTime) : undefined,
      endTime: this.gameData.useCustomTimes && this.gameData.endTime ? new Date(this.gameData.endTime) : undefined
    };
    
    this.gameService.createGame(gameToCreate).subscribe({
      next: (createdGame) => {
        this.creating = false;
        
        this.router.navigate(['/games/join', createdGame._id]);
      },
      error: (error) => {
        this.creating = false;
        this.error = 'Hiba történt a játék létrehozása közben: ' + (error.error?.message || error.message || 'Ismeretlen hiba');
        console.error('Game creation error:', error);
      }
    });
  }

  
  onStartTimeChange(): void {
    if (!this.gameData.startTime) {
      return;
    }
    
    const startDate = new Date(this.gameData.startTime);
    const endDate = new Date(this.gameData.endTime || '');
    
    
    if (!this.gameData.endTime || endDate <= startDate) {
      const newEndDate = new Date(startDate);
      newEndDate.setHours(newEndDate.getHours() + 2); 
      this.gameData.endTime = this.formatDateForInput(newEndDate);
    }
  }
}
