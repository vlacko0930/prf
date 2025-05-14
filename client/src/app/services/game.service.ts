import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Game } from '../models/game.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private readonly API_URL = environment.gameApiUrl;

  constructor(private http: HttpClient) { }

  
  getGames(): Observable<Game[]> {
    return this.http.get<Game[]>(this.API_URL);
  }
  
  
  getGame(id: string): Observable<Game> {
    return this.http.get<Game>(`${this.API_URL}/${id}`);
  }

  
  getActiveGames(): Observable<Game[]> {
    return this.http.get<Game[]>(`${this.API_URL}/active`);
  }

  
  getGameById(id: string): Observable<Game> {
    return this.http.get<Game>(`${this.API_URL}/${id}`);
  }

  
  createGame(game: Partial<Game>): Observable<Game> {
    return this.http.post<Game>(this.API_URL, game);
  }

  
  updateGame(id: string, game: Partial<Game>): Observable<Game> {
    return this.http.put<Game>(`${this.API_URL}/${id}`, game);
  }

  
  deleteGame(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`);
  }

  
  startGame(id: string): Observable<Game> {
    return this.http.post<Game>(`${this.API_URL}/${id}/start`, {});
  }

  
  submitAnswer(gameId: string, questionId: string, answerId: string): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/${gameId}/answer`, {
      questionId,
      answerId
    });
  }

  
  getGameResults(id: string): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/${id}/results`);
  }

  
  getMyGames(): Observable<Game[]> {
    return this.http.get<Game[]>(`${this.API_URL}/my-games`);
  }

  
  joinGame(id: string): Observable<Game> {
    return this.http.post<Game>(`${this.API_URL}/${id}/join`, {});
  }
}