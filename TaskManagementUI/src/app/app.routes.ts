import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./components/layout/layout').then(m => m.LayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardComponent) },
      { path: 'tasks', loadComponent: () => import('./pages/tasks/tasks').then(m => m.TasksComponent) },
      { path: 'board', loadComponent: () => import('./pages/board/board').then(m => m.BoardComponent) },
      { path: 'calendar', loadComponent: () => import('./pages/calendar/calendar').then(m => m.CalendarComponent) },
      { path: 'reports', loadComponent: () => import('./pages/reports/reports').then(m => m.ReportsComponent) },
      { path: 'team', loadComponent: () => import('./pages/team/team').then(m => m.TeamComponent) },
      { path: 'settings', loadComponent: () => import('./pages/settings/settings').then(m => m.SettingsComponent) }
    ]
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/register/register').then(m => m.RegisterComponent)
  },
  { path: '**', redirectTo: 'dashboard' }
];
