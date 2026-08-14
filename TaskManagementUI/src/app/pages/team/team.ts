import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService, TeamMember } from '../../services/task';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="workspace-container">
      
      <div class="page-header-card dash-card" (mouseenter)="setRandomColor($event)">
        <div class="header-row">
          <div class="header-text">
            <h1>Workspace Team</h1>
            <p>Manage your collaborators and send workspace invitations.</p>
          </div>
          <button class="ai-btn primary" (click)="toggleInviteModal()">+ Invite Member</button>
        </div>
      </div>

      <div class="team-card dash-card" (mouseenter)="setRandomColor($event)">
        <h3>Active Members ({{ teamMembers.length }})</h3>
        
        <div class="table-container">
          <table class="team-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let member of teamMembers">
                <td>
                  <div class="member-cell">
                    <div class="member-avatar">{{ member.email.charAt(0).toUpperCase() }}</div>
                    <div class="member-info">
                      <strong>{{ member.name || member.email.split('@')[0] }}</strong>
                      <small>{{ member.email }}</small>
                    </div>
                  </div>
                </td>
                <td><span class="role-badge">{{ member.role }}</span></td>
                <td>
                  <span class="status-indicator" [class.active]="member.status === 'Active'" [class.pending]="member.status === 'Pending'">
                    {{ member.status }}
                  </span>
                </td>
                <td>
                  <button class="ai-btn secondary-sm" *ngIf="member.role !== 'Workspace Owner'">Remove</button>
                </td>
              </tr>
              <tr *ngIf="teamMembers.length === 0">
                <td colspan="4" class="empty-hint">No team members found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- DAVET MODALI -->
      <div class="modal-backdrop" *ngIf="showInviteModal" (click)="toggleInviteModal()">
        <div class="modal-card dash-card" (click)="$event.stopPropagation()">
          <h3>Invite Colleague</h3>
          <p class="modal-desc">Send an email invitation to join this workspace.</p>
          
          <div class="input-group">
            <label>Workspace Name</label>
            <input type="text" [(ngModel)]="inviteTeamName" class="glass-input">
          </div>

          <div class="input-group" style="margin-top: 14px;">
            <label>Email Address</label>
            <input type="email" [(ngModel)]="inviteEmail" class="glass-input" placeholder="colleague@domain.com">
          </div>

          <div class="invite-msg" *ngIf="inviteMessage" [class.success]="inviteSuccess" [class.error]="!inviteSuccess">
            {{ inviteMessage }}
          </div>

          <div class="modal-actions" style="margin-top: 20px;">
            <button class="ai-btn secondary" (click)="toggleInviteModal()">Cancel</button>
            <button class="ai-btn primary" (click)="sendInvitation()">Send Invite</button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; min-height: calc(100vh - 84px); color: #F1F5F9; font-family: 'Plus Jakarta Sans', sans-serif; }
    .workspace-container { max-width: 1000px; margin: 0 auto; padding: 40px; display: flex; flex-direction: column; gap: 24px; }
    .dash-card { background: rgba(11, 15, 30, 0.7); backdrop-filter: blur(30px); border-radius: 20px; padding: 28px; border: 1px solid rgba(139, 92, 246, 0.25); box-shadow: 0 20px 40px rgba(0,0,0,0.5); transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important; }
    .dash-card:hover { transform: translateY(-3px) scale(1.01); box-shadow: 0 25px 50px rgba(0, 0, 0, 0.7), 0 0 30px color-mix(in srgb, var(--hover-color, #8B5CF6) 50%, transparent) !important; border-color: var(--hover-color, #8B5CF6) !important; }
    .header-row { display: flex; justify-content: space-between; align-items: center; }
    .page-header-card h1 { font-size: 28px; font-weight: 700; margin: 0; color: #fff; }
    .page-header-card p { font-size: 13.5px; color: #94A3B8; margin: 4px 0 0 0; }
    
    .team-card h3 { font-size: 18px; font-weight: 700; color: #FFF; margin: 0 0 20px 0; }
    .table-container { overflow-x: auto; }
    .team-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13.5px; }
    .team-table th { padding: 14px 18px; color: #94A3B8; border-bottom: 1px solid rgba(255,255,255,0.08); font-weight: 600; font-size: 11.5px; text-transform: uppercase; }
    .team-table td { padding: 16px 18px; border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: middle; }
    
    .member-cell { display: flex; align-items: center; gap: 14px; }
    .member-avatar { width: 38px; height: 38px; background: linear-gradient(135deg, #8B5CF6, #6366F1); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 15px; color: #FFF; box-shadow: 0 0 10px rgba(139, 92, 246, 0.4); }
    .member-info { display: flex; flex-direction: column; }
    .member-info strong { font-size: 14px; color: #FFF; }
    .member-info small { font-size: 12px; color: #94A3B8; }
    
    .role-badge { background: rgba(255,255,255,0.08); padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; color: #E2E8F0; border: 1px solid rgba(255,255,255,0.1); }
    .status-indicator { font-size: 12px; font-weight: 700; }
    .status-indicator.active { color: #34D399; }
    .status-indicator.pending { color: #FACC15; }
    
    .ai-btn { padding: 9px 16px; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; transition: 0.3s; }
    .ai-btn.primary { background: linear-gradient(135deg, #8B5CF6, #6366F1); color: #FFF; box-shadow: 0 0 20px rgba(139,92,246,0.4); }
    .ai-btn.primary:hover { box-shadow: 0 0 30px rgba(139,92,246,0.7); }
    .ai-btn.secondary { background: rgba(255,255,255,0.1); color: #FFF; border: 1px solid rgba(255,255,255,0.2); }
    .ai-btn.secondary-sm { background: rgba(239, 68, 68, 0.15); color: #F87171; border: 1px solid rgba(239, 68, 68, 0.3); padding: 5px 12px; border-radius: 6px; font-size: 11px; }

    .modal-backdrop { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-card { width: 420px; display: flex; flex-direction: column; gap: 12px; }
    .modal-card h3 { margin: 0; font-size: 20px; color: #FFF; }
    .modal-desc { font-size: 12.5px; color: #94A3B8; margin: 0 0 6px 0; }
    .input-group { display: flex; flex-direction: column; gap: 6px; }
    .input-group label { font-size: 11px; font-weight: 700; color: #94A3B8; text-transform: uppercase; }
    .glass-input { height: 42px; border-radius: 10px; background: rgba(18, 24, 48, 0.9); border: 1px solid rgba(139, 92, 246, 0.3); color: #fff; padding: 0 14px; font-size: 13px; outline: none; width: 100%; }
    .invite-msg { font-size: 12px; padding: 8px 12px; border-radius: 8px; margin-top: 6px; }
    .invite-msg.success { background: rgba(34,197,94,0.15); color: #34D399; border: 1px solid rgba(34,197,94,0.3); }
    .invite-msg.error { background: rgba(239,68,68,0.15); color: #F87171; border: 1px solid rgba(239,68,68,0.3); }
    .modal-actions { display: flex; justify-content: flex-end; gap: 10px; }
    .empty-hint { text-align: center; color: rgba(255,255,255,0.3); font-style: italic; padding: 30px 0; }
  `]
})
export class TeamComponent implements OnInit {
  private taskService = inject(TaskService);
  private langService = inject(LanguageService);
  private cdr = inject(ChangeDetectorRef);

  teamMembers: TeamMember[] = [];
  
  showInviteModal = false;
  inviteTeamName = 'Engineering Team';
  inviteEmail = '';
  inviteMessage = '';
  inviteSuccess = false;

  private palette = ['#8B5CF6', '#A855F7', '#EC4899', '#3B82F6', '#06B6D4'];

  setRandomColor(event: MouseEvent) {
    const el = event.currentTarget as HTMLElement;
    const randomColor = this.palette[Math.floor(Math.random() * this.palette.length)];
    el.style.setProperty('--hover-color', randomColor);
  }

  ngOnInit() {
    this.taskService.team$.subscribe(members => {
      this.teamMembers = members || [];
      this.cdr.detectChanges();
    });
  }

  t(key: string): string {
    return this.langService.translate(key);
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
      setTimeout(() => this.toggleInviteModal(), 1500);
    }
  }
}