import { AfterViewChecked, Component, ElementRef, OnDestroy, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LanguageService } from '../../services/language.service';
import { TaskStoreService } from '../../services/task-store.service';
import { THEMES, ThemeService } from '../../services/theme.service';
import { UiService } from '../../services/ui.service';
import { UserStateService } from '../../services/user-state.service';
import { PRIORITY_WEIGHT, TaskItem, daysUntil, dueState } from '../../models/task.model';
import { DueChipComponent, IconComponent } from '../ui/task-bits';

interface Part { text: string; bold: boolean; }

interface ChatMessage {
  id: number;
  from: 'ai' | 'user';
  parts: Part[];
  tasks?: TaskItem[];
  time: string;
}

interface Suggestion { label: string; query: string; }

// "**kalın**" işaretlerini güvenli parçalara böler (innerHTML kullanılmaz)
function toParts(text: string): Part[] {
  return text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map(chunk =>
    chunk.startsWith('**') && chunk.endsWith('**') ? { text: chunk.slice(2, -2), bold: true } : { text: chunk, bold: false });
}

// Sağ altta duran, görevleri bilen yıldız asistan
@Component({
  selector: 'app-ai-companion',
  standalone: true,
  imports: [FormsModule, IconComponent, DueChipComponent],
  template: `
    <div class="companion">
      @if (teaser() && !open()) {
        <div class="teaser" (click)="toggle()">
          <span class="teaser-orb">✦</span>
          <span class="teaser-text">{{ teaser() }}</span>
          <button class="teaser-x no-glow" (click)="$event.stopPropagation(); teaser.set(null)" aria-label="Close"><tm-icon name="close" [size]="12" /></button>
        </div>
      }

      @if (open()) {
        <section class="panel" role="dialog" [attr.aria-label]="lang.t('ai.name')">
          <header class="head">
            <div class="orb small"><svg viewBox="0 0 24 24" width="18" height="18"><path [attr.d]="starPath" fill="#fff" /></svg></div>
            <div class="title">
              <strong>{{ lang.t('ai.name') }}</strong>
              <span><i class="live"></i>{{ lang.t('ai.status') }}</span>
            </div>
            <button class="icon-btn no-glow" (click)="reset()" [attr.title]="lang.t('ai.clear')"><tm-icon name="refresh" [size]="15" /></button>
            <button class="icon-btn no-glow" (click)="toggle()" [attr.title]="lang.t('common.close')"><tm-icon name="close" [size]="16" /></button>
          </header>

          <div class="body" #body>
            @for (m of messages(); track m.id) {
              <div class="msg" [class.user]="m.from === 'user'">
                @if (m.from === 'ai') {
                  <span class="orb tiny"><svg viewBox="0 0 24 24" width="12" height="12"><path [attr.d]="starPath" fill="#fff" /></svg></span>
                }
                <div class="bubble">
                  <p>@for (part of m.parts; track $index) {@if (part.bold) {<strong>{{ part.text }}</strong>} @else {<span>{{ part.text }}</span>}}</p>
                  @if (m.tasks?.length) {
                    <div class="task-list">
                      @for (t of m.tasks; track t.id) {
                        <button class="task no-glow" (click)="openTask(t.id)">
                          <span class="prio" [class]="'prio pr-' + t.priority"></span>
                          <span class="task-title">{{ t.title }}</span>
                          <tm-due-chip [due]="t.dueDate" [status]="t.status" />
                        </button>
                      }
                    </div>
                  }
                  <span class="time">{{ m.time }}</span>
                </div>
              </div>
            }
            @if (typing()) {
              <div class="msg">
                <span class="orb tiny"><svg viewBox="0 0 24 24" width="12" height="12"><path [attr.d]="starPath" fill="#fff" /></svg></span>
                <div class="bubble typing"><i></i><i></i><i></i></div>
              </div>
            }
          </div>

          <div class="chips">
            @for (s of suggestions(); track s.query) {
              <button class="chip no-glow" (click)="ask(s.query)">{{ s.label }}</button>
            }
          </div>

          <footer class="composer">
            <textarea #input rows="1" [(ngModel)]="draft" [placeholder]="lang.t('ai.placeholder')" (keydown.enter)="onEnter($any($event))" maxlength="500"></textarea>
            <button class="send no-glow" [disabled]="!draft.trim()" (click)="send()" [attr.aria-label]="lang.t('drawer.send')"><tm-icon name="send" [size]="17" /></button>
          </footer>
        </section>
      }

      <!-- Rana'nın Yıldızı: döner, parlar; üzerine gelince göz kırpar -->
      <div class="star-launcher" [class.active]="open()" (click)="toggle()" (mouseenter)="hovered.set(true)" (mouseleave)="hovered.set(false)"
           role="button" tabindex="0" (keydown.enter)="toggle()" [attr.aria-label]="lang.t('ai.name')">
        <div class="star-halo" [class.hovered]="hovered()"></div>
        <div class="orbit"><i></i><i></i><i></i></div>
        <div class="star-spin" [class.paused]="hovered()">
          <svg class="magical-star" [class.waving]="hovered()" viewBox="0 0 50 50" width="54" height="54">
            <defs>
              <linearGradient id="rnStarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#F0ABFC" />
                <stop offset="35%" stop-color="#E879F9" />
                <stop offset="65%" stop-color="#A855F7" />
                <stop offset="100%" stop-color="#38BDF8" />
              </linearGradient>
              <radialGradient id="rnStarShine" cx="35%" cy="30%" r="45%">
                <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.75" />
                <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0" />
              </radialGradient>
              <filter id="rnStarGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2.6" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <path d="M25 2 L31.5 17.5 L48 20 L36.5 32 L39.5 48 L25 40 L10.5 48 L13.5 32 L2 20 L18.5 17.5 Z"
                  fill="url(#rnStarGrad)" stroke="rgba(255,255,255,0.55)" stroke-width="0.8" stroke-linejoin="round" filter="url(#rnStarGlow)" />
            <path d="M25 2 L31.5 17.5 L48 20 L36.5 32 L39.5 48 L25 40 L10.5 48 L13.5 32 L2 20 L18.5 17.5 Z" fill="url(#rnStarShine)" />
            <!-- Gözler ve gülümseme -->
            <ellipse class="eye" cx="21.5" cy="24" rx="1.7" ry="2.1" fill="#3B0764" />
            <ellipse class="eye" cx="28.5" cy="24" rx="1.7" ry="2.1" fill="#3B0764" />
            <circle cx="22.1" cy="23.3" r="0.6" fill="#FFFFFF" />
            <circle cx="29.1" cy="23.3" r="0.6" fill="#FFFFFF" />
            <path d="M22.5 28.2 Q25 30.4 27.5 28.2" stroke="#3B0764" stroke-width="1.1" fill="none" stroke-linecap="round" />
            <circle cx="19" cy="27.6" r="1.4" fill="#F9A8D4" opacity="0.7" />
            <circle cx="31" cy="27.6" r="1.4" fill="#F9A8D4" opacity="0.7" />
          </svg>
        </div>
        @if (hovered()) {
          <div class="sparkle-particles"><span class="spark s1">✨</span><span class="spark s2">⭐</span><span class="spark s3">💫</span></div>
        }
        @if (teaser() && !open()) { <span class="badge"></span> }
      </div>
    </div>
  `,
  styles: [`
    :host { font-family: var(--font-family); }
    .companion { position: fixed; right: 28px; bottom: 28px; z-index: 1400; display: flex; flex-direction: column; align-items: flex-end; gap: 14px; }

    /* ---- Rana'nın Yıldızı (başlatıcı) ---- */
    .star-launcher { position: relative; width: 66px; height: 66px; display: flex; align-items: center; justify-content: center; cursor: pointer; outline: none; }
    .star-spin { position: relative; z-index: 2; display: flex; animation: continuousSpinAndGlow 8s linear infinite; }
    .star-spin.paused { animation-play-state: paused; }
    @keyframes continuousSpinAndGlow {
      0%   { transform: rotate(0deg) scale(1);      filter: drop-shadow(0 0 8px rgba(168, 85, 247, 0.6)) hue-rotate(0deg); }
      25%  { filter: drop-shadow(0 0 16px rgba(236, 72, 153, 0.85)) hue-rotate(20deg); }
      50%  { transform: rotate(180deg) scale(1.08); filter: drop-shadow(0 0 22px rgba(232, 121, 249, 0.95)) hue-rotate(-15deg); }
      75%  { filter: drop-shadow(0 0 16px rgba(56, 189, 248, 0.85)) hue-rotate(10deg); }
      100% { transform: rotate(360deg) scale(1);    filter: drop-shadow(0 0 8px rgba(168, 85, 247, 0.6)) hue-rotate(0deg); }
    }
    .magical-star { transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
    .magical-star.waving { transform: scale(1.22); animation: wave 0.9s ease-in-out infinite; }
    @keyframes wave { 0%, 100% { transform: scale(1.22) rotate(-8deg); } 50% { transform: scale(1.22) rotate(8deg); } }
    .star-launcher:hover .eye { animation: blink 1.6s infinite; transform-origin: center; transform-box: fill-box; }
    @keyframes blink { 0%, 80%, 100% { transform: scaleY(1); } 88% { transform: scaleY(0.1); } }
    .star-launcher.active .star-spin { animation-duration: 3s; }

    .star-halo { position: absolute; inset: -12px; border-radius: 50%; z-index: 0; filter: blur(14px); opacity: 0.7;
      background: conic-gradient(from 0deg, rgba(236,72,153,0.55), rgba(168,85,247,0.55), rgba(56,189,248,0.55), rgba(52,211,153,0.45), rgba(251,191,36,0.45), rgba(236,72,153,0.55));
      animation: haloSpin 6s linear infinite, pulseGlow 4s ease-in-out infinite; }
    .star-halo.hovered { opacity: 1; inset: -18px; }
    @keyframes haloSpin { to { transform: rotate(-360deg); } }
    @keyframes pulseGlow { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.9; } }

    .orbit { position: absolute; inset: -6px; z-index: 1; animation: haloSpin 5s linear infinite reverse; pointer-events: none; }
    .orbit i { position: absolute; width: 5px; height: 5px; border-radius: 50%; background: #fff; box-shadow: 0 0 8px #fff, 0 0 14px #E879F9; }
    .orbit i:nth-child(1) { top: 0; left: 50%; }
    .orbit i:nth-child(2) { bottom: 8px; left: 6px; width: 4px; height: 4px; box-shadow: 0 0 8px #fff, 0 0 14px #38BDF8; }
    .orbit i:nth-child(3) { bottom: 8px; right: 6px; width: 3px; height: 3px; box-shadow: 0 0 8px #fff, 0 0 14px #FBBF24; }

    .sparkle-particles { position: absolute; inset: -22px; pointer-events: none; z-index: 3; }
    .spark { position: absolute; font-size: 13px; animation: particleFade 1.1s ease-out infinite; }
    .s1 { top: 0; left: 2px; } .s2 { top: 6px; right: -2px; animation-delay: 0.35s; } .s3 { bottom: 0; left: 40%; animation-delay: 0.7s; }
    @keyframes particleFade { 0% { transform: translateY(0) scale(0.7); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateY(-16px) scale(1.25); opacity: 0; } }
    .badge { position: absolute; top: 4px; right: 4px; z-index: 4; width: 13px; height: 13px; border-radius: 50%; background: #F43F5E; border: 2px solid #0B0F19; box-shadow: 0 0 10px #F43F5E; }

    /* ---- Tanıtım baloncuğu ---- */
    .teaser { display: flex; align-items: center; gap: 10px; max-width: 300px; padding: 10px 10px 10px 12px; border-radius: 16px 16px 4px 16px; cursor: pointer;
      background: color-mix(in srgb, var(--surface) 94%, black 6%); border: 1px solid var(--border); box-shadow: 0 18px 44px rgba(0,0,0,0.5); backdrop-filter: blur(20px);
      animation: pop 0.35s cubic-bezier(0.16, 1, 0.3, 1) both; }
    .teaser-orb { width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 13px; background: linear-gradient(135deg, #A855F7, #6366F1); }
    .teaser-text { font-size: 13.5px; line-height: 1.45; color: var(--text); }
    .teaser-x { border: 0; background: transparent; color: var(--muted); cursor: pointer; padding: 4px; border-radius: 6px; display: flex; align-self: flex-start; }
    @keyframes pop { from { opacity: 0; transform: translateY(8px) scale(0.96); } to { opacity: 1; transform: none; } }

    /* ---- Sohbet paneli ---- */
    .panel { width: 390px; max-width: calc(100vw - 32px); height: min(600px, calc(100vh - 140px)); display: flex; flex-direction: column; border-radius: 24px; overflow: hidden;
      background: linear-gradient(180deg, color-mix(in srgb, var(--surface) 96%, white 4%), color-mix(in srgb, var(--surface) 98%, black 2%));
      border: 1px solid var(--border); box-shadow: 0 40px 100px rgba(0,0,0,0.6), 0 0 50px color-mix(in srgb, var(--primary) 20%, transparent); backdrop-filter: blur(30px);
      transform-origin: bottom right; animation: open 0.32s cubic-bezier(0.16, 1, 0.3, 1) both; }
    @keyframes open { from { opacity: 0; transform: translateY(12px) scale(0.94); } to { opacity: 1; transform: none; } }
    .head { display: flex; align-items: center; gap: 12px; padding: 16px 14px 14px 18px; border-bottom: 1px solid var(--line);
      background: radial-gradient(120% 160% at 0% 0%, color-mix(in srgb, var(--primary) 22%, transparent), transparent 60%); }
    .orb { position: relative; display: flex; align-items: center; justify-content: center; border-radius: 50%;
      background: linear-gradient(135deg, #F0ABFC 0%, #E879F9 30%, #A855F7 65%, #38BDF8 100%); box-shadow: inset 0 2px 6px rgba(255,255,255,0.4); }
    .orb svg { filter: drop-shadow(0 0 4px rgba(255,255,255,0.9)); }
    .orb.small svg { animation: miniSpin 10s linear infinite; }
    @keyframes miniSpin { to { transform: rotate(360deg); } }
    .orb.small { width: 38px; height: 38px; flex-shrink: 0; box-shadow: 0 0 18px color-mix(in srgb, var(--primary) 55%, transparent), inset 0 2px 6px rgba(255,255,255,0.3); }
    .title { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .title strong { font-size: 15px; font-weight: 700; letter-spacing: -0.01em; }
    .title span { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--muted); }
    .live { width: 7px; height: 7px; border-radius: 50%; background: #34D399; box-shadow: 0 0 8px #34D399; }
    .icon-btn { width: 32px; height: 32px; border-radius: 10px; border: 0; background: transparent; color: var(--muted); cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .icon-btn:hover { background: var(--elev-2); color: var(--text); }

    .body { flex: 1; overflow-y: auto; padding: 18px 16px 8px; display: flex; flex-direction: column; gap: 14px; scroll-behavior: smooth; }
    .msg { display: flex; gap: 8px; align-items: flex-end; max-width: 100%; animation: pop 0.25s ease both; }
    .msg.user { justify-content: flex-end; }
    .orb.tiny { width: 24px; height: 24px; flex-shrink: 0; margin-bottom: 2px; }
    .bubble { max-width: 84%; padding: 11px 14px 8px; border-radius: 18px 18px 18px 6px; background: var(--elev-2); border: 1px solid var(--line); }
    .msg.user .bubble { border-radius: 18px 18px 6px 18px; background: linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--secondary) 85%, black 15%)); border-color: transparent; color: #fff;
      box-shadow: 0 8px 20px color-mix(in srgb, var(--primary) 30%, transparent); }
    .bubble p { margin: 0; font-size: 14px; line-height: 1.6; white-space: pre-line; word-break: break-word; color: inherit; }
    .bubble strong { font-weight: 700; color: var(--text); }
    .msg.user .bubble strong { color: #fff; }
    .time { display: block; margin-top: 4px; font-size: 10.5px; color: var(--muted); text-align: right; }
    .msg.user .time { color: rgba(255,255,255,0.7); }
    .task-list { display: flex; flex-direction: column; gap: 6px; margin-top: 10px; }
    .task { display: flex; align-items: center; gap: 8px; width: 100%; padding: 8px 10px; border-radius: 11px; border: 1px solid var(--line); background: rgba(0,0,0,0.2); color: var(--text); cursor: pointer; text-align: left; }
    .task:hover { border-color: color-mix(in srgb, var(--primary) 60%, transparent); background: rgba(0,0,0,0.3); }
    .prio { width: 4px; height: 18px; border-radius: 4px; background: var(--c); flex-shrink: 0; }
    .task-title { flex: 1; min-width: 0; font-size: 13px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .typing { display: inline-flex; gap: 5px; padding: 14px 16px; }
    .typing i { width: 7px; height: 7px; border-radius: 50%; background: var(--muted); animation: dots 1.2s infinite ease-in-out; }
    .typing i:nth-child(2) { animation-delay: 0.15s; } .typing i:nth-child(3) { animation-delay: 0.3s; }
    @keyframes dots { 0%, 80%, 100% { transform: translateY(0); opacity: 0.4; } 40% { transform: translateY(-5px); opacity: 1; } }

    .chips { display: flex; gap: 8px; padding: 8px 16px 10px; overflow-x: auto; scrollbar-width: none; }
    .chips::-webkit-scrollbar { display: none; }
    .chip { flex-shrink: 0; height: 32px; padding: 0 12px; border-radius: 999px; font-size: 12.5px; font-weight: 600; cursor: pointer; white-space: nowrap;
      color: var(--text-secondary); background: var(--elev); border: 1px solid var(--line); }
    .chip:hover { color: #fff; border-color: color-mix(in srgb, var(--primary) 60%, transparent); background: color-mix(in srgb, var(--primary) 18%, transparent); }

    .composer { display: flex; align-items: flex-end; gap: 8px; padding: 12px 14px 14px; border-top: 1px solid var(--line); background: rgba(0,0,0,0.18); }
    .composer textarea { flex: 1; resize: none; min-height: 44px; max-height: 120px; padding: 11px 14px; border-radius: 14px; font-size: 14px; line-height: 1.45; color: var(--text);
      background: rgba(0,0,0,0.28); border: 1px solid var(--line); outline: none; }
    .composer textarea:focus { border-color: var(--primary); box-shadow: var(--ring); }
    .send { width: 44px; height: 44px; flex-shrink: 0; border: 0; border-radius: 14px; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, var(--primary), var(--secondary)); box-shadow: 0 8px 20px color-mix(in srgb, var(--primary) 35%, transparent); }
    .send:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; }

    @media (max-width: 640px) {
      .companion { right: 14px; bottom: 14px; }
      .star-launcher { transform: scale(0.8); transform-origin: bottom right; }
      .panel { height: min(600px, calc(100vh - 110px)); }
      .teaser { max-width: calc(100vw - 100px); }
    }
  `]
})
export class AiCompanionComponent implements OnInit, OnDestroy, AfterViewChecked {
  lang = inject(LanguageService);
  private store = inject(TaskStoreService);
  private ui = inject(UiService);
  private router = inject(Router);
  private themes = inject(ThemeService);
  private userState = inject(UserStateService);

