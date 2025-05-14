import mongoose, { Document, Schema } from 'mongoose';

export interface IQuiz extends Document {
  title: string;
  description: string;
  category: string;
  difficulty: string;
  creator: mongoose.Types.ObjectId; 
  questions: mongoose.Types.ObjectId[]; 
  timeLimit: number | null; 
  createdAt: Date;
  updatedAt: Date;
}

const QuizSchema: Schema = new Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    default: 'Általános'
  },
  difficulty: {
    type: String,
    enum: ['könnyű', 'közepes', 'nehéz'],
    default: 'közepes'
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  questions: [{
    type: Schema.Types.ObjectId,
    ref: 'Question'
  }],
  timeLimit: {
    type: Number,
    default: null 
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

export default mongoose.model<IQuiz>('Quiz', QuizSchema);