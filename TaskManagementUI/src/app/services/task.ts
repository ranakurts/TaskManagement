import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';

// --- TYPES & INTERFACES ---
export type TaskStatusType = 'todo' | 'in-progress' | 'review' | 'completed';
export type PriorityType = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatusType;
  priority: PriorityType;
  storyPoint?: number;
  dueDate?: string;
  sprintId?: string | null;
}

export interface Sprint {
  id: string;
  name: string;
  status: 'Planned' | 'Active' | 'Completed';
  goal?: string;
  plannedStartDate?: string; // EKLENDİ
  plannedEndDate?: string;   // EKLENDİ
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  isInvite?: boolean;
  inviteStatus?: 'pending' | 'accepted' | 'rejected';
  inviteId?: string;
  time?: string;
}

export interface TeamMember {
  email: string;
  role: string;
  status: 'Active' | 'Pending';
  name?: string;
}

export interface AppSettings {
  theme: string;
  language: string;
  notificationsEnabled: boolean;
}

// --- SERVICE ---
@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private authService = inject(AuthService);

  private tasksSubject = new BehaviorSubject<Task[]>([]);
  tasks$ = this.tasksSubject.asObservable();

  private sprintsSubject = new BehaviorSubject<Sprint[]>([]);
  sprints$ = this.sprintsSubject.asObservable();

  private notificationsSubject = new BehaviorSubject<AppNotification[]>([]);
  notifications$ = this.notificationsSubject.asObservable();

  private teamSubject = new BehaviorSubject<TeamMember[]>([]);
  team$ = this.teamSubject.asObservable();

  private settingsSubject = new BehaviorSubject<AppSettings>({ theme: 'dark', language: 'en', notificationsEnabled: true });
  settings$ = this.settingsSubject.asObservable();

  constructor() {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.loadWorkspaceData(user.email);
      } else {
        this.wipeMemoryCaches();
      }
    });
  }

  private wipeMemoryCaches() {
    this.tasksSubject.next([]);
    this.sprintsSubject.next([]);
    this.notificationsSubject.next([]);
    this.teamSubject.next([]);
    this.settingsSubject.next({ theme: 'dark', language: 'en', notificationsEnabled: true });
  }

  private loadWorkspaceData(email: string) {
    const taskKey = `db_tasks_${email}`;
    const savedTasks = localStorage.getItem(taskKey);
    this.tasksSubject.next(savedTasks ? JSON.parse(savedTasks) : []);

    const sprintKey = `db_sprints_${email}`;
    const savedSprints = localStorage.getItem(sprintKey);
    this.sprintsSubject.next(savedSprints ? JSON.parse(savedSprints) : []);

    const notifKey = `db_notifs_${email}`;
    const savedNotifs = localStorage.getItem(notifKey);
    this.notificationsSubject.next(savedNotifs ? JSON.parse(savedNotifs) : []);

    const teamKey = `db_team_${email}`;
    const savedTeam = localStorage.getItem(teamKey);
    if (savedTeam) {
      this.teamSubject.next(JSON.parse(savedTeam));
    } else {
      this.teamSubject.next([
        { email: email, role: 'Workspace Owner', status: 'Active', name: email.split('@')[0] }
      ]);
    }

    const settingsKey = `db_settings_${email}`;
    const savedSettings = localStorage.getItem(settingsKey);
    if (savedSettings) {
      this.settingsSubject.next(JSON.parse(savedSettings));
    }
  }

  // --- DATABASE WRITE METHODS ---
  private saveCurrentTasks() {
    const user = this.authService.getCurrentUser();
    if (user) localStorage.setItem(`db_tasks_${user.email}`, JSON.stringify(this.tasksSubject.value));
  }

  private saveCurrentSprints() {
    const user = this.authService.getCurrentUser();
    if (user) localStorage.setItem(`db_sprints_${user.email}`, JSON.stringify(this.sprintsSubject.value));
  }

  private saveCurrentNotifications() {
    const user = this.authService.getCurrentUser();
    if (user) localStorage.setItem(`db_notifs_${user.email}`, JSON.stringify(this.notificationsSubject.value));
  }

  private saveCurrentTeam() {
    const user = this.authService.getCurrentUser();
    if (user) localStorage.setItem(`db_team_${user.email}`, JSON.stringify(this.teamSubject.value));
  }

  // --- TASK ACTIONS ---
  addTask(taskData: Omit<Task, 'id'>) {
    const newTask: Task = { ...taskData, id: Math.random().toString(36).substring(2, 9) };
    const current = this.tasksSubject.value;
    this.tasksSubject.next([...current, newTask]);
    this.saveCurrentTasks();
  }

  updateTaskStatus(id: string, status: TaskStatusType) {
    const current = this.tasksSubject.value;
    const updated = current.map(t => t.id === id ? { ...t, status } : t);
    this.tasksSubject.next(updated);
    this.saveCurrentTasks();
  }

  deleteTask(id: string) {
    const current = this.tasksSubject.value;
    const updated = current.filter(t => t.id !== id);
    this.tasksSubject.next(updated);
    this.saveCurrentTasks();
  }

  moveTaskToSprint(taskId: string, sprintId: string | null) {
    const current = this.tasksSubject.value;
    const updated = current.map(t => t.id === taskId ? { ...t, sprintId } : t);
    this.tasksSubject.next(updated);
    this.saveCurrentTasks();
  }

  // --- SPRINT ACTIONS ---
  startSprint(sprintId: string, sprintName?: string): { message: string } {
    const current = this.sprintsSubject.value;
    const updated = current.map(s => s.id === sprintId ? { ...s, status: 'Active' as const } : s);
    this.sprintsSubject.next(updated);
    this.saveCurrentSprints();
    return { message: 'Sprint başarıyla başlatıldı.' };
  }

  completeSprint(sprintId: string, actionOrName?: string): { message: string } {
    const current = this.sprintsSubject.value;
    const updated = current.map(s => s.id === sprintId ? { ...s, status: 'Completed' as const } : s);
    this.sprintsSubject.next(updated);
    this.saveCurrentSprints();
    return { message: 'Sprint başarıyla tamamlandı.' };
  }

  // --- TEAM ACTIONS ---
  sendTeamInvitation(teamName: string, email: string): { success: boolean, message: string } {
    const currentTeam = this.teamSubject.value;
    if (currentTeam.find(m => m.email === email)) {
      return { success: false, message: 'This user is already in the workspace or invited.' };
    }
    const newMember: TeamMember = { email, role: 'Member', status: 'Pending', name: email.split('@')[0] };
    this.teamSubject.next([...currentTeam, newMember]);
    this.saveCurrentTeam();
    return { success: true, message: `Invitation sent successfully to ${email}.` };
  }

  respondToInvitation(email: string, accept: boolean) {
    let currentTeam = this.teamSubject.value;
    if (accept) {
      currentTeam = currentTeam.map(m => m.email === email ? { ...m, status: 'Active' } : m);
    } else {
      currentTeam = currentTeam.filter(m => m.email !== email);
    }
    this.teamSubject.next(currentTeam);
    this.saveCurrentTeam();
  }

  // --- NOTIFICATION ACTIONS ---
  markAllNotificationsRead() {
    const current = this.notificationsSubject.value;
    const updated = current.map(n => ({ ...n, read: true }));
    this.notificationsSubject.next(updated);
    this.saveCurrentNotifications();
  }
}