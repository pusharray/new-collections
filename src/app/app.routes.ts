import { Routes } from '@angular/router';
import { HomeService } from './services';

export const appRoutes: Routes = [
  {
    path: 'new-tab',
    providers: [HomeService],
    loadComponent: () => import('./components/new-tab/new-tab.component').then((m) => m.NewTabComponent),
  },
  {
    path: 'popup',
    loadComponent: () => import('./components/popup/popup.component').then((m) => m.PopupComponent),
  },
  {
    path: 'options',
    loadComponent: () => import('./components/options/options.component').then((m) => m.OptionsComponent),
  },
];
