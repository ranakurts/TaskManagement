import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LanguageService, LangType } from '../../services/language.service';
import { TaskService } from '../../services/task';

interface ChatMessage {
  sender: 'ai' | 'user';
  text: string;
  time: string;
}

@Component({
  selector: 'app-ai-companion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- SAĞ ALT KÖŞEDE SABİT SİHİRLİ YILDIZ VE BALONCUK SOHBET ALANI -->
    <div class="companion-wrapper">
      
      <!-- Aktif Küçük Bildirim Balonu -->
      <div class="speech-bubble" *ngIf="currentMessage && !isAssistantOpen" (click)="toggleAssistant()">
        <span>{{ currentMessage }}</span>
        <div class="bubble-tail"></div>
      </div>

      <!-- İNTERAKTİF BALONCUK SOHBET PENCERESİ -->
      <div class="chat-popover-bubble dash-card" *ngIf="isAssistantOpen">
        <div class="ai-panel-header">
          <div class="ai-title-group">
            <span class="ai-status-dot"></span>
            <h3>Rananın Yıldızı ✨</h3>
          </div>
          <button class="close-panel-btn" (click)="toggleAssistant()">✕</button>
        </div>

        <!-- Mesaj Akış Alanı -->
        <div class="ai-panel-body" #chatBody>
          <div *ngFor="let msg of messages" class="chat-message-row" [class.user]="msg.sender === 'user'" [class.ai]="msg.sender === 'ai'">
            <div class="ai-chat-bubble" [class.user-bubble]="msg.sender === 'user'" [class.ai-bubble]="msg.sender === 'ai'">
              <p>{{ msg.text }}</p>
              <span class="msg-time">{{ msg.time }}</span>
            </div>
          </div>

          <!-- Öneri Çipleri -->
          <div class="ai-chat-suggestions" *ngIf="messages.length <= 2">
            <button class="suggestion-chip" (click)="sendPreset('Şifremi nasıl değiştirebilirim?')">🔐 Şifre değiştirme</button>
            <button class="suggestion-chip" (click)="sendPreset('Bugünkü önceliklerim neler?')">🎯 Bugünkü önceliklerim</button>
            <button class="suggestion-chip" (click)="sendPreset('Entity Framework optimizasyon ipucu ver')">⚡ EF Core İpucu</button>
            <button class="suggestion-chip" (click)="sendPreset('Task listemi özetle')">📋 Task listesi</button>
          </div>
        </div>

        <div class="ai-panel-footer">
          <input type="text" [(ngModel)]="userMessage" (keyup.enter)="sendMessage()" placeholder="Rananın Yıldızı'na bir şeyler yaz..." class="glass-input">
          <button class="ai-btn primary" (click)="sendMessage()">Gönder</button>
        </div>
      </div>

      <!-- Küçük Sihirli Yıldız Butonu -->
      <div class="magical-star-container" 
           (mouseenter)="isHovered = true" 
           (mouseleave)="isHovered = false" 
           (click)="toggleAssistant()">
        
        <div class="star-glow" [class.hovered]="isHovered"></div>
        
        <!-- SVG 5 Noktalı Yıldız -->
        <svg class="magical-star" [class.waving]="isHovered" viewBox="0 0 50 50" width="48" height="48">
          <defs>
            <linearGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#E879F9" />
              <stop offset="50%" stop-color="#A855F7" />
              <stop offset="100%" stop-color="#38BDF8" />
            </linearGradient>
            <filter id="starGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <path class="star-path" 
                d="M25 2 L31.5 17.5 L48 20 L36.5 32 L39.5 48 L25 40 L10.5 48 L13.5 32 L2 20 L18.5 17.5 Z" 
                fill="url(#starGrad)" 
                filter="url(#starGlow)" />
          <!-- Yumuşak Gözler -->
          <circle cx="22" cy="23" r="1.5" fill="#FFFFFF" opacity="0.85" />
          <circle cx="28" cy="23" r="1.5" fill="#FFFFFF" opacity="0.85" />
        </svg>

        <!-- Küçük Parıltı Parçacıkları -->
        <div class="sparkle-particles" *ngIf="isHovered">
          <span class="spark s1">✨</span>
          <span class="spark s2">⭐</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap');

    .companion-wrapper {
      position: fixed;
      right: 36px;
      bottom: 36px;
      z-index: 1400;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      pointer-events: auto;
      font-family: 'Quicksand', sans-serif !important;
    }

    .magical-star-container {
      position: relative;
      width: 52px;
      height: 52px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      animation: continuousSpinAndGlow 8s linear infinite;
      margin-top: 12px;
    }

    @keyframes continuousSpinAndGlow {
      0% { transform: rotate(0deg) scale(1); filter: drop-shadow(0 0 8px rgba(168, 85, 247, 0.5)); }
      50% { transform: rotate(180deg) scale(1.08); filter: drop-shadow(0 0 20px rgba(232, 121, 249, 0.9)); }
      100% { transform: rotate(360deg) scale(1); filter: drop-shadow(0 0 8px rgba(168, 85, 247, 0.5)); }
    }

    .magical-star.waving { transform: scale(1.25) !important; animation: none; }

    .star-glow {
      position: absolute;
      inset: -14px;
      background: radial-gradient(circle, rgba(168, 85, 247, 0.45) 0%, transparent 75%);
      border-radius: 50%;
      filter: blur(12px);
      opacity: 0.6;
      animation: pulseGlow 4s ease-in-out infinite;
    }

    .star-glow.hovered {
      opacity: 1;
      transform: scale(1.4);
      background: radial-gradient(circle, rgba(232, 121, 249, 0.8) 0%, rgba(56, 189, 248, 0.5) 75%);
    }

    @keyframes pulseGlow {
      0%, 100% { transform: scale(1); opacity: 0.45; }
      50% { transform: scale(1.4); opacity: 0.85; }
    }

    .sparkle-particles { position: absolute; inset: -20px; pointer-events: none; }
    .spark { position: absolute; font-size: 13px; animation: particleFade 1s ease-out infinite; }
    .s1 { top: 0; left: 0; animation-delay: 0s; }
    .s2 { bottom: 0; right: 0; animation-delay: 0.5s; }

    @keyframes particleFade {
      0% { transform: translateY(0) scale(0.8); opacity: 0; }
      50% { opacity: 1; }
      100% { transform: translateY(-14px) scale(1.25); opacity: 0; }
    }

    .speech-bubble {
      background: rgba(19, 26, 46, 0.94);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(232, 121, 249, 0.35);
      padding: 12px 18px;
      border-radius: 16px;
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.6);
      color: #F8FAFC;
      font-size: 14px;
      font-weight: 500;
      letter-spacing: 0.3px;
      font-family: 'Quicksand', sans-serif !important;
      white-space: nowrap;
      cursor: pointer;
      margin-bottom: 8px;
      animation: bubblePopup 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      position: relative;
    }

    .speech-bubble:hover { border-color: #E879F9; }

    @keyframes bubblePopup {
      from { opacity: 0; transform: translateY(6px) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .bubble-tail {
      position: absolute;
      bottom: -6px;
      right: 20px;
      width: 10px;
      height: 10px;
      background: rgba(19, 26, 46, 0.94);
      border-right: 1px solid rgba(232, 121, 249, 0.35);
      border-bottom: 1px solid rgba(232, 121, 249, 0.35);
      transform: rotate(45deg);
    }

    /* BALONCUK ŞEKLİNDE AÇILAN SOHBET KUTUSU - FERAH VE OKUNAKLI */
    .chat-popover-bubble {
      width: 420px;
      max-width: calc(100vw - 48px);
      background: rgba(20, 27, 48, 0.96) !important;
      backdrop-filter: blur(30px);
      border-radius: 24px;
      border: 1px solid rgba(232, 121, 249, 0.4) !important;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.7), 0 0 35px rgba(168, 85, 247, 0.3);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      font-family: 'Quicksand', sans-serif !important;
      margin-bottom: 12px;
      animation: popoverFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    @keyframes popoverFadeIn {
      from { opacity: 0; transform: translateY(12px) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .ai-panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 18px 22px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .ai-title-group { display: flex; align-items: center; gap: 10px; }

    .ai-status-dot {
      width: 8px;
      height: 8px;
      background: #38BDF8;
      border-radius: 50%;
      box-shadow: 0 0 10px #38BDF8;
    }

    .ai-panel-header h3 { 
      margin: 0; 
      font-size: 16px !important; 
      font-weight: 700 !important; 
      letter-spacing: 0.4px !important;
      color: #FFFFFF !important; 
      font-family: 'Quicksand', sans-serif !important;
    }

    .close-panel-btn { background: none; border: none; color: #94A3B8; font-size: 16px; cursor: pointer; transition: 0.2s; }
    .close-panel-btn:hover { color: #fff; }

    .ai-panel-body {
      padding: 20px 22px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      max-height: 340px;
      min-height: 220px;
      overflow-y: auto;
    }

    .chat-message-row { display: flex; width: 100%; }
    .chat-message-row.user { justify-content: flex-end; }
    .chat-message-row.ai { justify-content: flex-start; }

    .ai-chat-bubble {
      max-width: 88%;
      padding: 14px 18px;
      border-radius: 18px;
      font-size: 14px !important;
      font-weight: 500 !important;
      line-height: 1.7 !important;
      letter-spacing: 0.3px !important;
      font-family: 'Quicksand', sans-serif !important;
    }

    .ai-bubble {
      background: rgba(139, 92, 246, 0.16);
      border: 1px solid rgba(139, 92, 246, 0.35);
      color: #F8FAFC !important;
      border-top-left-radius: 4px;
    }

    .user-bubble {
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.5), rgba(59, 130, 246, 0.5));
      border: 1px solid rgba(139, 92, 246, 0.6);
      color: #FFFFFF !important;
      border-top-right-radius: 4px;
    }

    .ai-chat-bubble p { margin: 0 0 6px 0; }
    .msg-time { font-size: 11px !important; color: rgba(255, 255, 255, 0.5) !important; display: block; text-align: right; }

    .ai-chat-suggestions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }

    .suggestion-chip {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(232, 121, 249, 0.3);
      color: #E879F9;
      padding: 7px 14px;
      border-radius: 9999px;
      font-size: 13px !important;
      font-weight: 600 !important;
      letter-spacing: 0.3px !important;
      cursor: pointer;
      transition: 0.25s;
      font-family: 'Quicksand', sans-serif !important;
    }
    .suggestion-chip:hover {
      background: rgba(139, 92, 246, 0.28);
      border-color: rgba(232, 121, 249, 0.6);
      color: #FFFFFF;
      transform: translateY(-1px);
    }

    .ai-panel-footer {
      padding: 16px 22px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      gap: 10px;
      background: rgba(0, 0, 0, 0.25);
    }

    .glass-input {
      flex-grow: 1;
      height: 42px;
      border-radius: 12px;
      background: rgba(18, 24, 48, 0.7);
      border: 1px solid rgba(139, 92, 246, 0.35);
      color: #F8FAFC;
      padding: 0 16px;
      font-size: 14px !important;
      font-weight: 500 !important;
      letter-spacing: 0.3px !important;
      outline: none;
      font-family: 'Quicksand', sans-serif !important;
    }
    .glass-input:focus { border-color: #E879F9; box-shadow: 0 0 12px rgba(232, 121, 249, 0.4); }

    .ai-btn { 
      padding: 8px 18px; 
      border-radius: 12px; 
      font-size: 14px !important; 
      font-weight: 600 !important; 
      letter-spacing: 0.4px !important;
      cursor: pointer; 
      transition: 0.3s; 
      font-family: 'Quicksand', sans-serif !important; 
    }
    .ai-btn.primary { background: linear-gradient(135deg, #8B5CF6, #E879F9); border: none; color: #FFFFFF; box-shadow: 0 0 12px rgba(139, 92, 246, 0.5); }
    .ai-btn.primary:hover { box-shadow: 0 0 20px rgba(232, 121, 249, 0.8); }
  `]
})
export class AiCompanionComponent implements OnInit, OnDestroy {
  langService = inject(LanguageService);
  taskService = inject(TaskService);
  currentLang: LangType = 'tr';

  isHovered = false;
  isAssistantOpen = false;
  currentMessage: string | null = null;
  userMessage = '';

  messages: ChatMessage[] = [];

  private messageInterval: any;
  private messageTimeout: any;

  private messagesTr = [
    '✨ Merhaba! Ben Rananın Yıldızı.',
    '⭐ Projelerin veya kodların hakkında bana her şeyi sorabilirsin.',
    '🌸 Bugün harika işler çıkarıyoruz!'
  ];

  private messagesEn = [
    '✨ Hello! I am Rananın Yıldızı.',
    '⭐ Ask me anything about your code or projects.',
    '🌸 We are doing amazing work today!'
  ];

  ngOnInit() {
    this.langService.lang$.subscribe((l: LangType) => {
      this.currentLang = l;
    });

    this.resetChat();

    this.messageInterval = setInterval(() => {
      this.showRandomMessage();
    }, 35000);

    setTimeout(() => {
      this.showRandomMessage();
    }, 4000);
  }

  ngOnDestroy() {
    if (this.messageInterval) clearInterval(this.messageInterval);
    if (this.messageTimeout) clearInterval(this.messageTimeout);
  }

  resetChat() {
    const welcomeText = this.currentLang === 'en'
      ? '✨ Hello! I am Rananın Yıldızı, your friendly AI companion. How can I assist you with your projects, code, or settings today?'
      : '✨ Merhaba! Ben Rananın Yıldızı, senin akıllı ve tatlı AI asistanınım. Bugün projelerinde, kodlarında veya ayarlarında sana nasıl destek olabilirim?';
    
    this.messages = [{
      sender: 'ai',
      text: welcomeText,
      time: this.getTimeString()
    }];
  }

  showRandomMessage() {
    if (this.isAssistantOpen) return;
    const list = this.currentLang === 'en' ? this.messagesEn : this.messagesTr;
    const randomIndex = Math.floor(Math.random() * list.length);
    this.currentMessage = list[randomIndex];

    if (this.messageTimeout) clearTimeout(this.messageTimeout);
    this.messageTimeout = setTimeout(() => {
      this.currentMessage = null;
    }, 6000);
  }

  toggleAssistant() {
    this.isAssistantOpen = !this.isAssistantOpen;
    this.currentMessage = null;
  }

  closeAssistant() {
    this.isAssistantOpen = false;
  }

  sendPreset(text: string) {
    this.userMessage = text;
    this.sendMessage();
  }

  sendMessage() {
    const txt = this.userMessage.trim();
    if (!txt) return;

    this.messages.push({
      sender: 'user',
      text: txt,
      time: this.getTimeString()
    });

    const userQuery = txt;
    this.userMessage = '';

    setTimeout(() => {
      const aiReply = this.generateSmartResponse(userQuery);
      this.messages.push({
        sender: 'ai',
        text: aiReply,
        time: this.getTimeString()
      });
    }, 600);
  }

  generateSmartResponse(query: string): string {
    const q = query.toLowerCase();

    if (q.includes('şifre') || q.includes('password') || q.includes('değiş') || q.includes('reset') || q.includes('email') || q.includes('mail') || q.includes('hesap')) {
      return '🔐 Hesap bilgilerini veya şifreni güncellemek için üst menüden **Ayarlar** sayfasına gidebilirsin. Oradan adı, e-postayı ve şifreyi kolayca değiştirebilirsin!';
    } 
    else if (q.includes('öncelik') || q.includes('priority') || q.includes('bugün') || q.includes('plan')) {
      return '🎯 Bugünkü önceliklerin: Devam eden taskları board üzerinde tamamlamak, kod mimarisini gözden geçirmek ve sprint hedeflerine odaklanmak. Harika bir gün olacak!';
    } 
    else if (q.includes('entity framework') || q.includes('ef core') || q.includes('linq') || q.includes('c#') || q.includes('sql') || q.includes('kod') || q.includes('optimizasyon')) {
      return '💻 Harika bir teknik konu! Entity Framework performansını artırmak için LINQ sorgularında `.AsNoTracking()` kullanabilir, gereksiz veri yükünü önlemek için Eager/Lazy loading dengesine dikkat edebilirsin.';
    }
    else if (q.includes('angular') || q.includes('typescript') || q.includes('frontend')) {
      return '⚡ Angular projelerinde performans için change detection stratejilerini `OnPush` yapmak ve reusable bileşenler tasarlamak kodunu çok temiz tutar.';
    }
    else if (q.includes('task') || q.includes('görev') || q.includes('liste') || q.includes('pano') || q.includes('board')) {
      return '📋 Görevlerini **Görevler** veya **Pano** sekmesinden yönetebilirsin. Kartları sürükleyip bırakarak durumlarını anında güncelleyebilirsin!';
    } 
    else if (q.includes('moral') || q.includes('stres') || q.includes('yorgun') || q.includes('yardım et') || q.includes('nasilsin') || q.includes('nasılsın')) {
      return '⭐ Harika gidiyorsun! Bazen yoğun çalışma temposu yorucu olabilir, küçük bir mola verip derin bir nefes almayı unutma. Seninle gurur duyuyorum, her sorunun üstesinden gelebilirsin! ✨';
    } 
    else if (q.includes('merhaba') || q.includes('selam') || q.includes('hey') || q.includes('hi')) {
      return '🌸 Selam! Ben Rananın Yıldızı. Sana nasıl yardımcı olabilirim? Projelerin, kodların veya görevlerin konusunda buradayım.';
    }
    else if (q.includes('teşekkür') || q.includes('sağol') || q.includes('eyvallah')) {
      return '💖 Rica ederim! Her zaman buradayım, takıldığın başka bir şey olursa çekinmeden sorabilirsin.';
    }
    else {
      return `✨ "${query}" ile ilgili olarak; RanaCore çalışma alanındaki araçları kullanabilir veya modüller arasında geçiş yapabilirsin. Bu konuda daha detaylı rehberliğe ihtiyacın var mı?`;
    }
  }

  getTimeString(): string {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}