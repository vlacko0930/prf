export interface Question {
  _id?: string;
  quizzes: string[]; 
  text: string;
  options: Option[];
  answers?: Option[]; 
  correctOptionIndex: number;
  explanation?: string;
  points?: number;
  timeLimit?: number; 
  image?: string;
  order?: number;
  type?: 'egyszeres választás' | 'többszörös választás' | 'igaz/hamis';
  category?: string; 
  difficulty?: 'easy' | 'medium' | 'hard'; 
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Option {
  text: string;
  isCorrect: boolean;
}