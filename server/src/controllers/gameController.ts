import { Request, Response, NextFunction } from 'express';
import Game, { GameStatus, IGame } from '../models/Game';
import Quiz from '../models/Quiz';
import User, { UserRole } from '../models/User';
import Question from '../models/Question';
import mongoose from 'mongoose';


export const getGames = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const games = await Game.find()
      .populate('quiz', 'title description')
      .populate('host', 'username')
      .populate('players', 'username score');
    
    res.json(games);
  } catch (error) {
    console.error('Hiba a játékok lekérdezésekor:', error);
    res.status(500).json({ message: 'Szerver hiba a játékok lekérdezésekor' });
  }
};


export const getGameById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const game = await Game.findById(req.params.id)
      .populate('quiz', 'title description timeLimit questions')
      .populate({
        path: 'quiz',
        populate: {
          path: 'questions',
          model: 'Question',
          select: 'text options answers points timeLimit explanation'
        }
      })
      .populate('host', 'username')
      .populate('players', 'username score');
    
    if (!game) {
      res.status(404).json({ message: 'Játék nem található' });
      return;
    }
    
    res.json(game);
  } catch (error) {
    console.error('Hiba a játék lekérdezésekor:', error);
    res.status(500).json({ message: 'Szerver hiba a játék lekérdezésekor' });
  }
};


export const getActiveGames = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const now = new Date();
    const games = await Game.find({
      status: GameStatus.ACTIVE,
      startTime: { $lte: now },
      endTime: { $gte: now }
    })
      .populate('quiz', 'title description')
      .populate('host', 'username');
    
    res.json(games);
  } catch (error) {
    console.error('Hiba az aktív játékok lekérdezésekor:', error);
    res.status(500).json({ message: 'Szerver hiba az aktív játékok lekérdezésekor' });
  }
};


export const createGame = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  
  const { title, description, quizId, startTime, endTime, maxPlayers, timeLimit } = req.body;

  try {
    
    if (req.user.role !== UserRole.PLAYER && req.user.role !== UserRole.ADMIN) {
      res.status(403).json({ message: 'Csak játékos vagy admin hozhat létre játékot' });
      return;
    }

    
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      res.status(404).json({ message: 'Kvíz nem található' });
      return;
    }

    
    const gameData: any = {
      title,
      quiz: quizId,
      status: GameStatus.PENDING,
      players: [req.user._id],
      host: req.user._id,
      results: [{
        player: req.user._id,
        score: 0,
        answers: []
      }],
      createdAt: new Date()
    };

    
    if (description) gameData.description = description;
    if (maxPlayers) gameData.maxPlayers = maxPlayers;
    if (timeLimit) gameData.timeLimit = timeLimit;
    
    
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      
      if (start >= end) {
        res.status(400).json({ message: 'A kezdési időpontnak a befejezési időpont előtt kell lennie' });
        return;
      }
      
      gameData.startTime = start;
      gameData.endTime = end;
    }

    
    const game = await Game.create(gameData);

    
    await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { games: game._id } }
    );

    res.status(201).json(game);
  } catch (error) {
    console.error('Hiba a játék létrehozásakor:', error);
    res.status(500).json({ message: 'Szerver hiba a játék létrehozásakor' });
  }
};


export const updateGame = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { title, description, status, startTime, endTime } = req.body;

  try {
    
    if (req.user.role !== UserRole.ADMIN) {
      res.status(403).json({ message: 'Csak admin módosíthat játékot' });
      return;
    }

    let game = await Game.findById(req.params.id);
    
    if (!game) {
      res.status(404).json({ message: 'Játék nem található' });
      return;
    }

    
    if (!game.host || game.host.toString() !== req.user._id.toString()) {
      res.status(403).json({ message: 'Csak a saját játékodat módosíthatod' });
      return;
    }

    
    let start = game.startTime;
    let end = game.endTime;
    
    if (startTime) start = new Date(startTime);
    if (endTime) end = new Date(endTime);
    
    if (start && end && start >= end) {
      res.status(400).json({ message: 'A kezdési időpontnak a befejezési időpont előtt kell lennie' });
      return;
    }

    game = await Game.findByIdAndUpdate(
      req.params.id,
      { 
        title, 
        description, 
        status: status || game.status,
        startTime: start,
        endTime: end 
      },
      { new: true }
    );

    res.json(game);
  } catch (error) {
    console.error('Hiba a játék frissítésekor:', error);
    res.status(500).json({ message: 'Szerver hiba a játék frissítésekor' });
  }
};


