import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { QuestionService } from '../../../services/question.service';
import { Question, Option } from '../../../models/question.model';
import { QuizService } from '../../../services/quiz.service';
import { Quiz } from '../../../models/quiz.model';

@Component({
  selector: 'app-question-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './question-form.component.html',
  styleUrl: './question-form.component.scss'
})
export class QuestionFormComponent implements OnInit {
  questionForm!: FormGroup;
  editMode = false;
  questionId: string | null = null;
  isLoading = false;
  isSubmitting = false;
  error: string | null = null;
  successMessage: string | null = null;
  
  
  quizzes: Quiz[] = [];
  selectedQuizId: string | null = null;
  
  
  originalQuestion: any = null;
  
  categories = ['Történelem', 'Tudomány', 'Földrajz', 'Sport', 'Művészet', 'Zene', 'Film', 'Irodalom', 'Általános'];
  difficulties = [
    { value: 'easy', label: 'Könnyű' },
    { value: 'medium', label: 'Közepes' },
    { value: 'hard', label: 'Nehéz' }
  ];
  
  constructor(
    private fb: FormBuilder,
    private questionService: QuestionService,
    private quizService: QuizService,
    private route: ActivatedRoute,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.initForm();
    
    this.questionId = this.route.snapshot.paramMap.get('id');
    this.editMode = !!this.questionId;
    
    
    this.selectedQuizId = this.route.snapshot.queryParamMap.get('quizId');
    
    
    this.loadQuizzes();
    
    if (this.editMode && this.questionId) {
      this.loadQuestion(this.questionId);
    } else {
      
      this.addOption();
      this.addOption();
      
      
      setTimeout(() => {
        if (this.options.length > 0) {
          this.setCorrectOption(0);
        }
      }, 0);
    }
  }
  
