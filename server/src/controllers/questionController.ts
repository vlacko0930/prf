import { Request, Response, NextFunction } from 'express';
import Question, { IQuestion } from '../models/Question';
import Quiz from '../models/Quiz';
import { UserRole } from '../models/User';


export const getQuestions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const questions = await Question.find().populate('quizzes', 'title');
    
    res.json(questions);
  } catch (error) {
    console.error('Hiba a kérdések lekérdezésekor:', error);
    res.status(500).json({ message: 'Szerver hiba a kérdések lekérdezésekor' });
  }
};


export const getQuestionById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const question = await Question.findById(req.params.id).populate('quizzes', 'title');
    
    if (!question) {
      res.status(404).json({ message: 'Kérdés nem található' });
      return;
    }
    
    res.json(question);
  } catch (error) {
    console.error('Hiba a kérdés lekérdezésekor:', error);
    res.status(500).json({ message: 'Szerver hiba a kérdés lekérdezésekor' });
  }
};


export const getQuestionsByIds = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ message: 'Érvényes kérdés ID-k tömbje szükséges' });
      return;
    }

    const questions = await Question.find({
      _id: { $in: ids }
    }).populate('quizzes', 'title');
    
    res.json(questions);
  } catch (error) {
    console.error('Hiba a kérdések ID-k alapján történő lekérdezésekor:', error);
    res.status(500).json({ message: 'Szerver hiba a kérdések lekérdezésekor' });
  }
};


export const getQuestionsByQuiz = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const questions = await Question.find({ quizzes: req.params.quizId }).populate('quizzes', 'title');
    
    res.json(questions);
  } catch (error) {
    console.error('Hiba a kvízhez tartozó kérdések lekérdezésekor:', error);
    res.status(500).json({ message: 'Szerver hiba a kvízhez tartozó kérdések lekérdezésekor' });
  }
};


export const createQuestion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { text, answers, options, points, quizId, category, difficulty, explanation } = req.body;

  try {
    
    if (req.user.role !== UserRole.ADMIN) {
      res.status(403).json({ message: 'Csak admin hozhat létre kérdést' });
      return;
    }

    
    const answerItems = answers || options;

    
    if (!answerItems || !Array.isArray(answerItems) || answerItems.length < 2) {
      res.status(400).json({ message: 'Legalább 2 válaszlehetőség megadása szükséges' });
      return;
    }

    
    const hasCorrectAnswer = answerItems.some((answer: any) => answer && answer.isCorrect === true);
    if (!hasCorrectAnswer) {
      res.status(400).json({ message: 'Legalább egy helyes válasznak lennie kell' });
      return;
    }

    
    const questionData: any = {
      text,
      answers: answerItems, 
      points: points || 1,
      category,
      difficulty,
      explanation,
      quizzes: [] 
    };

    
    if (quizId) {
      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
        res.status(404).json({ message: 'Kvíz nem található' });
        return;
      }
      
      
      questionData.quizzes.push(quizId);
      
      const question = await Question.create(questionData);
      
      
      quiz.questions.push(question._id as any);
      await quiz.save();
      
      res.status(201).json(question);
    } else {
      
      const question = await Question.create(questionData);
      res.status(201).json(question);
    }
  } catch (error) {
    console.error('Hiba a kérdés létrehozásakor:', error);
    res.status(500).json({ message: 'Szerver hiba a kérdés létrehozásakor', error: (error as Error).message });
  }
};


export const updateQuestion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { text, answers, options, points, quizId, quizzes, category, difficulty, explanation } = req.body;

  try {
    
    if (req.user.role !== UserRole.ADMIN) {
      res.status(403).json({ message: 'Csak admin módosíthat kérdést' });
      return;
    }

    let question = await Question.findById(req.params.id);
    
    if (!question) {
      res.status(404).json({ message: 'Kérdés nem található' });
      return;
    }

    
    const answerItems = answers || options;

    
    if (answerItems) {
      if (!Array.isArray(answerItems) || answerItems.length < 2) {
        res.status(400).json({ message: 'Legalább 2 válaszlehetőség megadása szükséges' });
        return;
      }

      
      const hasCorrectAnswer = answerItems.some((answer: any) => answer && answer.isCorrect === true);
      if (!hasCorrectAnswer) {
        res.status(400).json({ message: 'Legalább egy helyes válasznak lennie kell' });
        return;
      }
    }

    
    const updateData: any = {
      text,
      points,
      category,
      difficulty,
      explanation
    };

    if (answerItems) {
      updateData['answers'] = answerItems;
    }

    
    if (quizId) {
      
      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
        res.status(404).json({ message: 'Kvíz nem található' });
        return;
      }

      
      const isQuestionInQuiz = question.quizzes.some(q => q.toString() === quizId);
      
      if (!isQuestionInQuiz) {
        
        quiz.questions.push(question._id as any);
        await quiz.save();
        
        
        question.quizzes.push(quizId);
        await question.save();
      }
    } else if (quizzes && Array.isArray(quizzes)) {
      
      
      
      const currentQuizIds = question.quizzes.map(q => q.toString());
      
      
      const quizzesToAdd = quizzes.filter(quizId => !currentQuizIds.includes(quizId));
      
      
      const quizzesToRemove = currentQuizIds.filter(quizId => !quizzes.includes(quizId));
      
      
      for (const quizId of quizzesToAdd) {
        const quiz = await Quiz.findById(quizId);
        if (quiz) {
          quiz.questions.push(question._id as any);
          await quiz.save();
        }
      }
      
      
      for (const quizId of quizzesToRemove) {
        await Quiz.updateOne(
          { _id: quizId },
          { $pull: { questions: question._id } }
        );
      }
      
      
      updateData.quizzes = quizzes;
    }

    question = await Question.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json(question);
  } catch (error) {
    console.error('Hiba a kérdés frissítésekor:', error);
    res.status(500).json({ message: 'Szerver hiba a kérdés frissítésekor' });
  }
};


export const deleteQuestion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    
    if (req.user.role !== UserRole.ADMIN) {
      res.status(403).json({ message: 'Csak admin törölhet kérdést' });
      return;
    }

    const question = await Question.findById(req.params.id);
    
    if (!question) {
      res.status(404).json({ message: 'Kérdés nem található' });
      return;
    }

    
    if (question.quizzes && question.quizzes.length > 0) {
      
      await Quiz.updateMany(
        { _id: { $in: question.quizzes } },
        { $pull: { questions: question._id } }
      );
    }

    await question.deleteOne();
    res.json({ message: 'Kérdés sikeresen törölve' });
  } catch (error) {
    console.error('Hiba a kérdés törlésekor:', error);
    res.status(500).json({ message: 'Szerver hiba a kérdés törlésekor' });
  }
};