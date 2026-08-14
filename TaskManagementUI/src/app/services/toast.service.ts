import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Comment {
  author: string;
  text: string;
  time: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'backlog' | 'todo' | 'progress' | 'review' | 'done';
  assignee: string;
  dueDate: string;
  createdAt: string;
  comments: Comment[];
}

export interface Activity {
  id: number;
  type: 'created' | 'updated' | 'moved' | 'completed' | 'comment';
  message: string;
  time: string;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private defaultTasks: Task[] = [
    { id: 1, title: 'API Gateway Mimarisi', description: 'Mikroservisler arası yönlendirme yapısı', priority: 'high', status: 'backlog', assignee: 'Fatih Bey', dueDate: '2026-07-28', createdAt: '2026-07-20', comments: [{ author: 'Harun Bey', text: 'İlk inceleme yapıldı.', time: '14:20' }] },
    { id: 2, title: 'UI Renk Paleti Revizyonu', description: 'Uzay teması tonlarının güncellenmesi', priority: 'medium', status: 'todo', assignee: 'Rana', dueDate: '2026-07-26', createdAt: '2026-07-21', comments: [] },
    { id: 3, title: 'Entity Framework Optimizasyonu', description: 'Sorgu performans iyileştirmeleri', priority: 'high', status: 'progress', assignee: 'Rana', dueDate: '2026-07-27', createdAt: '2026-07-22', comments: [{ author: 'Fatih Bey', text: 'Index ekleyelim.', time: '11:05' }] },
    { id: 4, title: 'JWT Kimlik Doğrulama', description: 'Güvenlik token sürelerinin ayarlanması', priority: 'urgent', status: 'review', assignee: 'Harun Bey', dueDate: '2026-07-25', createdAt: '2026-07-19', comments: [] },
    { id: 5, title: 'Proje Altyapı Kurulumu', description: 'Angular ve .NET tabanının ayağa kaldırılması', priority: 'low', status: 'done', assignee: 'Rana', dueDate: '2026-07-20', createdAt: '2026-07-15', comments: [{ author: 'Rana', time: '09:00', text: 'İlk sürüm tamamlandı.' }] }
  ];

  private defaultActivities: Activity[] = [
    { id: 1, type: 'completed', message: 'Rana "Proje Altyapı Kurulumu" görevini tamamladı', time: '2 saat önce', timestamp: Date.now() - 7200000 },
    { id: 2, type: 'moved', message: 'Fatih Bey "API Gateway Mimarisi" görevini Backlog\'a ekledi', time: '4 saat önce', timestamp: Date.now() - 14400000 },
    { id: 3, type: 'comment', message: 'Harun Bey "API Gateway Mimarisi" görevine yorum yaptı', time: '5 saat önce', timestamp: Date.now() - 18000000 },
    { id: 4, type: 'created', message: 'Yeni görev oluşturuldu: "UI Renk Paleti Revizyonu"', time: '1 gün önce', timestamp: Date.now() - 86400000 }
  ];

  private tasksSubject = new BehaviorSubject<Task[]>(this.loadTasks());
  private activitiesSubject = new BehaviorSubject<Activity[]>(this.loadActivities());

  tasks$ = this.tasksSubject.asObservable();
  activities$ = this.activitiesSubject.asObservable();

  private loadTasks(): Task[] {
    const saved = localStorage.getItem('ranacore_tasks_v2');
    return saved ? JSON.parse(saved) : this.defaultTasks;
  }

  private loadActivities(): Activity[] {
    const saved = localStorage.getItem('ranacore_activities_v2');
    return saved ? JSON.parse(saved) : this.defaultActivities;
  }

  private saveTasks(tasks: Task[]) {
    localStorage.setItem('ranacore_tasks_v2', JSON.stringify(tasks));
    this.tasksSubject.next(tasks);
  }

  private saveActivities(activities: Activity[]) {
    localStorage.setItem('ranacore_activities_v2', JSON.stringify(activities));
    this.activitiesSubject.next(activities);
  }

  logActivity(type: Activity['type'], message: string) {
    const current = this.activitiesSubject.value;
    const newAct: Activity = {
      id: Date.now(),
      type,
      message,
      time: 'Az önce',
      timestamp: Date.now()
    };
    this.saveActivities([newAct, ...current]);
  }

  getAllTasks(): Task[] {
    return this.tasksSubject.value;
  }

  addTask(task: Omit<Task, 'id' | 'createdAt' | 'comments'>) {
    const current = this.tasksSubject.value;
    const newTask: Task = {
      ...task,
      id: Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
      comments: []
    };
    this.saveTasks([newTask, ...current]);
    this.logActivity('created', `Yeni görev oluşturuldu: "${newTask.title}"`);
  }

  updateTask(id: number, updates: Partial<Task>) {
    const current = this.tasksSubject.value;
    const updated = current.map(t => t.id === id ? { ...t, ...updates } : t);
    this.saveTasks(updated);
    this.logActivity('updated', `Görev güncellendi`);
  }

  moveTaskStatus(id: number, newStatus: Task['status']) {
    const current = this.tasksSubject.value;
    const task = current.find(t => t.id === id);
    if (task && task.status !== newStatus) {
      task.status = newStatus;
      this.saveTasks([...current]);
      this.logActivity('moved', `"${task.title}" görevi ${newStatus.toUpperCase()} durumuna taşındı`);
      if (newStatus === 'done') {
        this.logActivity('completed', `"${task.title}" görevi tamamlandı`);
      }
    }
  }

  addComment(taskId: number, author: string, text: string) {
    const current = this.tasksSubject.value;
    const task = current.find(t => t.id === taskId);
    if (task) {
      task.comments.push({
        author,
        text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      this.saveTasks([...current]);
      this.logActivity('comment', `${author} "${task.title}" görevine yorum yaptı`);
    }
  }

  deleteTask(id: number) {
    const current = this.tasksSubject.value;
    const task = current.find(t => t.id === id);
    const filtered = current.filter(t => t.id !== id);
    this.saveTasks(filtered);
    if (task) {
      this.logActivity('updated', `"${task.title}" görevi silindi`);
    }
  }
}