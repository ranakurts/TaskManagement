import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/layout/layout').then((m: any) => m.LayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { 
        path: 'dashboard', 
        loadComponent: () => import('./pages/dashboard/dashboard').then((m: any) => m.DashboardComponent || m.Dashboard || m.default) 
      },
      { 
        path: 'tasks', 
        loadComponent: () => import('./pages/tasks/tasks').then((m: any) => m.TasksComponent || m.Tasks || m.default) 
      },
      { 
        path: 'board', 
        loadComponent: () => import('./pages/board/board').then((m: any) => m.BoardComponent || m.Board || m.default) 
      },
      { 
        path: 'calendar', 
        loadComponent: () => import('./pages/calendar/calendar').then((m: any) => m.CalendarComponent || m.Calendar || m.default) 
      },
      { 
        path: 'reports', 
        loadComponent: () => import('./pages/reports/reports').then((m: any) => m.ReportsComponent || m.Reports || m.default) 
      },
      { 
        path: 'settings', 
        loadComponent: () => import('./pages/settings/settings').then((m: any) => m.SettingsComponent || m.Settings || m.default) 
      }
    ]
  },
  { 
    path: 'login', 
    loadComponent: () => import('./pages/login/login').then((m: any) => m.LoginComponent || m.Login || m.default) 
  },
  { 
    path: 'register', 
    loadComponent: () => import('./pages/register/register').then((m: any) => m.RegisterComponent || m.Register || m.default) 
  },
  { path: '**', redirectTo: 'dashboard' }
];