import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, HostListener, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TaskService, AppSettings, AppNotification } from '../../services/task';
import { LanguageService, LangType } from '../../services/language.service';
import { ThemeService, ThemeType } from '../../services/theme.service';
import { UserStateService, AuthenticatedUser } from '../../services/user-state.service';
import { AiCompanionComponent } from '../ai-companion/ai-companion.component';

interface ProceduralMeteor {
  id: number;
  style: string;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, AiCompanionComponent],
  template: `
    <div class="app-layout" [ngClass]="currentTheme">
      <div class="space-layer-1 base-gradient"></div>
      <div class="space-layer-2 ambient-nebulas">
        <div class="nebula-blob nb1"></div>
        <div class="nebula-blob nb2"></div>
      </div>
      <div class="space-layer-3-4">
        <canvas #starCanvas class="star-canvas"></canvas>
      </div>
      <div class="space-layer-5 procedural-meteor-layer">
        <div *ngFor="let m of activeMeteors" class="procedural-meteor" [style]="m.style"></div>
      </div>

      <header class="app-navbar">
        <div class="brand-logo-container" routerLink="/dashboard" title="RanaCore">
          <div class="brand-icon-wrapper glow-hover-pink">
            <span class="brand-letter">R</span>
            <div class="sparkle-dot"></div>
          </div>
          <h1 class="brand-title">Rana<span class="brand-core">Core</span></h1>
        </div>

        <nav class="nav-links">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-tab glow-hover">{{ t('navDashboard') }}</a>
          <a routerLink="/tasks" routerLinkActive="active" class="nav-tab glow-hover">{{ t('navTasks') }}</a>
          <a routerLink="/board" routerLinkActive="active" class="nav-tab glow-hover">{{ t('navBoard') }}</a>
          <a routerLink="/calendar" routerLinkActive="active" class="nav-tab glow-hover">{{ t('navCalendar') }}</a>
          <a routerLink="/reports" routerLinkActive="active" class="nav-tab glow-hover">{{ t('navReports') }}</a>
          <a routerLink="/settings" routerLinkActive="active" class="nav-tab glow-hover">{{ t('navSettings') }}</a>
        </nav>

        <div class="nav-right">
          <div class="notification-container" (click)="$event.stopPropagation()">
            <button class="nav-icon-btn glow-hover" (click)="toggleNotifications()" [title]="t('notifications')">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
              <span class="notification-badge" *ngIf="unreadCount > 0">{{ unreadCount }}</span>
            </button>
            <div class="notification-dropdown" *ngIf="showNotifications">
              <div class="dropdown-header">
                <h3>{{ t('notifCenter') }}</h3>
                <button class="text-btn" (click)="markAllRead()">{{ t('markAllRead') }}</button>
              </div>
              <div class="dropdown-body">
                <div class="notification-item" *ngFor="let item of notifications" [class.unread]="!item.read">
                  <p><strong>{{ item.title }}</strong> {{ item.message }}</p>
                  
                  <div class="invite-actions" *ngIf="item.isInvite && item.inviteStatus === 'pending'">
                    <button class="invite-btn accept" (click)="$event.stopPropagation(); acceptInvite(item.inviteId!)">✓ Kabul Et</button>
                    <button class="invite-btn reject" (click)="$event.stopPropagation(); rejectInvite(item.inviteId!)">✕ Reddet</button>
                  </div>

                  <span class="invite-status-label accepted" *ngIf="item.isInvite && item.inviteStatus === 'accepted'">✓ Kabul Edildi</span>
                  <span class="invite-status-label rejected" *ngIf="item.isInvite && item.inviteStatus === 'rejected'">✕ Reddedildi</span>

                  <span class="notif-time" *ngIf="item.time">{{ item.time }}</span>
                </div>
                <div class="empty-notifs" *ngIf="notifications.length === 0">{{ t('noNotifications') }}</div>
              </div>
            </div>
          </div>

          <div class="user-dropdown-container" (click)="$event.stopPropagation()">
            <div class="user-avatar glow-hover" (click)="toggleUserDropdown()">
              <img *ngIf="isAvatarImage()" [src]="user?.avatar" class="avatar-img" />
              <span *ngIf="!isAvatarImage()">{{ getAvatarInitial() }}</span>
            </div>

            <div class="user-dropdown-menu" *ngIf="showUserDropdown">
              <div class="user-menu-header">
                <div class="menu-avatar-preview">
                  <img *ngIf="isAvatarImage()" [src]="user?.avatar" class="avatar-img" />
                  <span *ngIf="!isAvatarImage()">{{ getAvatarInitial() }}</span>
                </div>
                <div class="menu-user-info">
                  <strong>{{ user?.fullName || activeFullName || 'Kullanıcı' }}</strong>
                  <span>{{ user?.email || activeEmail || '' }}</span>
                </div>
              </div>

              <div class="user-menu-divider"></div>

              <div class="user-menu-body">
                <button class="menu-item" routerLink="/settings" (click)="showUserDropdown = false">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                  <span>{{ t('navSettings') }}</span>
                </button>
              </div>

              <div class="user-menu-divider"></div>

              <div class="user-menu-footer">
                <button class="menu-item logout-item" (click)="logout()">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                  <span>{{ t('logout') }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main class="app-main-content">
        <router-outlet></router-outlet>
      </main>

      <app-ai-companion></app-ai-companion>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    *, *::before, *::after { box-sizing: border-box; }
    select, option { background-color: var(--surface, #131A2E) !important; color: var(--text, #F8FAFC) !important; border: 1px solid var(--border, rgba(139, 92, 246, 0.3)) !important; }
    .app-layout { min-height: 100vh; font-family: 'Plus Jakarta Sans', sans-serif; color: var(--text, #F1F5F9); display: flex; flex-direction: column; position: relative; overflow-x: hidden; background: var(--bg, #0B0F19); transition: background 0.5s ease; }
    .base-gradient { position: fixed; inset: 0; z-index: 0; pointer-events: none; transition: background 0.5s ease; }
    .app-layout.cosmic-nebula .base-gradient { background: radial-gradient(circle at 50% 50%, #111827 0%, #0B0F19 100%); }
    .app-layout.cosmic-nebula .nb1 { background: radial-gradient(circle, rgba(139, 92, 246, 0.25) 0%, transparent 75%); }
    .app-layout.cosmic-nebula .nb2 { background: radial-gradient(circle, rgba(6, 182, 212, 0.18) 0%, transparent 75%); }
    .app-layout.midnight .base-gradient { background: radial-gradient(circle at 50% 50%, #020617 0%, #000000 100%); }
    .app-layout.midnight .nb1 { background: radial-gradient(circle, rgba(30, 58, 138, 0.3) 0%, transparent 75%); }
    .app-layout.midnight .nb2 { background: radial-gradient(circle, rgba(15, 23, 42, 0.35) 0%, transparent 75%); }
    .app-layout.cyberpunk .base-gradient { background: radial-gradient(circle at 50% 50%, #1e1b4b 0%, #090314 100%); }
    .app-layout.cyberpunk .nb1 { background: radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, transparent 75%); }
    .app-layout.cyberpunk .nb2 { background: radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, transparent 75%); }
    .ambient-nebulas { position: fixed; inset: 0; pointer-events: none; z-index: 0; opacity: 0.45; overflow: hidden; }
    .nebula-blob { position: fixed; border-radius: 50%; filter: blur(180px); pointer-events: none; transition: background 0.5s ease; }
    .nb1 { top: -10vh; left: -10vw; width: 750px; height: 750px; }
    .nb2 { bottom: -15vh; right: -10vw; width: 900px; height: 900px; }
    .space-layer-3-4 { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
    .star-canvas { width: 100vw; height: 100vh; display: block; }
    .procedural-meteor-layer { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
    .procedural-meteor {
      position: absolute; height: 2px;
      background: linear-gradient(90deg, #FFFFFF, rgba(168, 85, 247, 0.95), transparent);
      box-shadow: 0 0 16px rgba(168, 85, 247, 0.95);
      will-change: transform, opacity; opacity: 0;
      animation: proceduralFly var(--meteor-duration) cubic-bezier(0.25, 1, 0.5, 1) forwards;
    }
    @keyframes proceduralFly {
      0% { transform: translate(0px, 0px) rotate(var(--meteor-angle)) scaleX(0.2); opacity: 0; }
      20% { opacity: 1; }
      70% { opacity: 0.8; }
      100% { transform: translate(var(--end-x), var(--end-y)) rotate(var(--meteor-angle)) scaleX(1); opacity: 0; }
    }
    .app-navbar {
      height: 84px; background: var(--surface, rgba(19, 26, 46, 0.8)); backdrop-filter: blur(30px);
      border-bottom: 1px solid var(--border, rgba(139, 92, 246, 0.25)); padding: 0 32px; display: flex;
      align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 1000;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    }
    .brand-logo-container { display: flex; align-items: center; gap: 14px; cursor: pointer; transition: transform 0.3s ease; }
    .brand-logo-container:hover { transform: scale(1.03); }
    .brand-icon-wrapper {
      width: 44px; height: 44px; background: linear-gradient(135deg, #EC4899 0%, #A855F7 50%, #6366F1 100%);
      border-radius: 16px; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 25px rgba(236, 72, 153, 0.4); position: relative;
    }
    .brand-letter { font-size: 22px; font-weight: 800; color: #FFFFFF; }
    .sparkle-dot { position: absolute; top: 6px; right: 6px; width: 7px; height: 7px; background: #F472B6; border-radius: 50%; box-shadow: 0 0 8px #FFFFFF, 0 0 12px #F472B6; }
    .brand-title { font-size: 24px; font-weight: 800; margin: 0; color: #FFFFFF; }
    .brand-core { background: linear-gradient(135deg, #F472B6 0%, #C084FC 60%, #38BDF8 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .nav-links { display: flex; align-items: center; gap: 4px; background: rgba(255, 255, 255, 0.04); padding: 5px; border-radius: 9999px; border: 1px solid rgba(255, 255, 255, 0.08); }
    .nav-tab { display: flex; align-items: center; padding: 8px 14px; border-radius: 9999px; font-size: 12.5px; font-weight: 600; color: var(--muted, #94A3B8); text-decoration: none; transition: 0.3s; white-space: nowrap; }
    .nav-tab:hover { color: #FFFFFF; background: rgba(139, 92, 246, 0.2); }
    .nav-tab.active { color: #FFFFFF; background: linear-gradient(135deg, #8B5CF6, #6366F1); box-shadow: 0 0 15px rgba(139,92,246,0.4); }
    .nav-right { display: flex; align-items: center; gap: 16px; }
    .nav-icon-btn {
      position: relative; width: 42px; height: 42px; background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 50%; color: var(--text, #CBD5E1);
      display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.3s;
    }
    .notification-badge {
      position: absolute; top: -2px; right: -2px; background: #EC4899; color: #fff; font-size: 10px; font-weight: 700;
      width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px #EC4899;
    }
    .user-dropdown-container { position: relative; }
    .user-avatar {
      width: 42px; height: 42px; border-radius: 50%; background: linear-gradient(135deg, #8B5CF6, #3B82F6);
      display: flex; align-items: center; justify-content: center; font-weight: 700; color: #fff; cursor: pointer; transition: 0.3s;
      overflow: hidden;
    }
    .user-avatar:hover { transform: scale(1.05); }
    .avatar-img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
    .user-dropdown-menu {
      position: absolute; right: 0; top: 52px; width: 260px; background: rgba(15, 22, 41, 0.92);
      backdrop-filter: blur(25px); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 20px;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.7); z-index: 1100; padding: 12px; display: flex; flex-direction: column; gap: 6px;
      animation: dropdownFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes dropdownFadeIn {
      from { opacity: 0; transform: translateY(-8px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .user-menu-header { display: flex; align-items: center; gap: 12px; padding: 8px 8px 12px 8px; }
    .menu-avatar-preview { width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, #8B5CF6, #3B82F6); display: flex; align-items: center; justify-content: center; font-weight: 700; color: #fff; font-size: 14px; overflow: hidden; flex-shrink: 0; }
    .menu-user-info { display: flex; flex-direction: column; gap: 2px; overflow: hidden; }
    .menu-user-info strong { font-size: 13.5px; color: var(--text, #F8FAFC); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .menu-user-info span { font-size: 11px; color: var(--muted, #94A3B8); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-menu-divider { height: 1px; background: rgba(255, 255, 255, 0.08); margin: 4px 0; }
    .user-menu-body, .user-menu-footer { display: flex; flex-direction: column; gap: 4px; }
    .menu-item { background: none; border: none; width: 100%; text-align: left; padding: 10px 12px; border-radius: 12px; color: var(--text, #E2E8F0); font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: 0.2s; text-decoration: none; }
    .menu-item svg { opacity: 0.7; transition: 0.2s; }
    .menu-item:hover { background: rgba(139, 92, 246, 0.15); color: #FFFFFF; }
    .menu-item:hover svg { opacity: 1; color: #C084FC; }
    .logout-item { color: #F87171; }
    .logout-item:hover { background: rgba(239, 68, 68, 0.15); color: #FCA5A5; }
    .logout-item svg { color: #F87171; }
    .glow-hover:hover { 
      border-color: var(--hover-color, #8B5CF6) !important; 
      box-shadow: 0 0 35px color-mix(in srgb, var(--hover-color, #8B5CF6) 60%, transparent) !important; 
      background: rgba(255, 255, 255, 0.08) !important; 
    }
    .notification-container { position: relative; }
    .notification-dropdown {
      position: absolute; right: 0; top: 52px; width: 360px; background: var(--surface, rgba(19, 26, 46, 0.95));
      backdrop-filter: blur(30px); border: 1px solid var(--border, rgba(139, 92, 246, 0.4)); border-radius: 20px;
      box-shadow: 0 30px 60px rgba(0, 0, 0, 0.8); z-index: 1100; padding: 14px;
    }
    .dropdown-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px; }
    .dropdown-header h3 { margin: 0; font-size: 14px; font-weight: 700; color: var(--text, #F8FAFC); }
    .text-btn { background: none; border: none; color: #C084FC; font-size: 11.5px; cursor: pointer; }
    .dropdown-body { max-height: 300px; overflow-y: auto; margin-top: 8px; display: flex; flex-direction: column; gap: 8px; }
    .notification-item { padding: 12px; border-radius: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); display: flex; flex-direction: column; gap: 8px; }
    .notification-item.unread { background: rgba(139,92,246,0.12); border-color: rgba(139,92,246,0.3); }
    .notification-item p { margin: 0; font-size: 12.5px; color: var(--text, #E2E8F0); line-height: 1.4; }
    .invite-actions { display: flex; gap: 8px; margin-top: 4px; }
    .invite-btn { padding: 6px 14px; border-radius: 8px; font-size: 11.5px; font-weight: 700; cursor: pointer; border: none; transition: 0.2s; }
    .invite-btn.accept { background: rgba(34, 197, 94, 0.2); color: #34D399; border: 1px solid rgba(34, 197, 94, 0.4); }
    .invite-btn.accept:hover { background: rgba(34, 197, 94, 0.35); }
    .invite-btn.reject { background: rgba(239, 68, 68, 0.2); color: #F87171; border: 1px solid rgba(239, 68, 68, 0.4); }
    .invite-btn.reject:hover { background: rgba(239, 68, 68, 0.35); }
    .invite-status-label { font-size: 11.5px; font-weight: 700; margin-top: 4px; }
    .invite-status-label.accepted { color: #34D399; }
    .invite-status-label.rejected { color: #F87171; }
    .notif-time { font-size: 10px; color: var(--muted, #94A3B8); display: block; }
    .empty-notifs { text-align: center; padding: 20px; color: var(--muted); font-size: 13px; }
    .app-main-content { flex-grow: 1; width: 100%; position: relative; z-index: 1; }
  `]
})
export class LayoutComponent implements OnInit, AfterViewInit {
  private taskService = inject(TaskService);
  private themeService = inject(ThemeService);
  private langService = inject(LanguageService);
  private userStateService = inject(UserStateService);
  private router = inject(Router);
  private ngZone = inject(NgZone);

