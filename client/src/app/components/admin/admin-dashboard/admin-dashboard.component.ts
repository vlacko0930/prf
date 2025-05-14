import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { QuizService } from '../../../services/quiz.service';
import { QuestionService } from '../../../services/question.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
  userCount = 0;
  quizCount = 0;
  questionCount = 0;
  
  constructor(
    private userService: UserService,
    private quizService: QuizService,
    private questionService: QuestionService
  ) {}
  
  ngOnInit(): void {
    this.loadStatistics();
  }
  
  loadStatistics(): void {
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.userCount = users.length;
      },
      error: (error) => {
        console.error('Hiba a felhasználók lekérésekor:', error);
      }
    });
    
    this.quizService.getQuizzes().subscribe({
      next: (quizzes) => {
        this.quizCount = quizzes.length;
      },
      error: (error) => {
        console.error('Hiba a kvízek lekérésekor:', error);
      }
    });
    
    this.questionService.getQuestions().subscribe({
      next: (questions) => {
        this.questionCount = questions.length;
      },
      error: (error) => {
        console.error('Hiba a kérdések lekérésekor:', error);
      }
    });
  }
}
