import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { GameService } from '../../../services/game.service';
import { AuthService } from '../../../services/auth.service';
import { QuizService } from '../../../services/quiz.service';
import { SocketService } from '../../../services/socket.service';
import { Game } from '../../../models/game.model';
import { Quiz } from '../../../models/quiz.model';
import { Question, Option } from '../../../models/question.model';
import { interval, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-game-play',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './game-play.component.html',
  styleUrls: ['./game-play.component.scss']
})
export class GamePlayComponent implements OnInit, OnDestroy {
  private readonly apiUrl = environment.apiUrl;
  game: Game | null = null;
  quiz: Quiz | null = null;
  questions: Question[] = [];
  currentQuestion: Question | null = null;
  currentQuestionIndex = 0;
  selectedAnswerIndex: number | null = null;
  loading = true;
  error: string | null = null;
  gameComplete = false;
  
  
  timeLeft = 0;
  maxTime = 30; 
  timerSubscription: Subscription | null = null;
  timePercentage = 100;
  
  
  startTime: Date | null = null;
  endTime: Date | null = null;
  gameTimeLeft: number | null = null;
  gameTimePercentage = 100;
  gameTimerSubscription: Subscription | null = null;
  
  
  currentUserId = '';
  totalScore = 0;
  correctAnswers = 0;
  
  
  showFeedback = false;
  isCorrectAnswer = false;
  feedbackMessage = '';
  earnedPoints = 0;

  
  socketSubscriptions: Subscription[] = [];

  
  private isSubmittingAnswer = false;
  private isLoadingGame = false;
  private lastJoinAttemptTime = 0;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private gameService: GameService,
    private quizService: QuizService,
    private authService: AuthService,
    private socketService: SocketService,
    private http: HttpClient
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
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
    
