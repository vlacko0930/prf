import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./admin-dashboard/admin-dashboard.component').then(c => c.AdminDashboardComponent)
  },
  {
    path: 'users',
    loadComponent: () => import('./user-management/user-management.component').then(c => c.UserManagementComponent)
  },
  {
    path: 'quizzes',
    loadComponent: () => import('./quiz-management/quiz-management.component').then(c => c.QuizManagementComponent)
  },
  {
    path: 'quizzes/create',
    loadComponent: () => import('./quiz-form/quiz-form.component').then(c => c.QuizFormComponent)
  },
  {
    path: 'quizzes/edit/:id',
    loadComponent: () => import('./quiz-form/quiz-form.component').then(c => c.QuizFormComponent)
  },
  {
    path: 'questions',
    loadComponent: () => import('./question-management/question-management.component').then(c => c.QuestionManagementComponent)
  },
  {
    path: 'questions/create',
    loadComponent: () => import('./question-form/question-form.component').then(c => c.QuestionFormComponent)
  },
  {
    path: 'questions/edit/:id',
    loadComponent: () => import('./question-form/question-form.component').then(c => c.QuestionFormComponent)
  }
];