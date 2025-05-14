export enum UserRole {
  ADMIN = 'admin',
  PLAYER = 'player'
}

export interface User {
  _id?: string;
  username: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  roles?: string[]; 
  avatar?: string;
  bio?: string;
  createdAt?: Date;
  updatedAt?: Date;
  completedGames?: number;
  totalScore?: number;
  averageScore?: number;
  score?: number;
  games?: any[];
  imageUrl?: string; 
  gamesPlayed?: number; 
}