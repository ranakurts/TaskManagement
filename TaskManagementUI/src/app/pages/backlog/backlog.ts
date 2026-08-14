import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, transferArrayItem, moveItemInArray } from '@angular/cdk/drag-drop';
import { TaskService, Task, Sprint } from '../../services/task';
import { LanguageService, LangType } from '../../services/language.service';

@Component({
  selector: 'app-backlog',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  template: `
    <div class="backlog-container">
      
      <!-- BAŞLIK -->
      <div class="page-header-card dash-card">
        <div class="header-main-row">
          <div>
            <h1>Product & Sprint Backlog</h1>
            <p>Henüz planlanmamış işleri backlog'da yönetin veya sprintler arasında sürükleyin.</p>
          </div>
          <button class="ai-btn primary" (click)="addNewBacklogTask()">+ Backlog'a Görev Ekle</button>
        </div>
      </div>

      <!-- BACKLOG ALANI -->
      <div class="section-box dash-card">
        <div class="section-title">
          <h3>📥 Product Backlog (Planlanmamış Görevler)</h3>
          <span class="count-badge">{{ backlogTasks.length }} Görev</span>
        </div>

        <div cdkDropList 
             #backlogList="cdkDropList"
             [cdkDropListData]="backlogTasks"
             [cdkDropListConnectedTo]="sprintListIds"
             class="task-drop-zone"
             (cdkDropListDropped)="drop($event, null)">
          
          <div *ngFor="let task of backlogTasks" class="task-item-card" cdkDrag>
            <div class="task-left">
              <span class="priority-tag" [class]="task.priority">{{ task.priority }}</span>
              <strong>{{ task.title }}</strong>
            </div>
            <div class="task-right">
              <span class="sp-badge" title="Story Point">SP: {{ task.storyPoint || 3 }}</span>
              <span class="due-date">📅 {{ task.dueDate }}</span>
              <button class="del-btn" (click)="deleteTask(task.id)">🗑️</button>
            </div>
          </div>

          <div class="empty-zone" *ngIf="backlogTasks.length === 0">
            Backlog'da görev bulunmuyor. Görevleri buraya sürükleyebilirsiniz.
          </div>
        </div>
      </div>

      <!-- SPRİNTLER LİSTESİ -->
      <div class="sprints-section">
        <h2>Aktif ve Planlanmış Sprintler</h2>
        
        <div *ngFor="let sprint of sprints" class="sprint-card dash-card">
          <div class="sprint-header">
            <div>
              <div class="sprint-title-row">
                <h3>{{ sprint.name }}</h3>
                <span class="status-pill" [class]="sprint.status.toLowerCase()">{{ sprint.status }}</span>
              </div>
              <p class="sprint-goal">Hedef: {{ sprint.goal }} | Tarih: {{ sprint.plannedStartDate }} / {{ sprint.plannedEndDate }}</p>
            </div>

            <div class="sprint-actions">
              <button *ngIf="sprint.status === 'Planned'" class="ai-btn success-sm" (click)="startSprint(sprint.id)">▶ Sprinti Başlat</button>
              <button *ngIf="sprint.status === 'Active'" class="ai-btn warning-sm" (click)="completeSprint(sprint.id)">🏁 Sprinti Tamamla</button>
            </div>
          </div>

          <!-- Sprint İçindeki Görevler (Drop Zone) -->
          <div cdkDropList 
               [id]="'sprint-' + sprint.id"
               [cdkDropListData]="getTasksForSprint(sprint.id)"
               [cdkDropListConnectedTo]="sprintListIds"
               class="task-drop-zone"
               (cdkDropListDropped)="drop($event, sprint.id)">
            
            <div *ngFor="let task of getTasksForSprint(sprint.id)" class="task-item-card" cdkDrag>
              <div class="task-left">
                <span class="priority-tag" [class]="task.priority">{{ task.priority }}</span>
                <strong>{{ task.title }}</strong>
              </div>
              <div class="task-right">
                <span class="sp-badge">SP: {{ task.storyPoint || 3 }}</span>
                <span class="due-date">📅 {{ task.dueDate }}</span>
                <button class="del-btn" (click)="deleteTask(task.id)">🗑️</button>
              </div>
            </div>

            <div class="empty-zone" *ngIf="getTasksForSprint(sprint.id).length === 0">
              Bu sprintte henüz görev yok. Görevleri buraya sürükleyin.
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap');
    :host { display: block; color: var(--text, #F8FAFC); font-family: 'Quicksand', sans-serif !important; }
    .backlog-container { max-width: 1300px; margin: 0 auto; padding: 32px 48px; display: flex; flex-direction: column; gap: 24px; }
    .dash-card { background: var(--card, rgba(27, 36, 64, 0.65)); backdrop-filter: blur(24px); border: 1px solid var(--border, rgba(139, 92, 246, 0.28)); border-radius: 20px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4); }
    .page-header-card { padding: 24px 32px; }
    .header-main-row { display: flex; justify-content: space-between; align-items: center; }
    .page-header-card h1 { margin: 0; font-size: 20px; font-weight: 700; color: #FFF; }
    .page-header-card p { margin: 4px 0 0 0; font-size: 13px; color: rgba(255,255,255,0.65); }

    .section-box { padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
    .section-title { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 10px; }
    .section-title h3 { margin: 0; font-size: 15px; color: #C084FC; font-weight: 700; }
    .count-badge { font-size: 11px; background: rgba(139,92,246,0.2); padding: 2px 8px; border-radius: 99px; color: #E879F9; }

    .task-drop-zone { min-height: 70px; display: flex; flex-direction: column; gap: 8px; }
    .task-item-card { background: rgba(18, 24, 48, 0.85); border: 1px solid rgba(255,255,255,0.08); padding: 12px 16px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; cursor: grab; transition: 0.2s; }
    .task-item-card:active { cursor: grabbing; }
    .task-item-card:hover { border-color: rgba(139,92,246,0.5); }
    .task-left { display: flex; align-items: center; gap: 12px; font-size: 13.5px; color: #FFF; }
    .task-right { display: flex; align-items: center; gap: 14px; font-size: 12px; color: rgba(255,255,255,0.6); }

    .priority-tag { font-size: 9.5px; font-weight: 700; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; }
    .priority-tag.high { background: rgba(239, 68, 68, 0.2); color: #F87171; }
    .priority-tag.medium { background: rgba(245, 158, 11, 0.2); color: #FBBF24; }
    .priority-tag.low { background: rgba(16, 185, 129, 0.2); color: #34D399; }

    .sp-badge { background: rgba(6, 182, 212, 0.15); color: #22D3EE; padding: 2px 6px; border-radius: 6px; font-weight: 700; font-size: 11px; }
    .del-btn { background: none; border: none; cursor: pointer; font-size: 14px; opacity: 0.6; }
    .del-btn:hover { opacity: 1; }

    .empty-zone { text-align: center; color: rgba(255,255,255,0.3); font-size: 12.5px; padding: 20px 0; font-style: italic; border: 1px dashed rgba(255,255,255,0.08); border-radius: 10px; }

    .sprints-section { display: flex; flex-direction: column; gap: 16px; margin-top: 10px; }
    .sprints-section h2 { margin: 0; font-size: 18px; color: #FFF; font-weight: 700; }
    .sprint-card { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }
    .sprint-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 12px; }
    .sprint-title-row { display: flex; align-items: center; gap: 12px; }
    .sprint-title-row h3 { margin: 0; font-size: 16px; color: #FFF; }
    .sprint-goal { margin: 4px 0 0 0; font-size: 12.5px; color: rgba(255,255,255,0.6); }

    .status-pill { font-size: 10.5px; font-weight: 700; padding: 2px 8px; border-radius: 99px; text-transform: uppercase; }
    .status-pill.planned { background: rgba(59, 130, 246, 0.2); color: #60A5FA; }
    .status-pill.active { background: rgba(34, 197, 94, 0.2); color: #34D399; border: 1px solid rgba(34, 197, 94, 0.4); }
    .status-pill.completed { background: rgba(100, 116, 139, 0.2); color: #94A3B8; }

    .sprint-actions { display: flex; gap: 10px; }

    .ai-btn { padding: 8px 16px; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; font-family: 'Quicksand', sans-serif !important; }
    .ai-btn.primary { background: linear-gradient(135deg, #8B5CF6, #E879F9); color: #FFF; box-shadow: 0 0 10px rgba(139,92,246,0.4); }
    .success-sm { background: rgba(34, 197, 94, 0.2); color: #34D399; border: 1px solid rgba(34, 197, 94, 0.4); }
    .warning-sm { background: rgba(245, 158, 11, 0.2); color: #FBBF24; border: 1px solid rgba(245, 158, 11, 0.4); }
  `]
})
export class BacklogComponent implements OnInit {
  taskService = inject(TaskService);
  