  @ViewChild('body') body?: ElementRef<HTMLElement>;
  @ViewChild('input') input?: ElementRef<HTMLTextAreaElement>;

  readonly starPath = 'M12 1.5l3.1 7.4 7.9 1.2-5.5 5.7 1.4 7.7L12 19.7l-6.9 3.8 1.4-7.7L1 10.1l7.9-1.2z';

  private me = toSignal(this.userState.currentUser$, { initialValue: null });

  open = signal(false);
  hovered = signal(false);
  typing = signal(false);
  teaser = signal<string | null>(null);
  messages = signal<ChatMessage[]>([]);
  draft = '';

  private msgId = 0;
  private scrollPending = false;
  private teaserTimer: ReturnType<typeof setTimeout> | null = null;
  private firstTeaser: ReturnType<typeof setTimeout> | null = null;

  suggestions = computed<Suggestion[]>(() => {
    this.lang.lang();
    const t = (k: string) => this.lang.t(k);
    return [
      { label: '☀️ ' + t('ai.s.today'), query: t('ai.q.today') },
      { label: '⏰ ' + t('ai.s.overdue'), query: t('ai.q.overdue') },
      { label: '📅 ' + t('ai.s.week'), query: t('ai.q.week') },
      { label: '📊 ' + t('ai.s.summary'), query: t('ai.q.summary') },
      { label: '➕ ' + t('ai.s.create'), query: t('ai.q.create') },
      { label: '💡 ' + t('ai.s.help'), query: t('ai.q.help') }
    ];
  });

