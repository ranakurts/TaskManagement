import { AfterViewInit, Component, ElementRef, HostListener, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LanguageService } from '../../services/language.service';
import { TaskStoreService } from '../../services/task-store.service';
import { THEMES, ThemeService } from '../../services/theme.service';
import { UiService } from '../../services/ui.service';
import { AvatarComponent, DueChipComponent, IconComponent } from '../ui/task-bits';

interface PaletteItem {
  id: string;
  group: 'actions' | 'pages' | 'tasks';
  icon: string;
  label: string;
  hint?: string;
  run: () => void;
  task?: { status: any; dueDate: string | null; assignee: string | null };
}

// Ctrl+K komut paleti: görev arama, sayfalar arası geçiş ve hızlı eylemler
@Component({
  selector: 'tm-command-palette',
  standalone: true,
  imports: [FormsModule, IconComponent, AvatarComponent, DueChipComponent],
  template: `
    <div class="tm-overlay" (click)="close()"></div>
    <div class="palette" role="dialog" aria-modal="true">
      <div class="search">
        <tm-icon name="search" [size]="18" />
        <input #input [ngModel]="query()" (ngModelChange)="query.set($event); active.set(0)" [placeholder]="lang.t('palette.placeholder')" autocomplete="off" spellcheck="false" />
        <span class="tm-kbd">Esc</span>
      </div>
      <div class="results" #results>
        @for (group of groups(); track group.key) {
          <div class="group-label">{{ lang.t('palette.' + group.key) }}</div>
          @for (item of group.items; track item.id) {
            <button class="item no-glow" [class.active]="indexOf(item) === active()" (mouseenter)="active.set(indexOf(item))" (click)="run(item)" [attr.data-index]="indexOf(item)">
              <span class="item-icon"><tm-icon [name]="item.icon" [size]="16" /></span>
              <span class="label tm-ellipsis">{{ item.label }}</span>
              @if (item.task) {
                <tm-due-chip [due]="item.task.dueDate" [status]="item.task.status" />
                <tm-avatar [name]="item.task.assignee" size="xs" />
              }
              @if (item.hint) { <span class="hint">{{ item.hint }}</span> }
            </button>
          }
        } @empty {
          <div class="tm-empty"><strong>{{ lang.t('palette.noResults') }}</strong></div>
        }
      </div>
      <footer>
        <span><span class="tm-kbd">↑</span><span class="tm-kbd">↓</span> {{ lang.t('palette.hint') }}</span>
        <span><span class="tm-kbd">Enter</span> {{ lang.t('palette.open') }}</span>
      </footer>
    </div>
  `,
  styles: [`
    :host { position: fixed; inset: 0; z-index: 3500; display: flex; justify-content: center; align-items: flex-start; padding: 12vh 16px 16px; }
    .tm-overlay { position: fixed; }
    .palette {
      position: relative; z-index: 1; width: 100%; max-width: 640px; border-radius: 20px; overflow: hidden;
      background: color-mix(in srgb, var(--surface) 94%, black 6%); border: 1px solid var(--border);
      box-shadow: 0 40px 120px rgba(0,0,0,0.7), 0 0 60px color-mix(in srgb, var(--primary) 18%, transparent);
      backdrop-filter: blur(30px); animation: pop 0.22s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    @keyframes pop { from { opacity: 0; transform: scale(0.97) translateY(-6px); } to { opacity: 1; transform: none; } }
    .search { display: flex; align-items: center; gap: 12px; padding: 16px 18px; border-bottom: 1px solid var(--line); color: var(--muted); }
    .search input { flex: 1; border: 0; outline: 0; background: transparent; color: var(--text); font-size: 16px; }
    .search input::placeholder { color: color-mix(in srgb, var(--muted) 70%, transparent); }
    .results { max-height: min(56vh, 460px); overflow-y: auto; padding: 8px; }
    .group-label { padding: 10px 10px 6px; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); }
    .item { width: 100%; display: flex; align-items: center; gap: 12px; padding: 10px; border: 0; border-radius: 12px; background: transparent; color: var(--text); cursor: pointer; text-align: left; font-size: 14px; }
    .item.active { background: color-mix(in srgb, var(--hover-color) 20%, transparent); box-shadow: inset 3px 0 0 var(--hover-color); }
    .item-icon { width: 30px; height: 30px; border-radius: 9px; display: flex; align-items: center; justify-content: center; background: var(--elev-2); color: var(--accent); flex-shrink: 0; }
    .label { flex: 1; }
    .hint { font-size: 12px; color: var(--muted); }
    footer { display: flex; gap: 18px; padding: 10px 18px; border-top: 1px solid var(--line); font-size: 12px; color: var(--muted); }
    footer span { display: inline-flex; align-items: center; gap: 4px; }
  `]
})
export class CommandPaletteComponent implements AfterViewInit {
  lang = inject(LanguageService);
  private ui = inject(UiService);
  private store = inject(TaskStoreService);
  private router = inject(Router);
  private themes = inject(ThemeService);

