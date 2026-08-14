import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

// 1. AuthenticatedUser arayüzünü buraya ekleyip export ediyoruz
export interface AuthenticatedUser {
  id: number;
  username: string;
  fullName: string;
  email: string;
  avatar: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserStateService {
  private http = inject(HttpClient);

  private currentUserSubject = new BehaviorSubject<AuthenticatedUser | null>(null);
  public currentUser$: Observable<AuthenticatedUser | null> = this.currentUserSubject.asObservable();

  fetchCurrentUser(): void {
    const token = localStorage.getItem('Token') || sessionStorage.getItem('Token');
    if (!token) {
      this.clearAllStates();
      return;
    }

    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.get<AuthenticatedUser>('/api/users/me', { headers }).subscribe({
      next: (user) => {
        this.currentUserSubject.next(user);
      },
      error: () => {
        this.clearAllStates();
      }
    });
  }

  // 2. layout.ts'in çağırdığı clearUser metodunu ekliyoruz
  clearUser(): void {
    this.clearAllStates();
  }

  clearAllStates(): void {
    localStorage.removeItem('Token');
    sessionStorage.removeItem('Token');
    localStorage.clear();
    sessionStorage.clear();
    this.currentUserSubject.next(null);
  }
  // UserService içerisine bu metodun eklenmesi gerekiyor:

updateProfile(updatedData: Partial<AuthenticatedUser>) {
  const current = this.currentUserSubject.value;
  if (current) {
    const updated = { ...current, ...updatedData };
    this.currentUserSubject.next(updated);
  }
}
}