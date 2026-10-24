import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild, inject } from '@angular/core';

interface Star {
  x: number;
  y: number;
  r: number;
  base: number;      // temel parlaklık
  amp: number;       // parıldama genliği
  speed: number;     // parıldama hızı
  phase: number;
  color: string;     // "r, g, b"
}

interface Meteor {
  x: number;
  y: number;
  vx: number;        // px/sn
  vy: number;
  length: number;    // kuyruk uzunluğu (px)
  width: number;     // baş kalınlığı
  life: number;      // geçen süre (sn)
  maxLife: number;
  color: string;     // "r, g, b"
  fireball: boolean;
}

// Uygulama ve giriş ekranlarının ortak uzay arka planı:
// gradyan + bulutsular + parıldayan yıldızlar + gerçekçi kayan yıldızlar (tek canvas, Angular dışında çizilir)
@Component({
  selector: 'tm-space-bg',
  standalone: true,
  template: `
    <div class="base"></div>
    <div class="nebula n1"></div>
    <div class="nebula n2"></div>
    <div class="nebula n3"></div>
    <canvas #canvas></canvas>
  `,
  styles: [`
    :host { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; background: #070A14; }
    .base { position: absolute; inset: 0; background: var(--bg); }
    .nebula { position: absolute; border-radius: 50%; filter: blur(150px); opacity: 0.38; animation: drift 70s ease-in-out infinite; }
    .n1 { width: 760px; height: 760px; left: -14vw; top: -18vh; background: radial-gradient(circle, color-mix(in srgb, var(--primary) 34%, transparent) 0%, transparent 70%); }
    .n2 { width: 900px; height: 900px; right: -16vw; bottom: -26vh; background: radial-gradient(circle, color-mix(in srgb, var(--secondary) 26%, transparent) 0%, transparent 70%); animation-delay: -14s; }
    .n3 { width: 520px; height: 520px; left: 46%; top: 38%; opacity: 0.28; background: radial-gradient(circle, rgba(236, 72, 153, 0.35) 0%, transparent 70%); animation-delay: -26s; }
    @keyframes drift { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(3vw, -2vh) scale(1.06); } }
    canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
  `]
})
export class SpaceBackgroundComponent implements AfterViewInit, OnDestroy {
  private zone = inject(NgZone);
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private stars: Star[] = [];
  private meteors: Meteor[] = [];
  private frame = 0;
  private lastTime = 0;
  private nextMeteorIn = 2.5;
  private reducedMotion = false;
  private onResize = () => this.resize();

