import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { UserRole } from '../models/User';


declare global {
  namespace Express {
    interface Request {
      user?: any; 
    }
  }
}


const JWT_SECRET = process.env.JWT_SECRET || 'quiz_game_secret_key';


export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Nincs érvényes token' });
    }

    
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);

    
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Felhasználó nem található' });
    }

    
    req.user = user;
    next();
  } catch (error) {
    console.error('Autentikációs hiba:', error);
    res.status(401).json({ message: 'Nem engedélyezett' });
  }
};


export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === UserRole.ADMIN) {
    next();
  } else {
    res.status(403).json({ message: 'Hozzáférés megtagadva. Admin jogosultság szükséges.' });
  }
};


export const isPlayerOrAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user && (req.user.role === UserRole.PLAYER || req.user.role === UserRole.ADMIN)) {
    next();
  } else {
    res.status(403).json({ message: 'Hozzáférés megtagadva.' });
  }
};