  showNotifications = false;
  showUserDropdown = false;
  notifications: AppNotification[] = [];
  unreadCount = 0;
  
  user: AuthenticatedUser | null = null;
  activeEmail = '';
  activeFullName = '';
  
  currentTheme: string = 'cosmic-nebula';
  currentLang: LangType = 'tr';

  activeMeteors: ProceduralMeteor[] = [];
  private meteorIdCounter = 0;

  private palette = [
    '#8B5CF6', '#A855F7', '#EC4899', '#3B82F6', '#06B6D4', 
    '#14B8A6', '#22C55E', '#84CC16', '#F59E0B', '#F97316', '#E879F9', '#6366F1'
  ];

  @ViewChild('starCanvas') starCanvas!: ElementRef<HTMLCanvasElement>;

  ngOnInit() {
    this.taskService.notifications$.subscribe((nList: AppNotification[]) => {
      this.notifications = nList;
      this.unreadCount = nList.filter(n => !n.read).length;
    });

    // LocalStorage'dan anlık fallback verilerini alıyoruz ki "Yükleniyor" kalmasın
    this.activeEmail = localStorage.getItem('ranacore_active_email') || '';
    const accountsJson = localStorage.getItem('ranacore_accounts');
    if (accountsJson && this.activeEmail) {
      const accounts = JSON.parse(accountsJson);
      const acc = accounts.find((a: any) => a.email === this.activeEmail);
      if (acc) {
        this.activeFullName = `${acc.name} ${acc.surname || ''}`.trim();
      }
    }

    this.userStateService.fetchCurrentUser();
    this.userStateService.currentUser$.subscribe((u: AuthenticatedUser | null) => {
      this.user = u;
      if (u) {
        this.activeFullName = u.fullName;
        this.activeEmail = u.email;
      }
    });

    this.langService.lang$.subscribe((l: LangType) => {
      this.currentLang = l;
    });

    this.themeService.theme$.subscribe((t: ThemeType) => {
      this.currentTheme = t;
      document.body.setAttribute('data-theme', t);
    });

    this.taskService.settings$.subscribe((settings: AppSettings) => {
      if (settings.theme) {
        this.currentTheme = settings.theme;
        document.body.setAttribute('data-theme', settings.theme);
      }
    });

    this.startProceduralMeteorEngine();
  }