  @ViewChild('input') input?: ElementRef<HTMLInputElement>;
  @ViewChild('results') results?: ElementRef<HTMLElement>;

  query = signal('');
  active = signal(0);

  private items = computed<PaletteItem[]>(() => {
    const t = (k: string) => this.lang.t(k);
    const go = (path: string) => () => { this.close(); this.router.navigate([path]); };
    const actions: PaletteItem[] = [
      { id: 'new', group: 'actions', icon: 'plus', label: t('nav.newTask'), hint: 'N', run: () => this.ui.newTask() },
      { id: 'lang', group: 'actions', icon: 'globe', label: t('palette.switchLang'), run: () => { this.lang.setLanguage(this.lang.lang() === 'tr' ? 'en' : 'tr'); } },
      { id: 'theme', group: 'actions', icon: 'palette', label: t('palette.nextTheme'), run: () => this.nextTheme() }
    ];
    const pages: PaletteItem[] = [
      ['dashboard', '/dashboard'], ['tasks', '/tasks'], ['board', '/board'], ['calendar', '/calendar'],
      ['reports', '/reports'], ['team', '/team'], ['settings', '/settings']
    ].map(([key, path]) => ({ id: 'p-' + key, group: 'pages' as const, icon: key, label: t('nav.' + key), run: go(path) }));
    const tasks: PaletteItem[] = this.store.tasks().map(task => ({
      id: 't-' + task.id, group: 'tasks' as const, icon: task.status === 'done' ? 'check' : 'tasks', label: task.title,
      run: () => this.ui.openTask(task.id),
      task: { status: task.status, dueDate: task.dueDate, assignee: task.assignedUserName }
    }));
    return [...actions, ...pages, ...tasks];
  });

  private filtered = computed(() => {
    const q = this.query().trim().toLocaleLowerCase(this.lang.locale);
    const all = this.items();
    if (!q) return all.filter(i => i.group !== 'tasks').concat(all.filter(i => i.group === 'tasks').slice(0, 6));
    return all.filter(i => i.label.toLocaleLowerCase(this.lang.locale).includes(q)).slice(0, 30);
  });

  groups = computed(() => {
    const list = this.filtered();
    return (['actions', 'pages', 'tasks'] as const)
      .map(key => ({ key, items: list.filter(i => i.group === key) }))
      .filter(g => g.items.length);
  });

  private flat = computed(() => this.groups().flatMap(g => g.items));

  indexOf(item: PaletteItem) {
    return this.flat().indexOf(item);
  }

  ngAfterViewInit() {
    setTimeout(() => this.input?.nativeElement.focus(), 20);
  }

  run(item: PaletteItem) {
    this.close();
    item.run();
  }

  close() {
    this.ui.paletteOpen.set(false);
  }

  private nextTheme() {
    const i = THEMES.indexOf(this.themes.getTheme());
    this.themes.setTheme(THEMES[(i + 1) % THEMES.length]);
  }

  @HostListener('keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    const count = this.flat().length;
    if (e.key === 'Escape') {
      e.stopPropagation();
      this.close();
    } else if (e.key === 'ArrowDown' && count) {
      e.preventDefault();
      this.active.set((this.active() + 1) % count);
      this.scrollActive();
    } else if (e.key === 'ArrowUp' && count) {
      e.preventDefault();
      this.active.set((this.active() - 1 + count) % count);
      this.scrollActive();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = this.flat()[this.active()];
      if (item) this.run(item);
    }
  }

  private scrollActive() {
    setTimeout(() => this.results?.nativeElement.querySelector(`[data-index="${this.active()}"]`)?.scrollIntoView({ block: 'nearest' }));
  }
}
