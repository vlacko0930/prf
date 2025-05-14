import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Question } from '../models/question.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class QuestionService {
  private readonly API_URL = `${environment.apiUrl}/questions`;

  constructor(private http: HttpClient) { }

  
  getQuestions(): Observable<Question[]> {
    return this.http.get<Question[]>(this.API_URL).pipe(
      map(questions => this.transformQuestionsFromServer(questions))
    );
  }

  
  getQuestion(id: string): Observable<Question> {
    return this.http.get<Question>(`${this.API_URL}/${id}`).pipe(
      map(question => this.transformQuestionFromServer(question))
    );
  }

  
  getQuestionById(id: string): Observable<Question> {
    return this.http.get<Question>(`${this.API_URL}/${id}`).pipe(
      map(question => this.transformQuestionFromServer(question))
    );
  }

  
  getQuestionsByCategory(category: string): Observable<Question[]> {
    return this.http.get<Question[]>(`${this.API_URL}/category/${category}`).pipe(
      map(questions => this.transformQuestionsFromServer(questions))
    );
  }

  
  createQuestion(question: Partial<Question>): Observable<Question> {
    const serverQuestion = this.transformQuestionToServer(question);
    return this.http.post<Question>(this.API_URL, serverQuestion).pipe(
      map(question => this.transformQuestionFromServer(question))
    );
  }

  
  updateQuestion(id: string, question: Partial<Question>): Observable<Question> {
    const serverQuestion = this.transformQuestionToServer(question);
    return this.http.put<Question>(`${this.API_URL}/${id}`, serverQuestion).pipe(
      map(question => this.transformQuestionFromServer(question))
    );
  }

  
  deleteQuestion(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`);
  }

  
  importQuestions(file: File): Observable<Question[]> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Question[]>(`${this.API_URL}/import`, formData).pipe(
      map(questions => this.transformQuestionsFromServer(questions))
    );
  }

  
  exportQuestions(): Observable<Blob> {
    return this.http.get(`${this.API_URL}/export`, { responseType: 'blob' });
  }

  
  private transformQuestionFromServer(question: any): Question {
    if (!question) return question;

    const transformedQuestion: Question = {
      ...question,
      options: question.options || question.answers || [],
      quizzes: question.quizzes || []
    };

    
    if (question.quiz && !transformedQuestion.quizzes.length) {
      const quizId = typeof question.quiz === 'string' ? question.quiz : question.quiz._id;
      if (quizId) {
        transformedQuestion.quizzes = [quizId];
      }
    }

    
    if (question.quizId && !transformedQuestion.quizzes.length) {
      transformedQuestion.quizzes = [question.quizId];
    }

    
    if (!transformedQuestion.options || !Array.isArray(transformedQuestion.options)) {
      transformedQuestion.options = [];
    }

    return transformedQuestion;
  }

  
  private transformQuestionsFromServer(questions: any[]): Question[] {
    if (!questions) return [];
    return questions.map(q => this.transformQuestionFromServer(q));
  }

  
  private transformQuestionToServer(question: Partial<Question>): any {
    if (!question) return question;

    
    const serverQuestion: any = {
      ...question,
      answers: question.options || []
    };

    
    delete serverQuestion.options;

    return serverQuestion;
  }
}