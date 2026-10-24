import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { API_BASE_URL } from '../api.config';
import { AuthService } from './auth.service';

export interface AuthenticatedUser {
  id: number;
  username: string;
  fullName: string;
  email: string;
  avatar: string;
  workspaceName?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class UserStateService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  private currentUserSubject = new BehaviorSubject<AuthenticatedUser | null>(null);
  public currentUser$: Observable<AuthenticatedUser | null> = this.currentUserSubject.asObservable();

  fetchCurrentUser(): void {
    if (!this.auth.isLoggedIn()) {
      this.currentUserSubject.next(null);
      return;
    }

    this.http.get<AuthenticatedUser>(`${API_BASE_URL}/users/me`).subscribe({
      next: user => this.currentUserSubject.next(user),
      error: () => this.currentUserSubject.next(null)
    });
  }

  updateProfile(data: { fullName?: string; username?: string; email?: string; workspaceName?: string }) {
    return this.http
      .put<{ message: string; user: AuthenticatedUser }>(`${API_BASE_URL}/users/update`, data)
      .pipe(tap(res => {
        this.currentUserSubject.next(res.user);
        this.auth.updateSessionEmail(res.user.email);
      }));
  }

  changePassword(currentPassword: string, newPassword: string) {
    return this.http.put<{ message: string }>(`${API_BASE_URL}/users/password`, { currentPassword, newPassword });
  }

  // Sadece oturumu kapatır; dil, tema ve kullanıcıya ait yerel veriler silinmez.
  clearUser(): void {
    this.auth.logout();
    this.currentUserSubject.next(null);
  }
}
