import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { UserStateService } from '../../services/user-state.service';

interface ProceduralMeteor {
  id: number;
  style: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="login-layout cosmic-nebula">
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

      <div class="login-container">
        <div class="hero-side">
          <div class="brand-logo-container">
            <div class="brand-icon-wrapper glow-hover-pink">
              <span class="brand-letter">R</span>
              <div class="sparkle-dot"></div>
            </div>
            <h1 class="brand-title">Rana<span class="brand-core">Core</span></h1>
          </div>

          <div class="hero-content">
            <div class="hero-badge">✨ AI WORKSPACE ✨</div>
            <h2 class="hero-headline">Build smarter.<br>Organize faster.<br>Collaborate effortlessly.</h2>
            <p class="hero-desc">Experience independent multi-account workspaces with seamless cosmic session isolation.</p>
          </div>

          <div class="floating-widgets-grid">
            <div class="widget-card dash-card" (mouseenter)="setRandomColor($event)">
              <span class="widget-icon">✨</span>
              <div class="widget-text">
                <strong>AI Workspace</strong>
                <p>Independent sessions</p>
              </div>
            </div>

            <div class="widget-card dash-card" (mouseenter)="setRandomColor($event)">
              <span class="widget-icon">📊</span>
              <div class="widget-text">
                <strong>Smart Analytics</strong>
                <p>Real-time insights</p>
              </div>
            </div>

            <div class="widget-card dash-card" (mouseenter)="setRandomColor($event)">
              <span class="widget-icon">🚀</span>
              <div class="widget-text">
                <strong>Multi-Account</strong>
                <p>Run simultaneously</p>
              </div>
            </div>
          </div>
        </div>

        <div class="form-side">
          <div class="login-card dash-card" (mouseenter)="setRandomColor($event)">
            <div class="form-header">
              <h3>Welcome Back</h3>
              <p>Sign in to your specific workspace account</p>
            </div>

            <form (submit)="onLogin($event)" class="login-form">
              <div class="input-group">
                <label>Email Address</label>
                <input type="email" [(ngModel)]="email" name="email" class="glass-input" placeholder="hesap&#64;ranacore.ai" required>
              </div>

              <div class="input-group">
                <label>Password</label>
                <input type="password" [(ngModel)]="password" name="password" class="glass-input" placeholder="••••••••" required>
              </div>

              <div class="error-message" *ngIf="errorMessage">
                {{ errorMessage }}
              </div>

              <div class="success-message" *ngIf="successMessage">
                {{ successMessage }}
              </div>

              <div class="form-actions-row">
                <label class="remember-label">
                  <input type="checkbox" [(ngModel)]="rememberMe" name="remember">
                  <span>Remember me</span>
                </label>
                <a href="javascript:void(0)" (click)="sendPasswordReset()" class="forgot-link">Forgot password?</a>
              </div>

              <button type="submit" class="ai-btn primary login-btn">Sign In to Workspace</button>

              <div class="register-prompt">
                <span>Don't have an account? </span>
                <a routerLink="/register" class="register-link">Sign up</a>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700;800&display=swap');
    *, *::before, *::after { box-sizing: border-box; }

