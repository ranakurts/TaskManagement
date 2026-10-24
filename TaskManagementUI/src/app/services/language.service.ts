import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { I18N } from '../i18n';

export type LangType = 'tr' | 'en';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private currentLang: LangType = localStorage.getItem('ranacore_lang') === 'en' ? 'en' : 'tr';
  private langSubject = new BehaviorSubject<LangType>(this.currentLang);
  lang$: Observable<LangType> = this.langSubject.asObservable();
  // Sinyal: şablonlarda dil değişince otomatik yeniden çizim için
  readonly lang = signal<LangType>(this.currentLang);

  private translations: Record<LangType, Record<string, string>> = {
    tr: {
      'tasks.title': 'Görev Yönetimi',
      'tasks.desc': 'Tüm görevlerin detaylı listesi ve durum yönetimi.',
      'board.title': 'Proje Panosu',
      'board.desc': 'Çalışma alanındaki Kanban akışı ve görev durumları.',
      'col.todo': 'YAPILACAKLAR',
      'col.inprogress': 'DEVAM EDEN',
      'col.completed': 'TAMAMLANAN',
      'common.noTask': 'Görev bulunmuyor.',
      'board.start': 'Başlat ➔',
      'board.complete': 'Tamamla ➔',
      'board.done': 'Bitti ✓',

      'calendar.title': 'Takvim ve Zaman Planı',
      'calendar.desc': 'Aylık planlama ve etkinlik takibi.',
      'calendar.prev': 'Önceki',
      'calendar.next': 'Sonraki',
      'calendar.month': 'Temmuz 2026',

      'reports.title': 'Raporlar ve Analizler',
      'reports.desc': 'Çalışma alanındaki görev dağılımları ve performans özetleri.',
      'reports.totalPeriod': 'TOPLAM PERİYOT',
      'reports.finishedPeriod': 'BİTEN DÖNEM',
      'reports.totalScore': 'TOPLAM PUAN',
      'reports.analysisTitle': 'Dönem ve Görev Performans Analizi',
      'reports.periodName': 'DÖNEM ADI',
      'reports.status': 'DURUM',
      'reports.target': 'HEDEF',
      'reports.totalTasksCol': 'TOPLAM GÖREV',
      'reports.earnedScore': 'KAZANILAN PUAN',
      'reports.noGoal': 'Hedef belirtilmedi',
      'reports.noPeriod': 'Kayıtlı dönem bulunmuyor.',

      'settings.title': 'Kullanıcı Ayarları',
      'settings.desc': 'Profil bilgilerini, hesap oturumlarını ve arayüz tercihlerini yönetin.',
      'settings.profileTitle': 'Profil Bilgileri',
      'settings.profileDesc': 'Kişisel hesap detaylarınız ve çalışma alanı kimliğiniz.',
      'settings.activeAcc': 'Aktif Hesap Oturumu',
      'settings.name': 'Ad',
      'settings.surname': 'Soyad',
      'settings.workspace': 'Çalışma Alanı',
      'settings.email': 'E-posta Adresi',
      'settings.appearance': 'Görünüm ve Tema',
      'settings.appDesc': 'Uygulama renk paleti ve dil tercihleri.',
      'settings.theme': 'Tema Paleti',
      'settings.lang': 'Arayüz Dili',
      'settings.username': 'Kullanıcı Adı',
      'settings.connected': 'BAĞLI',
      'settings.save': 'Değişiklikleri Kaydet',
      'settings.saved': '✓ Profil başarıyla kaydedildi.',
      'settings.saveFailed': 'Profil kaydedilemedi.',
      'settings.invalid': 'Ad, kullanıcı adı ve geçerli bir e-posta zorunludur.',
      'settings.serverDown': 'Sunucuya ulaşılamadı.'
    },
    en: {
      'tasks.title': 'Task Management',
      'tasks.desc': 'Detailed task list and status tracking.',
      'board.title': 'Project Board',
      'board.desc': 'Kanban workflow and task statuses in the workspace.',
      'col.todo': 'TO DO',
      'col.inprogress': 'IN PROGRESS',
      'col.completed': 'COMPLETED',
      'common.noTask': 'No tasks found.',
      'board.start': 'Start ➔',
      'board.complete': 'Complete ➔',
      'board.done': 'Done ✓',

      'calendar.title': 'Calendar & Schedule',
      'calendar.desc': 'Monthly planning and event tracking.',
      'calendar.prev': 'Previous',
      'calendar.next': 'Next',
      'calendar.month': 'July 2026',

      'reports.title': 'Reports & Analytics',
      'reports.desc': 'Task distribution, completion rates and performance overview.',
      'reports.totalPeriod': 'Total Periods',
      'reports.finishedPeriod': 'Completed Periods',
      'reports.totalScore': 'Total Score',
      'reports.analysisTitle': 'Period & Task Performance Analysis',
      'reports.periodName': 'Period Name',
      'reports.status': 'Status',
      'reports.target': 'Target',
      'reports.totalTasksCol': 'Total Tasks',
      'reports.earnedScore': 'Score Earned',
      'reports.noGoal': 'No target specified',
      'reports.noPeriod': 'No periods found',

      'settings.title': 'User Settings',
      'settings.desc': 'Manage your profile information, account sessions, and interface preferences.',
      'settings.profileTitle': 'Profile Information',
      'settings.profileDesc': 'Personal account details and workspace identity.',
      'settings.activeAcc': 'Active Account Session',
      'settings.name': 'First Name',
      'settings.surname': 'Last Name',
      'settings.workspace': 'Workspace',
      'settings.email': 'Email Address',
      'settings.appearance': 'Appearance & Theme',
      'settings.appDesc': 'Application color palette and interface options.',
      'settings.theme': 'Theme Palette',
      'settings.lang': 'Interface Language',
      'settings.username': 'Username',
      'settings.connected': 'CONNECTED',
      'settings.save': 'Save Changes',
      'settings.saved': '✓ Profile saved successfully.',
      'settings.saveFailed': 'Profile could not be saved.',
      'settings.invalid': 'Name, username and a valid email are required.',
      'settings.serverDown': 'Could not reach the server.'
    }
  };

  constructor() {
    document.documentElement.lang = this.currentLang;
  }

  setLanguage(lang: LangType) {
    if (lang !== 'tr' && lang !== 'en') return;
    this.currentLang = lang;
    document.documentElement.lang = lang;
    localStorage.setItem('ranacore_lang', lang);
    this.lang.set(lang);
    this.langSubject.next(lang);
  }

  get locale(): string {
    return this.lang() === 'en' ? 'en-US' : 'tr-TR';
  }

  // Metni çevirir; {n}, {name} gibi yer tutucuları params ile doldurur
  t(key: string, params?: Record<string, string | number>): string {
    const lang = this.lang();
    let text = I18N[lang][key] ?? I18N.tr[key] ?? this.translate(key);
    if (params) {
      for (const [k, v] of Object.entries(params)) text = text.split(`{${k}}`).join(String(v));
    }
    return text;
  }

  // "yyyy-MM-dd" veya ISO tarihini dile uygun biçimlendirir
  formatDate(value: string | Date | null | undefined, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }): string {
    if (!value) return '';
    const date = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(Number(value.slice(0, 4)), Number(value.slice(5, 7)) - 1, Number(value.slice(8, 10)))
      : new Date(value);
    return new Intl.DateTimeFormat(this.locale, opts).format(date);
  }

  // "3 dk önce" gibi göreli zaman
  timeAgo(iso: string | null | undefined): string {
    if (!iso) return '';
    const diff = Math.max(0, Date.now() - new Date(iso).getTime());
    const min = Math.floor(diff / 60000);
    if (min < 1) return this.t('common.justNow');
    if (min < 60) return this.t('common.minutesAgo', { n: min });
    const hours = Math.floor(min / 60);
    if (hours < 24) return this.t('common.hoursAgo', { n: hours });
    const days = Math.floor(hours / 24);
    if (days < 7) return this.t('common.daysAgo', { n: days });
    return this.formatDate(iso, { day: 'numeric', month: 'short', year: 'numeric' });
  }

  getLang(): LangType {
    return this.currentLang;
  }

  translate(key: string): string {
    const dict = this.translations[this.currentLang] || this.translations['tr'];
    return dict[key] || this.translations['tr'][key] || key;
  }
}