export const deleteGame = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    
    if (req.user.role !== UserRole.ADMIN) {
      res.status(403).json({ message: 'Csak admin törölhet játékot' });
      return;
    }

    const game = await Game.findById(req.params.id);
    
    if (!game) {
      res.status(404).json({ message: 'Játék nem található' });
      return;
    }

    
    if (!game.host || game.host.toString() !== req.user._id.toString()) {
      res.status(403).json({ message: 'Csak a saját játékodat törölheted' });
      return;
    }

    
    if (game.status !== GameStatus.PENDING) {
      res.status(400).json({ message: 'Csak a még nem indult játékok törölhetők' });
      return;
    }

    await game.deleteOne();
    res.json({ message: 'Játék sikeresen törölve' });
  } catch (error) {
    console.error('Hiba a játék törlésekor:', error);
    res.status(500).json({ message: 'Szerver hiba a játék törlésekor' });
  }
};


export const joinGame = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    
    if (req.user.role !== UserRole.PLAYER) {
      res.status(403).json({ message: 'Csak játékosok csatlakozhatnak a játékhoz' });
      return;
    }

    const game = await Game.findById(req.params.id);
    
    if (!game) {
      res.status(404).json({ message: 'Játék nem található' });
      return;
    }

    
    const now = new Date();
    
    
    if (game.startTime && game.endTime && now >= game.startTime && now <= game.endTime && game.status === GameStatus.PENDING) {
      game.status = GameStatus.ACTIVE;
    } 
    
    else if (game.endTime && now > game.endTime && game.status !== GameStatus.COMPLETED) {
      game.status = GameStatus.COMPLETED;
    }
    
    
    if (game.status === GameStatus.COMPLETED) {
      res.status(400).json({ message: 'A játék már lezárult' });
      return;
    }

    
    const isPlayerInGame = game.players.some(playerId => playerId.toString() === req.user._id.toString());
    const playerResultIndex = game.results.findIndex(
      result => result.player.toString() === req.user._id.toString()
    );
    
    
    if (isPlayerInGame) {
      
      if (playerResultIndex === -1) {
        game.results.push({
          player: req.user._id,
          score: 0,
          answers: []
        });
        await game.save();
        console.log(`Játékos eredmény bejegyzése létrehozva: ${req.user._id}`);
      }
      
      
      res.json(game);
      return;
    }

    
    if (game.maxPlayers && game.players.length >= game.maxPlayers) {
      res.status(400).json({ message: 'A játék elérte a maximális játékosszámot' });
      return;
    }

    
    game.players.push(req.user._id);
    
    
    game.results.push({
      player: req.user._id,
      score: 0,
      answers: []
    });
    
    await game.save();

    
    await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { games: game._id } }
    );

    res.json(game);
  } catch (error) {
    console.error('Hiba a játékhoz csatlakozáskor:', error);
    res.status(500).json({ message: 'Szerver hiba a játékhoz csatlakozáskor' });
  }
};


