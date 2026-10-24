import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_BASE_URL } from '../api.config';
import { SaveTaskRequest, TaskComment, TaskItem, TaskStatus } from '../models/task.model';
import { AuthService } from './auth.service';

// Görevlerin tek kaynağı: backend'den yüklenir, tüm sayfalar aynı listeyi paylaşır.
@Injectable({ providedIn: 'root' })
export class TaskStoreService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private api = `${API_BASE_URL}/tasks`;

  private readonly _tasks = signal<TaskItem[]>([]);
  readonly tasks = this._tasks.asReadonly();
  readonly loading = signal(false);
  readonly loaded = signal(false);
  readonly error = signal<string | null>(null);

  readonly openTasks = computed(() => this._tasks().filter(t => t.status !== 'done'));

  constructor() {
    // Oturum değişince eski kullanıcının görevleri ekranda kalmasın
    this.auth.currentUser$.subscribe(user => {
      if (!user) {
        this._tasks.set([]);
        this.loaded.set(false);
      }
    });
  }

  load(force = false): void {
    if (this.loading() || (this.loaded() && !force)) return;
    this.loading.set(true);
    this.http.get<TaskItem[]>(this.api).subscribe({
      next: tasks => {
        this._tasks.set(tasks);
        this.loaded.set(true);
        this.loading.set(false);
        this.error.set(null);
      },
      error: err => {
        this.loading.set(false);
        this.error.set(err.status === 0 ? 'server' : 'load');
      }
    });
  }

  refresh(): void {
    this.loading.set(false);
    this.load(true);
  }

  byId(id: number): TaskItem | undefined {
    return this._tasks().find(t => t.id === id);
  }

  create(request: SaveTaskRequest): Observable<TaskItem> {
    return this.http.post<TaskItem>(this.api, request).pipe(
      tap(task => this._tasks.update(list => [task, ...list]))
    );
  }

  update(id: number, request: SaveTaskRequest): Observable<TaskItem> {
    return this.http.put<TaskItem>(`${this.api}/${id}`, request).pipe(tap(task => this.replace(task)));
  }

  // İyimser güncelleme: kart hemen yer değiştirir, hata olursa geri alınır
  setStatus(id: number, status: TaskStatus): Observable<TaskItem> {
    const previous = this.byId(id);
    if (previous) this.replace({ ...previous, status });
    return this.http.patch<TaskItem>(`${this.api}/${id}/status`, { status }).pipe(
      tap({
        next: task => this.replace(task),
        error: () => previous && this.replace(previous)
      })
    );
  }

  delete(id: number): Observable<unknown> {
    return this.http.delete(`${this.api}/${id}`).pipe(
      tap(() => this._tasks.update(list => list.filter(t => t.id !== id)))
    );
  }

  getComments(taskId: number): Observable<TaskComment[]> {
    return this.http.get<TaskComment[]>(`${this.api}/${taskId}/comments`);
  }

  addComment(taskId: number, content: string): Observable<TaskComment> {
    return this.http.post<TaskComment>(`${this.api}/${taskId}/comments`, { content }).pipe(
      tap(() => this._tasks.update(list => list.map(t => t.id === taskId ? { ...t, commentCount: t.commentCount + 1 } : t)))
    );
  }

  deleteComment(taskId: number, commentId: number): Observable<unknown> {
    return this.http.delete(`${this.api}/${taskId}/comments/${commentId}`).pipe(
      tap(() => this._tasks.update(list => list.map(t => t.id === taskId ? { ...t, commentCount: Math.max(0, t.commentCount - 1) } : t)))
    );
  }

  private replace(task: TaskItem) {
    this._tasks.update(list => list.map(t => (t.id === task.id ? task : t)));
  }
}