  ngOnInit() {
    this.reset();
    // İlk açılışta kısa bir selam; sonra yalnızca gecikmiş görev varsa hatırlatır
    this.firstTeaser = setTimeout(() => this.showTeaser(), 3500);
  }

  ngOnDestroy() {
    if (this.teaserTimer) clearTimeout(this.teaserTimer);
    if (this.firstTeaser) clearTimeout(this.firstTeaser);
  }

  ngAfterViewChecked() {
    if (this.scrollPending && this.body) {
      this.body.nativeElement.scrollTop = this.body.nativeElement.scrollHeight;
      this.scrollPending = false;
    }
  }

  toggle() {
    this.open.set(!this.open());
    this.teaser.set(null);
    if (this.open()) {
      this.scrollPending = true;
      setTimeout(() => this.input?.nativeElement.focus(), 60);
    }
  }

  reset() {
    const name = (this.me()?.fullName || '').split(' ')[0];
    this.messages.set([this.aiMessage(this.lang.t('ai.welcome', { name: name ? ' ' + name : '' }))]);
  }

  onEnter(e: KeyboardEvent) {
    if (e.shiftKey) return;
    e.preventDefault();
    this.send();
  }

  send() {
    const text = this.draft.trim();
    if (!text) return;
    this.draft = '';
    this.ask(text);
  }

