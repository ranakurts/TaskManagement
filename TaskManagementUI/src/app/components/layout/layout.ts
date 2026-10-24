import { Component, HostListener, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { LanguageService } from '../../services/language.service';
import { ThemeService } from '../../services/theme.service';
import { UserStateService } from '../../services/user-state.service';
import { TeamService } from '../../services/team.service';
import { TaskStoreService } from '../../services/task-store.service';
import { UiService } from '../../services/ui.service';
import { dueState } from '../../models/task.model';
import { AiCompanionComponent } from '../ai-companion/ai-companion.component';
import { BrandComponent } from '../brand/brand';
import { SpaceBackgroundComponent } from '../space-bg/space-bg';
import { TaskModalComponent } from '../task-modal/task-modal';
import { TaskDrawerComponent } from '../task-drawer/task-drawer';
import { CommandPaletteComponent } from '../command-palette/command-palette';
import { ToastHostComponent } from '../toast-host/toast-host';
import { AvatarComponent, IconComponent } from '../ui/task-bits';

interface AppNotice {
  key: string;
  kind: 'assigned' | 'overdue';
  taskId: number;
  title: string;
  text: string;
  at: string;
}

const NAV = [
  { path: '/dashboard', key: 'dashboard' },
  { path: '/tasks', key: 'tasks' },
  { path: '/board', key: 'board' },
  { path: '/calendar', key: 'calendar' },
  { path: '/reports', key: 'reports' },
  { path: '/team', key: 'team' }
];

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterModule, BrandComponent, SpaceBackgroundComponent, AiCompanionComponent, TaskModalComponent, TaskDrawerComponent, CommandPaletteComponent, ToastHostComponent, AvatarComponent, IconComponent],
  template: `
    <div class="app-layout">
      <!-- Yıldızlar ve kayan yıldızlar: giriş ekranıyla ortak arka plan -->
      <tm-space-bg />

      <header class="app-navbar">
        <tm-brand link="/dashboard" />

        <nav class="nav-links" [class.open]="mobileNav()">
          @for (item of nav; track item.path) {
            <a [routerLink]="item.path" routerLinkActive="active" class="nav-tab" (click)="mobileNav.set(false)">
              <tm-icon [name]="item.key" [size]="16" />
              <span>{{ lang.t('nav.' + item.key) }}</span>
              @if (item.key === 'tasks' && overdueCount()) { <span class="nav-badge">{{ overdueCount() }}</span> }
            </a>
          }
        </nav>

        <div class="nav-right">
          <button class="search-btn no-glow" (click)="ui.paletteOpen.set(true)">
            <tm-icon name="search" [size]="16" />
            <span class="search-text">{{ lang.t('common.search') }}…</span>
            <span class="tm-kbd">Ctrl K</span>
          </button>

          <button class="tm-btn primary new-btn" (click)="ui.newTask()" [attr.title]="lang.t('nav.newTask') + ' (N)'">
            <tm-icon name="plus" [size]="16" /><span>{{ lang.t('nav.newTask') }}</span>
          </button>

          <div class="menu-wrap" (click)="$event.stopPropagation()">
            <button class="nav-icon-btn" (click)="toggle('notif')" [attr.aria-label]="lang.t('notif.title')">
              <tm-icon name="bell" [size]="18" />
              @if (badgeCount()) { <span class="notification-badge">{{ badgeCount() > 9 ? '9+' : badgeCount() }}</span> }
            </button>

            @if (openMenu() === 'notif') {
              <div class="dropdown notif">
                <div class="dropdown-head">
                  <strong>{{ lang.t('notif.title') }}</strong>
                  @if (unseen().length) { <button class="link-btn no-glow" (click)="markAllSeen()">{{ lang.t('notif.markAll') }}</button> }
                </div>
                <div class="dropdown-body">
                  @for (inv of invitations(); track inv.id) {
                    <div class="notice invite">
                      <tm-avatar [name]="inv.invitedByName" />
                      <div class="notice-body">
                        <span class="notice-text">{{ lang.t('notif.teamInvite', { name: inv.invitedByName }) }}</span>
                        <strong>{{ inv.teamName }}</strong>
                        <div class="invite-actions">
                          <button class="tm-btn sm primary" [disabled]="busyInvite() === inv.id" (click)="respond(inv.id, true)"><tm-icon name="check" [size]="13" />{{ lang.t('notif.accept') }}</button>
                          <button class="tm-btn sm" [disabled]="busyInvite() === inv.id" (click)="respond(inv.id, false)">{{ lang.t('notif.reject') }}</button>
                        </div>
                      </div>
                    </div>
                  }
                  @for (n of notices(); track n.key) {
                    <button class="notice no-glow" [class.unread]="!seen().has(n.key)" (click)="openNotice(n)">
                      <span class="notice-icon" [class.overdue]="n.kind === 'overdue'"><tm-icon [name]="n.kind === 'overdue' ? 'clock' : 'user'" [size]="15" /></span>
                      <span class="notice-body">
                        <span class="notice-text">{{ n.text }}</span>
                        <strong class="tm-ellipsis">{{ n.title }}</strong>
                        <span class="notice-time">{{ lang.timeAgo(n.at) }}</span>
                      </span>
                    </button>
                  }
                  @if (!invitations().length && !notices().length) {
                    <div class="tm-empty small"><div class="tm-empty-icon"><tm-icon name="bell" [size]="22" /></div><span>{{ lang.t('notif.empty') }}</span></div>
                  }
                </div>
              </div>
            }
          </div>

          <div class="menu-wrap" (click)="$event.stopPropagation()">
            <button class="avatar-btn no-glow" (click)="toggle('user')"><tm-avatar [name]="user()?.fullName" /></button>
            @if (openMenu() === 'user') {
              <div class="dropdown user">
                <div class="user-head">
                  <tm-avatar [name]="user()?.fullName" size="lg" />
                  <div class="user-info">
                    <strong class="tm-ellipsis">{{ user()?.fullName }}</strong>
                    <span class="tm-ellipsis">{{ user()?.email }}</span>
                  </div>
                </div>
                <div class="sep"></div>
                <a class="menu-item" routerLink="/settings" (click)="openMenu.set(null)"><tm-icon name="settings" [size]="16" />{{ lang.t('user.settings') }}</a>
                <button class="menu-item no-glow" (click)="switchLang()"><tm-icon name="globe" [size]="16" />{{ lang.lang() === 'tr' ? 'English' : 'Türkçe' }}</button>
                <button class="menu-item no-glow" (click)="showShortcuts.set(true); openMenu.set(null)"><tm-icon name="keyboard" [size]="16" />{{ lang.t('user.shortcuts') }}</button>
                <div class="sep"></div>
                <button class="menu-item danger no-glow" (click)="logout()"><tm-icon name="logout" [size]="16" />{{ lang.t('user.logout') }}</button>
              </div>
            }
          </div>

          <button class="nav-icon-btn burger" (click)="mobileNav.set(!mobileNav()); $event.stopPropagation()" [attr.aria-label]="lang.t('nav.menu')">
            <tm-icon [name]="mobileNav() ? 'close' : 'menu'" [size]="18" />
          </button>
        </div>
      </header>

      <main class="app-main-content">
        <router-outlet></router-outlet>
      </main>

      <app-ai-companion></app-ai-companion>

      @if (ui.taskModal()) { <tm-task-modal /> }
      @if (ui.drawerTaskId() !== null) { <tm-task-drawer /> }
      @if (ui.paletteOpen()) { <tm-command-palette /> }
      <tm-toast-host />

      @if (showShortcuts()) {
        <div class="tm-overlay" (click)="showShortcuts.set(false)"></div>
        <div class="shortcuts tm-card">
          <div class="tm-card-head"><div class="tm-card-title"><tm-icon name="keyboard" [size]="18" />{{ lang.t('user.shortcuts') }}</div>
            <button class="tm-btn ghost icon sm no-glow" (click)="showShortcuts.set(false)"><tm-icon name="close" [size]="15" /></button></div>
          <ul>
            <li><span>{{ lang.t('shortcut.palette') }}</span><span><span class="tm-kbd">Ctrl</span> <span class="tm-kbd">K</span></span></li>
            <li><span>{{ lang.t('shortcut.new') }}</span><span class="tm-kbd">N</span></li>
            <li><span>{{ lang.t('modal.shortcut') }}</span><span><span class="tm-kbd">Ctrl</span> <span class="tm-kbd">Enter</span></span></li>
            <li><span>{{ lang.t('shortcut.close') }}</span><span class="tm-kbd">Esc</span></li>
          </ul>
        </div>
      }
    </div>
  `,
  styles: [`
    .app-layout { min-height: 100vh; color: var(--text); display: flex; flex-direction: column; position: relative; overflow-x: clip; background: #0B0F19; }
    .app-navbar {
      height: 72px; position: sticky; top: 0; z-index: 1000; display: flex; align-items: center; gap: 18px; padding: 0 24px;
      background: color-mix(in srgb, var(--surface) 88%, transparent); backdrop-filter: blur(28px) saturate(140%);
      border-bottom: 1px solid var(--line); box-shadow: 0 10px 40px rgba(0,0,0,0.35);
    }

    .nav-links { display: flex; align-items: center; gap: 2px; padding: 4px; border-radius: 14px; background: rgba(255,255,255,0.035); border: 1px solid var(--line); margin: 0 auto; }
    .nav-tab { position: relative; display: flex; align-items: center; gap: 7px; height: 36px; padding: 0 12px; border-radius: 10px; font-size: 13px; font-weight: 600; color: var(--muted); text-decoration: none; white-space: nowrap; border: 1px solid transparent; transition: color 0.2s, background 0.2s; }
    .nav-tab:hover { color: var(--text); background: rgba(255,255,255,0.06); }
    .nav-tab.active { color: #fff; background: linear-gradient(135deg, color-mix(in srgb, var(--primary) 85%, transparent), color-mix(in srgb, var(--secondary) 70%, transparent)); box-shadow: 0 6px 18px color-mix(in srgb, var(--primary) 35%, transparent); }
    .nav-badge { min-width: 18px; height: 18px; padding: 0 5px; border-radius: 999px; background: #EF4444; color: #fff; font-size: 10.5px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; }

    .nav-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
    .search-btn { display: flex; align-items: center; gap: 8px; height: 38px; padding: 0 8px 0 12px; border-radius: 11px; border: 1px solid var(--line); background: rgba(0,0,0,0.2); color: var(--muted); cursor: pointer; font-size: 13px; }
    .search-btn:hover { border-color: color-mix(in srgb, var(--primary) 50%, transparent); color: var(--text); }
    .search-text { min-width: 60px; text-align: left; }
    .new-btn { height: 38px; }
    .nav-icon-btn { position: relative; width: 38px; height: 38px; border-radius: 11px; border: 1px solid var(--line); background: rgba(255,255,255,0.04); color: var(--text); display: flex; align-items: center; justify-content: center; cursor: pointer; }
    .notification-badge { position: absolute; top: -5px; right: -5px; min-width: 18px; height: 18px; padding: 0 4px; border-radius: 999px; background: #EC4899; color: #fff; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px #EC4899; }
    .avatar-btn { border: 0; background: transparent; padding: 0; cursor: pointer; border-radius: 50%; display: flex; }
    .avatar-btn tm-avatar { --size: 36px; }
    .burger { display: none; }

    .menu-wrap { position: relative; }
    .dropdown {
      position: absolute; right: 0; top: 48px; z-index: 1100; border-radius: 18px; padding: 8px;
      background: color-mix(in srgb, var(--surface) 96%, black 4%); border: 1px solid var(--border);
      box-shadow: 0 30px 70px rgba(0,0,0,0.65); backdrop-filter: blur(30px); animation: drop 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    @keyframes drop { from { opacity: 0; transform: translateY(-6px) scale(0.98); } to { opacity: 1; transform: none; } }
    .dropdown.notif { width: 380px; }
    .dropdown.user { width: 260px; }
    .dropdown-head { display: flex; align-items: center; justify-content: space-between; padding: 8px 10px 10px; }
    .link-btn { border: 0; background: transparent; color: var(--accent); font-size: 12px; font-weight: 600; cursor: pointer; }
    .dropdown-body { max-height: 420px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
    .notice { display: flex; gap: 12px; align-items: flex-start; width: 100%; text-align: left; padding: 10px; border-radius: 12px; border: 0; background: transparent; color: var(--text); cursor: pointer; }
    .notice:hover { background: var(--elev-2); box-shadow: 0 0 0 1px color-mix(in srgb, var(--hover-color) 55%, transparent), 0 0 26px color-mix(in srgb, var(--hover-color) 40%, transparent); }
    .notice.unread { background: color-mix(in srgb, var(--primary) 12%, transparent); }
    .notice.invite { cursor: default; background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2); }
    .notice-icon { width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--accent); background: color-mix(in srgb, var(--primary) 18%, transparent); }
    .notice-icon.overdue { color: #FCA5A5; background: rgba(239,68,68,0.15); }
    .notice-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; font-size: 13px; }
    .notice-text { color: var(--muted); font-size: 12.5px; }
    .notice-time { font-size: 11px; color: var(--muted); }
    .invite-actions { display: flex; gap: 8px; margin-top: 8px; }
    .user-head { display: flex; align-items: center; gap: 12px; padding: 10px; }
    .user-info { display: flex; flex-direction: column; min-width: 0; }
    .user-info span { font-size: 12px; color: var(--muted); }
    .sep { height: 1px; background: var(--line); margin: 6px 4px; }
    .menu-item { width: 100%; display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px; border: 0; background: transparent; color: var(--text); font-size: 13.5px; font-weight: 500; cursor: pointer; text-decoration: none; text-align: left; }
    .menu-item:hover { background: var(--elev-2); box-shadow: 0 0 0 1px color-mix(in srgb, var(--hover-color) 55%, transparent), 0 0 26px color-mix(in srgb, var(--hover-color) 40%, transparent); }
    .menu-item.danger { color: #FCA5A5; }
    .menu-item.danger:hover { background: rgba(239,68,68,0.12); }
    .tm-empty.small { padding: 22px 8px; }

    .app-main-content { flex-grow: 1; width: 100%; position: relative; z-index: 1; }

    .tm-overlay { z-index: 3600; }
    .shortcuts { position: fixed; z-index: 3601; top: 50%; left: 50%; transform: translate(-50%, -50%); width: min(420px, calc(100vw - 32px)); background: var(--surface); animation: drop 0.2s ease both; }
    .shortcuts ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
    .shortcuts li { display: flex; justify-content: space-between; align-items: center; font-size: 14px; }

    @media (max-width: 1280px) {
      .search-text, .search-btn .tm-kbd { display: none; }
      .search-btn { width: 38px; padding: 0; justify-content: center; }
    }
    @media (max-width: 1120px) {
      .burger { display: flex; }
      .nav-links {
        display: none; position: fixed; top: 72px; left: 0; right: 0; flex-direction: column; align-items: stretch; gap: 4px; padding: 12px;
        margin: 0; border-radius: 0 0 18px 18px; background: color-mix(in srgb, var(--surface) 97%, black 3%); border: 0; border-bottom: 1px solid var(--border);
        box-shadow: 0 30px 60px rgba(0,0,0,0.5);
      }
      .nav-links.open { display: flex; animation: drop 0.2s ease both; }
      .nav-tab { height: 44px; font-size: 14px; }
      .nav-right { margin-left: auto; }
    }
    @media (max-width: 640px) {
      .app-navbar { padding: 0 14px; gap: 10px; height: 64px; }
      .nav-links { top: 64px; }
      .new-btn span { display: none; }
      .new-btn { width: 38px; padding: 0; }
      .dropdown.notif { position: fixed; left: 12px; right: 12px; top: 70px; width: auto; }
    }
  `]
})
export class LayoutComponent implements OnInit, OnDestroy {
  lang = inject(LanguageService);
  ui = inject(UiService);
  private store = inject(TaskStoreService);
  private themeService = inject(ThemeService);
  private userStateService = inject(UserStateService);
  private teamService = inject(TeamService);
  private router = inject(Router);

