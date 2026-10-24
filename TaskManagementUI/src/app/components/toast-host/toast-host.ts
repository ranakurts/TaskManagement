import { Component, inject } from '@angular/core';
import { UiService, Toast } from '../../services/ui.service';
import { IconComponent } from '../ui/task-bits';

@Component({
  selector: 'tm-toast-host',
  standalone: true,
  imports: [IconComponent],
  template: `
    @for (toast of ui.toasts(); track toast.id) {
      <div class="toast" [class]="'toast ' + toast.kind" role="status">
        <span class="icon">
          <tm-icon [name]="toast.kind === 'error' ? 'close' : toast.kind === 'info' ? 'sparkle' : 'check'" [size]="14" [stroke]="2.6" />
        </span>
        <span class="text">{{ toast.text }}</span>
        @if (toast.action) {
          <button class="action no-glow" (click)="run(toast)">{{ toast.action.label }}</button>
        }
        <button class="x no-glow" (click)="ui.dismissToast(toast.id)" aria-label="Close"><tm-icon name="close" [size]="13" /></button>
      </div>
    }
  `,
  styles: [`
    :host { position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%); z-index: 4000; display: flex; flex-direction: column; gap: 10px; align-items: center; pointer-events: none; width: max-content; max-width: calc(100vw - 32px); }
    .toast {
      pointer-events: auto; display: flex; align-items: center; gap: 10px; padding: 10px 10px 10px 12px; border-radius: 14px;
      background: color-mix(in srgb, var(--surface) 92%, black 8%); border: 1px solid var(--border);
      box-shadow: 0 18px 50px rgba(0,0,0,0.55); backdrop-filter: blur(20px); font-size: 13.5px; font-weight: 500;
      animation: rise 0.35s cubic-bezier(0.16, 1, 0.3, 1) both; max-width: 100%;
    }
    @keyframes rise { from { opacity: 0; transform: translateY(16px) scale(0.96); } to { opacity: 1; transform: none; } }
    .icon { width: 24px; height: 24px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #fff; background: var(--st-done); }
    .error .icon { background: #EF4444; }
    .info .icon { background: var(--primary); }
    .text { min-width: 0; }
    .action { border: 0; background: color-mix(in srgb, var(--primary) 22%, transparent); color: var(--accent); font-weight: 700; font-size: 12.5px; padding: 6px 10px; border-radius: 9px; cursor: pointer; white-space: nowrap; }
    .x { border: 0; background: transparent; color: var(--muted); cursor: pointer; padding: 4px; border-radius: 6px; display: flex; }
    .x:hover { color: var(--text); }
  `]
})
export class ToastHostComponent {
  ui = inject(UiService);

  run(toast: Toast) {
    toast.action?.run();
    this.ui.dismissToast(toast.id);
  }
}
