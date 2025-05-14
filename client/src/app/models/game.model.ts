export enum GameStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  WAITING = 'waiting',
  IN_PROGRESS = 'in-progress',
  ABANDONED = 'abandoned',
  INPROGRESS = 'inprogress',
  FINISHED = 'finished'
}

export interface Game {
  _id?: string;
  title: string;
  description?: string;
  quiz: any; 
  player?: string; 
  players: Player[]; 
  host?: any; 
  score?: number;
  totalQuestions?: number;
  correctAnswers?: number;
  answers?: {
    questionId: string;
    selectedOptionIndex: number;
    isCorrect: boolean;
    points: number;
  }[];
  startedAt?: Date;
  completedAt?: Date;
  endedAt?: Date; 
  startTime?: Date; 
  endTime?: Date;
  createdAt?: Date;
  status: GameStatus | string;
  maxPlayers?: number;
  timeLimit?: number;
  results?: GameResult[];
}

export interface Player {
  user?: {
    _id: string;
    username: string;
    email?: string;
  };
  name?: string;
  score?: number;
  joinedAt?: Date;
  isCompleted?: boolean;
}

export interface GameResult {
  player: string | {
    _id: string;
    username: string;
  };
  score: number;
  correctAnswers?: number;
  totalQuestions?: number;
  completedAt?: Date;
}