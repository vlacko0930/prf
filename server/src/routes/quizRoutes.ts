import express from 'express';
import { 
  getQuizzes, 
  getQuizById, 
  createQuiz, 
  updateQuiz, 
  deleteQuiz,
  addQuestionToQuiz,
  removeQuestionFromQuiz
} from '../controllers/quizController';
import { authenticateUser, isAdmin, isPlayerOrAdmin } from '../middleware/authMiddleware';

const router = express.Router();


router.get('/', authenticateUser, isPlayerOrAdmin, getQuizzes);


router.get('/:id', authenticateUser, isPlayerOrAdmin, getQuizById);


router.post('/', authenticateUser, isAdmin, createQuiz);


router.put('/:id', authenticateUser, isAdmin, updateQuiz);


router.delete('/:id', authenticateUser, isAdmin, deleteQuiz);


router.post('/:quizId/questions/:questionId', authenticateUser, isAdmin, addQuestionToQuiz);


router.delete('/:quizId/questions/:questionId', authenticateUser, isAdmin, removeQuestionFromQuiz);

export default router;