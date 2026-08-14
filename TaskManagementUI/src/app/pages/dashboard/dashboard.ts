import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LanguageService, LangType } from '../../services/language.service';
import { ProfileService, UserProfile } from '../../services/profile.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-container">
      <!-- HERO SECTION -->
      <div class="welcome-hero-section dash-card" (mouseenter)="setRandomColor($event)">
        <div class="hero-badge">AI WORKSPACE</div>
        <h1 class="hero-title">{{ getWelcomeMessage() }}</h1>
        <p class="hero-subtitle">{{ t('subtitle') }}</p>
      </div>

      <!-- METRİKLER -->
      <div class="metrics-grid">
        <div class="metric-card dash-card" (mouseenter)="setRandomColor($event)">
          <div class="metric-header">
            <span class="metric-title">{{ t('totalTasks') }}</span>
            <span class="metric-badge-green">+12%</span>
          </div>
          <div class="metric-value">1</div>
          <div class="metric-desc">{{ t('activeWorkflow') }}</div>
        </div>

        <div class="metric-card dash-card" (mouseenter)="setRandomColor($event)">
          <div class="metric-header">
            <span class="metric-title">{{ t('inProgress') }}</span>
            <span class="metric-badge-gray">{{ t('activeLabel') }}</span>
          </div>
          <div class="metric-value">1</div>
          <div class="metric-desc">{{ t('workingOnIt') }}</div>
        </div>

        <div class="metric-card dash-card" (mouseenter)="setRandomColor($event)">
          <div class="metric-header">
            <span class="metric-title">{{ t('completed') }}</span>
            <span class="metric-badge-green">+18%</span>
          </div>
          <div class="metric-value">0</div>
          <div class="metric-desc">{{ t('successfullyDelivered') }}</div>
        </div>

        <div class="metric-card dash-card" (mouseenter)="setRandomColor($event)">
          <div class="metric-header">
            <span class="metric-title">{{ t('successRate') }}</span>
            <span class="metric-badge-green">+8.4%</span>
          </div>
          <div class="metric-value">%0</div>
          <div class="metric-desc">{{ t('efficiencyIndex') }}</div>
        </div>
      </div>

      <!-- ALT KARTLAR -->
      <div class="bottom-grid">
        <div class="dash-card content-card" (mouseenter)="setRandomColor($event)">
          <h3>{{ t('recentTasks') }}</h3>
          <div class="sub-card">
            <span class="dot"></span>
            <div>
              <strong>Entity Framework Optimizasyonu</strong>
              <p>{{ userName }} • high</p>
            </div>
          </div>
        </div>

        <div class="dash-card content-card" (mouseenter)="setRandomColor($event)">
          <h3>{{ t('upcomingDeadlines') }}</h3>
          <div class="sub-card">
            <span class="date-tag">2026-07-30</span>
            <div>
              <strong>Entity Framework Optimizasyonu</strong>
              <p>{{ t('sprintClosing') }}</p>
            </div>
          </div>
        </div>

        <div class="dash-card content-card" (mouseenter)="setRandomColor($event)">
          <h3>{{ t('recentActivities') }}</h3>
          <div class="sub-card">
            <div>
              <strong>Entity Framework</strong>
              <p>{{ t('optCompleted') }}</p>
            </div>
          </div>
          <div class="sub-card" style="margin-top: 10px;">
            <div>
              <strong>API Gateway</strong>
              <p>{{ t('ocelotIntegration') }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container { padding: 32px 48px; display: flex; flex-direction: column; gap: 28px; max-width: 1440px; margin: 0 auto; width: 100%; }
    
    .dash-card {
      background: var(--card, rgba(27, 36, 64, 0.65)) !important;
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid var(--border, rgba(139, 92, 246, 0.28)) !important;
      border-radius: 24px;
      box-shadow: var(--shadow, 0 25px 50px rgba(0, 0, 0, 0.5));
      position: relative;
      overflow: hidden;
      transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), 
                  box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1), 
                  border-color 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
    }

    .dash-card:hover {
      transform: translateY(-6px) scale(1.02);
      box-shadow: 0 30px 60px rgba(0, 0, 0, 0.7), 0 0 35px color-mix(in srgb, var(--hover-color, #8B5CF6) 45%, transparent) !important;
      border-color: var(--hover-color, #8B5CF6) !important;
    }

    .welcome-hero-section { padding: 40px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px; }
    .hero-badge { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; color: var(--muted, #94A3B8); }
    .hero-title { font-size: 36px; font-weight: 800; color: var(--text, #F8FAFC); margin: 0; }
    .hero-subtitle { font-size: 14.5px; color: var(--muted, #94A3B8); margin: 0; }

    .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
    .metric-card { padding: 24px; display: flex; flex-direction: column; gap: 12px; }
    .metric-header { display: flex; justify-content: space-between; align-items: center; }
    .metric-title { font-size: 11.5px; font-weight: 700; color: var(--muted, #94A3B8); letter-spacing: 0.05em; }
    .metric-badge-green { font-size: 11px; font-weight: 700; color: #10B981; background: rgba(16, 185, 129, 0.15); padding: 2px 8px; border-radius: 99px; }
    .metric-badge-gray { font-size: 11px; font-weight: 700; color: var(--muted, #94A3B8); background: rgba(255, 255, 255, 0.08); padding: 2px 8px; border-radius: 99px; }
    .metric-value { font-size: 32px; font-weight: 800; color: var(--text, #F8FAFC); }
    .metric-desc { font-size: 12.5px; color: var(--muted, #64748B); }

    .bottom-grid { display: grid; grid-template-columns: 1fr 1.2fr 1fr; gap: 20px; }
    .content-card { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
    .content-card h3 { font-size: 15px; font-weight: 700; color: var(--text, #F8FAFC); margin: 0; }
    .sub-card { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.06); padding: 12px 16px; border-radius: 14px; display: flex; align-items: center; gap: 12px; }
    .sub-card strong { font-size: 13px; color: var(--text, #F8FAFC); display: block; }
    .sub-card p { font-size: 11.5px; color: var(--muted, #94A3B8); margin: 2px 0 0 0; }
    .dot { width: 8px; height: 8px; background: #EAB308; border-radius: 50%; box-shadow: 0 0 10px #EAB308; }
    .date-tag { font-size: 11px; font-weight: 700; color: #C084FC; background: rgba(192, 132, 252, 0.12); padding: 6px 8px; border-radius: 8px; text-align: center; }

    @media (max-width: 1024px) {
      .metrics-grid { grid-template-columns: repeat(2, 1fr); }
      .bottom-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  langService = inject(LanguageService);
  profileService = inject(ProfileService);
  
  currentLang: LangType = 'tr';
  userName: string = 'Nesli';

  private palette = [
    '#8B5CF6', '#A855F7', '#EC4899', '#3B82F6', '#06B6D4', 
    '#14B8A6', '#22C55E', '#84CC16', '#F59E0B', '#F97316', '#E879F9', '#6366F1'
  ];

  ngOnInit() {
    this.langService.lang$.subscribe((l: LangType) => {
      this.currentLang = l;
    });

    // DÜZELTME: null güvenlik kontrolü eklendi
    this.profileService.profile$.subscribe((p: UserProfile | null) => {
      if (p && p.name) {
        this.userName = p.name;
      }
    });
  }

  getWelcomeMessage(): string {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    let greetingTr = 'İyi akşamlar';
    let greetingEn = 'Good evening';

    if (totalMinutes >= 0 && totalMinutes <= 360) {
      greetingTr = 'İyi geceler';
      greetingEn = 'Good night';
    } 
    else if (totalMinutes > 360 && totalMinutes <= 660) {
      greetingTr = 'Günaydın';
      greetingEn = 'Good morning';
    } 
    else if (totalMinutes > 660 && totalMinutes <= 1020) {
      greetingTr = 'İyi öğlenler ';
      greetingEn = 'Good afternoon';
    } 
    else {
      greetingTr = 'İyi akşamlar';
      greetingEn = 'Good evening';
    }

    return this.currentLang === 'tr' 
      ? `${greetingTr}, ${this.userName}` 
      : `${greetingEn}, ${this.userName}`;
  }

  setRandomColor(event: MouseEvent) {
    const card = event.currentTarget as HTMLElement;
    const randomColor = this.palette[Math.floor(Math.random() * this.palette.length)];
    card.style.setProperty('--hover-color', randomColor);
  }

  t(key: string): string {
    const dict: Record<LangType, Record<string, string>> = {
      tr: {
        subtitle: 'AI çalışma alanınıza hoş geldiniz. Projelerinizi oluşturun, yönetin ve daha verimli çalışın.',
        totalTasks: 'TOPLAM GÖREV',
        inProgress: 'DEVAM EDİYOR',
        activeWorkflow: 'Aktif iş akışı',
        activeLabel: 'Aktif',
        workingOnIt: 'Üzerinde çalışılıyor',
        completed: 'TAMAMLANAN',
        successfullyDelivered: 'Başarıyla teslim edildi',
        successRate: 'BAŞARI ORANI',
        efficiencyIndex: 'Verimlilik endeksi',
        recentTasks: 'Son Görevler',
        upcomingDeadlines: 'Yaklaşan Teslim Tarihleri',
        recentActivities: 'Son Aktiviteler',
        sprintClosing: 'Sprint Kapanışı',
        optCompleted: 'Optimizasyon tamamlandı',
        ocelotIntegration: 'Ocelot entegrasyonu'
      },
      en: {
        subtitle: 'Welcome to your AI workspace. Create, manage your projects and work more efficiently.',
        totalTasks: 'TOTAL TASKS',
        inProgress: 'IN PROGRESS',
        activeWorkflow: 'Active workflow',
        activeLabel: 'Active',
        workingOnIt: 'Working on it',
        completed: 'COMPLETED',
        successfullyDelivered: 'Successfully delivered',
        successRate: 'SUCCESS RATE',
        efficiencyIndex: 'Efficiency index',
        recentTasks: 'Recent Tasks',
        upcomingDeadlines: 'Upcoming Deadlines',
        recentActivities: 'Recent Activities',
        sprintClosing: 'Sprint Closing',
        optCompleted: 'Optimization completed',
        ocelotIntegration: 'Ocelot integration'
      }
    };
    return dict[this.currentLang]?.[key] || dict['tr'][key] || key;
  }
}