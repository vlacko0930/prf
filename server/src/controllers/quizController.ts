import { Request, Response, NextFunction } from 'express';
import Quiz, { IQuiz } from '../models/Quiz';
import Question from '../models/Question';
import { UserRole } from '../models/User';


export const getQuizzes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const quizzes = await Quiz.find()
      .populate('creator', 'username')
      .populate('questions');
    
    res.json(quizzes);
  } catch (error) {
    console.error('Hiba a kvízek lekérdezésekor:', error);
    res.status(500).json({ message: 'Szerver hiba a kvízek lekérdezésekor' });
  }
};


export const getQuizById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('creator', 'username')
      .populate('questions');
    
    if (!quiz) {
      res.status(404).json({ message: 'Kvíz nem található' });
      return;
    }
    
    res.json(quiz);
  } catch (error) {
    console.error('Hiba a kvíz lekérdezésekor:', error);
    res.status(500).json({ message: 'Szerver hiba a kvíz lekérdezésekor' });
  }
};


export const createQuiz = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { 
    title, 
    description, 
    category, 
    difficulty,
    timeLimit,
    questions 
  } = req.body;

  try {
    
    if (req.user.role !== UserRole.ADMIN) {
      res.status(403).json({ message: 'Csak admin hozhat létre kvízt' });
      return;
    }

    const quizData: any = {
      title,
      description,
      category: category || 'Általános',
      difficulty: difficulty || 'közepes',
      timeLimit: timeLimit === undefined || timeLimit === '' ? null : timeLimit, 
      creator: req.user._id,
      questions: []
    };

    
    if (questions && Array.isArray(questions) && questions.length > 0) {
      quizData.questions = questions;
    }

    const quiz = await Quiz.create(quizData);

    if (questions && Array.isArray(questions) && questions.length > 0) {
      const newQuestionIds = questions.map(q => typeof q === 'string' ? q : q._id.toString());
      for (const questionId of newQuestionIds) {
        const question = await Question.findById(questionId);
        if (question && quiz && quiz._id && !question.quizzes.includes(quiz._id)) {
          question.quizzes.push(quiz._id);
          await question.save();
          console.log(`A ${questionId} kérdéshez hozzáadva a ${quiz._id} kvíz`);
        }
      }
    }
    res.status(201).json(quiz);
  } catch (error) {
    console.error('Hiba a kvíz létrehozásakor:', error);
    res.status(500).json({ message: 'Szerver hiba a kvíz létrehozásakor' });
  }
};


export const updateQuiz = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { 
    title, 
    description, 
    category, 
    difficulty, 
    timeLimit,
    questions 
  } = req.body;

  try {
    
    if (req.user.role !== UserRole.ADMIN) {
      res.status(403).json({ message: 'Csak admin módosíthat kvízt' });
      return;
    }

    let quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      res.status(404).json({ message: 'Kvíz nem található' });
      return;
    }

    
    if (quiz.creator.toString() !== req.user._id.toString()) {
      res.status(403).json({ message: 'Csak a saját kvízt módosíthatja' });
      return;
    }

    
    const updateData: any = {
      title,
      description,
      category,
      difficulty,
      timeLimit: timeLimit === undefined || timeLimit === '' ? null : timeLimit 
    };

    
    if (questions && Array.isArray(questions)) {
      
      const currentQuestionIds = quiz.questions.map(q => q.toString());
      
      
      const newQuestionIds = questions.map(q => typeof q === 'string' ? q : q._id.toString());
      
      
      const questionsToAdd = newQuestionIds.filter(id => !currentQuestionIds.includes(id));
      
      
      const questionsToRemove = currentQuestionIds.filter(id => !newQuestionIds.includes(id));
      
      
      
      for (const questionId of questionsToAdd) {
        const question = await Question.findById(questionId);
        if (question && quiz && quiz._id && !question.quizzes.includes(quiz._id)) {
          question.quizzes.push(quiz._id);
          await question.save();
          console.log(`A ${questionId} kérdéshez hozzáadva a ${quiz._id} kvíz`);
        }
      }
      
      
      for (const questionId of questionsToRemove) {
        const question = await Question.findById(questionId);
        if (question) {
          
          const quizIdString = req.params.id;
          question.quizzes = question.quizzes.filter(id => id.toString() !== quizIdString);
          await question.save();
          console.log(`A ${questionId} kérdésből eltávolítva a ${quizIdString} kvíz`);
        }
      }
      
      updateData.questions = questions;
    }

    
    quiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('questions');

    
    res.json(quiz);
  } catch (error) {
    console.error('Hiba a kvíz frissítésekor:', error);
    res.status(500).json({ message: 'Szerver hiba a kvíz frissítésekor' });
  }
};