  ask(text: string) {
    this.messages.update(list => [...list, { id: ++this.msgId, from: 'user', parts: [{ text, bold: false }], time: this.now() }]);
    this.typing.set(true);
    this.scrollPending = true;
    setTimeout(() => {
      this.typing.set(false);
      this.messages.update(list => [...list, this.answer(text)]);
      this.scrollPending = true;
    }, 450 + Math.random() * 350);
  }

  openTask(id: number) {
    this.ui.openTask(id);
  }

  // ===== Cevap üretimi: kullanıcının gerçek görevlerine bakar =====
  private answer(raw: string): ChatMessage {
    const q = raw.toLocaleLowerCase('tr-TR');
    const has = (...words: string[]) => words.some(w => q.includes(w));
    const t = (k: string, p?: Record<string, string | number>) => this.lang.t(k, p);
    const all = this.store.tasks();
    const open = all.filter(x => x.status !== 'done');
    const meId = this.me()?.id;
    const byUrgency = (a: TaskItem, b: TaskItem) =>
      (a.dueDate ? daysUntil(a.dueDate) : 999) - (b.dueDate ? daysUntil(b.dueDate) : 999) || PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];

    // Görev oluşturma: "görev ekle: başlık" / "add task: title"
    const create = raw.match(/(?:görev ekle|yeni görev|görev oluştur|add task|new task|create task)\s*[:\-]?\s*(.*)$/i);
    if (create) {
      const title = create[1].trim();
      this.ui.newTask(title ? { title } : undefined);
      return this.aiMessage(title ? t('ai.a.createWith', { title }) : t('ai.a.create'));
    }

