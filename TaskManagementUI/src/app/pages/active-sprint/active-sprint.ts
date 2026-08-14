import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { TaskService, Task, Sprint, TaskStatusType } from '../../services/task';

@Component({
  selector: 'app-active-sprint',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  template: `
    <div class="active-sprint-container">
      
      <!-- AKTİF SPRINT METRİK VE BİLGİ KARTI -->
      <div class="sprint-hero-card dash-card" *ngIf="activeSprint; else noActiveSprint">
        <div class="hero-top">
          <div>
            <div class="title-row">
              <h2>{{ activeSprint.name }}</h2>
              <span class="status-pill active">Aktif Sprint</span>
            </div>
            <p class="sprint-goal">Hedef: {{ activeSprint.goal }}</p>
          </div>
          <button class="ai-btn warning-btn" (click)="completeActiveSprint()">🏁 Sprinti Tamamla</button>
        </div>

        <!-- METRİK ÖZET ÇUBUĞU -->
        <div class="metrics-grid">
          <div class="metric-box">
            <span class="metric-label">Kalan Süre</span>
            <span class="metric-val">{{ getRemainingDays(activeSprint.plannedEndDate) }} Gün</span>
          </div>
          <div class="metric-box">
            <span class="metric-label">Toplam Görev</span>
            <span class="metric-val">{{ sprintTasks.length }}</span>
          </div>
          <div class="metric-box">
            <span class="metric-label">Tamamlanan</span>
            <span class="metric-val text-green">{{ completedCount }}</span>
          </div>
          <div class="metric-box">
            <span class="metric-label">Toplam Story Point</span>
            <span class="metric-val text-cyan">{{ totalStoryPoints }} SP</span>
          </div>
          <div class="metric-box">
            <span class="metric-label">Tamamlanan SP</span>
            <span class="metric-val text-purple">{{ completedStoryPoints }} SP</span>
          </div>
        </div>
      </div>

      <!-- AKTİF SPRINT KANBAN SÜTUNLARI (Todo | In Progress | Review | Done) -->
      <div class="kanban-4-grid" cdkDropListGroup *ngIf="activeSprint">
        
        <!-- TODO -->
        <div class="kanban-column dash-card">
          <div class="column-header">
            <h3>YAPILACAK (TODO)</h3>
            <span class="count-badge blue">{{ todoTasks.length }}</span>
          </div>
          <div cdkDropList [cdkDropListData]="todoTasks" class="task-list" (cdkDropListDropped)="drop($event, 'todo')">
            <div *ngFor="let t of todoTasks" class="task-card" cdkDrag>
              <div class="task-card-top">
                <strong>{{ t.title }}</strong>
                <span class="sp-tag">SP: {{ t.storyPoint || 3 }}</span>
              </div>
              <p>{{ t.description || 'Açıklama yok' }}</p>
            </div>
            <div class="empty-hint" *ngIf="todoTasks.length === 0">Görev yok</div>
          </div>
        </div>

        <!-- IN PROGRESS -->
        <div class="kanban-column dash-card">
          <div class="column-header">
            <h3>DEVAM EDİYOR</h3>
            <span class="count-badge yellow">{{ inProgressTasks.length }}</span>
          </div>
          <div cdkDropList [cdkDropListData]="inProgressTasks" class="task-list" (cdkDropListDropped)="drop($event, 'in-progress')">
            <div *ngFor="let t of inProgressTasks" class="task-card" cdkDrag>
              <div class="task-card-top">
                <strong>{{ t.title }}</strong>
                <span class="sp-tag">SP: {{ t.storyPoint || 3 }}</span>
              </div>
              <p>{{ t.description || 'Açıklama yok' }}</p>
            </div>
            <div class="empty-hint" *ngIf="inProgressTasks.length === 0">Görev yok</div>
          </div>
        </div>

        <!-- REVIEW -->
        <div class="kanban-column dash-card">
          <div class="column-header">
            <h3>İNCELEME (REVIEW)</h3>
            <span class="count-badge purple">{{ reviewTasks.length }}</span>
          </div>
          <div cdkDropList [cdkDropListData]="reviewTasks" class="task-list" (cdkDropListDropped)="drop($event, 'review')">
            <div *ngFor="let t of reviewTasks" class="task-card" cdkDrag>
              <div class="task-card-top">
                <strong>{{ t.title }}</strong>
                <span class="sp-tag">SP: {{ t.storyPoint || 3 }}</span>
              </div>
              <p>{{ t.description || 'Açıklama yok' }}</p>
            </div>
            <div class="empty-hint" *ngIf="reviewTasks.length === 0">Görev yok</div>
          </div>
        </div>

        <!-- COMPLETED / DONE -->
        <div class="kanban-column dash-card">
          <div class="column-header">
            <h3>TAMAMLANDI (DONE)</h3>
            <span class="count-badge green">{{ completedTasks.length }}</span>
          </div>
          <div cdkDropList [cdkDropListData]="completedTasks" class="task-list" (cdkDropListDropped)="drop($event, 'completed')">
            <div *ngFor="let t of completedTasks" class="task-card" cdkDrag>
              <div class="task-card-top">
                <strong>{{ t.title }}</strong>
                <span class="sp-tag">SP: {{ t.storyPoint || 3 }}</span>
              </div>
              <p>{{ t.description || 'Açıklama yok' }}</p>
            </div>
            <div class="empty-hint" *ngIf="completedTasks.length === 0">Görev yok</div>
          </div>
        </div>

      </div>

      <!-- AKTİF SPRINT YOKSA UYARI -->
      <ng-template #noActiveSprint>
        <div class="dash-card no-active-card">
          <h3>Şu anda devam eden aktif bir sprint bulunmuyor.</h3>
          <p>Backlog ekranından planlanmış bir sprinti başlatabilirsiniz.</p>
        </div>
      </ng-template>

    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap');
    :host { display: block; color: var(--text, #F8FAFC); font-family: 'Quicksand', sans-serif !important; }
    .active-sprint-container { max-width: 1400px; margin: 0 auto; padding: 32px 48px; display: flex; flex-direction: column; gap: 24px; }
    .dash-card { background: var(--card, rgba(27, 36, 64, 0.65)); backdrop-filter: blur(24px); border: 1px solid var(--border, rgba(139, 92, 246, 0.28)); border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
    
    .sprint-hero-card { padding: 28px 36px; display: flex; flex-direction: column; gap: 20px; }
    .hero-top { display: flex; justify-content: space-between; align-items: center; }
    .title-row { display: flex; align-items: center; gap: 12px; }
    .title-row h2 { margin: 0; font-size: 22px; font-weight: 700; color: #FFF; }
    .sprint-goal { margin: 6px 0 0 0; font-size: 13.5px; color: rgba(255,255,255,0.65); }
    
    .status-pill.active { background: rgba(34, 197, 94, 0.2); color: #34D399; padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 700; border: 1px solid rgba(34,197,94,0.4); }

    .metrics-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px; }
    .metric-box { background: rgba(18, 24, 48, 0.6); border: 1px solid rgba(255,255,255,0.06); padding: 12px; border-radius: 12px; display: flex; flex-direction: column; gap: 4px; text-align: center; }
    .metric-label { font-size: 11px; color: #94A3B8; font-weight: 600; text-transform: uppercase; }
    .metric-val { font-size: 18px; font-weight: 700; color: #FFF; }
    .text-green { color: #34D399 !important; }
    .text-cyan { color: #22D3EE !important; }
    .text-purple { color: #C084FC !important; }

    .kanban-4-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; align-items: start; }
    .kanban-column { padding: 16px; display: flex; flex-direction: column; gap: 12px; min-height: 400px; }
    .column-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 10px; }
    .column-header h3 { margin: 0; font-size: 12.5px; font-weight: 700; color: #C084FC; letter-spacing: 0.5px; }

    .count-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 99px; }
    .count-badge.blue { background: rgba(59,130,246,0.2); color: #60A5FA; }
    .count-badge.yellow { background: rgba(245,158,11,0.2); color: #FBBF24; }
    .count-badge.purple { background: rgba(168,85,247,0.2); color: #E879F9; }
    .count-badge.green { background: rgba(34,197,94,0.2); color: #34D399; }

    .task-list { display: flex; flex-direction: column; gap: 10px; min-height: 300px; }
    .task-card { background: rgba(18, 24, 48, 0.85); border: 1px solid rgba(255,255,255,0.08); padding: 12px; border-radius: 12px; display: flex; flex-direction: column; gap: 6px; cursor: grab; }
    .task-card:active { cursor: grabbing; }
    .task-card-top { display: flex; justify-content: space-between; align-items: center; }
    .task-card-top strong { font-size: 13px; color: #FFF; }
    .sp-tag { font-size: 10px; background: rgba(6,182,212,0.15); color: #22D3EE; padding: 1px 6px; border-radius: 4px; font-weight: 700; }
    .task-card p { margin: 0; font-size: 12px; color: rgba(255,255,255,0.6); }

    .empty-hint { text-align: center; color: rgba(255,255,255,0.3); font-size: 12px; padding: 30px 0; font-style: italic; }
    .no-active-card { text-align: center; padding: 50px; display: flex; flex-direction: column; gap: 10px; }
    .no-active-card h3 { margin: 0; color: #FFF; font-size: 18px; }
    .no-active-card p { margin: 0; color: #94A3B8; font-size: 13.5px; }

    .ai-btn { padding: 8px 16px; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; font-family: 'Quicksand', sans-serif !important; }
    .warning-btn { background: rgba(245, 158, 11, 0.2); color: #FBBF24; border: 1px solid rgba(245, 158, 11, 0.4); }
    .warning-btn:hover { background: rgba(245, 158, 11, 0.35); }
  `]
})
export class ActiveSprintComponent implements OnInit {
  taskService = inject(TaskService);

