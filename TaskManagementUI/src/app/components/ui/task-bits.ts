import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { LanguageService } from '../../services/language.service';
import { TaskPriority, TaskStatus, daysUntil, dueState, hueFor, initials } from '../../models/task.model';

// Küçük, tekrar kullanılan görev parçaları: avatar, durum/öncelik/tarih rozetleri, ikonlar

@Component({
  selector: 'tm-avatar',
  standalone: true,
  template: `
    @if (name()) {
      <span class="tm-avatar" [class.lg]="size() === 'lg'" [class.xs]="size() === 'xs'" [style.--h]="hue()" [attr.title]="name()">{{ letters() }}</span>
    } @else {
      <span class="tm-avatar empty" [class.lg]="size() === 'lg'" [class.xs]="size() === 'xs'" [attr.title]="emptyTitle()">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>
      </span>
    }
  `,
  host: { style: 'display: inline-flex' }
})
export class AvatarComponent {
  name = input<string | null | undefined>(null);
  size = input<'xs' | 'md' | 'lg'>('md');
  emptyTitle = input<string>('');
  hue = computed(() => hueFor(this.name()));
  letters = computed(() => initials(this.name()));
}

@Component({
  selector: 'tm-status-chip',
  standalone: true,
  template: `<span [class]="'tm-chip tone st-' + status()"><span class="tm-dot"></span>{{ lang.t('status.' + status()) }}</span>`,
  host: { style: 'display: inline-flex; min-width: 0' }
})
export class StatusChipComponent {
  lang = inject(LanguageService);
  status = input.required<TaskStatus>();
}

@Component({
  selector: 'tm-priority-chip',
  standalone: true,
  template: `
    <span [class]="'tm-chip tone pr-' + priority()">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
        <rect x="3" y="14" width="4" height="7" rx="1" />
        <rect x="10" y="9" width="4" height="12" rx="1" [attr.opacity]="level() >= 2 ? 1 : 0.25" />
        <rect x="17" y="4" width="4" height="17" rx="1" [attr.opacity]="level() >= 3 ? 1 : 0.25" />
      </svg>
      @if (!compact()) { {{ lang.t('priority.' + priority()) }} }
    </span>
  `,
  host: { style: 'display: inline-flex' }
})
export class PriorityChipComponent {
  lang = inject(LanguageService);
  priority = input.required<TaskPriority>();
  compact = input(false);
  level = computed(() => ({ low: 1, medium: 2, high: 3, critical: 3 })[this.priority()]);
}

@Component({
  selector: 'tm-due-chip',
  standalone: true,
  template: `
    @if (due()) {
      <span class="tm-chip" [class.due-overdue]="state() === 'overdue'" [class.due-soon]="state() === 'today' || state() === 'soon'" [attr.title]="lang.formatDate(due(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>
        {{ label() }}
      </span>
    }
  `,
  host: { style: 'display: inline-flex' }
})
export class DueChipComponent {
  lang = inject(LanguageService);
  due = input<string | null>(null);
  status = input<TaskStatus>('todo');
  relative = input(true);

  state = computed(() => dueState({ dueDate: this.due(), status: this.status() }));

  label = computed(() => {
    const due = this.due();
    if (!due) return '';
    this.lang.lang();
    if (!this.relative() || this.status() === 'done') return this.lang.formatDate(due);
    const diff = daysUntil(due);
    if (diff === 0) return this.lang.t('common.today');
    if (diff === 1) return this.lang.t('common.tomorrow');
    if (diff === -1) return this.lang.t('common.yesterday');
    if (diff < 0) return this.lang.t('common.daysOverdue', { n: -diff });
    if (diff <= 6) return this.lang.formatDate(due, { weekday: 'long' });
    return this.lang.formatDate(due);
  });
}

// Satır içi SVG ikon seti (harici kütüphane gerektirmez)
const ICONS: Record<string, string> = {
  dashboard: '<rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/>',
  tasks: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>',
  board: '<rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="10" y="4" width="5" height="11" rx="1.5"/><rect x="17" y="4" width="4" height="7" rx="1.5"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/>',
  reports: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  team: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><circle cx="17.5" cy="9" r="2.5"/><path d="M16.5 14.6c2.6.3 4.4 2 5 5.4"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  close: '<path d="M18 6L6 18M6 6l12 12"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
  comment: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
  chevronLeft: '<path d="M15 18l-6-6 6-6"/>',
  chevronRight: '<path d="M9 18l6-6-6-6"/>',
  arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  sparkle: '<path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  flame: '<path d="M12 22c4 0 7-3 7-7 0-5-5-7-5-12-3 2-5 5-5 8-1-1-2-2-2-4-1.5 1.5-2 4-2 6 0 5 3 9 7 9z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  palette: '<circle cx="13.5" cy="6.5" r="1"/><circle cx="17.5" cy="10.5" r="1"/><circle cx="8.5" cy="7.5" r="1"/><circle cx="6.5" cy="12.5" r="1"/><path d="M12 2a10 10 0 0 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.4A5.6 5.6 0 0 0 22 9.8C22 5.5 17.5 2 12 2z"/>',
  filter: '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.1L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.1z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4L21 8"/><path d="M21 3v5h-5"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 7l9 6 9-6"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M3 3l18 18"/><path d="M10.6 5.1A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.2M6.6 6.6A17.4 17.4 0 0 0 2 12s3.5 7 10 7a9.8 9.8 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  at: '<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/>',
  send: '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>',
  bot: '<rect x="4" y="8" width="16" height="12" rx="4"/><path d="M12 4v4M9 13h.01M15 13h.01M9 17h6"/>',
    keyboard: '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>'
};

@Component({
  selector: 'tm-icon',
  standalone: true,
  template: `<svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor" [attr.stroke-width]="stroke()" stroke-linecap="round" stroke-linejoin="round" [innerHTML]="path()" aria-hidden="true"></svg>`,
  host: { style: 'display: inline-flex; flex-shrink: 0' }
})
export class IconComponent {
  private sanitizer = inject(DomSanitizer);
  name = input.required<string>();
  size = input(18);
  stroke = input(2);
  // İkonlar bu dosyadaki sabit, güvenilir SVG parçalarıdır (kullanıcı girdisi değil)
  path = computed(() => this.sanitizer.bypassSecurityTrustHtml(ICONS[this.name()] ?? ''));
}
