import express from 'express';
import { 
  getUsers, 
  getUserById, 
  updateUser, 
  deleteUser, 
  getLeaderboard 
} from '../controllers/userController';
import { authenticateUser, isAdmin, isPlayerOrAdmin } from '../middleware/authMiddleware';

const router = express.Router();


router.get('/', authenticateUser, isAdmin, getUsers);


router.get('/leaderboard', authenticateUser, getLeaderboard);


router.get('/:id', authenticateUser, isPlayerOrAdmin, getUserById);


router.put('/:id', authenticateUser, isPlayerOrAdmin, updateUser);


router.delete('/:id', authenticateUser, isAdmin, deleteUser);

export default router;