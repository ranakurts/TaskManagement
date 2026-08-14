import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AuthUser {
  email: string;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly SESSION_TOKEN_KEY = 'sys_session_token';
  private readonly SESSION_USER_KEY = 'sys_session_user';
  
  // DİKKAT: Buradaki port numarasını kendi .NET API portuna göre güncelle (Örn: 5001, 7154 vb.)
  private apiUrl = 'https://localhost:5001/api/Auth'; 

  private http = inject(HttpClient);

  private currentUserSubject = new BehaviorSubject<AuthUser | null>(this.getStoredSession());
  currentUser$: Observable<AuthUser | null> = this.currentUserSubject.asObservable();

  constructor() {}

  private getStoredSession(): AuthUser | null {
    const stored = localStorage.getItem(this.SESSION_USER_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  // Artık gerçek backend'e istek atıyoruz!
  login(email: string, password: string = "123456A*") {
    // 1. Önceki oturum kalıntılarını yok et
    this.executeSessionWipe();

    const normalizedEmail = email.toLowerCase().trim();
    const loginDto = { email: normalizedEmail, password: password };

    // 2. .NET API'ye login isteği at
    this.http.post<{token: string}>(`${this.apiUrl}/login`, loginDto).subscribe({
      next: (response) => {
        const user: AuthUser = {
          email: normalizedEmail,
          token: response.token // Backend'den gelen GERÇEK token
        };

        // 3. Yeni ve güvenli oturumu kaydet
        localStorage.setItem(this.SESSION_TOKEN_KEY, user.token);
        localStorage.setItem(this.SESSION_USER_KEY, JSON.stringify(user));
        sessionStorage.setItem(this.SESSION_TOKEN_KEY, user.token);

        this.currentUserSubject.next(user);

        // 4. Tüm Angular bileşenlerini sıfırlamak için tam sayfa yenileme
        window.location.href = '/';
      },
      error: (err) => {
        console.error('Login failed:', err);
        alert('Giriş başarısız. Lütfen bilgileri kontrol edin.');
      }
    });
  }

  logout() {
    // API'ye çıkış yaptığımızı bildir
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
      next: () => this.completeLogout(),
      error: () => this.completeLogout() // Hata verse bile lokalden sil
    });
  }

  private completeLogout() {
    this.executeSessionWipe();
    this.currentUserSubject.next(null);
    window.location.href = '/login'; 
  }

  private executeSessionWipe() {
    // Tarayıcıdaki TÜM verileri kökten yok ediyoruz. Eski hesap sızması imkansız hale gelir.
    localStorage.clear();
    sessionStorage.clear();
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }
}