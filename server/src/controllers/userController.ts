import { Request, Response, NextFunction } from 'express';
import User, { IUser, UserRole } from '../models/User';
import Game from '../models/Game';


export const getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    
    if (req.user.role !== UserRole.ADMIN) {
      res.status(403).json({ message: 'Csak admin láthatja az összes felhasználót' });
      return;
    }

    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('Hiba a felhasználók lekérdezésekor:', error);
    res.status(500).json({ message: 'Szerver hiba a felhasználók lekérdezésekor' });
  }
};


export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Felhasználó nem található' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Hiba a felhasználó lekérdezésekor:', error);
    res.status(500).json({ message: 'Szerver hiba a felhasználó lekérdezésekor' });
  }
};


export const updateUser = async (req: Request, res: Response) => {
  const { username, email, role } = req.body;

  try {
    
    if (req.user._id.toString() !== req.params.id && req.user.role !== UserRole.ADMIN) {
      return res.status(403).json({ message: 'Nincs jogosultsága más felhasználó adatainak módosításához' });
    }

    let user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Felhasználó nem található' });
    }

    
    if (role !== undefined && role !== user.role && req.user.role !== UserRole.ADMIN) {
      return res.status(403).json({ message: 'Nincs jogosultsága a szerepkör módosításához' });
    }

    
    if (username && username !== user.username) {
      const usernameExists = await User.findOne({ username });
      if (usernameExists) {
        return res.status(400).json({ message: 'A felhasználónév már foglalt' });
      }
    }

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: 'Az email cím már foglalt' });
      }
    }

    
    const updateData: any = { username, email };
    if (role !== undefined) {
      updateData.role = role;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select('-password');

    res.json(updatedUser);
  } catch (error) {
    console.error('Hiba a felhasználó frissítésekor:', error);
    res.status(500).json({ message: 'Szerver hiba a felhasználó frissítésekor' });
  }
};


export const deleteUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Felhasználó nem található' });
    }

    
    if (user.role === UserRole.ADMIN) {
      return res.status(400).json({ message: 'Admin felhasználót nem lehet törölni' });
    }

    
    await Game.updateMany(
      { players: user._id },
      { $pull: { players: user._id } }
    );

    await user.deleteOne();
    res.json({ message: 'Felhasználó sikeresen törölve' });
  } catch (error) {
    console.error('Hiba a felhasználó törlésekor:', error);
    res.status(500).json({ message: 'Szerver hiba a felhasználó törlésekor' });
  }
};


export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const leaderboard = await User.find({ role: UserRole.PLAYER })
      .sort({ score: -1 })
      .limit(10)
      .select('username score');
    
    res.json(leaderboard);
  } catch (error) {
    console.error('Hiba a ranglista lekérdezésekor:', error);
    res.status(500).json({ message: 'Szerver hiba a ranglista lekérdezésekor' });
  }
};