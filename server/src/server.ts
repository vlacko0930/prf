import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import http from 'http';
import { Server } from 'socket.io';


import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import quizRoutes from './routes/quizRoutes';
import questionRoutes from './routes/questionRoutes';
import gameRoutes from './routes/gameRoutes';


dotenv.config();


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/games', gameRoutes);


io.on('connection', (socket) => {
  console.log('Új kliens kapcsolódott:', socket.id);

  
  socket.on('joinGame', (gameId) => {
    socket.join(`game-${gameId}`);
    console.log(`Játékos csatlakozott: ${socket.id} -> game-${gameId}`);
  });

  
  socket.on('leaveGame', (gameId) => {
    socket.leave(`game-${gameId}`);
    console.log(`Játékos kilépett: ${socket.id} -> game-${gameId}`);
  });

  
  socket.on('submitAnswer', (data) => {
    
    io.to(`game-${data.gameId}`).emit('answerSubmitted', {
      playerId: socket.id,
      questionId: data.questionId,
      isCorrect: data.isCorrect,
      points: data.points
    });
  });

  
  socket.on('updateGameState', (data) => {
    io.to(`game-${data.gameId}`).emit('gameStateUpdated', data);
  });

  
  socket.on('disconnect', () => {
    console.log('Kliens lecsatlakozott:', socket.id);
  });
});


if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist/prf-client')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/prf-client/index.html'));
  });
}


const PORT = process.env.PORT || 3000;


mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quiz-game')
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Szerver fut a következő porton: ${PORT}`);
      console.log('MongoDB kapcsolódás sikeres');
    });
  })
  .catch((error) => {
    console.error('MongoDB kapcsolódás sikertelen:', error.message);
  });