export const deleteQuiz = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    
    if (req.user.role !== UserRole.ADMIN) {
      res.status(403).json({ message: 'Csak admin törölhet kvízt' });
      return;
    }

    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      res.status(404).json({ message: 'Kvíz nem található' });
      return;
    }

    
    if (quiz.creator.toString() !== req.user._id.toString()) {
      res.status(403).json({ message: 'Csak a saját kvízt törölheti' });
      return;
    }

    
    await Question.deleteMany({ quiz: req.params.id });

    await quiz.deleteOne();
    res.json({ message: 'Kvíz és a hozzá tartozó kérdések sikeresen törölve' });
  } catch (error) {
    console.error('Hiba a kvíz törlésekor:', error);
    res.status(500).json({ message: 'Szerver hiba a kvíz törlésekor' });
  }
};


export const addQuestionToQuiz = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { quizId, questionId } = req.params;

  try {
    
    if (req.user.role !== UserRole.ADMIN) {
      res.status(403).json({ message: 'Csak admin adhat hozzá kérdést' });
      return;
    }

    const quiz = await Quiz.findById(quizId);
    
    if (!quiz) {
      res.status(404).json({ message: 'Kvíz nem található' });
      return;
    }

    const question = await Question.findById(questionId);
    
    if (!question) {
      res.status(404).json({ message: 'Kérdés nem található' });
      return;
    }

    
    if (quiz.questions.includes(question._id as any)) {
      res.status(400).json({ message: 'Ez a kérdés már hozzá van adva a kvízhez' });
      return;
    }

    
    quiz.questions.push(question._id as any);
    await quiz.save();
    
    
    if (question && quiz && quiz._id && !question.quizzes.includes(quiz._id as any)) {
      question.quizzes.push(quiz._id as any);
      await question.save();
    }

    res.json(quiz);
  } catch (error) {
    console.error('Hiba a kérdés hozzáadásakor:', error);
    res.status(500).json({ message: 'Szerver hiba a kérdés hozzáadásakor' });
  }
};


export const removeQuestionFromQuiz = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { quizId, questionId } = req.params;

  try {
    
    if (req.user.role !== UserRole.ADMIN) {
      res.status(403).json({ message: 'Csak admin távolíthat el kérdést' });
      return;
    }

    const quiz = await Quiz.findById(quizId);
    
    if (!quiz) {
      res.status(404).json({ message: 'Kvíz nem található' });
      return;
    }

    
    if (!quiz.questions.includes(questionId as any)) {
      res.status(400).json({ message: 'Ez a kérdés nincs hozzáadva a kvízhez' });
      return;
    }

    
    quiz.questions = quiz.questions.filter(id => id.toString() !== questionId);
    await quiz.save();

    
    const question = await Question.findById(questionId);
    if (question) {
      
      if (quiz && quiz._id) {
        question.quizzes = question.quizzes.filter(id => id.toString() !== quizId);
        await question.save();
      }
    }

    res.json(quiz);
  } catch (error) {
    console.error('Hiba a kérdés eltávolításakor:', error);
    res.status(500).json({ message: 'Szerver hiba a kérdés eltávolításakor' });
  }
};