export const submitAnswer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { questionId, answerId } = req.body;

  try {
    
    if (req.user.role !== UserRole.PLAYER) {
      res.status(403).json({ message: 'Csak játékosok küldhetnek be választ' });
      return;
    }

    const game = await Game.findById(req.params.id);
    
    if (!game) {
      res.status(404).json({ message: 'Játék nem található' });
      return;
    }

    
    if (game.status !== GameStatus.ACTIVE) {
      res.status(400).json({ message: 'A játék nem aktív' });
      return;
    }

    
    if (!game.players.some(player => player.toString() === req.user._id.toString())) {
      res.status(400).json({ message: 'Nem vagy a játék résztvevője' });
      return;
    }

    
    const question = await Question.findById(questionId);
    if (!question) {
      res.status(404).json({ message: 'Kérdés nem található' });
      return;
    }

    
    if (!question.quizzes || question.quizzes.length === 0) {
      res.status(400).json({ message: 'A kérdés nem tartozik egyetlen kvízhez sem' });
      return;
    }

    
    const belongsToQuiz = question.quizzes.some(quizId => 
      quizId.toString() === game.quiz.toString()
    );
    
    if (!belongsToQuiz) {
      res.status(400).json({ message: 'A kérdés nem a játékhoz tartozó kvízben van' });
      return;
    }

    
    const playerResultIndex = game.results.findIndex(
      result => result.player.toString() === req.user._id.toString()
    );

    if (playerResultIndex === -1) {
      res.status(400).json({ message: 'Nem vagy a játék résztvevője' });
      return;
    }

    
    const alreadyAnswered = game.results[playerResultIndex].answers.some(
      answer => answer.question.toString() === questionId
    );

    if (alreadyAnswered) {
      res.status(400).json({ message: 'Erre a kérdésre már válaszoltál' });
      return;
    }

    
    
    const answerIndex = parseInt(answerId, 10);
    const answerObj = question.answers[answerIndex];
    
    if (!answerObj) {
      res.status(404).json({ message: 'Válasz nem található' });
      return;
    }

    const isCorrect = answerObj.isCorrect;
    
    
    game.results[playerResultIndex].answers.push({
      question: question._id as any,
      selectedAnswer: answerId,
      isCorrect
    });

    if (isCorrect) {
      game.results[playerResultIndex].score += question.points;
      
      
      await User.findByIdAndUpdate(
        req.user._id,
        { $inc: { score: question.points } }
      );
    }

    
    const answeredQuestionsCount = game.results[playerResultIndex].answers.length;
    const quiz = await Quiz.findById(game.quiz);
    
    if (!quiz) {
      res.status(404).json({ message: 'Kvíz nem található' });
      return;
    }
    
    const totalQuestionsCount = quiz.questions.length;
    
    if (answeredQuestionsCount >= totalQuestionsCount) {
      game.results[playerResultIndex].completedAt = new Date();
      
      
      
      
      
      
      const allResultsCompleted = game.results.every(result => {
        
        
        return !!result.completedAt;
      });
      
      
      
      if (allResultsCompleted && game.status === GameStatus.ACTIVE) {
        game.status = GameStatus.COMPLETED;
        game.endTime = new Date();
      }
    }

    await game.save();

    res.json({
      isCorrect,
      points: isCorrect ? question.points : 0,
      totalScore: game.results[playerResultIndex].score
    });
  } catch (error) {
    console.error('Hiba a válasz beküldésekor:', error);
    res.status(500).json({ message: 'Szerver hiba a válasz beküldésekor' });
  }
};


export const getGameResults = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const game = await Game.findById(req.params.id)
      .populate('results.player', 'username')
      .populate('quiz');
    
    if (!game) {
      res.status(404).json({ message: 'Játék nem található' });
      return;
    }

    
    const isPlayer = game.players.some(playerId => playerId.toString() === req.user._id.toString());
    if (req.user.role !== UserRole.ADMIN && !isPlayer) {
      res.status(403).json({ message: 'Nincs jogosultságod az eredmények megtekintéséhez' });
      return;
    }

    
    const results = game.results.sort((a, b) => b.score - a.score);
    
    res.json(results);
  } catch (error) {
    console.error('Hiba a játék eredményeinek lekérdezésekor:', error);
    res.status(500).json({ message: 'Szerver hiba a játék eredményeinek lekérdezésekor' });
  }
};


export const startGame = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const game = await Game.findById(req.params.id);
    
    if (!game) {
      res.status(404).json({ message: 'Játék nem található' });
      return;
    }

    
    const isHost = game.host && game.host.toString() === req.user._id.toString();

    if (!isHost && req.user.role !== UserRole.ADMIN) {
      res.status(403).json({ message: 'Csak a játék házigazdája indíthatja el a játékot' });
      return;
    }

    
    if (game.status === GameStatus.ACTIVE) {
      res.status(400).json({ message: 'A játék már elindult' });
      return;
    }
    if (game.status === GameStatus.COMPLETED) {
      res.status(400).json({ message: 'A játék már lezárult' });
      return;
    }

    
    game.status = GameStatus.ACTIVE;
    
    
    if (!game.startTime) {
      game.startTime = new Date();
      
      
      if (!game.endTime) {
        const endTime = new Date();
        endTime.setHours(endTime.getHours() + 1);
        game.endTime = endTime;
      }
    }
    
    await game.save();
    
    res.json(game);
  } catch (error) {
    console.error('Hiba a játék indításakor:', error);
    res.status(500).json({ message: 'Szerver hiba a játék indításakor' });
  }
};
