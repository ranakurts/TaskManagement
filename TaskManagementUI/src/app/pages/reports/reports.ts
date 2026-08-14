import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskService, Sprint, Task } from '../../services/task';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="workspace-container">
      
      <div class="page-header-card dash-card" (mouseenter)="setRandomColor($event)">
        <div class="header-text">
          <h1>{{ t('reports.title') }}</h1>
          <p>{{ t('reports.desc') }}</p>
        </div>
      </div>

      <div class="metrics-grid">
        <div class="metric-card dash-card" (mouseenter)="setRandomColor($event)">
          <span class="metric-title">{{ t('reports.totalPeriod') }}</span>
          <span class="metric-value">{{ sprints.length }}</span>
        </div>
        <div class="metric-card dash-card" (mouseenter)="setRandomColor($event)">
          <span class="metric-title">{{ t('reports.finishedPeriod') }}</span>
          <span class="metric-value green-val">{{ completedSprintsCount }}</span>
        </div>
        <div class="metric-card dash-card" (mouseenter)="setRandomColor($event)">
          <span class="metric-title">{{ t('reports.totalScore') }}</span>
          <span class="metric-value cyan-val">{{ totalPoints }} Points</span>
        </div>
      </div>

      <div class="table-card dash-card" (mouseenter)="setRandomColor($event)">
        <div class="card-top-row">
          <h3>{{ t('reports.analysisTitle') }}</h3>
        </div>

        <div class="table-container">
          <table class="report-table">
            <thead>
              <tr>
                <th>{{ t('reports.periodName') }}</th>
                <th>{{ t('reports.status') }}</th>
                <th>{{ t('reports.target') }}</th>
                <th>{{ t('reports.totalTasksCol') }}</th>
                <th>{{ t('reports.earnedScore') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of sprints">
                <td><strong>{{ s.name }}</strong></td>
                <td>
                  <span class="status-pill" [ngClass]="s.status.toLowerCase()">
                    {{ s.status }}
                  </span>
                </td>
                <td class="goal-text">{{ s.goal || t('reports.noGoal') }}</td>
                <td>{{ getSprintTaskCount(s.id) }} Tasks</td>
                <td>
                  <span class="sp-badge">{{ getSprintCompletedSP(s.id) }} Points</span>
                </td>
              </tr>
              <tr *ngIf="sprints.length === 0">
                <td colspan="5" class="empty-hint">{{ t('reports.noPeriod') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; min-height: calc(100vh - 84px); color: #F1F5F9; font-family: 'Plus Jakarta Sans', sans-serif; }
    .workspace-container { max-width: 1240px; margin: 0 auto; padding: 40px; display: flex; flex-direction: column; gap: 28px; }
    .dash-card { background: rgba(11, 15, 30, 0.7); backdrop-filter: blur(30px); border-radius: 20px; padding: 28px 36px; border: 1px solid rgba(139, 92, 246, 0.25); box-shadow: 0 20px 40px rgba(0,0,0,0.5); transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important; }
    .dash-card:hover { transform: translateY(-3px) scale(1.01); box-shadow: 0 25px 50px rgba(0, 0, 0, 0.7), 0 0 30px color-mix(in srgb, var(--hover-color, #8B5CF6) 50%, transparent) !important; border-color: var(--hover-color, #8B5CF6) !important; }
    .page-header-card h1 { font-size: 28px; font-weight: 700; margin: 0; color: #fff; }
    .page-header-card p { font-size: 13.5px; color: #94A3B8; margin: 4px 0 0 0; }
    .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
    .metric-card { padding: 28px 32px !important; display: flex; flex-direction: column; gap: 10px; }
    .metric-title { font-size: 11.5px; font-weight: 700; color: #94A3B8; letter-spacing: 0.5px; text-transform: uppercase; }
    .metric-value { font-size: 36px; font-weight: 800; color: #fff; }
    .metric-value.green-val { color: #34D399; }
    .metric-value.cyan-val { color: #22D3EE; }
    .table-card { display: flex; flex-direction: column; gap: 20px; }
    .card-top-row h3 { font-size: 20px; font-weight: 700; margin: 0; color: #fff; }
    .table-container { overflow-x: auto; }
    .report-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13.5px; }
    .report-table th { padding: 14px 18px; color: #94A3B8; border-bottom: 1px solid rgba(255,255,255,0.08); font-weight: 600; font-size: 12px; text-transform: uppercase; }
    .report-table td { padding: 18px; border-bottom: 1px solid rgba(255,255,255,0.04); color: #FFF; vertical-align: middle; }
    .goal-text { color: #94A3B8; font-size: 13px; }
    .status-pill { font-size: 10.5px; font-weight: 700; padding: 4px 12px; border-radius: 99px; text-transform: uppercase; display: inline-block; }
    .status-pill.active { background: rgba(56, 189, 248, 0.15); color: #38BDF8; border: 1px solid rgba(56, 189, 248, 0.3); }
    .status-pill.planned { background: rgba(250, 204, 21, 0.15); color: #FACC15; border: 1px solid rgba(250, 204, 21, 0.3); }
    .status-pill.completed { background: rgba(34, 197, 94, 0.15); color: #34D399; border: 1px solid rgba(34, 197, 94, 0.3); }
    .sp-badge { font-size: 11px; font-weight: 700; background: rgba(168, 85, 247, 0.15); color: #E879F9; padding: 4px 10px; border-radius: 8px; border: 1px solid rgba(168, 85, 247, 0.3); }
    .empty-hint { text-align: center; color: rgba(255,255,255,0.3); font-style: italic; padding: 30px 0; }
  `]
})
export class ReportsComponent implements OnInit {
  private taskService = inject(TaskService);
  private langService = inject(LanguageService);
  private cdr = inject(ChangeDetectorRef);

  sprints: Sprint[] = [];
  tasks: Task[] = [];
  completedSprintsCount = 0;
  totalPoints = 0;

  private palette = ['#8B5CF6', '#A855F7', '#EC4899', '#3B82F6', '#06B6D4', '#22C55E'];

  setRandomColor(event: MouseEvent) {
    const el = event.currentTarget as HTMLElement;
    const randomColor = this.palette[Math.floor(Math.random() * this.palette.length)];
    el.style.setProperty('--hover-color', randomColor);
  }

  ngOnInit() {
    this.taskService.sprints$.subscribe(sList => {
      this.sprints = sList || [];
      this.completedSprintsCount = this.sprints.filter(s => s.status === 'Completed').length;
      this.calculateTotalPoints();
      this.cdr.detectChanges();
    });

    this.taskService.tasks$.subscribe(tList => {
      this.tasks = tList || [];
      this.calculateTotalPoints();
      this.cdr.detectChanges();
    });

    this.langService.lang$.subscribe(() => this.cdr.detectChanges());
  }

  t(key: string): string {
    return this.langService.translate(key);
  }

  getSprintTaskCount(sprintId: string): number {
    return this.tasks.filter(t => t.sprintId === sprintId).length;
  }

  getSprintCompletedSP(sprintId: string): number {
    return this.tasks
      .filter(t => t.sprintId === sprintId && t.status === 'completed')
      .reduce((acc, t) => acc + (t.storyPoint || 3), 0);
  }

  private calculateTotalPoints() {
    let sum = 0;
    this.tasks.forEach(t => {
      if (t.status === 'completed') sum += (t.storyPoint || 3);
    });
    this.totalPoints = sum;
  }
}