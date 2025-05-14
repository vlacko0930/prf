import mongoose, { Document, Schema } from 'mongoose';

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

export interface IPlayerResult {
  player: mongoose.Types.ObjectId;
  score: number;
  completedAt?: Date;
  answers: {
    question: mongoose.Types.ObjectId;
    selectedAnswer: mongoose.Types.ObjectId | string;
    isCorrect: boolean;
  }[];
}

export interface IGame extends Document {
  title: string;
  description?: string;
  quiz: mongoose.Types.ObjectId;
  status: GameStatus;
  startTime?: Date;
  endTime?: Date;
  players: mongoose.Types.ObjectId[];
  results: IPlayerResult[];
  host?: mongoose.Types.ObjectId;
  maxPlayers?: number;
  timeLimit?: number;
  createdAt: Date;
  updatedAt: Date;
}

const PlayerResultSchema = new Schema({
  player: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  score: {
    type: Number,
    default: 0
  },
  completedAt: {
    type: Date
  },
  answers: [
    {
      question: {
        type: Schema.Types.ObjectId,
        ref: 'Question',
        required: true
      },
      selectedAnswer: {
        type: Schema.Types.Mixed,
      },
      isCorrect: {
        type: Boolean,
        default: false
      }
    }
  ]
});

const GameSchema: Schema = new Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  quiz: {
    type: Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  status: {
    type: String,
    enum: Object.values(GameStatus),
    default: GameStatus.PENDING
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  players: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  results: [PlayerResultSchema],
  host: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  maxPlayers: {
    type: Number,
    default: 10
  },
  timeLimit: {
    type: Number,
    default: 30
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model<IGame>('Game', GameSchema);