  ngAfterViewInit() { 
    this.initUniformStarField(); 
  }

  toggleNotifications() { 
    this.showNotifications = !this.showNotifications; 
    this.showUserDropdown = false;
  }

  toggleUserDropdown() {
    this.showUserDropdown = !this.showUserDropdown;
    this.showNotifications = false;
  }

  logout() {
    this.userStateService.clearUser();
    this.showUserDropdown = false;
    this.router.navigate(['/login']);
  }

  isAvatarImage(): boolean {
    return !!(this.user?.avatar && (this.user.avatar.startsWith('data:image') || this.user.avatar.startsWith('http')));
  }

  getAvatarInitial(): string {
    const nameToUse = this.user?.fullName || this.activeFullName;
    if (nameToUse && nameToUse.length > 0) {
      return nameToUse.charAt(0).toUpperCase();
    }
    return 'K';
  }

  acceptInvite(inviteId: string) {
    this.taskService.respondToInvitation(inviteId, true);
  }

  rejectInvite(inviteId: string) {
    this.taskService.respondToInvitation(inviteId, false);
  }

  @HostListener('mouseenter', ['$event'])
  onGlobalMouseEnter(event: MouseEvent) {
    const selector = '.glass-card, .metric-card, .dash-card, .welcome-hero-section, .page-header-card, .task-card, .board-column, .calendar-card, .report-card, button, .nav-tab, .user-avatar, .nav-icon-btn';
    const target = (event.target as HTMLElement).closest(selector);
    if (target) {
      const randomColor = this.palette[Math.floor(Math.random() * this.palette.length)];
      (target as HTMLElement).style.setProperty('--hover-color', randomColor);
    }
  }