    .login-layout {
      min-height: 100vh; font-family: 'Quicksand', sans-serif !important; color: var(--text, #F1F5F9);
      display: flex; align-items: center; justify-content: center; position: relative; overflow-x: hidden;
      background: var(--bg, #0B0F19); padding: 50px;
    }

    .base-gradient { position: fixed; inset: 0; background: radial-gradient(circle at 50% 50%, #111827 0%, #0B0F19 100%); z-index: 0; pointer-events: none; }
    .ambient-nebulas { position: fixed; inset: 0; pointer-events: none; z-index: 0; opacity: 0.55; overflow: hidden; }
    .nebula-blob { position: fixed; border-radius: 50%; filter: blur(180px); pointer-events: none; }
    .nb1 { top: -15vh; left: -10vw; width: 850px; height: 850px; background: radial-gradient(circle, rgba(139, 92, 246, 0.28) 0%, transparent 75%); }
    .nb2 { bottom: -15vh; right: -10vw; width: 1000px; height: 1000px; background: radial-gradient(circle, rgba(6, 182, 212, 0.18) 0%, transparent 75%); }

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

    .login-container {
      max-width: 1560px; width: 100%; display: grid; grid-template-columns: 1.3fr 1fr; gap: 80px;
      align-items: center; position: relative; z-index: 10; animation: fadeInPage 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    @keyframes fadeInPage {
      from { opacity: 0; transform: translateY(15px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .hero-side { display: flex; flex-direction: column; gap: 40px; }

    .brand-logo-container { display: flex; align-items: center; gap: 18px; }
    .brand-icon-wrapper {
      width: 64px; height: 64px; background: linear-gradient(135deg, #EC4899 0%, #A855F7 50%, #6366F1 100%);
      border-radius: 22px; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 40px rgba(236, 72, 153, 0.55); position: relative;
    }
    .brand-letter { font-size: 34px; font-weight: 800; color: #FFFFFF; }
    .sparkle-dot { position: absolute; top: 8px; right: 8px; width: 10px; height: 10px; background: #F472B6; border-radius: 50%; box-shadow: 0 0 10px #FFFFFF, 0 0 16px #F472B6; }
    .brand-title { font-size: 42px; font-weight: 800; margin: 0; color: #FFFFFF; letter-spacing: 0.5px; }
    .brand-core { background: linear-gradient(135deg, #F472B6 0%, #C084FC 60%, #38BDF8 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

    .hero-content { display: flex; flex-direction: column; gap: 22px; }
    .hero-badge { font-size: 14px; font-weight: 700; letter-spacing: 0.22em; color: #E879F9; }
    .hero-headline { font-size: 62px; font-weight: 800; color: #F8FAFC; line-height: 1.12; margin: 0; letter-spacing: -0.8px; }
    .hero-desc { font-size: 20px; color: rgba(255, 255, 255, 0.8); line-height: 1.65; max-width: 660px; margin: 0; font-weight: 500; }

    .floating-widgets-grid { display: flex; flex-direction: column; gap: 16px; margin-top: 10px; max-width: 560px; }
    .widget-card { display: flex; align-items: center; gap: 20px; padding: 22px 30px !important; animation: floatSlow 4s ease-in-out infinite; }
    .widget-card:nth-child(2) { animation-delay: 1.3s; }
    .widget-card:nth-child(3) { animation-delay: 2.6s; }

    @keyframes floatSlow {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
    }

    .widget-icon { font-size: 30px; }
    .widget-text strong { font-size: 18px; color: #F8FAFC; display: block; font-weight: 700; margin-bottom: 3px; }
    .widget-text p { font-size: 15px; color: rgba(255, 255, 255, 0.7); margin: 0; font-weight: 500; }

    .form-side { display: flex; justify-content: center; }
    .login-card { width: 100%; max-width: 520px; padding: 52px !important; display: flex; flex-direction: column; gap: 32px; }

    .form-header h3 { font-size: 32px; font-weight: 700; color: #F8FAFC; margin: 0 0 10px 0; }
    .form-header p { font-size: 15px; color: rgba(255, 255, 255, 0.65); margin: 0; font-weight: 500; }

    .login-form { display: flex; flex-direction: column; gap: 24px; }
    .input-group { display: flex; flex-direction: column; gap: 10px; }
    .input-group label { font-size: 12.5px; font-weight: 700; text-transform: uppercase; color: #94A3B8; letter-spacing: 0.08em; }

    .glass-input {
      height: 54px; border-radius: 16px; background: var(--surface, rgba(18, 24, 48, 0.7));
      border: 1px solid var(--border, rgba(139, 92, 246, 0.35)); color: var(--text, #F8FAFC);
      padding: 0 20px; font-size: 15.5px; outline: none; transition: 0.3s; font-family: 'Quicksand', sans-serif !important;
    }
    .glass-input:focus { border-color: var(--primary, #E879F9); box-shadow: 0 0 25px var(--glow, rgba(232, 121, 249, 0.45)); }

    .error-message {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.4);
      color: #F87171;
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 13.5px;
      font-weight: 600;
      text-align: center;
    }

    .success-message {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #34D399;
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 13.5px;
      font-weight: 600;
      text-align: center;
    }

    .form-actions-row { display: flex; justify-content: space-between; align-items: center; font-size: 14.5px; margin-top: 4px; }
    .remember-label { display: flex; align-items: center; gap: 12px; color: rgba(255, 255, 255, 0.85); cursor: pointer; font-weight: 600; }
    .remember-label input { width: 18px; height: 18px; accent-color: #8B5CF6; cursor: pointer; }
    .forgot-link { color: #E879F9; text-decoration: none; font-weight: 700; transition: 0.2s; }
    .forgot-link:hover { color: #F472B6; text-decoration: underline; }

    .login-btn { width: 100%; height: 56px; border-radius: 16px; font-size: 16.5px; font-weight: 700; margin-top: 10px; }

    .register-prompt {
      text-align: center;
      font-size: 14.5px;
      color: rgba(255, 255, 255, 0.7);
      margin-top: 4px;
      font-weight: 500;
    }
    .register-link {
      color: #E879F9;
      text-decoration: none;
      font-weight: 700;
      transition: 0.2s;
    }
    .register-link:hover {
      color: #F472B6;
      text-decoration: underline;
    }

    .dash-card {
      background: var(--card, rgba(27, 36, 64, 0.65)); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
      border-radius: 28px; border: 1px solid var(--border, rgba(139, 92, 246, 0.28)); box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
      position: relative; overflow: hidden;
      transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
    }
    .dash-card:hover {
      transform: translateY(-4px) scale(1.01);
      box-shadow: 0 30px 60px rgba(0, 0, 0, 0.7), 0 0 35px color-mix(in srgb, var(--hover-color, #E879F9) 45%, transparent) !important;
      border-color: var(--hover-color, #E879F9) !important;
    }

    .ai-btn { padding: 14px 28px; border-radius: 9999px; font-size: 15px; font-weight: 700; cursor: pointer; transition: 0.3s; display: inline-flex; align-items: center; justify-content: center; font-family: 'Quicksand', sans-serif !important; }
    .ai-btn.primary { background: linear-gradient(135deg, #8B5CF6, #E879F9); border: none; color: #FFFFFF; box-shadow: 0 0 22px rgba(139, 92, 246, 0.5); }
    .ai-btn.primary:hover { box-shadow: 0 0 35px rgba(232, 121, 249, 0.85); transform: translateY(-2px); }

    .glow-hover-pink:hover { box-shadow: 0 0 35px rgba(236, 72, 153, 0.7); }

    @media (max-width: 1024px) {
      .login-container { grid-template-columns: 1fr; gap: 50px; padding: 20px; }
      .hero-side { text-align: center; align-items: center; }
      .floating-widgets-grid { width: 100%; max-width: 100%; }
    }
  `]
})
export class LoginComponent implements OnInit, AfterViewInit {
  private router = inject(Router);
  private http = inject(HttpClient);
  private userStateService = inject(UserStateService);
  private ngZone = inject(NgZone);

  email = '';
  password = '';
  rememberMe = false;
  errorMessage = '';
  successMessage = '';

  activeMeteors: ProceduralMeteor[] = [];
  private meteorIdCounter = 0;

  private palette = [
    '#8B5CF6', '#A855F7', '#EC4899', '#3B82F6', '#06B6D4', 
    '#14B8A6', '#22C55E', '#84CC16', '#F59E0B', '#F97316', '#E879F9', '#6366F1'
  ];

  @ViewChild('starCanvas') starCanvas!: ElementRef<HTMLCanvasElement>;

  ngOnInit() {
    this.startProceduralMeteorEngine();
  }

  ngAfterViewInit() {
    this.initUniformStarField();
  }

  setRandomColor(event: MouseEvent) {
    const card = event.currentTarget as HTMLElement;
    const randomColor = this.palette[Math.floor(Math.random() * this.palette.length)];
    card.style.setProperty('--hover-color', randomColor);
  }

  onLogin(event: Event) {
    event.preventDefault();
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.email.trim() || !this.password.trim()) {
      this.errorMessage = 'Lütfen e-posta ve şifrenizi girin.';
      return;
    }

    // Backend'e gerçek kimlik doğrulama isteği gönderilir
    this.http.post<{ Token: string }>('http://localhost:5246/api/auth/login', {
      usernameOrEmail: this.email.trim(),
      password: this.password
    }).subscribe({
      next: (response) => {
        if (response && response.Token) {
          // Token doğrudan kaydedilir
          localStorage.setItem('Token', response.Token);
          localStorage.setItem('ranacore_active_token', response.Token);

          // Tek gerçek kaynak (UserStateService) tetiklenerek /api/users/me çağrılır
          this.userStateService.fetchCurrentUser();

          // Dashboard'a yönlendirilir
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage = 'Geçersiz sunucu yanıtı.';
        }
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'E-posta veya şifre hatalı.';
      }
    });
  }

  sendPasswordReset() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.email.trim()) {
      this.errorMessage = 'Lütfen önce e-posta adresinizi girin.';
      return;
    }

    this.successMessage = `Şifre sıfırlama bağlantısı ${this.email} adresine gönderildi!`;
  }

  private initUniformStarField() {
    const canvas = this.starCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const generateStars = (w: number, h: number) => {
      return Array.from({ length: 150 }, () => {
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
}