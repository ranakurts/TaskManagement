import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService, Task, TaskStatusType, PriorityType } from '../../services/task';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="workspace-container">
      
      <div class="page-header-card dash-card" (mouseenter)="setRandomColor($event)">
        <div class="header-row">
          <div class="header-text">
            <h1>{{ t('tasks.title') }}</h1>
            <p>{{ t('tasks.desc') }}</p>
          </div>
          <button class="ai-btn primary" (click)="toggleNewTaskModal()">+ New Task</button>
        </div>
      </div>

      <div class="board-grid">
        
        <!-- TO DO -->
        <div class="column dash-card" 
             (mouseenter)="setRandomColor($event)"
             (dragover)="$event.preventDefault()" 
             (drop)="onDrop($event, 'todo')">
          <h3>{{ t('col.todo') }} ({{ getTasksByStatus('todo').length }})</h3>
          <div class="task-list">
            <div *ngFor="let task of getTasksByStatus('todo')" 
                 class="task-card" 
                 draggable="true" 
                 (dragstart)="onDragStart($event, task.id)">
              <h4>{{ task.title }}</h4>
              <p>{{ task.description }}</p>
              <div class="task-footer">
                <span class="priority-badge" [ngClass]="task.priority">{{ task.priority }}</span>
                <div class="footer-actions">
                  <button class="ai-btn sm" (click)="moveStatus(task.id, 'in-progress')">{{ t('board.start') }}</button>
                  <button class="ai-btn danger-sm" (click)="deleteTask(task.id)">✕</button>
                </div>
              </div>
            </div>
            <div *ngIf="getTasksByStatus('todo').length === 0" class="empty-hint">{{ t('common.noTask') }}</div>
          </div>
        </div>

        <!-- IN PROGRESS -->
        <div class="column dash-card" 
             (mouseenter)="setRandomColor($event)"
             (dragover)="$event.preventDefault()" 
             (drop)="onDrop($event, 'in-progress')">
          <h3>{{ t('col.inprogress') }} ({{ getTasksByStatus('in-progress').length }})</h3>
          <div class="task-list">
            <div *ngFor="let task of getTasksByStatus('in-progress')" 
                 class="task-card" 
                 draggable="true" 
                 (dragstart)="onDragStart($event, task.id)">
              <h4>{{ task.title }}</h4>
              <p>{{ task.description }}</p>
              <div class="task-footer">
                <span class="priority-badge" [ngClass]="task.priority">{{ task.priority }}</span>
                <div class="footer-actions">
                  <button class="ai-btn sm" (click)="moveStatus(task.id, 'completed')">{{ t('board.complete') }}</button>
                  <button class="ai-btn danger-sm" (click)="deleteTask(task.id)">✕</button>
                </div>
              </div>
            </div>
            <div *ngIf="getTasksByStatus('in-progress').length === 0" class="empty-hint">{{ t('common.noTask') }}</div>
          </div>
        </div>

        <!-- COMPLETED -->
        <div class="column dash-card" 
             (mouseenter)="setRandomColor($event)"
             (dragover)="$event.preventDefault()" 
             (drop)="onDrop($event, 'completed')">
          <h3>{{ t('col.completed') }} ({{ getTasksByStatus('completed').length }})</h3>
          <div class="task-list">
            <div *ngFor="let task of getTasksByStatus('completed')" 
                 class="task-card" 
                 draggable="true" 
                 (dragstart)="onDragStart($event, task.id)">
              <h4>{{ task.title }}</h4>
              <p>{{ task.description }}</p>
              <div class="task-footer">
                <span class="priority-badge" [ngClass]="task.priority">{{ task.priority }}</span>
                <div class="footer-actions">
                  <span class="success-label">{{ t('board.done') }}</span>
                  <button class="ai-btn danger-sm" (click)="deleteTask(task.id)">✕</button>
                </div>
              </div>
            </div>
            <div *ngIf="getTasksByStatus('completed').length === 0" class="empty-hint">{{ t('common.noTask') }}</div>
          </div>
        </div>

      </div>

      <!-- NEW TASK MODAL -->
      <div class="modal-backdrop" *ngIf="showModal" (click)="toggleNewTaskModal()">
        <div class="modal-card dash-card" (click)="$event.stopPropagation()">
          <h3>Create New Task</h3>
          <div class="input-group">
            <label>Task Title</label>
            <input type="text" [(ngModel)]="newTaskTitle" class="glass-input" placeholder="Enter task title...">
          </div>
          <div class="input-group">
            <label>Description</label>
            <textarea [(ngModel)]="newTaskDesc" class="glass-input textarea" placeholder="Enter details..."></textarea>
          </div>
          <div class="form-grid">
            <div class="input-group">
              <label>Priority</label>
              <select [(ngModel)]="newTaskPriority" class="glass-input">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div class="input-group">
              <label>Status</label>
              <select [(ngModel)]="newTaskStatus" class="glass-input">
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          <div class="modal-actions">
            <button class="ai-btn secondary" (click)="toggleNewTaskModal()">Cancel</button>
            <button class="ai-btn primary" (click)="createTask()">Save Task</button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; min-height: calc(100vh - 84px); color: #F1F5F9; font-family: 'Plus Jakarta Sans', sans-serif; }
    .workspace-container { max-width: 1400px; margin: 0 auto; padding: 40px; display: flex; flex-direction: column; gap: 24px; }
    .dash-card { background: rgba(11, 15, 30, 0.7); backdrop-filter: blur(30px); border-radius: 20px; padding: 28px; border: 1px solid rgba(139, 92, 246, 0.25); box-shadow: 0 20px 40px rgba(0,0,0,0.5); transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important; }
    .dash-card:hover { transform: translateY(-3px) scale(1.01); box-shadow: 0 25px 50px rgba(0, 0, 0, 0.7), 0 0 30px color-mix(in srgb, var(--hover-color, #8B5CF6) 50%, transparent) !important; border-color: var(--hover-color, #8B5CF6) !important; }
    .header-row { display: flex; justify-content: space-between; align-items: center; }
    .page-header-card h1 { font-size: 28px; font-weight: 700; margin: 0; color: #fff; }
    .page-header-card p { font-size: 13.5px; color: #94A3B8; margin: 4px 0 0 0; }
    .board-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
    .column { min-height: 500px; display: flex; flex-direction: column; }
    .column h3 { font-size: 15px; font-weight: 700; color: #C084FC; margin: 0 0 16px 0; letter-spacing: 0.5px; text-transform: uppercase; }
    .task-list { display: flex; flex-direction: column; gap: 12px; flex-grow: 1; }
    .task-card { background: rgba(18, 24, 48, 0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 16px; display: flex; flex-direction: column; gap: 8px; cursor: grab; transition: 0.2s; }
    .task-card:active { cursor: grabbing; }
    .task-card:hover { border-color: rgba(139, 92, 246, 0.6); box-shadow: 0 0 15px rgba(139, 92, 246, 0.2); }
    .task-card h4 { margin: 0; font-size: 14px; color: #FFF; font-weight: 600; }
    .task-card p { margin: 0; font-size: 12.5px; color: #94A3B8; }
    .task-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 6px; }
    .footer-actions { display: flex; gap: 8px; align-items: center; }
    .priority-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 6px; text-transform: uppercase; }
    .priority-badge.high { background: rgba(239, 68, 68, 0.15); color: #F87171; }
    .priority-badge.medium { background: rgba(250, 204, 21, 0.15); color: #FACC15; }
    .priority-badge.low { background: rgba(56, 189, 248, 0.15); color: #38BDF8; }
    .ai-btn { padding: 8px 16px; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; transition: 0.3s; }
    .ai-btn.primary { background: linear-gradient(135deg, #8B5CF6, #6366F1); color: #FFF; box-shadow: 0 0 20px rgba(139,92,246,0.4); }
    .ai-btn.primary:hover { box-shadow: 0 0 30px rgba(139,92,246,0.7); }
    .ai-btn.secondary { background: rgba(255,255,255,0.08); color: #FFF; }
    .ai-btn.sm { background: rgba(139, 92, 246, 0.2); border: 1px solid rgba(139, 92, 246, 0.4); color: #E879F9; padding: 4px 10px; font-size: 11px; border-radius: 8px; cursor: pointer; }
    .danger-sm { background: rgba(239, 68, 68, 0.15); color: #F87171; border: 1px solid rgba(239, 68, 68, 0.3); padding: 4px 8px; border-radius: 6px; font-size: 11px; }
    .success-label { font-size: 11px; color: #34D399; font-weight: 700; }
    .empty-hint { text-align: center; color: rgba(255,255,255,0.3); font-style: italic; padding: 40px 0; font-size: 12.5px; }
    .modal-backdrop { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-card { width: 450px; display: flex; flex-direction: column; gap: 16px; }
    .modal-card h3 { margin: 0; font-size: 20px; color: #FFF; }
    .input-group { display: flex; flex-direction: column; gap: 6px; }
    .input-group label { font-size: 11px; font-weight: 700; color: #94A3B8; text-transform: uppercase; }
    .glass-input { height: 42px; border-radius: 10px; background: rgba(18, 24, 48, 0.9); border: 1px solid rgba(139, 92, 246, 0.3); color: #fff; padding: 0 14px; font-size: 13px; outline: none; width: 100%; }
    .textarea { height: 90px; padding: 12px 14px; resize: none; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px; }
  `]
})
export class TasksComponent implements OnInit {
  private taskService = inject(TaskService);
  private langService = inject(LanguageService);
  private cdr = inject(ChangeDetectorRef);

  tasks: Task[] = [];
  showModal = false;
  newTaskTitle = '';
  newTaskDesc = '';
  newTaskPriority: PriorityType = 'medium';
  newTaskStatus: TaskStatusType = 'todo';
  private draggedTaskId: string | null = null;

  private palette = ['#8B5CF6', '#A855F7', '#EC4899', '#3B82F6', '#06B6D4', '#22C55E', '#F59E0B'];

  setRandomColor(event: MouseEvent) {
    const el = event.currentTarget as HTMLElement;
    const randomColor = this.palette[Math.floor(Math.random() * this.palette.length)];
    el.style.setProperty('--hover-color', randomColor);
  }

  ngOnInit() {
    this.taskService.tasks$.subscribe(t => {
      this.tasks = t || [];
      this.cdr.detectChanges();
    });
    this.langService.lang$.subscribe(() => this.cdr.detectChanges());
  }

  t(key: string): string {
    return this.langService.translate(key);
  }

  getTasksByStatus(status: string): Task[] {
    return this.tasks.filter(t => t.status === status);
  }

  moveStatus(id: string, newStatus: TaskStatusType) {
    this.taskService.updateTaskStatus(id, newStatus);
  }

  deleteTask(id: string) {
    this.taskService.deleteTask(id);
  }

  toggleNewTaskModal() {
    this.showModal = !this.showModal;
  }

  createTask() {
    if (!this.newTaskTitle.trim()) return;
    this.taskService.addTask({
      title: this.newTaskTitle,
      description: this.newTaskDesc,
      priority: this.newTaskPriority,
      status: this.newTaskStatus,
      storyPoint: 3,
      dueDate: '2026-08-15'
    });
    this.newTaskTitle = '';
    this.newTaskDesc = '';
    this.showModal = false;
  }

  onDragStart(event: DragEvent, taskId: string) {
    this.draggedTaskId = taskId;
    if (event.dataTransfer) event.dataTransfer.setData('text/plain', taskId);
  }

  onDrop(event: DragEvent, targetStatus: TaskStatusType) {
    event.preventDefault();
    if (this.draggedTaskId) {
      this.taskService.updateTaskStatus(this.draggedTaskId, targetStatus);
      this.draggedTaskId = null;
    }
  }
}