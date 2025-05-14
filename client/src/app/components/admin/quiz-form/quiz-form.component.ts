import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { QuizService } from '../../../services/quiz.service';
import { Quiz } from '../../../models/quiz.model';
import { QuestionService } from '../../../services/question.service';
import { Question } from '../../../models/question.model';

@Component({
  selector: 'app-quiz-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule],
  templateUrl: './quiz-form.component.html',
  styleUrl: './quiz-form.component.scss'
})
export class QuizFormComponent implements OnInit {
  quizForm!: FormGroup;
  editMode = false;
  quizId: string | null = null;
  isLoading = false;
  isSubmitting = false;
  error: string | null = null;
  successMessage: string | null = null;
  
  allQuestions: Question[] = [];
  selectedQuestions: Question[] = [];
  availableQuestions: Question[] = [];
  searchTerm = '';
  filteredQuestions: Question[] = [];
  
  categories = ['Történelem', 'Tudomány', 'Földrajz', 'Sport', 'Művészet', 'Zene', 'Film', 'Irodalom', 'Általános'];
  
  constructor(
    private fb: FormBuilder,
    private quizService: QuizService,
    private questionService: QuestionService,
    private route: ActivatedRoute,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.initForm();
    this.loadQuestions();
    
    this.quizId = this.route.snapshot.paramMap.get('id');
    this.editMode = !!this.quizId;
    
    if (this.editMode && this.quizId) {
      this.loadQuiz(this.quizId);
    }
  }
  
  initForm(): void {
    this.quizForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      category: ['', Validators.required],
      difficulty: ['közepes', Validators.required],
      timeLimit: [null, [Validators.min(1), Validators.max(60)]]
    });
  }
  
  loadQuestions(): void {
    this.questionService.getQuestions().subscribe({
      next: (questions) => {
        this.allQuestions = questions;
        this.updateAvailableQuestions();
        this.filterQuestions();
      },
      error: (err) => {
        console.error('Hiba a kérdések lekérésekor', err);
        this.error = 'Nem sikerült betölteni a kérdéseket.';
      }
    });
  }
  
  loadQuiz(id: string): void {
    this.isLoading = true;
    
    this.quizService.getQuiz(id).subscribe({
      next: (quiz) => {
        
        this.quizForm.patchValue({
          title: quiz.title,
          description: quiz.description,
          category: quiz.category,
          difficulty: quiz.difficulty || 'közepes',
          timeLimit: quiz.timeLimit
        });
        
        
        if (quiz.questions && quiz.questions.length > 0) {
          
          this.selectedQuestions = quiz.questions
            .filter(q => typeof q !== 'string' && q._id) 
            .map(q => q as Question);
          
          this.updateAvailableQuestions();
        }
        
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Hiba a kvíz betöltésekor', err);
        this.error = 'Nem sikerült betölteni a kvízt.';
        this.isLoading = false;
      }
    });
  }
  
  updateAvailableQuestions(): void {
    if (!this.allQuestions.length) return;
    
    const selectedIds = this.selectedQuestions.map(q => q._id);
    this.availableQuestions = this.allQuestions.filter(q => !selectedIds.includes(q._id));
    this.filterQuestions();
  }
  
  filterQuestions(): void {
    if (!this.searchTerm.trim()) {
      this.filteredQuestions = [...this.availableQuestions];
      return;
    }
    
    const term = this.searchTerm.toLowerCase().trim();
    this.filteredQuestions = this.availableQuestions.filter(q => 
      q.text.toLowerCase().includes(term) || 
      q.options.some(option => option.text.toLowerCase().includes(term))
    );
  }
  
  addQuestion(question: Question): void {
    this.selectedQuestions = [...this.selectedQuestions, question];
    this.updateAvailableQuestions();
  }
  
  removeQuestion(question: Question): void {
    this.selectedQuestions = this.selectedQuestions.filter(q => q._id !== question._id);
    this.updateAvailableQuestions();
  }
  
  moveQuestionUp(index: number): void {
    if (index <= 0) return;
    
    const temp = this.selectedQuestions[index];
    this.selectedQuestions[index] = this.selectedQuestions[index - 1];
    this.selectedQuestions[index - 1] = temp;
  }
  
  moveQuestionDown(index: number): void {
    if (index >= this.selectedQuestions.length - 1) return;
    
    const temp = this.selectedQuestions[index];
    this.selectedQuestions[index] = this.selectedQuestions[index + 1];
    this.selectedQuestions[index + 1] = temp;
  }
  
  onSubmit(): void {    
    
    let hasError = false;
    
    
    if (this.quizForm.invalid) {
      this.quizForm.markAllAsTouched();
      hasError = true;
    }
    
    
    if (this.selectedQuestions.length === 0) {
      this.error = 'Legalább egy kérdést hozzá kell adni a kvízhez.';
      hasError = true;
    }
    
    
    if (hasError) {
      return;
    }
    
    this.isSubmitting = true;
    this.error = null;
    this.successMessage = null;
    
    const formValue = this.quizForm.value;
    
    
    
    const questionObjects: Question[] = this.selectedQuestions
      .map(q => q._id)
      .filter((id): id is string => id !== undefined)
      .map(id => ({ _id: id } as Question));
    
    
    
    const timeLimit = formValue.timeLimit === '' || formValue.timeLimit === undefined ? null : formValue.timeLimit;
    
    const quizData: Partial<Quiz> = {
      title: formValue.title,
      description: formValue.description,
      category: formValue.category,
      difficulty: formValue.difficulty,
      timeLimit: timeLimit,
      questions: questionObjects
    };
    
    
    if (this.editMode && this.quizId) {
      this.quizService.updateQuiz(this.quizId, quizData).subscribe({
        next: (updatedQuiz) => {
          this.successMessage = 'A kvíz sikeresen frissítve!';
          this.isSubmitting = false;
        },
        error: (err) => {
          this.error = 'Hiba történt a kvíz frissítése során.';
          this.isSubmitting = false;
        }
      });
    } else {
      this.quizService.createQuiz(quizData as Quiz).subscribe({
        next: () => {
          this.successMessage = 'Az új kvíz sikeresen létrehozva!';
          this.isSubmitting = false;
          
          setTimeout(() => {
            this.router.navigate(['/admin/quizzes']);
          }, 1500);
        },
        error: (err) => {
          this.error = 'Hiba történt az új kvíz létrehozása során.';
          this.isSubmitting = false;
        }
      });
    }
  }
  
  
  getFormValidationErrors() {
    Object.keys(this.quizForm.controls).forEach(key => {
      const controlErrors = this.quizForm.get(key)?.errors;
      if (controlErrors != null) {
        Object.keys(controlErrors).forEach(keyError => {
          console.log('Mező: ' + key + ', Hiba: ' + keyError, controlErrors[keyError]);
        });
      }
    });
  }
  
  onSubmitClicked(event: MouseEvent): void {
    event.preventDefault();
    this.onSubmit();
  }
  
  navigateBack(): void {
    this.router.navigate(['/admin/quizzes']);
  }
}
