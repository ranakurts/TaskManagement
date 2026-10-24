import { Component, OnInit, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { LanguageService, LangType } from '../../services/language.service';
import { Team, TeamInvitation, TeamMemberInfo, TeamService } from '../../services/team.service';
import { UserStateService } from '../../services/user-state.service';

type Feedback = { text: string; ok: boolean } | null;

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="workspace-container">

      <div class="page-header-card dash-card">
        <div class="header-row">
          <div class="header-text">
            <h1>{{ t('title') }}</h1>
            <p>{{ t('desc') }}</p>
          </div>
          <button class="ai-btn primary" (click)="openCreateModal()">+ {{ t('newTeam') }}</button>
        </div>
      </div>

      <!-- GELEN DAVETLER: kabul / red -->
      <div class="team-card dash-card invites-card" *ngIf="pendingInvitations.length > 0">
        <h3>📨 {{ t('incoming') }} ({{ pendingInvitations.length }})</h3>
        <div class="invite-row" *ngFor="let inv of pendingInvitations">
          <div class="invite-text">
            <strong>{{ inv.teamName }}</strong>
            <small>{{ inv.invitedByName }} {{ t('invitedYou') }} · {{ inv.createdAt | date:'dd.MM.yyyy HH:mm' }}</small>
          </div>
          <div class="invite-actions">
            <button class="ai-btn accept-btn" [disabled]="busyInvitationId === inv.id" (click)="respond(inv, true)">✓ {{ t('accept') }}</button>
            <button class="ai-btn reject-btn" [disabled]="busyInvitationId === inv.id" (click)="respond(inv, false)">✕ {{ t('reject') }}</button>
          </div>
        </div>
      </div>

      <div class="feedback" *ngIf="pageFeedback" [class.success]="pageFeedback.ok" [class.error]="!pageFeedback.ok">{{ pageFeedback.text }}</div>

      <div class="team-layout">
        <!-- TAKIM LİSTESİ -->
        <div class="team-card dash-card team-list">
          <h3>{{ t('myTeams') }} ({{ teams.length }})</h3>
          <div class="empty-hint" *ngIf="!loadingTeams && teams.length === 0">{{ t('noTeams') }}</div>
          <button
            type="button"
            class="team-item"
            *ngFor="let team of teams"
            [class.selected]="team.id === selectedTeam?.id"
            (click)="selectTeam(team)">
            <span class="team-avatar">{{ team.name.charAt(0).toUpperCase() }}</span>
            <span class="team-item-text">
              <strong>{{ team.name }}</strong>
              <small>{{ team.memberCount }} {{ t('members') }}</small>
            </span>
            <span class="role-badge" [class.admin]="team.myRole === 'Admin'">{{ roleLabel(team.myRole) }}</span>
          </button>
        </div>

        <!-- SEÇİLİ TAKIM -->
        <div class="team-card dash-card team-detail" *ngIf="selectedTeam; else pickTeam">
          <div class="detail-header">
            <div>
              <h3>{{ selectedTeam.name }}</h3>
              <p class="card-desc">{{ selectedTeam.description || t('noDescription') }}</p>
            </div>
            <span class="role-badge" [class.admin]="isAdmin">{{ roleLabel(selectedTeam.myRole) }}</span>
          </div>

          <!-- Sadece yönetici davet gönderebilir -->
          <div class="invite-box" *ngIf="isAdmin">
            <label>{{ t('inviteLabel') }}</label>
            <div class="invite-form">
              <input type="email" [(ngModel)]="inviteEmail" class="glass-input" placeholder="colleague@domain.com" (keyup.enter)="sendInvitation()">
              <button class="ai-btn primary" [disabled]="sending" (click)="sendInvitation()">{{ t('sendInvite') }}</button>
            </div>
            <div class="feedback" *ngIf="inviteFeedback" [class.success]="inviteFeedback.ok" [class.error]="!inviteFeedback.ok">{{ inviteFeedback.text }}</div>
          </div>
          <p class="member-note" *ngIf="!isAdmin">{{ t('memberNote') }}</p>

          <div class="table-container">
            <table class="team-table">
              <thead>
                <tr>
                  <th>{{ t('member') }}</th>
                  <th>{{ t('role') }}</th>
                  <th>{{ t('joined') }}</th>
                  <th *ngIf="isAdmin"></th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let member of members">
                  <td>
                    <div class="member-cell">
                      <div class="member-avatar">{{ (member.fullName || member.email).charAt(0).toUpperCase() }}</div>
                      <div class="member-info">
                        <strong>{{ member.fullName || member.username }}</strong>
                        <small>{{ member.email }}</small>
                      </div>
                    </div>
                  </td>
                  <td><span class="role-badge" [class.admin]="member.role === 'Admin'">{{ roleLabel(member.role) }}</span></td>
                  <td class="muted">{{ member.joinedAt | date:'dd.MM.yyyy' }}</td>
                  <td *ngIf="isAdmin" class="text-right">
                    <button class="ai-btn danger-sm" *ngIf="member.userId !== currentUserId" (click)="removeMember(member)">{{ t('remove') }}</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Yöneticinin gönderdiği davetler -->
          <div *ngIf="isAdmin && sentInvitations.length > 0" class="sent-section">
            <h4>{{ t('sentInvites') }}</h4>
            <div class="sent-row" *ngFor="let inv of sentInvitations">
              <span>{{ inv.email }}</span>
              <span class="status" [ngClass]="inv.status.toLowerCase()">{{ statusLabel(inv.status) }}</span>
              <button class="ai-btn danger-sm" *ngIf="inv.status === 'Pending'" (click)="cancelInvitation(inv)">{{ t('cancel') }}</button>
            </div>
          </div>
        </div>

        <ng-template #pickTeam>
          <div class="team-card dash-card team-detail empty-detail">
            <p class="empty-hint">{{ teams.length ? t('pickTeam') : t('createFirst') }}</p>
          </div>
        </ng-template>
      </div>

      <!-- TAKIM OLUŞTURMA MODALI -->
      <div class="modal-backdrop" *ngIf="showCreateModal" (click)="showCreateModal = false">
        <div class="modal-card dash-card" (click)="$event.stopPropagation()">
          <h3>{{ t('newTeam') }}</h3>
          <p class="card-desc">{{ t('createDesc') }}</p>
          <div class="input-group">
            <label>{{ t('teamName') }}</label>
            <input type="text" [(ngModel)]="newTeamName" class="glass-input" maxlength="100" (keyup.enter)="createTeam()">
          </div>
          <div class="input-group">
            <label>{{ t('description') }}</label>
            <input type="text" [(ngModel)]="newTeamDescription" class="glass-input" maxlength="300">
          </div>
          <div class="feedback error" *ngIf="createError">{{ createError }}</div>
          <div class="modal-actions">
            <button class="ai-btn secondary" (click)="showCreateModal = false">{{ t('cancel') }}</button>
            <button class="ai-btn primary" [disabled]="creating" (click)="createTeam()">{{ t('create') }}</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: calc(100vh - 84px); color: #F1F5F9; font-family: 'Plus Jakarta Sans', sans-serif; }
    .workspace-container { max-width: 1200px; margin: 0 auto; padding: 40px; display: flex; flex-direction: column; gap: 24px; }
    .dash-card { background: rgba(11, 15, 30, 0.7); backdrop-filter: blur(30px); border-radius: 20px; padding: 28px; border: 1px solid rgba(139, 92, 246, 0.25); box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    .header-row { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
    .page-header-card h1 { font-size: 28px; font-weight: 700; margin: 0; color: #fff; }
    .page-header-card p, .card-desc { font-size: 13.5px; color: #94A3B8; margin: 4px 0 0 0; }
    .team-card h3 { font-size: 18px; font-weight: 700; color: #FFF; margin: 0 0 16px 0; }
    .team-layout { display: grid; grid-template-columns: minmax(260px, 340px) minmax(0, 1fr); gap: 24px; align-items: start; }
    .team-list { display: flex; flex-direction: column; gap: 10px; }
    .team-item { display: flex; align-items: center; gap: 12px; width: 100%; text-align: left; padding: 12px 14px; border-radius: 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); color: inherit; cursor: pointer; font-family: inherit; }
    .team-item:hover { border-color: var(--hover-color); box-shadow: 0 0 0 1px color-mix(in srgb, var(--hover-color) 55%, transparent), 0 0 26px color-mix(in srgb, var(--hover-color) 40%, transparent); }
    .team-item.selected { background: rgba(139,92,246,0.18); border-color: rgba(139,92,246,0.55); }
    .team-item-text { display: flex; flex-direction: column; flex: 1; min-width: 0; }
    .team-item-text strong { font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .team-item-text small { font-size: 12px; color: #94A3B8; }
    .team-avatar, .member-avatar { width: 38px; height: 38px; flex-shrink: 0; background: linear-gradient(135deg, #8B5CF6, #6366F1); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #FFF; }
    .member-avatar { border-radius: 50%; }
    .detail-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 20px; }
    .detail-header h3 { margin: 0; }
    .invite-box { display: flex; flex-direction: column; gap: 8px; padding: 16px; border-radius: 14px; background: rgba(139,92,246,0.08); border: 1px solid rgba(139,92,246,0.25); margin-bottom: 20px; }
    .invite-box label, .input-group label { font-size: 11px; font-weight: 700; color: #94A3B8; text-transform: uppercase; }
    .invite-form { display: flex; gap: 10px; }
    .invite-form .glass-input { flex: 1; min-width: 0; }
    .member-note { font-size: 12.5px; color: #94A3B8; margin: 0 0 16px; }
    .table-container { overflow-x: auto; }
    .team-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13.5px; }
    .team-table th { padding: 12px 14px; color: #94A3B8; border-bottom: 1px solid rgba(255,255,255,0.08); font-weight: 600; font-size: 11.5px; text-transform: uppercase; }
    .team-table tbody tr { transition: background 0.2s ease, box-shadow 0.2s ease; }
    .team-table tbody tr:hover { background: color-mix(in srgb, var(--hover-color) 10%, transparent); box-shadow: inset 3px 0 0 var(--hover-color); }
    .team-table td { padding: 14px; border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: middle; }
    .text-right { text-align: right; }
    .muted { color: #94A3B8; }
    .member-cell { display: flex; align-items: center; gap: 12px; }
    .member-info { display: flex; flex-direction: column; min-width: 0; }
    .member-info strong { font-size: 14px; color: #FFF; }
    .member-info small { font-size: 12px; color: #94A3B8; }
    .role-badge { background: rgba(255,255,255,0.08); padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; color: #E2E8F0; border: 1px solid rgba(255,255,255,0.1); white-space: nowrap; }
    .role-badge.admin { background: rgba(236,72,153,0.15); color: #F9A8D4; border-color: rgba(236,72,153,0.4); }
    .invites-card { border-color: rgba(34,197,94,0.4); }
    .invite-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px 0; border-top: 1px solid rgba(255,255,255,0.06); flex-wrap: wrap; }
    .invite-text { display: flex; flex-direction: column; }
    .invite-text small { color: #94A3B8; font-size: 12px; }
    .invite-actions { display: flex; gap: 8px; }
    .sent-section { margin-top: 24px; }
    .sent-section h4 { margin: 0 0 10px; font-size: 13px; color: #94A3B8; text-transform: uppercase; }
    .sent-row { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; gap: 12px; align-items: center; padding: 8px 0; font-size: 13px; border-top: 1px solid rgba(255,255,255,0.05); }
    .status { font-size: 12px; font-weight: 700; }
    .status.pending { color: #FACC15; } .status.accepted { color: #34D399; } .status.rejected { color: #F87171; }
    .ai-btn { padding: 9px 16px; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid transparent; font-family: inherit; white-space: nowrap; }
    .ai-btn:disabled { opacity: 0.6; cursor: wait; }
    .ai-btn.primary { background: linear-gradient(135deg, #8B5CF6, #6366F1); color: #FFF; }
    .ai-btn.secondary { background: rgba(255,255,255,0.1); color: #FFF; border-color: rgba(255,255,255,0.2); }
    .ai-btn.accept-btn { background: rgba(34,197,94,0.2); color: #34D399; border-color: rgba(34,197,94,0.4); }
    .ai-btn.reject-btn, .ai-btn.danger-sm { background: rgba(239,68,68,0.15); color: #F87171; border-color: rgba(239,68,68,0.35); }
    .ai-btn.danger-sm { padding: 5px 12px; font-size: 11.5px; }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 16px; }
    .modal-card { width: 440px; max-width: 100%; display: flex; flex-direction: column; gap: 14px; }
    .modal-card h3 { margin: 0; font-size: 20px; color: #FFF; }
    .input-group { display: flex; flex-direction: column; gap: 6px; }
    .glass-input { height: 42px; border-radius: 10px; background: rgba(18, 24, 48, 0.9); border: 1px solid rgba(139, 92, 246, 0.3); color: #fff; padding: 0 14px; font-size: 13px; outline: none; width: 100%; font-family: inherit; }
    .glass-input:focus { border-color: #A855F7; }
    .feedback { font-size: 12.5px; padding: 8px 12px; border-radius: 8px; }
    .feedback.success { background: rgba(34,197,94,0.15); color: #34D399; border: 1px solid rgba(34,197,94,0.3); }
    .feedback.error { background: rgba(239,68,68,0.15); color: #F87171; border: 1px solid rgba(239,68,68,0.3); }
    .modal-actions { display: flex; justify-content: flex-end; gap: 10px; }
    .empty-hint { text-align: center; color: rgba(255,255,255,0.4); font-style: italic; padding: 24px 0; margin: 0; }
    .empty-detail { display: flex; align-items: center; justify-content: center; min-height: 200px; }
    @media (max-width: 860px) {
      .workspace-container { padding: 20px 16px; }
      .team-layout { grid-template-columns: 1fr; }
      .invite-form { flex-direction: column; }
    }
  `]
})
export class TeamComponent implements OnInit {
  private teamService = inject(TeamService);
  private langService = inject(LanguageService);
  private userState = inject(UserStateService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  currentLang: LangType = 'tr';
  currentUserId: number | null = null;

  teams: Team[] = [];
  loadingTeams = true;
  selectedTeam: Team | null = null;
  members: TeamMemberInfo[] = [];
  sentInvitations: TeamInvitation[] = [];
  pendingInvitations: TeamInvitation[] = [];

  inviteEmail = '';
  sending = false;
  inviteFeedback: Feedback = null;
  pageFeedback: Feedback = null;
  busyInvitationId: number | null = null;

  showCreateModal = false;
  newTeamName = '';
  newTeamDescription = '';
  creating = false;
  createError = '';

  get isAdmin(): boolean {
    return this.selectedTeam?.myRole === 'Admin';
  }

  ngOnInit() {
    this.langService.lang$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(l => {
      this.currentLang = l;
      this.cdr.markForCheck();
    });

    this.userState.currentUser$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(u => {
      this.currentUserId = u?.id ?? null;
      this.cdr.markForCheck();
    });

    this.teamService.pendingInvitations$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(list => {
      this.pendingInvitations = list;
      this.cdr.markForCheck();
    });

    // Bildirim zilinden kabul edilen davetler de takım listesini yeniler
    this.teamService.teamsChanged$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.loadTeams());
    this.teamService.refreshPendingInvitations();
  }

  loadTeams(selectId?: number) {
    this.teamService.getMyTeams().subscribe({
      next: teams => {
        this.teams = teams;
        this.loadingTeams = false;
        const id = selectId ?? this.selectedTeam?.id;
        const toSelect = teams.find(t => t.id === id) ?? teams[0] ?? null;
        if (toSelect) {
          this.selectTeam(toSelect);
        } else {
          this.selectedTeam = null;
        }
        this.cdr.markForCheck();
      },
      error: err => {
        this.loadingTeams = false;
        this.pageFeedback = { text: this.errorText(err), ok: false };
        this.cdr.markForCheck();
      }
    });
  }

  selectTeam(team: Team) {
    this.selectedTeam = team;
    this.inviteFeedback = null;
    this.members = [];
    this.sentInvitations = [];

    this.teamService.getMembers(team.id).subscribe(members => {
      this.members = members;
      this.cdr.markForCheck();
    });

    if (team.myRole === 'Admin') {
      this.loadSentInvitations(team.id);
    }
  }

  openCreateModal() {
    this.newTeamName = '';
    this.newTeamDescription = '';
    this.createError = '';
    this.showCreateModal = true;
  }

  createTeam() {
    if (this.newTeamName.trim().length < 2) {
      this.createError = this.t('nameRequired');
      return;
    }
    this.creating = true;
    this.teamService.createTeam(this.newTeamName.trim(), this.newTeamDescription.trim()).subscribe({
      next: res => {
        this.creating = false;
        this.showCreateModal = false;
        this.pageFeedback = { text: res.message, ok: true };
        this.loadTeams(res.teamId);
      },
      error: err => {
        this.creating = false;
        this.createError = this.errorText(err);
        this.cdr.markForCheck();
      }
    });
  }

  sendInvitation() {
    const team = this.selectedTeam;
    const email = this.inviteEmail.trim();
    if (!team || !email) return;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.inviteFeedback = { text: this.t('invalidEmail'), ok: false };
      return;
    }

    this.sending = true;
    this.teamService.invite(team.id, email).subscribe({
      next: res => {
        this.sending = false;
        this.inviteEmail = '';
        this.inviteFeedback = { text: res.message, ok: true };
        this.loadSentInvitations(team.id);
      },
      error: err => {
        this.sending = false;
        this.inviteFeedback = { text: this.errorText(err), ok: false };
        this.cdr.markForCheck();
      }
    });
  }

  cancelInvitation(inv: TeamInvitation) {
    this.teamService.cancelInvitation(inv.teamId, inv.id).subscribe({
      next: () => this.loadSentInvitations(inv.teamId),
      error: err => {
        this.inviteFeedback = { text: this.errorText(err), ok: false };
        this.cdr.markForCheck();
      }
    });
  }

  removeMember(member: TeamMemberInfo) {
    const team = this.selectedTeam;
    if (!team || !confirm(`${member.fullName || member.email} ${this.t('confirmRemove')}`)) return;

    this.teamService.removeMember(team.id, member.userId).subscribe({
      next: () => this.loadTeams(team.id),
      error: err => {
        this.inviteFeedback = { text: this.errorText(err), ok: false };
        this.cdr.markForCheck();
      }
    });
  }

  respond(inv: TeamInvitation, accept: boolean) {
    this.busyInvitationId = inv.id;
    this.teamService.respond(inv.id, accept).subscribe({
      next: res => {
        this.busyInvitationId = null;
        this.pageFeedback = { text: res.message, ok: true };
        this.cdr.markForCheck();
      },
      error: err => {
        this.busyInvitationId = null;
        this.pageFeedback = { text: this.errorText(err), ok: false };
        this.teamService.refreshPendingInvitations();
        this.cdr.markForCheck();
      }
    });
  }

  roleLabel(role: string): string {
    return role === 'Admin' ? this.t('admin') : this.t('memberRole');
  }

  statusLabel(status: string): string {
    return this.t('status' + status);
  }

  private loadSentInvitations(teamId: number) {
    this.teamService.getSentInvitations(teamId).subscribe(list => {
      this.sentInvitations = list;
      this.cdr.markForCheck();
    });
  }

  private errorText(err: HttpErrorResponse): string {
    if (err.status === 0) return this.t('serverDown');
    return err.error?.message || this.t('genericError');
  }

  t(key: string): string {
    const dict: Record<LangType, Record<string, string>> = {
      tr: {
        title: 'Takımlar',
        desc: 'Takım kurun, yöneticisi olun ve ekip arkadaşlarınıza katılım isteği gönderin.',
        newTeam: 'Yeni Takım',
        incoming: 'Bekleyen Takım Davetleri',
        invitedYou: 'sizi bu takıma davet etti',
        accept: 'Kabul Et',
        reject: 'Reddet',
        myTeams: 'Takımlarım',
        noTeams: 'Henüz bir takımınız yok.',
        members: 'üye',
        noDescription: 'Açıklama yok',
        inviteLabel: 'E-posta ile üye davet et',
        sendInvite: 'Davet Gönder',
        memberNote: 'Bu takımda üyesiniz. Sadece takım yöneticisi davet gönderebilir.',
        member: 'Üye',
        role: 'Rol',
        joined: 'Katılım',
        remove: 'Çıkar',
        sentInvites: 'Gönderilen Davetler',
        cancel: 'İptal',
        pickTeam: 'Detayları görmek için bir takım seçin.',
        createFirst: 'İlk takımınızı oluşturun — oluşturan kişi otomatik olarak yönetici olur.',
        createDesc: 'Takımı oluşturan kişi yönetici (Admin) olur ve davet gönderebilir.',
        teamName: 'Takım Adı',
        description: 'Açıklama (isteğe bağlı)',
        create: 'Oluştur',
        nameRequired: 'Takım adı en az 2 karakter olmalıdır.',
        invalidEmail: 'Geçerli bir e-posta adresi girin.',
        confirmRemove: 'takımdan çıkarılsın mı?',
        admin: 'Yönetici',
        memberRole: 'Üye',
        statusPending: 'Bekliyor',
        statusAccepted: 'Kabul edildi',
        statusRejected: 'Reddedildi',
        statusExpired: 'Süresi doldu',
        serverDown: 'Sunucuya ulaşılamadı.',
        genericError: 'İşlem başarısız oldu.'
      },
      en: {
        title: 'Teams',
        desc: 'Create a team, become its admin and send join requests to your teammates.',
        newTeam: 'New Team',
        incoming: 'Pending Team Invitations',
        invitedYou: 'invited you to this team',
        accept: 'Accept',
        reject: 'Decline',
        myTeams: 'My Teams',
        noTeams: 'You have no teams yet.',
        members: 'members',
        noDescription: 'No description',
        inviteLabel: 'Invite a member by email',
        sendInvite: 'Send Invite',
        memberNote: 'You are a member of this team. Only the team admin can send invitations.',
        member: 'Member',
        role: 'Role',
        joined: 'Joined',
        remove: 'Remove',
        sentInvites: 'Sent Invitations',
        cancel: 'Cancel',
        pickTeam: 'Select a team to see its details.',
        createFirst: 'Create your first team — the creator automatically becomes its admin.',
        createDesc: 'The person who creates the team becomes its Admin and can send invitations.',
        teamName: 'Team Name',
        description: 'Description (optional)',
        create: 'Create',
        nameRequired: 'Team name must be at least 2 characters.',
        invalidEmail: 'Enter a valid email address.',
        confirmRemove: 'will be removed from the team. Continue?',
        admin: 'Admin',
        memberRole: 'Member',
        statusPending: 'Pending',
        statusAccepted: 'Accepted',
        statusRejected: 'Declined',
        statusExpired: 'Expired',
        serverDown: 'Could not reach the server.',
        genericError: 'The operation failed.'
      }
    };
    return dict[this.currentLang]?.[key] ?? dict.tr[key] ?? key;
  }
}
