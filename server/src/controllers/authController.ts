import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { UserRole } from '../models/User';


const JWT_SECRET = process.env.JWT_SECRET || 'quiz_game_secret_key';


const generateToken = (id: string): string => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });
};


export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    
    if (!username || !email || !password) {
      res.status(400).json({ message: 'Minden mező kitöltése kötelező' });
      return;
    }

    
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      if (existingUser.email === email) {
        res.status(400).json({ message: 'Ez az email cím már használatban van' });
        return;
      }
      if (existingUser.username === username) {
        res.status(400).json({ message: 'Ez a felhasználónév már foglalt' });
        return;
      }
    }

    
    const user = await User.create({
      username,
      email,
      password,
      role: UserRole.PLAYER,
      score: 0
    });

    
    if (user) {
      const token = generateToken(user._id as any);

      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        score: user.score,
        games: user.games,
        token
      });
    } else {
      res.status(400).json({ message: 'Érvénytelen felhasználói adatok' });
    }
  } catch (error) {
    console.error('Hiba a regisztráció során:', error);
    res.status(500).json({ message: 'Szerver hiba a regisztráció során' });
  }
};


export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    
    const user = await User.findOne({ email });

    
    if (user && (await user.comparePassword(password))) {
      const token = generateToken(user._id as any);

      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        score: user.score,
        games: user.games,
        token
      });
    } else {
      res.status(401).json({ message: 'Hibás email cím vagy jelszó' });
    }
  } catch (error) {
    console.error('Hiba a bejelentkezés során:', error);
    res.status(500).json({ message: 'Szerver hiba a bejelentkezés során' });
  }
};


export const getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user._id).select('-password').populate('games');
    
    if (!user) {
      res.status(404).json({ message: 'Felhasználó nem található' });
      return;
    }
    
    res.json(user);
  } catch (error) {
    console.error('Hiba a profil lekérdezésekor:', error);
    res.status(500).json({ message: 'Szerver hiba a profil lekérdezésekor' });
  }
};