  initForm(): void {
    this.questionForm = this.fb.group({
      text: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(300)]],
      category: ['', Validators.required],
      difficulty: ['medium', Validators.required],
      quizzes: [[]],  
      options: this.fb.array([]),
      explanation: ['']
    });
  }
  
  loadQuizzes(): void {
    this.isLoading = true;
    
    this.quizService.getQuizzes().subscribe({
      next: (quizzes) => {
        this.quizzes = quizzes;
        
        
        if (this.selectedQuizId) {
          
          this.questionForm.patchValue({ quizzes: [this.selectedQuizId] });
        }
        
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Hiba a kvízek betöltése során:', err);
        this.error = 'Nem sikerült betölteni a kvízeket.';
        this.isLoading = false;
      }
    });
  }
  
  get options(): FormArray {
    return this.questionForm.get('options') as FormArray;
  }
  
  createOptionFormGroup(text: string = '', isCorrect: boolean = false): FormGroup {
    return this.fb.group({
      text: [text, [Validators.required, Validators.minLength(1)]],
      isCorrect: [isCorrect]
    });
  }
  
  addOption(): void {
    this.options.push(this.createOptionFormGroup());
  }
  
  removeOption(index: number): void {
    if (this.options.length > 2) {
      
      const isCorrectValue = this.options.at(index).get('isCorrect')?.value;
      this.options.removeAt(index);
      
      if (isCorrectValue) {
        this.setCorrectOption(0);
      }
    }
  }
  
  setCorrectOption(index: number): void {
    
    for (let i = 0; i < this.options.length; i++) {
      const optionControl = this.options.at(i).get('isCorrect');
      optionControl?.setValue(i === index);
      optionControl?.markAsDirty();
    }
    
  }
  
  isCorrectOption(index: number): boolean {
    return this.options.at(index).get('isCorrect')?.value === true;
  }
  
  loadQuestion(id: string): void {
    this.isLoading = true;
    
    this.questionService.getQuestion(id).subscribe({
      next: (question) => {
        this.originalQuestion = question;
        
        
        this.options.clear();
        
        
        const optionsArray = question.options || (question as any).answers || [];
        
        
        if (optionsArray && optionsArray.length > 0) {
          optionsArray.forEach((option: any) => {
            this.options.push(this.createOptionFormGroup(option.text, option.isCorrect));
          });
        } else {
          
          this.addOption();
          this.addOption();
          this.setCorrectOption(0);
        }

        
        let quizIds: string[] = [];
        
        if (Array.isArray(question.quizzes)) {
          
          quizIds = question.quizzes.map((quiz: any) => 
            typeof quiz === 'string' ? quiz : quiz._id || ''
          ).filter(id => !!id);
        } else if ((question as any).quizId) {
          
          quizIds = [(question as any).quizId];
        } else if ((question as any).quiz) {
          
          const quizId = typeof (question as any).quiz === 'string' 
            ? (question as any).quiz 
            : ((question as any).quiz._id || '');
          
          if (quizId) quizIds = [quizId];
        }
        
        
        this.questionForm.patchValue({
          text: question.text,
          category: question.category || '',
          difficulty: question.difficulty || 'medium',
          explanation: question.explanation || '',
          quizzes: quizIds
        });
        
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Hiba a kérdés betöltésekor:', err);
        this.error = 'Nem sikerült betölteni a kérdést.';
        this.isLoading = false;
      }
    });
  }
  
  hasCorrectOption(): boolean {
    return this.options.controls.some(control => control.get('isCorrect')?.value === true);
  }
  
  onSubmit(): void {
    if (this.questionForm.invalid) {
      
      this.questionForm.markAllAsTouched();
      this.error = 'Kérjük, töltsd ki megfelelően a mezőket!';
      return;
    }
    
    if (!this.hasCorrectOption()) {
      this.error = 'Legalább egy helyes választ meg kell jelölni!';
      return;
    }
    
    this.isSubmitting = true;
    this.error = null;
    this.successMessage = null;
    
    const formValue = this.questionForm.value;
    const optionsArray = formValue.options;
    
    
    let correctOptionIndex = -1;
    for (let i = 0; i < optionsArray.length; i++) {
      if (optionsArray[i].isCorrect) {
        correctOptionIndex = i;
        break;
      }
    }
    
    
    let optionsKey = 'options';
    
    
    if (this.originalQuestion && (this.originalQuestion.answers && !this.originalQuestion.options)) {
      optionsKey = 'answers';
    }
    
    
    const questionData: any = {
      text: formValue.text,
      category: formValue.category,
      difficulty: formValue.difficulty,
      explanation: formValue.explanation,
      correctOptionIndex: correctOptionIndex,
      quizzes: formValue.quizzes || [] 
    };
    
    
    questionData[optionsKey] = optionsArray;
    
    
    if (this.editMode && this.questionId) {
      this.questionService.updateQuestion(this.questionId, questionData).subscribe({
        next: (response) => {
          this.successMessage = 'A kérdés sikeresen frissítve!';
          this.isSubmitting = false;
          
          
          this.loadQuestion(this.questionId!);
        },
        error: (err) => {
          this.error = 'Hiba történt a kérdés frissítése során: ' + (err.error?.message || 'Ismeretlen hiba');
          console.error('Hiba a frissítés során:', err);
          this.isSubmitting = false;
        }
      });
    } else {
      this.questionService.createQuestion(questionData).subscribe({
        next: (response) => {
          this.successMessage = 'Az új kérdés sikeresen létrehozva!';
          this.isSubmitting = false;
          
          
          setTimeout(() => {
            this.router.navigate(['/admin/questions']);
          }, 1500);
        },
        error: (err) => {
          this.error = 'Hiba történt az új kérdés létrehozása során: ' + (err.error?.message || 'Ismeretlen hiba');
          console.error('Hiba a létrehozás során:', err);
          this.isSubmitting = false;
        }
      });
    }
  }
  
  navigateBack(): void {
    this.router.navigate(['/admin/questions']);
  }
}