  activeSprint: Sprint | null = null;
  sprintTasks: Task[] = [];

  todoTasks: Task[] = [];
  inProgressTasks: Task[] = [];
  reviewTasks: Task[] = [];
  completedTasks: Task[] = [];

  ngOnInit() {
    this.taskService.sprints$.subscribe(sprints => {
      this.activeSprint = sprints.find(s => s.status === 'Active') || null;
      this.updateSprintTasks();
    });

    this.taskService.tasks$.subscribe(() => {
      this.updateSprintTasks();
    });
  }

  private updateSprintTasks() {
    if (!this.activeSprint) {
      this.sprintTasks = [];
      this.todoTasks = [];
      this.inProgressTasks = [];
      this.reviewTasks = [];
      this.completedTasks = [];
      return;
    }

    const allTasks = (this.taskService as any).tasksSubject?.value || [];
    this.sprintTasks = allTasks.filter((t: Task) => t.sprintId === this.activeSprint?.id);

    this.todoTasks = this.sprintTasks.filter(t => t.status === 'todo');
    this.inProgressTasks = this.sprintTasks.filter(t => t.status === 'in-progress');
    this.reviewTasks = this.sprintTasks.filter(t => t.status === 'review');
    this.completedTasks = this.sprintTasks.filter(t => t.status === 'completed');
  }

  get completedCount(): number {
    return this.completedTasks.length;
  }

  get totalStoryPoints(): number {
    return this.sprintTasks.reduce((acc, t) => acc + (t.storyPoint || 3), 0);
  }

  get completedStoryPoints(): number {
    return this.completedTasks.reduce((acc, t) => acc + (t.storyPoint || 3), 0);
  }

  getRemainingDays(endDateStr?: string): number {
    if (!endDateStr) return 0;
    const end = new Date(endDateStr).getTime();
    const now = new Date().getTime();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }

  drop(event: CdkDragDrop<Task[]>, targetStatus: TaskStatusType) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
      
      const movedTask = event.container.data[event.currentIndex];
      if (movedTask && movedTask.id) {
        this.taskService.updateTaskStatus(movedTask.id, targetStatus);
      }
    }
  }

  completeActiveSprint() {
    if (!this.activeSprint) return;
    const action = prompt('Tamamlanmayan görevler nereye taşınsın? (backlog yazın veya başka sprint ID girin)', 'backlog');
    if (action) {
      const res = this.taskService.completeSprint(this.activeSprint.id, action);
      alert(res.message);
    }
  }
}