    if (this.gameTimerSubscription) {
      this.gameTimerSubscription.unsubscribe();
    }
    
    
    this.socketSubscriptions.forEach(sub => sub.unsubscribe());
    
    
    if (this.game && this.game._id) {
      this.socketService.leaveGame(this.game._id);
    }
  }

  
  setupSocketListeners(gameId: string): void {
    
    const stateSubscription = this.socketService.onGameStateUpdated()
      .subscribe(data => {
        if (data.gameId === gameId) {
          
          this.updateGameStateFromSocket(data);
        }
      });
      
    
    const answerSubscription = this.socketService.onAnswerSubmitted()
      .subscribe(data => {
        if (data.gameId === gameId) {
          
          this.updatePlayerAnswer(data);
        }
      });

    
    const timeSubscription = this.socketService.onGameTimeUpdated()
      .subscribe((data: {gameId: string, startTime?: string, endTime?: string}) => {
        if (data.gameId === gameId) {
          if (data.startTime) {
            this.startTime = new Date(data.startTime);
          }
          if (data.endTime) {
            this.endTime = new Date(data.endTime);
          }
          this.updateGameTimer();
        }
      });
      
    this.socketSubscriptions.push(stateSubscription, answerSubscription, timeSubscription);
  }

  
  updateGameStateFromSocket(data: any): void {
    if (data.status === 'completed') {
      this.gameComplete = true;
      
      setTimeout(() => {
        this.router.navigate(['/games/results', data.gameId]);
      }, 3000);
    }
    
    
    if (data.currentQuestionIndex !== undefined && 
        data.currentQuestionIndex !== this.currentQuestionIndex) {
      this.currentQuestionIndex = data.currentQuestionIndex;
      this.showNextQuestion();
    }

    
    if (data.startTime) {
      this.startTime = new Date(data.startTime);
    }
    if (data.endTime) {
      this.endTime = new Date(data.endTime);
    }
    this.updateGameTimer();
  }

  
  updatePlayerAnswer(data: any): void {
    
  }
  
  
  exitGame(): void {
    this.router.navigate(['/games']);
  }
  
  
  getProgressPercentage(): number {
    if (!this.questions || this.questions.length === 0) return 0;
    return ((this.currentQuestionIndex + 1) / this.questions.length) * 100;
  }
  
  
  formatGameTime(): string {
    if (this.gameTimeLeft === null) return '00:00';
    
    const minutes = Math.floor(this.gameTimeLeft / 60);
    const seconds = this.gameTimeLeft % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  
  getGameTimeBarClass(): string {
    if (this.gameTimePercentage > 50) return 'bg-success';
    if (this.gameTimePercentage > 20) return 'bg-warning';
    return 'bg-danger';
  }
  
  
  getTimeBarClass(): string {
    if (this.timePercentage > 50) return 'bg-success';
    if (this.timePercentage > 20) return 'bg-warning';
    return 'bg-danger';
  }
  
  
  selectAnswer(index: number): void {
    if (this.showFeedback) return; 
    this.selectedAnswerIndex = index;
  }
  
  
  submitAnswer(): void {
    
    if (this.isSubmittingAnswer || this.selectedAnswerIndex === null || !this.currentQuestion || !this.game) return;
    
    this.isSubmittingAnswer = true;
    
    const selectedOption = this.currentQuestion.options[this.selectedAnswerIndex];
    this.isCorrectAnswer = selectedOption.isCorrect;
    
    if (this.isCorrectAnswer) {
      this.earnedPoints = this.currentQuestion.points || 1;
      this.totalScore += this.earnedPoints;
      this.correctAnswers++;
      this.feedbackMessage = 'Helyes válasz! Gratulálunk!';
    } else {
      this.earnedPoints = 0;
      this.feedbackMessage = 'Sajnos helytelen válasz.';
    }
    
    this.showFeedback = true;
    
    
    if (this.game._id && this.currentQuestion._id) {
      
      this.sendAnswer(this.game._id, this.currentQuestion._id, this.selectedAnswerIndex);
    } else {
      
      console.error('Hiányzó játék ID vagy kérdés ID a válasz beküldéséhez');
      setTimeout(() => {
        this.isSubmittingAnswer = false;
        this.showNextQuestion();
      }, 3000);
    }
  }
  
  
  private sendAnswer(gameId: string, questionId: string, answerId: number): void {
    this.http.post(`${this.apiUrl}/games/${gameId}/submit`, {
      questionId: questionId,
      answerId: answerId
    }).subscribe({
      next: (response: any) => {
        console.log('Válasz sikeresen beküldve:', response);
        
        
        this.socketService.submitAnswer({
          gameId: gameId,
          questionId: questionId,
          answerId: answerId.toString(),
          isCorrect: this.isCorrectAnswer,
          points: this.earnedPoints
        });
      },
      error: (error) => {
        console.error('Hiba a válasz beküldésekor:', error);
      },
      complete: () => {
        
        
        setTimeout(() => {
          this.isSubmittingAnswer = false;  
          this.showNextQuestion();
        }, 3000);
      }
    });
  }
  
  
  showNextQuestion(): void {
    this.showFeedback = false;
    this.selectedAnswerIndex = null;
    
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      this.currentQuestion = this.questions[this.currentQuestionIndex];
      this.startQuestionTimer();
    } else {
      
      this.gameComplete = true;
      
      
      
      setTimeout(() => {
        if (this.game && this.game._id) {
          this.router.navigate(['/games/results', this.game._id]);
        }
      }, 3000);
    }
  }
  
  
  
  startQuestionTimer(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
    
    this.timeLeft = this.quiz?.timeLimit || this.maxTime;
    this.timePercentage = 100;
    
    this.timerSubscription = interval(1000).subscribe(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
        this.timePercentage = (this.timeLeft / (this.quiz?.timeLimit || this.maxTime)) * 100;
      } else {
        
        if (!this.showFeedback) {
          this.selectedAnswerIndex = null;
          this.submitAnswer();
        }
        
        this.timerSubscription?.unsubscribe();
      }
    });
  }
  
  
  updateGameTimer(): void {
    if (this.gameTimerSubscription) {
      this.gameTimerSubscription.unsubscribe();
    }
    
    if (!this.startTime || !this.endTime) return;
    
    const updateTime = () => {
      const now = new Date();
      const endTime = this.endTime as Date;
      const totalGameDuration = endTime.getTime() - this.startTime!.getTime();
      const elapsedTime = now.getTime() - this.startTime!.getTime();
      const remainingTime = endTime.getTime() - now.getTime();
      
      if (remainingTime <= 0) {
        this.gameTimeLeft = 0;
        this.gameTimePercentage = 0;
        this.gameTimerSubscription?.unsubscribe();
      
        
        return;
      }
      
      this.gameTimeLeft = Math.floor(remainingTime / 1000);
      this.gameTimePercentage = (remainingTime / totalGameDuration) * 100;
    };
    
    updateTime();
    
    this.gameTimerSubscription = interval(2000).subscribe(updateTime);
  }
  
  
  loadQuizAndQuestions(game: Game): void {
    if (!game.quiz) {
      this.error = 'Hiba: Nem sikerült betölteni a kvíz adatait';
      this.loading = false;
      return;
    }
    
    
    if (typeof game.quiz === 'object' && game.quiz._id) {
      this.quiz = game.quiz;
      
      
      if (this.quiz && this.quiz.questions && Array.isArray(this.quiz.questions) && this.quiz.questions.length > 0) {
        
        this.questions = [...this.quiz.questions];
        
        
        this.questions = this.questions.map((question: Question) => {
          
          if (question.answers && Array.isArray(question.answers) && (!question.options || !question.options.length)) {
            
            question.options = [...question.answers];
            console.log('Válaszok átmásolva options-ba:', question.options);
          }
          return question;
        });
        
        if (this.questions.length > 0) {
          this.currentQuestion = this.questions[0];
          this.startQuestionTimer();
        }
        
        this.loading = false;
      } else {
        
        this.quizService.getQuizQuestions(game.quiz._id).subscribe({
          next: (questions: Question[]) => {
            this.questions = questions;
            
            if (this.questions.length > 0) {
              this.currentQuestion = this.questions[0];
              this.startQuestionTimer();
            }
            
            this.loading = false;
          },
          error: (err: any) => {
            this.error = 'Hiba a kérdések betöltésekor.';
            this.loading = false;
            console.error('Error loading questions:', err);
          }
        });
      }
    } else if (typeof game.quiz === 'string') {
      
      this.quizService.getQuiz(game.quiz).subscribe({
        next: (quiz: Quiz) => {
          this.quiz = quiz;
          
          if (!quiz || !quiz._id) {
            this.error = 'Hiba: Érvénytelen kvíz adatok';
            this.loading = false;
            return;
          }
          
          
          this.quizService.getQuizQuestions(quiz._id).subscribe({
            next: (questions: Question[]) => {
              this.questions = questions;
              
              if (this.questions.length > 0) {
                this.currentQuestion = this.questions[0];
                this.startQuestionTimer();
              }
              
              this.loading = false;
            },
            error: (err: any) => {
              this.error = 'Hiba a kérdések betöltésekor.';
              this.loading = false;
              console.error('Error loading questions:', err);
            }
          });
        },
        error: (err: any) => {
          this.error = 'Hiba a kvíz betöltésekor.';
          this.loading = false;
          console.error('Error loading quiz:', err);
        }
      });
    } else {
      this.error = 'Hiba: Érvénytelen kvíz adatok';
      this.loading = false;
    }
  }
  
  loadGame(gameId: string): void {
    
    if (this.isLoadingGame) return;
    
    this.isLoadingGame = true;
    this.loading = true;
    this.error = null;
    
    
    const now = Date.now();
    const timeSinceLastAttempt = now - this.lastJoinAttemptTime;
    
    if (timeSinceLastAttempt < 2000) { 
      console.log('Túl gyakori kérés. Várakozás...');
      setTimeout(() => {
        this.isLoadingGame = false;
        this.loadGame(gameId);
      }, 2000 - timeSinceLastAttempt);
      return;
    }
    
    this.lastJoinAttemptTime = now;
    
    
    this.gameService.getGame(gameId).subscribe({
      next: (game) => {
        this.game = game;
        
        
        if (game.startTime) {
          this.startTime = new Date(game.startTime);
        }
        if (game.endTime) {
          this.endTime = new Date(game.endTime);
        }
        this.updateGameTimer();
        
        
        if (game.status === 'pending') {
          this.isLoadingGame = false;
          this.router.navigate(['/games/join', game._id]);
          return;
        }
        
        
        if (game.status === 'completed') {
          this.isLoadingGame = false;
          this.router.navigate(['/games/results', game._id]);
          return;
        }

        
        this.loadQuizAndQuestions(game);
        this.isLoadingGame = false;
      },
      error: (err: any) => {
        this.error = 'Hiba a játék betöltése során.';
        this.loading = false;
        this.isLoadingGame = false;
        console.error('Error loading game:', err);
      }
    });
  }
  
  
  checkPlayerParticipation(game: Game): boolean {
    if (!game.players || !Array.isArray(game.players)) {
      return false;
    }
    
    
    let isPlayer = game.players.some(player => {
      
      if (typeof player === 'string') {
        return player === this.currentUserId;
      } else if (player && player.user && typeof player.user === 'string') {
        return player.user === this.currentUserId;
      } else if (player && player.user && typeof player.user === 'object') {
        return player.user._id === this.currentUserId;
      }
      return false;
    });
    
    
    const hostId = typeof game.host === 'string'
      ? game.host
      : game.host?._id;
    
    
    if (this.currentUserId === hostId) {
      isPlayer = true;
    }
    
    return isPlayer;
  }
}
