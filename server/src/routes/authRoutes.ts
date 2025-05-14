import express from 'express';
import { login, register, getProfile } from '../controllers/authController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();


router.post('/register', register);


router.post('/login', login);


router.get('/profile', authenticateUser, getProfile);

export default router;