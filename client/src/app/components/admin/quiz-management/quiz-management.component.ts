import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { QuizService } from '../../../services/quiz.service';
import { Quiz } from '../../../models/quiz.model';

@Component({
  selector: 'app-quiz-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './quiz-management.component.html',
  styleUrl: './quiz-management.component.scss'
})
export class QuizManagementComponent implements OnInit {
  quizzes: Quiz[] = [];
  filteredQuizzes: Quiz[] = [];
  searchTerm: string = '';
  isLoading = false;
  error: string | null = null;
  
  constructor(private quizService: QuizService) {}
  
  ngOnInit(): void {
    this.loadQuizzes();
  }
  
  loadQuizzes(): void {
    this.isLoading = true;
    this.error = null;
    
    this.quizService.getQuizzes().subscribe({
      next: (data) => {
        this.quizzes = data;
        this.filteredQuizzes = [...this.quizzes];
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Hiba történt a kvízek betöltése során';
        this.isLoading = false;
        console.error(err);
      }
    });
  }
  
  filterQuizzes(): void {
    if (!this.searchTerm.trim()) {
      this.filteredQuizzes = [...this.quizzes];
      return;
    }
    
    const term = this.searchTerm.toLowerCase().trim();
    this.filteredQuizzes = this.quizzes.filter(quiz => 
      quiz.title.toLowerCase().includes(term) || 
      quiz.description.toLowerCase().includes(term)
    );
  }
  
  deleteQuiz(quiz: Quiz, event: Event): void {
    event.stopPropagation();
    
    if (!quiz._id) return;
    
    if (confirm(`Biztosan törölni szeretné a(z) "${quiz.title}" kvízt?`)) {
      this.quizService.deleteQuiz(quiz._id).subscribe({
        next: () => {
          this.quizzes = this.quizzes.filter(q => q._id !== quiz._id);
          this.filteredQuizzes = this.filteredQuizzes.filter(q => q._id !== quiz._id);
        },
        error: (err) => {
          console.error('Hiba a kvíz törlésekor', err);
        }
      });
    }
  }
}
