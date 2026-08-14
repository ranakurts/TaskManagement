import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ProfileService } from '../../services/profile.service';

interface ProceduralMeteor {
  id: number;
  style: string;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="login-layout cosmic-nebula">
      <div class="space-layer-1 base-gradient"></div>
      <div class="space-layer-2 ambient-nebulas"><div class="nebula-blob nb1"></div><div class="nebula-blob nb2"></div></div>
      <div class="space-layer-3-4"><canvas #starCanvas class="star-canvas"></canvas></div>
      <div class="space-layer-5 procedural-meteor-layer">
        <div *ngFor="let m of activeMeteors" class="procedural-meteor" [style]="m.style"></div>
      </div>

      <div class="login-container">
        <div class="hero-side">
          <div class="brand-logo-container">
            <div class="brand-icon-wrapper glow-hover-pink"><span class="brand-letter">R</span><div class="sparkle-dot"></div></div>
            <h1 class="brand-title">Rana<span class="brand-core">Core</span></h1>
          </div>
          <div class="hero-content">
            <div class="hero-badge">✨ AI WORKSPACE ✨</div>
            <h2 class="hero-headline">Create your workspace.<br>Start collaborating.<br>Achieve more today.</h2>
            <p class="hero-desc">Join RanaCore and experience independent multi-account workspaces in a seamless cosmic interface.</p>
          </div>
          <div class="floating-widgets-grid">
            <div class="widget-card dash-card" (mouseenter)="setRandomColor($event)"><span class="widget-icon">✨</span><div class="widget-text"><strong>AI Workspace</strong><p>Independent sessions</p></div></div>
            <div class="widget-card dash-card" (mouseenter)="setRandomColor($event)"><span class="widget-icon">📊</span><div class="widget-text"><strong>Smart Analytics</strong><p>Real-time insights</p></div></div>
            <div class="widget-card dash-card" (mouseenter)="setRandomColor($event)"><span class="widget-icon">🚀</span><div class="widget-text"><strong>Multi-Account</strong><p>Run simultaneously</p></div></div>
          </div>
        </div>

        <div class="form-side">
          <div class="login-card dash-card" (mouseenter)="setRandomColor($event)">
            <div class="form-header"><h3>Create Independent Account</h3><p>Register a new isolated workspace</p></div>

            <form (submit)="onRegister($event)" class="login-form">
              <div class="input-group"><label>Full Name</label><input type="text" [(ngModel)]="name" name="name" class="glass-input" placeholder="Ahmet Yılmaz" required></div>
              <div class="input-group"><label>Email Address</label><input type="email" [(ngModel)]="email" name="email" class="glass-input" placeholder="ahmet&#64;ranacore.ai" required></div>
              <div class="input-group"><label>Password</label><input type="password" [(ngModel)]="password" name="password" class="glass-input" placeholder="••••••••" required></div>

              <div class="error-message" *ngIf="errorMessage">{{ errorMessage }}</div>

              <button type="submit" class="ai-btn primary login-btn">Create Independent Workspace</button>

