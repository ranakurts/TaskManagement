import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { API_BASE_URL } from '../api.config';

export interface AuthUser {
  email: string;
  token: string;
}

export interface RegisterRequest {
  username: string;
  fullName: string;
  email: string;
  password: string;
}

// Oturum bilgisinin tek kaynağı. Token her yerde 'Token' anahtarıyla saklanır.
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  static readonly TOKEN_KEY = 'Token';
  private static readonly USER_KEY = 'sys_session_user';

  private http = inject(HttpClient);
  private apiUrl = `${API_BASE_URL}/auth`;

  private currentUserSubject = new BehaviorSubject<AuthUser | null>(this.getStoredSession());
  currentUser$: Observable<AuthUser | null> = this.currentUserSubject.asObservable();

  private getStoredSession(): AuthUser | null {
    const token = localStorage.getItem(AuthService.TOKEN_KEY);
    const stored = localStorage.getItem(AuthService.USER_KEY);
    if (!token || !stored || this.isExpired(token)) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  login(usernameOrEmail: string, password: string): Observable<{ token: string }> {
    return this.http
      .post<{ token: string }>(`${this.apiUrl}/login`, { usernameOrEmail: usernameOrEmail.trim(), password })
      .pipe(tap(res => this.startSession(res.token)));
  }

  register(data: RegisterRequest): Observable<{ message: string; token: string }> {
    return this.http
      .post<{ message: string; token: string }>(`${this.apiUrl}/register`, data)
      .pipe(tap(res => this.startSession(res.token)));
  }

  logout() {
    localStorage.removeItem(AuthService.TOKEN_KEY);
    localStorage.removeItem(AuthService.USER_KEY);
    sessionStorage.clear();
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    const token = localStorage.getItem(AuthService.TOKEN_KEY);
    return token && !this.isExpired(token) ? token : null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  // Profilde e-posta değişirse oturumdaki e-posta da güncellenir
  updateSessionEmail(email: string) {
    const current = this.currentUserSubject.value;
    if (!current || current.email === email) return;
    const updated = { ...current, email };
    localStorage.setItem(AuthService.USER_KEY, JSON.stringify(updated));
    this.currentUserSubject.next(updated);
  }

  private startSession(token: string) {
    const user: AuthUser = { email: this.readClaim(token, 'email') ?? '', token };
    localStorage.setItem(AuthService.TOKEN_KEY, token);
    localStorage.setItem(AuthService.USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private isExpired(token: string): boolean {
    const exp = Number(this.readClaim(token, 'exp'));
    return !!exp && exp * 1000 < Date.now();
  }

  private readClaim(token: string, claim: string): string | null {
    try {
      const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const bytes = Uint8Array.from(atob(payload), c => c.charCodeAt(0));
      const value = JSON.parse(new TextDecoder().decode(bytes))[claim];
      return value === undefined ? null : String(value);
    } catch {
      return null;
    }
  }
}
