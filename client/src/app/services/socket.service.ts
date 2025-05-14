import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;
  
  constructor() {
    this.socket = io(environment.apiUrl.replace('/api', '')); 
    
    this.socket.on('connect', () => {
    });
    
    this.socket.on('disconnect', () => {
    });
    
    this.socket.on('error', (error: string) => {
      console.error('Socket.io hiba:', error);
    });
  }

  
  joinGame(gameId: string): void {
    this.socket.emit('joinGame', gameId);
  }
  
  
  leaveGame(gameId: string): void {
    this.socket.emit('leaveGame', gameId);
  }
  
  
  submitAnswer(data: {gameId: string, questionId: string, answerId: string, isCorrect: boolean, points: number}): void {
    this.socket.emit('submitAnswer', data);
  }
  
  
  updateGameState(data: {gameId: string, [key: string]: any}): void {
    this.socket.emit('updateGameState', data);
  }
  
  
  onPlayerJoined(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('playerJoined', (data) => {
        observer.next(data);
      });
      
      return () => {
        this.socket.off('playerJoined');
      };
    });
  }
  
  
  onAnswerSubmitted(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('answerSubmitted', (data) => {
        observer.next(data);
      });
      
      return () => {
        this.socket.off('answerSubmitted');
      };
    });
  }
  
  
  onGameStateUpdated(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('gameStateUpdated', (data) => {
        observer.next(data);
      });
      
      return () => {
        this.socket.off('gameStateUpdated');
      };
    });
  }
  
  
  onGameTimeUpdated(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('gameTimeUpdated', (data) => {
        observer.next(data);
      });
      
      return () => {
        this.socket.off('gameTimeUpdated');
      };
    });
  }
  
  
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}