  tasks: Task[] = [];
  sprints: Sprint[] = [];
  
  backlogTasks: Task[] = [];
  sprintListIds: string[] = [];

  ngOnInit() {
    this.taskService.tasks$.subscribe(t => {
      this.tasks = t;
      this.backlogTasks = t.filter(item => !item.sprintId);
    });

    this.taskService.sprints$.subscribe(s => {
      this.sprints = s;
      this.sprintListIds = ['backlogList', ...s.map(sp => 'sprint-' + sp.id)];
    });
  }

  getTasksForSprint(sprintId: string): Task[] {
    return this.tasks.filter(t => t.sprintId === sprintId);
  }

  drop(event: CdkDragDrop<Task[]>, targetSprintId: string | null) {
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
      if (movedTask) {
        this.taskService.moveTaskToSprint(movedTask.id, targetSprintId);
      }
    }
  }

  startSprint(sprintId: string) {
    const res = this.taskService.startSprint(sprintId);
    alert(res.message);
  }

  completeSprint(sprintId: string) {
    const action = prompt('Tamamlanmayan görevler nereye taşınsın? (backlog yazın veya başka sprint ID girin)', 'backlog');
    if (action) {
      const res = this.taskService.completeSprint(sprintId, action);
      alert(res.message);
    }
  }

  addNewBacklogTask() {
    const title = prompt('Yeni Backlog Görevi Başlığı:');
    if (title) {
      this.taskService.addTask({
        title: title,
        sprintId: null, // Backlog
        status: 'todo',
        priority: 'medium',
        storyPoint: 5
      });
    }
  }

  deleteTask(id: any) {
    if (confirm('Görevi silmek istediğinize emin misiniz?')) {
      this.taskService.deleteTask(id);
    }
  }
}