    if (has('gecik', 'overdue', 'late', 'kaçırd')) {
      const list = open.filter(x => dueState(x) === 'overdue').sort(byUrgency);
      return list.length ? this.aiMessage(t('ai.a.overdue', { n: list.length }), list.slice(0, 6)) : this.aiMessage(t('ai.a.noOverdue'));
    }

    if (has('bugün', 'today', 'öncelik', 'ne yapmalı', 'odak', 'focus', 'priority')) {
      const list = open.filter(x => {
        const s = dueState(x);
        return s === 'overdue' || s === 'today' || x.priority === 'critical';
      }).sort(byUrgency);
      return list.length ? this.aiMessage(t('ai.a.today', { n: list.length }), list.slice(0, 6)) : this.aiMessage(t('ai.a.noToday'));
    }

    if (has('hafta', 'week', 'yaklaşan', 'upcoming', 'yarın', 'tomorrow')) {
      const list = open.filter(x => x.dueDate && daysUntil(x.dueDate) >= 0 && daysUntil(x.dueDate) <= 7).sort(byUrgency);
      return list.length ? this.aiMessage(t('ai.a.week', { n: list.length }), list.slice(0, 6)) : this.aiMessage(t('ai.a.noWeek'));
    }

    if (has('bana atanan', 'atanan', 'assigned', 'benim', 'my task')) {
      const list = open.filter(x => x.assignedUserId === meId).sort(byUrgency);
      return list.length ? this.aiMessage(t('ai.a.mine', { n: list.length }), list.slice(0, 6)) : this.aiMessage(t('ai.a.noMine'));
    }