  readonly nav = NAV;

  user = toSignal(this.userStateService.currentUser$, { initialValue: null });
  invitations = toSignal(this.teamService.pendingInvitations$, { initialValue: [] });
  openMenu = signal<'notif' | 'user' | null>(null);
  mobileNav = signal(false);
  showShortcuts = signal(false);
  busyInvite = signal<number | null>(null);
  seen = signal<Set<string>>(new Set());

  private poll: ReturnType<typeof setInterval> | null = null;

  overdueCount = computed(() => this.store.tasks().filter(t => dueState(t) === 'overdue' && t.assignedUserId === this.user()?.id).length);

  // Bildirimler görevlerden türetilir: başkasının bana atadığı görevler ve gecikmiş görevlerim
  notices = computed<AppNotice[]>(() => {
    const me = this.user()?.id;
    if (!me) return [];
    this.lang.lang();
    const list: AppNotice[] = [];
    for (const t of this.store.tasks()) {
      if (t.status === 'done' || t.assignedUserId !== me) continue;
      if (t.createdById !== me) {
        list.push({ key: `a${t.id}`, kind: 'assigned', taskId: t.id, title: t.title, text: this.lang.t('notif.assigned', { name: t.createdByName }), at: t.createdAt });
      }
      if (dueState(t) === 'overdue') {
        list.push({ key: `o${t.id}-${t.dueDate}`, kind: 'overdue', taskId: t.id, title: t.title, text: this.lang.t('notif.overdue'), at: t.updatedAt || t.createdAt });
      }
    }
    return list.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 20);
  });

  unseen = computed(() => this.notices().filter(n => !this.seen().has(n.key)));
  badgeCount = computed(() => this.unseen().length + this.invitations().length);

  ngOnInit() {
    this.userStateService.fetchCurrentUser();
    this.store.load();
    this.teamService.refreshPendingInvitations();
    this.themeService.theme$.subscribe();

    // Takım arkadaşlarının değişiklikleri ve yeni davetler için düzenli yenileme
    this.poll = setInterval(() => {
      if (document.hidden) return;
      this.store.refresh();
      this.teamService.refreshPendingInvitations();
    }, 45000);

    this.userStateService.currentUser$.subscribe(u => {
      if (u) this.seen.set(this.loadSeen(u.id));
    });

    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.mobileNav.set(false);
      this.openMenu.set(null);
    });

  }

  ngOnDestroy() {
    if (this.poll) clearInterval(this.poll);
  }

  toggle(menu: 'notif' | 'user') {
    this.mobileNav.set(false);
    this.openMenu.set(this.openMenu() === menu ? null : menu);
    if (menu === 'notif') this.teamService.refreshPendingInvitations();
  }

  openNotice(n: AppNotice) {
    this.markSeen([n.key]);
    this.openMenu.set(null);
    this.ui.openTask(n.taskId);
  }

  markAllSeen() {
    this.markSeen(this.notices().map(n => n.key));
  }

  respond(id: number, accept: boolean) {
    this.busyInvite.set(id);
    this.teamService.respond(id, accept).subscribe({
      next: res => {
        this.busyInvite.set(null);
        this.ui.toast(res.message, accept ? 'success' : 'info');
        if (accept) this.store.refresh();
      },
      error: (e: HttpErrorResponse) => {
        this.busyInvite.set(null);
        this.ui.error(e.error?.message || this.lang.t('common.genericError'));
        this.teamService.refreshPendingInvitations();
      }
    });
  }

  switchLang() {
    this.lang.setLanguage(this.lang.lang() === 'tr' ? 'en' : 'tr');
  }

  logout() {
    this.openMenu.set(null);
    this.userStateService.clearUser();
    this.router.navigate(['/login']);
  }

  private seenKey(userId: number) {
    return `tm_seen_notices_${userId}`;
  }

  private loadSeen(userId: number): Set<string> {
    try {
      return new Set(JSON.parse(localStorage.getItem(this.seenKey(userId)) || '[]'));
    } catch {
      return new Set();
    }
  }

  private markSeen(keys: string[]) {
    const id = this.user()?.id;
    if (!id) return;
    const next = new Set([...this.seen(), ...keys]);
    this.seen.set(next);
    try {
      localStorage.setItem(this.seenKey(id), JSON.stringify([...next].slice(-300)));
    } catch { /* yok say */ }
  }

  @HostListener('document:click')
  onDocClick() {
    this.openMenu.set(null);
    this.mobileNav.set(false);
  }

  // Genel kısayollar: Ctrl+K komut paleti, N yeni görev, Esc menüleri kapatır
  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    const target = e.target as HTMLElement | null;
    const typing = !!target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      this.ui.paletteOpen.set(!this.ui.paletteOpen());
      return;
    }
    if (e.key === 'Escape') {
      this.openMenu.set(null);
      this.mobileNav.set(false);
      this.showShortcuts.set(false);
      return;
    }
    if (typing || e.ctrlKey || e.metaKey || e.altKey || this.ui.anyLayerOpen()) return;
    if (e.key === 'n' || e.key === 'N') {
      e.preventDefault();
      this.ui.newTask();
    } else if (e.key === '?') {
      this.showShortcuts.set(true);
    }
  }

}
