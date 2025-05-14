import { Question } from './question.model';

export interface Quiz {
  _id?: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'könnyű' | 'közepes' | 'nehéz';
  timeLimit?: number; 
  coverImage?: string;
  author?: string; 
  createdAt?: Date;
  updatedAt?: Date;
  questionCount?: number;
  playCount?: number;
  averageRating?: number;
  tags?: string[];
  questions: Question[]; 
}