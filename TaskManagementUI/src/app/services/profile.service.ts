import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { UserStateService } from './user-state.service';

export interface UserProfile {
  id?: number;
  fullName?: string;
  email: string;
  name?: string;
  surname?: string;
  avatar?: string;
}

// Eski bileşenler için UserStateService üzerinde ince bir uyumluluk katmanı
@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private userState = inject(UserStateService);

  public profile$: Observable<UserProfile | null> = this.userState.currentUser$.pipe(
    map(u => {
      if (!u) return null;
      const parts = (u.fullName || '').trim().split(' ');
      return {
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        name: parts[0] || u.username,
        surname: parts.slice(1).join(' '),
        avatar: u.avatar
      };
    })
  );

  reloadProfile(): void {
    this.userState.fetchCurrentUser();
  }
}
