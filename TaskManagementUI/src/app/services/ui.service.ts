import { Injectable, signal } from '@angular/core';
import { SaveTaskRequest, TaskItem } from '../models/task.model';

export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  text: string;
  action?: { label: string; run: () => void };
}

export interface TaskModalState {
  task?: TaskItem;                       // varsa düzenleme
  defaults?: Partial<SaveTaskRequest>;   // yeni görev için ön değerler (ör. takvimden tarih)
}

// Uygulama genelindeki katmanların (modal, çekmece, palet, bildirim) durumu
@Injectable({ providedIn: 'root' })
export class UiService {
  readonly toasts = signal<Toast[]>([]);
  readonly taskModal = signal<TaskModalState | null>(null);
  readonly drawerTaskId = signal<number | null>(null);
  readonly paletteOpen = signal(false);

  private toastId = 0;

  toast(text: string, kind: ToastKind = 'success', action?: Toast['action']) {
    const id = ++this.toastId;
    this.toasts.update(list => [...list.slice(-3), { id, kind, text, action }]);
    setTimeout(() => this.dismissToast(id), action ? 6000 : 3500);
  }

  error(text: string) {
    this.toast(text, 'error');
  }

  dismissToast(id: number) {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }

  newTask(defaults?: Partial<SaveTaskRequest>) {
    this.paletteOpen.set(false);
    this.taskModal.set({ defaults });
  }

  editTask(task: TaskItem) {
    this.taskModal.set({ task });
  }

  closeTaskModal() {
    this.taskModal.set(null);
  }

  openTask(id: number) {
    this.paletteOpen.set(false);
    this.drawerTaskId.set(id);
  }

  closeDrawer() {
    this.drawerTaskId.set(null);
  }

  // Herhangi bir katman açık mı (kısayolların çakışmaması için)
  anyLayerOpen(): boolean {
    return !!this.taskModal() || this.drawerTaskId() !== null || this.paletteOpen();
  }
}