  t(key: string): string {
    const dict: Record<LangType, Record<string, string>> = {
      tr: {
        navDashboard: 'Ana Sayfa',
        navTasks: 'Görevler',
        navBoard: 'Pano',
        navCalendar: 'Takvim',
        navReports: 'Raporlar',
        navSettings: 'Ayarlar',
        notifications: 'Bildirimler',
        notifCenter: 'Bildirim Merkezi',
        markAllRead: 'Tümünü Oku',
        logout: 'Çıkış Yap',
        noNotifications: 'Bildirim bulunmuyor.'
      },
      en: {
        navDashboard: 'Dashboard',
        navTasks: 'Tasks',
        navBoard: 'Board',
        navCalendar: 'Calendar',
        navReports: 'Reports',
        navSettings: 'Settings',
        notifications: 'Notifications',
        notifCenter: 'Notification Center',
        markAllRead: 'Mark All Read',
        logout: 'Log Out',
        noNotifications: 'No notifications found.'
      }
    };
    return dict[this.currentLang]?.[key] || dict['tr'][key] || key;
  }

  private initUniformStarField() {
    const canvas = this.starCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const generateStars = (w: number, h: number) => {
      return Array.from({ length: 350 }, () => {
        const sizeRand = Math.random();
        let radius = Math.random() * 1.0 + 0.3;
        let isLarge = false;
        let isMedium = false;

        if (sizeRand > 0.90) { radius = Math.random() * 2.2 + 1.8; isLarge = true; }
        else if (sizeRand > 0.70) { radius = Math.random() * 1.4 + 1.0; isMedium = true; }

        const colorRand = Math.random();
        let colorPrefix = 'rgba(255, 255, 255, ';
        if (colorRand > 0.75) colorPrefix = 'rgba(196, 181, 253, ';
        else if (colorRand > 0.50) colorPrefix = 'rgba(147, 197, 253, ';
        else if (colorRand > 0.25) colorPrefix = 'rgba(165, 243, 252, ';

        const randomDurationSec = Math.random() * 18 + 6; 
        const stepSpeed = (2 / (randomDurationSec * 60)) * (Math.random() > 0.5 ? 1 : -1);

        return { x: Math.random() * w, y: Math.random() * h, radius, alpha: Math.random() * 0.5 + 0.2, speed: stepSpeed, colorPrefix, isLarge, isMedium };
      });
    };

    let stars = generateStars(width, height);

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      stars = generateStars(width, height);
    });

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      stars.forEach(s => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = s.colorPrefix + s.alpha + ')';
        if (s.isLarge) { ctx.shadowBlur = 12; ctx.shadowColor = 'rgba(139, 92, 246, 0.7)'; }
        else if (s.isMedium) { ctx.shadowBlur = 4; ctx.shadowColor = 'rgba(165, 243, 252, 0.4)'; }
        else { ctx.shadowBlur = 0; }
        ctx.fill();

        s.alpha += s.speed;
        if (s.alpha > 0.85 || s.alpha < 0.2) { s.speed = -s.speed; }
      });
      requestAnimationFrame(animate);
    };
    animate();
  }

  private startProceduralMeteorEngine() {
    const spawnMeteor = () => {
      this.ngZone.run(() => {
        const w = window.innerWidth || 1200;
        const h = window.innerHeight || 800;

        const edge = Math.floor(Math.random() * 4);
        let startX = 0, startY = 0;

        if (edge === 0) { startX = Math.random() * w; startY = -120; }
        else if (edge === 1) { startX = Math.random() * w; startY = h + 120; }
        else if (edge === 2) { startX = -120; startY = Math.random() * h; }
        else { startX = w + 120; startY = Math.random() * h; }

        const endX = Math.random() * (w + 600) - 300;
        const endY = Math.random() * (h + 600) - 300;

        const dx = endX - startX;
        const dy = endY - startY;
        const angleRad = Math.atan2(dy, dx);
        const angleDeg = angleRad * (180 / Math.PI);

        const distance = Math.sqrt(dx * dx + dy * dy);
        const speed = 200 + Math.random() * 250;
        const duration = distance / speed;
        const length = 140 + Math.random() * 180;
        const id = this.meteorIdCounter++;

        const style = `
          top: ${startY}px; left: ${startX}px; width: ${length}px;
          --end-x: ${dx}px; --end-y: ${dy}px;
          --meteor-duration: ${duration}s; --meteor-angle: ${angleDeg}deg;
        `;

        if (this.activeMeteors.length < 5) { this.activeMeteors.push({ id, style }); }

        setTimeout(() => {
          this.activeMeteors = this.activeMeteors.filter(m => m.id !== id);
        }, duration * 1000);
      });

      const nextInterval = (Math.random() * 3.5 + 2) * 1000;
      setTimeout(spawnMeteor, nextInterval);
    };

    setTimeout(spawnMeteor, 100);
  }

  markAllRead() { this.taskService.markAllNotificationsRead(); }
  @HostListener('document:click') onDocClick() { 
    this.showNotifications = false; 
    this.showUserDropdown = false;
  }
}