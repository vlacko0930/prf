import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Quiz } from '../models/quiz.model';
import { Question } from '../models/question.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class QuizService {
  private apiUrl = `${environment.apiUrl}/quizzes`;

  constructor(private http: HttpClient) { }

  
  getQuizzes(params?: any): Observable<Quiz[]> {
    return this.http.get<Quiz[]>(this.apiUrl, { params }).pipe(
      map(quizzes => this.transformQuizzesFromServer(quizzes))
    );
  }

  
  getQuiz(id: string): Observable<Quiz> {
    return this.http.get<Quiz>(`${this.apiUrl}/${id}`).pipe(
      map(quiz => this.transformQuizFromServer(quiz))
    );
  }

  
  getQuizById(id: string): Observable<Quiz> {
    return this.http.get<Quiz>(`${this.apiUrl}/${id}`).pipe(
      map(quiz => this.transformQuizFromServer(quiz))
    );
  }

  
  createQuiz(quiz: Quiz): Observable<Quiz> {
    const serverQuiz = this.transformQuizToServer(quiz);
    return this.http.post<Quiz>(this.apiUrl, serverQuiz).pipe(
      map(quiz => this.transformQuizFromServer(quiz))
    );
  }

  
  updateQuiz(id: string, quiz: Partial<Quiz>): Observable<Quiz> {
    const serverQuiz = this.transformQuizToServer(quiz);
    return this.http.put<Quiz>(`${this.apiUrl}/${id}`, serverQuiz).pipe(
      map(quiz => this.transformQuizFromServer(quiz))
    );
  }

  
  deleteQuiz(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  
  getPopularQuizzes(limit: number = 5): Observable<Quiz[]> {
    return this.http.get<Quiz[]>(`${this.apiUrl}/popular`, { params: { limit } }).pipe(
      map(quizzes => this.transformQuizzesFromServer(quizzes))
    );
  }

  
  searchQuizzes(query: string): Observable<Quiz[]> {
    return this.http.get<Quiz[]>(`${this.apiUrl}/search`, { params: { q: query } }).pipe(
      map(quizzes => this.transformQuizzesFromServer(quizzes))
    );
  }

  
  getCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/categories`);
  }

  
  addQuestionToQuiz(quizId: string, questionId: string): Observable<Quiz> {
    return this.http.post<Quiz>(`${this.apiUrl}/${quizId}/questions/${questionId}`, {}).pipe(
      map(quiz => this.transformQuizFromServer(quiz))
    );
  }

  
  removeQuestionFromQuiz(quizId: string, questionId: string): Observable<Quiz> {
    return this.http.delete<Quiz>(`${this.apiUrl}/${quizId}/questions/${questionId}`).pipe(
      map(quiz => this.transformQuizFromServer(quiz))
    );
  }

  
  getQuizQuestions(quizId: string): Observable<Question[]> {
    
    return this.http.get<Question[]>(`${environment.apiUrl}/questions/quiz/${quizId}`).pipe(
      map(questions => questions.map(question => {
        
        const transformedQuestion: Question = {
          ...question,
          
          options: question.options || question.answers || []
        };

        
        if (!transformedQuestion.options || !Array.isArray(transformedQuestion.options) || transformedQuestion.options.length === 0) {
          console.warn('Hiányzó válaszlehetőségek a kérdéshez:', question);
          transformedQuestion.options = [];
        }

        
        console.log('Kérdés átalakítás:', {
          eredeti: question,
          átalakított: transformedQuestion
        });
        
        return transformedQuestion;
      }))
    );
  }

  
  private transformQuizFromServer(quiz: any): Quiz {
    if (!quiz) return quiz;

    const transformedQuiz: Quiz = {
      ...quiz
    };

    
    if (quiz.questions && Array.isArray(quiz.questions)) {
      transformedQuiz.questions = quiz.questions.map((question: any) => {
        
        if (typeof question === 'string' || !question.text) {
          return question;
        }

        
        const transformedQuestion: Question = {
          ...question,
          options: question.options || question.answers || [],
          quizzes: question.quizzes || []
        };

        
        if ((!transformedQuestion.quizzes || !transformedQuestion.quizzes.length) && transformedQuestion._id) {
          transformedQuestion.quizzes = [quiz._id];
        }

        return transformedQuestion;
      });
    } else if (!transformedQuiz.questions) {
      transformedQuiz.questions = [];
    }

    return transformedQuiz;
  }

  
  private transformQuizzesFromServer(quizzes: any[]): Quiz[] {
    if (!quizzes) return [];
    return quizzes.map(q => this.transformQuizFromServer(q));
  }

  
  private transformQuizToServer(quiz: Partial<Quiz>): any {
    if (!quiz) return quiz;

    const serverQuiz: any = {
      ...quiz
    };

    
    if (quiz.questions && Array.isArray(quiz.questions)) {
      serverQuiz.questions = quiz.questions.map(question => {
        if (typeof question === 'string') {
          return question;
        }
        return question._id;
      }).filter(id => !!id); 
    }

    return serverQuiz;
  }
}