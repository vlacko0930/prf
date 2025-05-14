import { Routes } from '@angular/router';

export const PLAYER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./game-list/game-list.component').then(c => c.GameListComponent)
  },
  {
    path: 'join/:id',
    loadComponent: () => import('./game-lobby/game-lobby.component').then(c => c.GameLobbyComponent)
  },
  {
    path: 'play/:id',
    loadComponent: () => import('./game-play/game-play.component').then(c => c.GamePlayComponent)
  },
  {
    path: 'results/:id',
    loadComponent: () => import('./game-results/game-results.component').then(c => c.GameResultsComponent)
  },
  {
    path: 'my-games',
    loadComponent: () => import('./my-games/my-games.component').then(c => c.MyGamesComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./create-game/create-game.component').then(c => c.CreateGameComponent)
  }
];