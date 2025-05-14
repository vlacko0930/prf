import express from 'express';
import { 
  getQuestions, 
  getQuestionById, 
  getQuestionsByQuiz,
  getQuestionsByIds,
  createQuestion, 
  updateQuestion, 
  deleteQuestion 
} from '../controllers/questionController';
import { authenticateUser, isAdmin, isPlayerOrAdmin } from '../middleware/authMiddleware';

const router = express.Router();


router.get('/', authenticateUser, isPlayerOrAdmin, getQuestions);


router.get('/quiz/:quizId', authenticateUser, isPlayerOrAdmin, getQuestionsByQuiz);


router.post('/byIds', authenticateUser, isPlayerOrAdmin, getQuestionsByIds);


router.get('/:id', authenticateUser, isPlayerOrAdmin, getQuestionById);


router.post('/', authenticateUser, isAdmin, createQuestion);


router.put('/:id', authenticateUser, isAdmin, updateQuestion);


router.delete('/:id', authenticateUser, isAdmin, deleteQuestion);

export default router;