  ngAfterViewInit() {
    const ctx = this.canvasRef.nativeElement.getContext('2d');
    if (!ctx) return;
    this.ctx = ctx;
    this.reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    this.zone.runOutsideAngular(() => {
      this.resize();
      window.addEventListener('resize', this.onResize);
      this.frame = requestAnimationFrame(t => this.loop(t));
    });
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.frame);
    window.removeEventListener('resize', this.onResize);
  }

  private resize() {
    const canvas = this.canvasRef.nativeElement;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    canvas.width = Math.round(this.width * this.dpr);
    canvas.height = Math.round(this.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.createStars();
  }

  private createStars() {
    const count = Math.round((this.width * this.height) / 5200);
    const palette = ['255, 255, 255', '255, 255, 255', '255, 255, 255', '196, 181, 253', '165, 243, 252', '191, 219, 254', '254, 240, 200'];
    this.stars = Array.from({ length: count }, () => {
      const size = Math.random();
      // Çoğu yıldız küçük ve sönük, azı büyük ve parlak (gerçek gökyüzü gibi)
      const r = size > 0.992 ? 1.5 + Math.random() * 0.6 : size > 0.92 ? 0.9 + Math.random() * 0.45 : 0.3 + Math.random() * 0.5;
      return {
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        r,
        base: r > 1.4 ? 0.75 : 0.2 + Math.random() * 0.45,
        amp: 0.05 + Math.random() * 0.15,
        speed: 0.12 + Math.random() * 0.35,
        phase: Math.random() * Math.PI * 2,
        color: palette[Math.floor(Math.random() * palette.length)]
      };
    });
  }

  private spawnMeteor() {
    // Gerçek meteor yağmuru gibi: hepsi aşağı yukarı aynı yönden (sağ üstten sol alta) gelir
    const angle = (205 + (Math.random() * 30 - 15)) * (Math.PI / 180);
    const fireball = Math.random() < 0.05;
    const speed = fireball ? 170 + Math.random() * 60 : 210 + Math.random() * 170;
    const startX = Math.random() * (this.width * 1.1) + this.width * 0.1;
    const startY = Math.random() * (this.height * 0.55) - this.height * 0.1;
    const colors = ['255, 255, 255', '210, 225, 255', '230, 210, 255', '200, 245, 255'];
    this.meteors.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: -Math.sin(angle) * speed,
      length: fireball ? 220 + Math.random() * 120 : 110 + Math.random() * 150,
      width: fireball ? 2.4 : 0.9 + Math.random() * 0.8,
      life: 0,
      maxLife: fireball ? 3.4 + Math.random() * 1.2 : 2.2 + Math.random() * 1.4,
      color: fireball ? '255, 214, 170' : colors[Math.floor(Math.random() * colors.length)],
      fireball
    });
  }

  private loop(time: number) {
    if (!this.canvasRef.nativeElement.isConnected) return;
    const dt = Math.min(0.05, (time - (this.lastTime || time)) / 1000);
    this.lastTime = time;

    if (!document.hidden) {
      this.draw(time / 1000, dt);
    }
    this.frame = requestAnimationFrame(t => this.loop(t));
  }

  private draw(t: number, dt: number) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Yıldızlar: her biri kendi hızında, yumuşakça parıldar
    for (const s of this.stars) {
      const alpha = Math.max(0.05, Math.min(1, s.base + Math.sin(t * s.speed + s.phase) * s.amp));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${s.color}, ${alpha})`;
      ctx.fill();
      if (s.r > 1.4) {
        // Parlak yıldızların etrafında hafif ışıma ve çapraz parıltı
        const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 5);
        glow.addColorStop(0, `rgba(${s.color}, ${alpha * 0.22})`);
        glow.addColorStop(1, `rgba(${s.color}, 0)`);
        ctx.fillStyle = glow;
        ctx.fillRect(s.x - s.r * 5, s.y - s.r * 5, s.r * 10, s.r * 10);
        ctx.strokeStyle = `rgba(${s.color}, ${alpha * 0.18})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(s.x - s.r * 4, s.y); ctx.lineTo(s.x + s.r * 4, s.y);
        ctx.moveTo(s.x, s.y - s.r * 4); ctx.lineTo(s.x, s.y + s.r * 4);
        ctx.stroke();
      }
    }

    if (this.reducedMotion) return;

    // Yeni meteor zamanlaması: düzensiz aralıklarla, bazen arka arkaya
    this.nextMeteorIn -= dt;
    if (this.nextMeteorIn <= 0 && this.meteors.length < 2) {
      this.spawnMeteor();
      this.nextMeteorIn = 5 + Math.random() * 7;
    }

    for (let i = this.meteors.length - 1; i >= 0; i--) {
      const m = this.meteors[i];
      m.life += dt;
      m.x += m.vx * dt;
      m.y += m.vy * dt;

      const p = m.life / m.maxLife;
      if (p >= 1 || m.x < -400 || m.y > this.height + 400) {
        this.meteors.splice(i, 1);
        continue;
      }

      // Hızla parlar, kısa süre parlak kalır, sonra söner
      const fade = 0.75 * (p < 0.25 ? p / 0.25 : p > 0.6 ? Math.max(0, (1 - p) / 0.4) : 1);
      const speed = Math.hypot(m.vx, m.vy);
      const ux = m.vx / speed;
      const uy = m.vy / speed;
      const tailLength = m.length * (0.35 + 0.65 * Math.min(1, p * 2));
      const tx = m.x - ux * tailLength;
      const ty = m.y - uy * tailLength;

      // Kuyruk: başa doğru kalınlaşan, sona doğru kaybolan ışık izi (üç katman)
      const layers = [
        { w: m.width * 4, a: 0.05 },
        { w: m.width * 2, a: 0.14 },
        { w: m.width, a: 0.7 }
      ];
      for (const layer of layers) {
        const grad = ctx.createLinearGradient(m.x, m.y, tx, ty);
        grad.addColorStop(0, `rgba(${m.color}, ${layer.a * fade})`);
        grad.addColorStop(0.25, `rgba(${m.color}, ${layer.a * 0.5 * fade})`);
        grad.addColorStop(1, `rgba(${m.color}, 0)`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = layer.w;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();
      }

      // Baş: parlak beyaz çekirdek + renkli hale
      const headR = m.width * (m.fireball ? 5 : 3.2);
      const head = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, headR);
      head.addColorStop(0, `rgba(255, 255, 255, ${fade})`);
      head.addColorStop(0.35, `rgba(${m.color}, ${0.7 * fade})`);
      head.addColorStop(1, `rgba(${m.color}, 0)`);
      ctx.fillStyle = head;
      ctx.beginPath();
      ctx.arc(m.x, m.y, headR, 0, Math.PI * 2);
      ctx.fill();

      // Ateş topu: arkasında küçük kıvılcımlar bırakır
      if (m.fireball && Math.random() < 0.25) {
        const back = Math.random() * tailLength * 0.5;
        ctx.fillStyle = `rgba(255, ${180 + Math.floor(Math.random() * 60)}, 120, ${0.8 * fade})`;
        ctx.beginPath();
        ctx.arc(m.x - ux * back + (Math.random() - 0.5) * 6, m.y - uy * back + (Math.random() - 0.5) * 6, 0.8 + Math.random() * 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
