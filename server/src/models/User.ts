import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

export enum UserRole {
  ADMIN = 'admin',
  PLAYER = 'player'
}

export interface IUser extends Document {
  username: String;
  email: String;
  password: String;
  role: UserRole;
  score: Number;
  games: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.PLAYER
  },
  score: {
    type: Number,
    default: 0
  },
  games: [{
    type: Schema.Types.ObjectId,
    ref: 'Game'
  }],
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


UserSchema.pre('save', async function(next) {
  const user = this as unknown as IUser;
  
  if (!user.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password as string, salt);
    next();
  } catch (error: any) {
    return next(error);
  }
});


UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

export default mongoose.model<IUser>('User', UserSchema);