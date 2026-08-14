import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type LangType = 'tr' | 'en';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private currentLang: LangType = (localStorage.getItem('ranacore_lang') as LangType) || 'tr';
  private langSubject = new BehaviorSubject<LangType>(this.currentLang);
  lang$: Observable<LangType> = this.langSubject.asObservable();

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
      'settings.lang': 'Arayüz Dili'
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
      'settings.lang': 'Interface Language'
    }
  };

  constructor() {}

  setLanguage(lang: LangType) {
    this.currentLang = lang;
    localStorage.setItem('ranacore_lang', lang);
    this.langSubject.next(lang);
  }

  getLang(): LangType {
    return this.currentLang;
  }

  translate(key: string): string {
    const dict = this.translations[this.currentLang] || this.translations['tr'];
    return dict[key] || this.translations['tr'][key] || key;
  }
}