              <div class="register-prompt"><span>Already have an account? </span><a routerLink="/login" class="register-link">Sign in</a></div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700;800&display=swap');
    *, *::before, *::after { box-sizing: border-box; }
    .login-layout { min-height: 100vh; font-family: 'Quicksand', sans-serif !important; color: #F1F5F9; display: flex; align-items: center; justify-content: center; position: relative; overflow-x: hidden; background: #0B0F19; padding: 50px; }
    .base-gradient { position: fixed; inset: 0; background: radial-gradient(circle at 50% 50%, #111827 0%, #0B0F19 100%); z-index: 0; pointer-events: none; }
    .ambient-nebulas { position: fixed; inset: 0; pointer-events: none; z-index: 0; opacity: 0.55; overflow: hidden; }
    .nebula-blob { position: fixed; border-radius: 50%; filter: blur(180px); pointer-events: none; }
    .nb1 { top: -15vh; left: -10vw; width: 850px; height: 850px; background: radial-gradient(circle, rgba(139, 92, 246, 0.28) 0%, transparent 75%); }
    .nb2 { bottom: -15vh; right: -10vw; width: 1000px; height: 1000px; background: radial-gradient(circle, rgba(6, 182, 212, 0.18) 0%, transparent 75%); }
    .space-layer-3-4 { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
    .star-canvas { width: 100vw; height: 100vh; display: block; }
    .procedural-meteor-layer { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
    .procedural-meteor { position: absolute; height: 2px; background: linear-gradient(90deg, #FFFFFF, rgba(168, 85, 247, 0.95), transparent); box-shadow: 0 0 16px rgba(168, 85, 247, 0.95); opacity: 0; animation: proceduralFly var(--meteor-duration) cubic-bezier(0.25, 1, 0.5, 1) forwards; }
    @keyframes proceduralFly { 0% { transform: translate(0px, 0px) rotate(var(--meteor-angle)) scaleX(0.2); opacity: 0; } 20% { opacity: 1; } 70% { opacity: 0.8; } 100% { transform: translate(var(--end-x), var(--end-y)) rotate(var(--meteor-angle)) scaleX(1); opacity: 0; } }
    .login-container { max-width: 1560px; width: 100%; display: grid; grid-template-columns: 1.3fr 1fr; gap: 80px; align-items: center; position: relative; z-index: 10; }
    .hero-side { display: flex; flex-direction: column; gap: 40px; }
    .brand-logo-container { display: flex; align-items: center; gap: 18px; }
    .brand-icon-wrapper { width: 64px; height: 64px; background: linear-gradient(135deg, #EC4899, #A855F7); border-radius: 22px; display: flex; align-items: center; justify-content: center; position: relative; box-shadow: 0 0 40px rgba(236, 72, 153, 0.55); }
    .brand-letter { font-size: 34px; font-weight: 800; color: #FFFFFF; }
    .sparkle-dot { position: absolute; top: 8px; right: 8px; width: 10px; height: 10px; background: #F472B6; border-radius: 50%; box-shadow: 0 0 10px #FFFFFF, 0 0 16px #F472B6; }
    .brand-title { font-size: 42px; font-weight: 800; margin: 0; color: #FFFFFF; }
    .brand-core { background: linear-gradient(135deg, #F472B6, #38BDF8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .hero-content { display: flex; flex-direction: column; gap: 22px; }
    .hero-badge { font-size: 14px; font-weight: 700; letter-spacing: 0.22em; color: #E879F9; }
    .hero-headline { font-size: 62px; font-weight: 800; color: #F8FAFC; line-height: 1.12; margin: 0; }
    .hero-desc { font-size: 20px; color: rgba(255,255,255,0.8); line-height: 1.65; max-width: 660px; margin: 0; }
    .floating-widgets-grid { display: flex; flex-direction: column; gap: 16px; margin-top: 10px; max-width: 560px; }
    .widget-card { display: flex; align-items: center; gap: 20px; padding: 22px 30px !important; }
    .widget-icon { font-size: 30px; }
    .widget-text strong { font-size: 18px; color: #F8FAFC; display: block; margin-bottom: 3px; }
    .widget-text p { font-size: 15px; color: rgba(255,255,255,0.7); margin: 0; }
    .form-side { display: flex; justify-content: center; }
    .login-card { width: 100%; max-width: 520px; padding: 52px !important; display: flex; flex-direction: column; gap: 32px; }
    .form-header h3 { font-size: 32px; font-weight: 700; color: #F8FAFC; margin: 0 0 10px 0; }
    .form-header p { font-size: 15px; color: rgba(255,255,255,0.65); margin: 0; }
    .login-form { display: flex; flex-direction: column; gap: 24px; }
    .input-group { display: flex; flex-direction: column; gap: 10px; }
    .input-group label { font-size: 12.5px; font-weight: 700; color: #94A3B8; text-transform: uppercase; }
    .glass-input { height: 54px; border-radius: 16px; background: rgba(18, 24, 48, 0.7); border: 1px solid rgba(139, 92, 246, 0.35); color: #F8FAFC; padding: 0 20px; font-size: 15.5px; outline: none; font-family: 'Quicksand', sans-serif !important; }
    .glass-input:focus { border-color: #E879F9; box-shadow: 0 0 25px rgba(232, 121, 249, 0.45); }
    .error-message { background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: #F87171; padding: 12px 16px; border-radius: 12px; font-size: 13.5px; font-weight: 600; text-align: center; }
    .login-btn { width: 100%; height: 56px; border-radius: 16px; font-size: 16.5px; font-weight: 700; margin-top: 10px; }
    .register-prompt { text-align: center; font-size: 14.5px; color: rgba(255,255,255,0.7); margin-top: 4px; }
    .register-link { color: #E879F9; text-decoration: none; font-weight: 700; }
    .dash-card { background: rgba(27, 36, 64, 0.65); backdrop-filter: blur(24px); border-radius: 28px; border: 1px solid rgba(139, 92, 246, 0.28); box-shadow: 0 25px 50px rgba(0,0,0,0.5); }
    .ai-btn.primary { background: linear-gradient(135deg, #8B5CF6, #E879F9); border: none; color: #FFFFFF; box-shadow: 0 0 22px rgba(139, 92, 246, 0.5); }
  `]
})
export class RegisterComponent implements OnInit, AfterViewInit {
  private router = inject(Router);
  private profileService = inject(ProfileService);
  private http = inject(HttpClient);
  private ngZone = inject(NgZone);

  name = '';
  email = '';
  password = '';
  errorMessage = '';

  activeMeteors: ProceduralMeteor[] = [];
  private meteorIdCounter = 0;
  @ViewChild('starCanvas') starCanvas!: ElementRef<HTMLCanvasElement>;

  ngOnInit() { this.startProceduralMeteorEngine(); }
  ngAfterViewInit() { this.initUniformStarField(); }

  setRandomColor(event: MouseEvent) {
    const card = event.currentTarget as HTMLElement;
    card.style.setProperty('--hover-color', '#E879F9');
  }

  onRegister(event: Event) {
    event.preventDefault();
    this.errorMessage = '';

    if (!this.name.trim() || !this.email.trim() || !this.password.trim()) {
      this.errorMessage = 'Lütfen tüm alanları eksiksiz doldurun.';
      return;
    }

    const email = this.email.trim();
    const nameParts = this.name.trim().split(' ');
    const firstName = nameParts[0] || 'Kullanıcı';
    const lastName = nameParts.slice(1).join(' ') || '';
    const username = email.split('@')[0];

    const registerPayload = {
      username: username,
      fullName: this.name.trim(),
      email: email,
      password: this.password
    };

    // Doğrudan backend portuna (https://localhost:7122) istek atılıyor
    this.http.post<any>('https://localhost:7122/api/auth/register', registerPayload).subscribe({
      next: (response) => {
        if (response && response.token) {
          localStorage.setItem('Token', response.token);
        }

        const newProfile = {
          name: firstName,
          surname: lastName,
          workspace: `${username}_workspace`,
          email: email,
          bio: 'AI & Defense Technologies Engineering Student',
          timezone: 'UTC+3',
          avatar: firstName.charAt(0).toUpperCase()
        };

        const accountsJson = localStorage.getItem('ranacore_accounts');
        let accounts: any[] = accountsJson ? JSON.parse(accountsJson) : [];
        const existingIndex = accounts.findIndex(a => a.email === email);
        if (existingIndex >= 0) {
          accounts[existingIndex] = newProfile;
        } else {
          accounts.push(newProfile);
        }

        localStorage.setItem('ranacore_accounts', JSON.stringify(accounts));
        localStorage.setItem('ranacore_active_email', email);

        this.profileService.updateProfile(newProfile);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Kayıt hatası:', err);
        this.errorMessage = err.error?.message || 'Kayıt işlemi başarısız oldu. Lütfen tekrar deneyin.';
      }
    });
  }

  private initUniformStarField() {
    const canvas = this.starCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let stars = Array.from({ length: 150 }, () => ({
      x: Math.random() * width, y: Math.random() * height,
      radius: Math.random() * 1.0 + 0.3, alpha: Math.random() * 0.5 + 0.2,
      speed: (Math.random() * 0.002 + 0.001) * (Math.random() > 0.5 ? 1 : -1)
    }));
    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      stars.forEach(s => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
        ctx.fill();
        s.alpha += s.speed;
        if (s.alpha > 0.85 || s.alpha < 0.2) s.speed = -s.speed;
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
        const startX = Math.random() * w;
        const startY = -120;
        const endX = Math.random() * (w + 600) - 300;
        const endY = Math.random() * (h + 600) - 300;
        const dx = endX - startX;
        const dy = endY - startY;
        const duration = Math.sqrt(dx * dx + dy * dy) / 300;
        const id = this.meteorIdCounter++;
        const style = `top: ${startY}px; left: ${startX}px; width: 160px; --end-x: ${dx}px; --end-y: ${dy}px; --meteor-duration: ${duration}s; --meteor-angle: ${Math.atan2(dy, dx) * (180 / Math.PI)}deg;`;
        if (this.activeMeteors.length < 5) this.activeMeteors.push({ id, style });
        setTimeout(() => this.activeMeteors = this.activeMeteors.filter(m => m.id !== id), duration * 1000);
      });
      setTimeout(spawnMeteor, (Math.random() * 3 + 2) * 1000);
    };
    setTimeout(spawnMeteor, 100);
  }
}