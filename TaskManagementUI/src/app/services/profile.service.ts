import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export interface UserProfile {
  id?: number;
  fullName?: string;
  email: string;
  name?: string;
  surname?: string;
  avatar?: string;
  workspace?: string;
  bio?: string;
  timezone?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private http = inject(HttpClient);

  private profileSubject = new BehaviorSubject<UserProfile | null>(null);
  public profile$: Observable<UserProfile | null> = this.profileSubject.asObservable();

  constructor() {
    this.reloadProfile();
  }

  reloadProfile(): void {
    const token = localStorage.getItem('Token') || localStorage.getItem('ranacore_active_token');
    
    if (!token) {
      this.profileSubject.next(null);
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<UserProfile>('/api/auth/profile', { headers }).subscribe({
      next: (profile) => {
        this.profileSubject.next(profile);
      },
      error: () => {
        this.profileSubject.next(null);
      }
    });
  }

  updateProfile(data: Partial<UserProfile>): Observable<any> {
    const current = this.profileSubject.value || { email: '' };
    const updated = { ...current, ...data };
    this.profileSubject.next(updated);
    return of({ success: true });
  }

  getAvailableAccounts(): string[] {
    const current = this.profileSubject.value;
    return current ? [`${current.fullName || current.email} (Aktif Hesap)`] : ['Oturum Açılmadı'];
  }

  setProfile(profile: UserProfile | null): void {
    this.profileSubject.next(profile);
  }

  clearProfile(): void {
    this.profileSubject.next(null);
  }
}