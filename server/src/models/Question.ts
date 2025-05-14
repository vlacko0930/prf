import mongoose, { Document, Schema } from 'mongoose';

export interface IAnswer {
  text: string;
  isCorrect: boolean;
}

export interface IQuestion extends Document {
  text: string;
  answers: IAnswer[];
  points: number; 
  quizzes: mongoose.Types.ObjectId[]; 
  category?: string; 
  difficulty?: 'easy' | 'medium' | 'hard'; 
  explanation?: string; 
  createdAt: Date;
  updatedAt: Date;
}

const AnswerSchema = new Schema({
  text: {
    type: String,
    required: true
  },
  isCorrect: {
    type: Boolean,
    required: true,
    default: false
  }
});

const QuestionSchema: Schema = new Schema({
  text: {
    type: String,
    required: true
  },
  answers: {
    type: [AnswerSchema],
    validate: [
      {
        validator: function(answers: IAnswer[]) {
          return answers && answers.length >= 2; 
        },
        message: 'Legalább 2 válaszlehetőség szükséges'
      },
      {
        validator: function(answers: IAnswer[]) {
          return answers.some(answer => answer.isCorrect === true);
        },
        message: 'Legalább egy válasznak helyesnek kell lennie'
      }
    ]
  },
  points: {
    type: Number,
    default: 1, 
    min: 1
  },
  quizzes: [{
    type: Schema.Types.ObjectId,
    ref: 'Quiz',
  }],
  category: {
    type: String,
    default: 'Általános'
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  explanation: {
    type: String
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

export default mongoose.model<IQuestion>('Question', QuestionSchema);