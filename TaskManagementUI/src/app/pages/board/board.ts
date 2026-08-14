import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService, Task, TaskStatusType, TeamMember } from '../../services/task';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="workspace-container">
      
      <!-- BAŞLIK KARTI VE TAKIM DAVET ET BUTONU -->
      <div class="page-header-card dash-card" (mouseenter)="setRandomColor($event)">
        <div class="header-row">
          <div class="header-text">
            <h1>{{ t('board.title') }}</h1>
            <p>{{ t('board.desc') }}</p>
          </div>
          <button class="ai-btn primary" (click)="toggleInviteModal()">+ Invite Member</button>
        </div>
      </div>

      <!-- KANBAN PANOSU -->
      <div class="board-grid">
        
        <!-- TO DO SÜTUNU -->
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
                <button class="ai-btn sm" (click)="moveStatus(task.id, 'in-progress')">{{ t('board.start') }}</button>
              </div>
            </div>
            <div *ngIf="getTasksByStatus('todo').length === 0" class="empty-hint">{{ t('common.noTask') }}</div>
          </div>
        </div>

        <!-- IN PROGRESS SÜTUNU -->
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
                <button class="ai-btn sm" (click)="moveStatus(task.id, 'completed')">{{ t('board.complete') }}</button>
              </div>
            </div>
            <div *ngIf="getTasksByStatus('in-progress').length === 0" class="empty-hint">{{ t('common.noTask') }}</div>
          </div>
        </div>

        <!-- COMPLETED SÜTUNU -->
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
                <span class="success-label">{{ t('board.done') }}</span>
              </div>
            </div>
            <div *ngIf="getTasksByStatus('completed').length === 0" class="empty-hint">{{ t('common.noTask') }}</div>
          </div>
        </div>

      </div>

      <!-- TAKIM ÜYELERİ KARTI -->
      <div class="team-card dash-card" (mouseenter)="setRandomColor($event)">
        <h3>Workspace Team Members</h3>
        <div class="team-list">
          <div *ngFor="let member of teamMembers" class="team-member-chip">
            <span class="member-avatar">{{ member.email.charAt(0).toUpperCase() }}</span>
            <div class="member-info">
              <strong>{{ member.email }}</strong>
              <small>{{ member.role }} • <span [class.active-status]="member.status==='Active'" [class.pending-status]="member.status==='Pending'">{{ member.status }}</span></small>
            </div>
          </div>
        </div>
      </div>

      <!-- ÜYE DAVET ETME MODALI -->
      <div class="modal-backdrop" *ngIf="showInviteModal" (click)="toggleInviteModal()">
        <div class="modal-card dash-card" (click)="$event.stopPropagation()">
          <h3>Invite Member to Workspace</h3>
          <p class="modal-desc">Enter the email address of the person you want to invite to your workspace.</p>
          
          <div class="input-group">
            <label>Workspace / Team Name</label>
            <input type="text" [(ngModel)]="inviteTeamName" class="glass-input" placeholder="e.g. Core Engineering Team">
          </div>

          <div class="input-group" style="margin-top: 14px;">
            <label>Recipient Email Address</label>
            <input type="email" [(ngModel)]="inviteEmail" class="glass-input" placeholder="colleague@gmail.com">
          </div>

          <div class="invite-msg" *ngIf="inviteMessage" [class.success]="inviteSuccess" [class.error]="!inviteSuccess">
            {{ inviteMessage }}
          </div>

          <div class="modal-actions" style="margin-top: 20px;">
            <button class="ai-btn secondary" (click)="toggleInviteModal()">Cancel</button>
            <button class="ai-btn primary" (click)="sendInvitation()">Send Invitation</button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; min-height: calc(100vh - 84px); color: #F1F5F9; font-family: 'Plus Jakarta Sans', sans-serif; }
    .workspace-container { max-width: 1400px; margin: 0 auto; padding: 40px; display: flex; flex-direction: column; gap: 24px; }
    
    .dash-card {
      background: rgba(11, 15, 30, 0.7);
      backdrop-filter: blur(30px);
      border-radius: 20px;
      padding: 28px;
      border: 1px solid rgba(139, 92, 246, 0.25);
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
      transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), 
                  box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1), 
                  border-color 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
    }

    .dash-card:hover {
      transform: translateY(-3px) scale(1.01);
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.7), 0 0 30px color-mix(in srgb, var(--hover-color, #8B5CF6) 50%, transparent) !important;
      border-color: var(--hover-color, #8B5CF6) !important;
    }

    .header-row { display: flex; justify-content: space-between; align-items: center; }
    .page-header-card h1 { font-size: 28px; font-weight: 700; margin: 0; color: #fff; }
    .page-header-card p { font-size: 13.5px; color: #94A3B8; margin: 4px 0 0 0; }
    
    .board-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
    .column { min-height: 450px; display: flex; flex-direction: column; }
    .column h3 { font-size: 15px; font-weight: 700; color: #C084FC; margin: 0 0 16px 0; letter-spacing: 0.5px; }
    
    .task-list { display: flex; flex-direction: column; gap: 12px; flex-grow: 1; }
    .task-card { background: rgba(18, 24, 48, 0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 16px; display: flex; flex-direction: column; gap: 8px; cursor: grab; transition: 0.2s; }
    .task-card:active { cursor: grabbing; }
    .task-card:hover { border-color: rgba(139, 92, 246, 0.6); box-shadow: 0 0 15px rgba(139, 92, 246, 0.2); }
    
    .task-card h4 { margin: 0; font-size: 14px; color: #FFF; font-weight: 600; }
    .task-card p { margin: 0; font-size: 12.5px; color: #94A3B8; }
    .task-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 6px; }
    
    .priority-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 6px; text-transform: uppercase; }
    .priority-badge.high { background: rgba(239, 68, 68, 0.15); color: #F87171; }
    .priority-badge.medium { background: rgba(250, 204, 21, 0.15); color: #FACC15; }
    .priority-badge.low { background: rgba(56, 189, 248, 0.15); color: #38BDF8; }
    
    .ai-btn { padding: 8px 16px; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; transition: 0.3s; }
    .ai-btn.primary { background: linear-gradient(135deg, #8B5CF6, #6366F1); color: #FFF; box-shadow: 0 0 20px rgba(139,92,246,0.4); }
    .ai-btn.primary:hover { box-shadow: 0 0 30px rgba(139,92,246,0.7); }
    .ai-btn.secondary { background: rgba(255,255,255,0.08); color: #FFF; }
    .ai-btn.sm { background: rgba(139, 92, 246, 0.2); border: 1px solid rgba(139, 92, 246, 0.4); color: #E879F9; padding: 5px 12px; font-size: 11.5px; border-radius: 8px; cursor: pointer; }
    
    .success-label { font-size: 11px; color: #34D399; font-weight: 700; }
    .empty-hint { text-align: center; color: rgba(255,255,255,0.3); font-style: italic; padding: 40px 0; font-size: 12.5px; }

    /* TAKIM ÜYELERİ KARTI */
    .team-card h3 { font-size: 18px; font-weight: 700; color: #FFF; margin: 0 0 16px 0; }
    .team-list { display: flex; flex-wrap: wrap; gap: 12px; }
    .team-member-chip { background: rgba(18, 24, 48, 0.8); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 12px; padding: 10px 16px; display: flex; align-items: center; gap: 12px; }
    .member-avatar { width: 32px; height: 32px; background: #8B5CF6; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; color: #FFF; }
    .member-info { display: flex; flex-direction: column; }
    .member-info strong { font-size: 13px; color: #FFF; }
    .member-info small { font-size: 11px; color: #94A3B8; }
    .active-status { color: #34D399; font-weight: 600; }
    .pending-status { color: #FACC15; font-weight: 600; }

    /* MODAL */
    .modal-backdrop { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-card { width: 450px; display: flex; flex-direction: column; gap: 14px; }
    .modal-card h3 { margin: 0; font-size: 20px; color: #FFF; }
    .modal-desc { font-size: 12.5px; color: #94A3B8; margin: 0 0 6px 0; }
    .input-group { display: flex; flex-direction: column; gap: 6px; }
    .input-group label { font-size: 11px; font-weight: 700; color: #94A3B8; text-transform: uppercase; }
    .glass-input { height: 42px; border-radius: 10px; background: rgba(18, 24, 48, 0.9); border: 1px solid rgba(139, 92, 246, 0.3); color: #fff; padding: 0 14px; font-size: 13px; outline: none; width: 100%; }
    .invite-msg { font-size: 12px; padding: 8px 12px; border-radius: 8px; margin-top: 6px; }
    .invite-msg.success { background: rgba(34,197,94,0.15); color: #34D399; border: 1px solid rgba(34,197,94,0.3); }
    .invite-msg.error { background: rgba(239,68,68,0.15); color: #F87171; border: 1px solid rgba(239,68,68,0.3); }
    .modal-actions { display: flex; justify-content: flex-end; gap: 10px; }
  `]
})
export class BoardComponent implements OnInit {
  private taskService = inject(TaskService);
  private langService = inject(LanguageService);
  private cdr = inject(ChangeDetectorRef);

  tasks: Task[] = [];
  teamMembers: TeamMember[] = [];
  
  showInviteModal = false;
  inviteTeamName = 'Core Engineering Team';
  inviteEmail = '';
  inviteMessage = '';
  inviteSuccess = false;

  private draggedTaskId: string | null = null;
  private palette = ['#8B5CF6', '#A855F7', '#EC4899', '#3B82F6', '#06B6D4', '#22C55E', '#F59E0B'];

  setRandomColor(event: MouseEvent) {
    const el = event.currentTarget as HTMLElement;
    const randomColor = this.palette[Math.floor(Math.random() * this.palette.length)];
    el.style.setProperty('--hover-color', randomColor);
  }

  ngOnInit() {
    this.taskService.tasks$.subscribe(t => {
      this.tasks = t;
      this.cdr.detectChanges();
    });
    this.taskService.team$.subscribe(members => {
      this.teamMembers = members;
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

  onDragStart(event: DragEvent, taskId: string) {
    this.draggedTaskId = taskId;
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', taskId);
    }
  }

  onDrop(event: DragEvent, targetStatus: TaskStatusType) {
    event.preventDefault();
    if (this.draggedTaskId) {
      this.taskService.updateTaskStatus(this.draggedTaskId, targetStatus);
      this.draggedTaskId = null;
    }
  }

  toggleInviteModal() {
    this.showInviteModal = !this.showInviteModal;
    this.inviteMessage = '';
    this.inviteEmail = '';
  }

  sendInvitation() {
    if (!this.inviteEmail.trim() || !this.inviteEmail.includes('@')) {
      this.inviteMessage = 'Please enter a valid email address.';
      this.inviteSuccess = false;
      return;
    }

    const res = this.taskService.sendTeamInvitation(this.inviteTeamName, this.inviteEmail);
    this.inviteSuccess = res.success;
    this.inviteMessage = res.message;

    if (res.success) {
      setTimeout(() => {
        this.toggleInviteModal();
      }, 1500);
    }
  }
}