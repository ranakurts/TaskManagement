import { Component, Input, Output, EventEmitter, HostListener, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DropdownOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-custom-dropdown',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="custom-dropdown" (click)="toggleOpen()">
      <div class="dropdown-selected">
        <span>{{ getSelectedLabel() }}</span>
        <svg class="chevron" [class.open]="isOpen" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
      </div>

      <div class="dropdown-menu" *ngIf="isOpen">
        <div 
          class="dropdown-item" 
          *ngFor="let opt of options"
          [class.selected]="opt.value === value"
          (click)="selectOption(opt, $event)">
          <span>{{ opt.label }}</span>
          <svg *ngIf="opt.value === value" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .custom-dropdown {
      position: relative; width: 100%; cursor: pointer; user-select: none; font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .dropdown-selected {
      height: 48px; background: var(--input-bg, rgba(19, 26, 46, 0.8)); border: 1px solid var(--card-border, rgba(139, 92, 246, 0.3));
      border-radius: 16px; padding: 0 18px; display: flex; align-items: center; justify-content: space-between;
      color: var(--text-primary, #fff); font-size: 13.5vpx; font-weight: 500; backdrop-filter: blur(16px);
      box-shadow: 0 10px 25px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08); transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .dropdown-selected:hover {
      border-color: var(--accent-glow, #8B5CF6); box-shadow: 0 0 25px var(--accent-glow, rgba(139,92,246,0.4));
    }
    .chevron { transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1); color: var(--text-secondary, #94A3B8); }
    .chevron.open { transform: rotate(180deg); }

    .dropdown-menu {
      position: absolute; top: calc(100% + 8px); left: 0; width: 100%;
      background: rgba(14, 20, 36, 0.94); backdrop-filter: blur(30px);
      border: 1px solid var(--card-border, rgba(139, 92, 246, 0.4)); border-radius: 16px;
      box-shadow: 0 30px 60px rgba(0, 0, 0, 0.8), 0 0 35px var(--accent-glow, rgba(139, 92, 246, 0.2));
      z-index: 2000; overflow: hidden; padding: 6px;
      animation: dropdownSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes dropdownSlideIn {
      0% { opacity: 0; transform: translateY(-10px) scale(0.98); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }
    .dropdown-item {
      padding: 12px 14px; border-radius: 12px; font-size: 13.5px; font-weight: 500; color: var(--text-secondary, #94A3B8);
      display: flex; align-items: center; justify-content: space-between; transition: all 0.25s ease;
    }
    .dropdown-item:hover {
      background: var(--hover-bg, rgba(139, 92, 246, 0.15)); color: var(--text-primary, #fff);
      box-shadow: 0 0 20px var(--accent-glow, rgba(139, 92, 246, 0.25));
    }
    .dropdown-item.selected {
      background: var(--selected-gradient, linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(59, 130, 246, 0.4)));
      color: #fff; font-weight: 600; box-shadow: 0 0 25px var(--accent-glow, rgba(139, 92, 246, 0.35));
    }
  `]
})
export class CustomDropdownComponent {
  @Input() options: DropdownOption[] = [];
  @Input() value: string = '';
  @Output() valueChange = new EventEmitter<string>();

  isOpen = false;
  private el = inject(ElementRef);

  toggleOpen() { this.isOpen = !this.isOpen; }

  getSelectedLabel(): string {
    const found = this.options.find(o => o.value === this.value);
    return found ? found.label : 'Select...';
  }

  selectOption(opt: DropdownOption, event: Event) {
    event.stopPropagation();
    this.value = opt.value;
    this.valueChange.emit(this.value);
    this.isOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (!this.el.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }
}