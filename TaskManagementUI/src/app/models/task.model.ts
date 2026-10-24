export type TaskStatus = 'todo' | 'inProgress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export const TASK_STATUSES: TaskStatus[] = ['todo', 'inProgress', 'review', 'done'];
export const TASK_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'critical'];

export const PRIORITY_WEIGHT: Record<TaskPriority, number> = { critical: 4, high: 3, medium: 2, low: 1 };

export interface TaskItem {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  startDate: string | null;   // yyyy-MM-dd
  dueDate: string | null;     // yyyy-MM-dd
  teamId: number | null;
  teamName: string | null;
  assignedUserId: number | null;
  assignedUserName: string | null;
  createdById: number;
  createdByName: string;
  createdAt: string;          // ISO UTC
  updatedAt: string | null;
  completedAt: string | null;
  commentCount: number;
  canDelete: boolean;
}

export interface SaveTaskRequest {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  startDate?: string | null;
  dueDate?: string | null;
  teamId?: number | null;
  assignedUserId?: number | null;
}

export interface TaskComment {
  id: number;
  content: string;
  userId: number;
  userName: string;
  createdAt: string;
}

export type DueState = 'none' | 'overdue' | 'today' | 'soon' | 'later' | 'done';

// ===== Tarih yardımcıları (yerel gün bazında) =====

export function todayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDay(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function daysUntil(key: string): number {
  const today = parseDay(todayKey());
  return Math.round((parseDay(key).getTime() - today.getTime()) / 86400000);
}

export function dueState(task: Pick<TaskItem, 'dueDate' | 'status'>): DueState {
  if (task.status === 'done') return 'done';
  if (!task.dueDate) return 'none';
  const diff = daysUntil(task.dueDate);
  if (diff < 0) return 'overdue';
  if (diff === 0) return 'today';
  if (diff <= 3) return 'soon';
  return 'later';
}

// İsimden sabit bir renk tonu (avatarlar için)
export function hueFor(name: string | null | undefined): number {
  let h = 0;
  for (const ch of name || '?') h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}

export function initials(name: string | null | undefined): string {
  const parts = (name || '?').trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] || '?').slice(0, 2);
  return letters.toLocaleUpperCase('tr-TR');
}
