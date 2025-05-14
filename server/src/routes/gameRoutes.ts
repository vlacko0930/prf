import express from 'express';
import { 
  getGames, 
  getGameById, 
  getActiveGames,
  createGame, 
  updateGame, 
  deleteGame,
  joinGame,
  submitAnswer,
  getGameResults,
  startGame,
} from '../controllers/gameController';
import { authenticateUser, isAdmin, isPlayerOrAdmin } from '../middleware/authMiddleware';

const router = express.Router();


router.get('/', authenticateUser, isPlayerOrAdmin, getGames);


router.get('/active', authenticateUser, isPlayerOrAdmin, getActiveGames);


router.get('/:id', authenticateUser, isPlayerOrAdmin, getGameById);


router.get('/:id/results', authenticateUser, isPlayerOrAdmin, getGameResults);


router.post('/', authenticateUser, isPlayerOrAdmin, createGame);


router.post('/:id/start', authenticateUser, startGame);


router.put('/:id', authenticateUser, isAdmin, updateGame);


router.delete('/:id', authenticateUser, isAdmin, deleteGame);


router.post('/:id/join', authenticateUser, joinGame);


router.post('/:id/submit', authenticateUser, submitAnswer);

export default router;