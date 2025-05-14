import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { QuestionService } from '../../../services/question.service';
import { Question } from '../../../models/question.model';

@Component({
  selector: 'app-question-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './question-management.component.html',
  styleUrl: './question-management.component.scss'
})
export class QuestionManagementComponent implements OnInit {
  questions: Question[] = [];
  filteredQuestions: Question[] = [];
  searchTerm: string = '';
  selectedCategory: string = '';
  difficultyFilter: string = '';
  
  isLoading = false;
  error: string | null = null;
  
  categories = ['Történelem', 'Tudomány', 'Földrajz', 'Sport', 'Művészet', 'Zene', 'Film', 'Irodalom', 'Általános', ''];
  difficulties = [
    { value: '', label: 'Mind' },
    { value: 'easy', label: 'Könnyű' },
    { value: 'medium', label: 'Közepes' },
    { value: 'hard', label: 'Nehéz' }
  ];
  
  constructor(private questionService: QuestionService) {}
  
  ngOnInit(): void {
    this.loadQuestions();
  }
  
  loadQuestions(): void {
    this.isLoading = true;
    this.error = null;
    
    this.questionService.getQuestions().subscribe({
      next: (data) => {
        this.questions = data;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Hiba történt a kérdések betöltése során';
        this.isLoading = false;
        console.error(err);
      }
    });
  }
  
  applyFilters(): void {
    this.filteredQuestions = this.questions.filter(question => {
      
      const textMatch = !this.searchTerm.trim() || 
        question.text.toLowerCase().includes(this.searchTerm.toLowerCase()) || 
        question.options.some(opt => opt.text.toLowerCase().includes(this.searchTerm.toLowerCase()));
      
      
      const categoryMatch = !this.selectedCategory || question.category === this.selectedCategory;
      
      
      const difficultyMatch = !this.difficultyFilter || question.difficulty === this.difficultyFilter;
      
      return textMatch && categoryMatch && difficultyMatch;
    });
  }
  
  onSearchChange(): void {
    this.applyFilters();
  }
  
  onCategoryChange(): void {
    this.applyFilters();
  }
  
  onDifficultyChange(): void {
    this.applyFilters();
  }
  
  resetFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.difficultyFilter = '';
    this.applyFilters();
  }
  
  deleteQuestion(question: Question, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    if (!question._id) return;
    
    if (confirm(`Biztosan törölni szeretné a(z) "${question.text}" kérdést?`)) {
      this.questionService.deleteQuestion(question._id).subscribe({
        next: () => {
          this.questions = this.questions.filter(q => q._id !== question._id);
          this.applyFilters();
        },
        error: (err) => {
          console.error('Hiba a kérdés törlésekor', err);
        }
      });
    }
  }
  
  getCorrectAnswer(question: Question): string {
    const correctOption = question.options.find(opt => opt.isCorrect);
    return correctOption ? correctOption.text : 'Nincs helyes válasz';
  }
  
  getDifficultyText(difficulty: string | undefined): string {
    switch(difficulty) {
      case 'easy': return 'Könnyű';
      case 'medium': return 'Közepes';
      case 'hard': return 'Nehéz';
      default: return 'Ismeretlen';
    }
  }
}