    if (has('özet', 'summary', 'durum', 'kaç', 'how many', 'istatistik', 'stats', 'liste')) {
      if (!all.length) return this.aiMessage(t('ai.a.empty'));
      const count = (s: string) => all.filter(x => x.status === s).length;
      const done = count('done');
      const overdue = open.filter(x => dueState(x) === 'overdue').length;
      return this.aiMessage(t('ai.a.summary', {
        total: all.length, todo: count('todo'), progress: count('inProgress'), review: count('review'), done,
        rate: Math.round((done / all.length) * 100), overdue
      }));
    }

    const routes: [string[], string, string][] = [
      [['pano', 'board', 'kanban'], '/board', 'nav.board'],
      [['takvim', 'calendar'], '/calendar', 'nav.calendar'],
      [['rapor', 'report', 'analiz'], '/reports', 'nav.reports'],
      [['takım', 'team', 'davet', 'invite'], '/team', 'nav.team'],
      [['ayar', 'setting', 'profil', 'profile', 'şifre', 'password'], '/settings', 'nav.settings']
    ];
    for (const [words, path, key] of routes) {
      if (has(...words)) {
        this.router.navigate([path]);
        return this.aiMessage(t('ai.a.navigate', { page: t(key) }));
      }
    }

    if (has('tema', 'theme')) {
      const i = THEMES.indexOf(this.themes.getTheme());
      this.themes.setTheme(THEMES[(i + 1) % THEMES.length]);
      return this.aiMessage(t('ai.a.theme'));
    }

    if (has('ingilizce', 'english', 'türkçe', 'turkish', 'dil', 'language')) {
      this.lang.setLanguage(this.lang.lang() === 'tr' ? 'en' : 'tr');
      return this.aiMessage(t('ai.a.lang'));
    }

    if (has('yorgun', 'stres', 'moral', 'tired', 'stress', 'motivasyon', 'motivation')) return this.aiMessage(t('ai.a.motivate'));
    if (has('teşekkür', 'sağol', 'eyvallah', 'thank')) return this.aiMessage(t('ai.a.thanks'));
    if (has('merhaba', 'selam', 'hello', 'hi ', 'hey')) return this.aiMessage(t('ai.a.hello'));
    if (has('yardım', 'help', 'neler yap', 'what can')) return this.aiMessage(t('ai.a.help'));

    // Son çare: görevlerde kelime ara
    const words = q.split(/\s+/).filter(w => w.length > 2);
    const found = all.filter(x => words.some(w => x.title.toLocaleLowerCase('tr-TR').includes(w))).sort(byUrgency);
    if (found.length) return this.aiMessage(t('ai.a.found', { n: found.length }), found.slice(0, 6));
    return this.aiMessage(t('ai.a.unknown'));
  }

  private aiMessage(text: string, tasks?: TaskItem[]): ChatMessage {
    return { id: ++this.msgId, from: 'ai', parts: toParts(text), tasks, time: this.now() };
  }

  private showTeaser() {
    if (this.open()) return;
    const overdue = this.store.tasks().filter(x => dueState(x) === 'overdue' && x.assignedUserId === this.me()?.id).length;
    this.teaser.set(overdue ? this.lang.t('ai.teaserOverdue', { n: overdue }) : this.lang.t('ai.teaser'));
    this.teaserTimer = setTimeout(() => this.teaser.set(null), 8000);
  }

  private now(): string {
    return new Intl.DateTimeFormat(this.lang.locale, { hour: '2-digit', minute: '2-digit' }).format(new Date());
  }
}
