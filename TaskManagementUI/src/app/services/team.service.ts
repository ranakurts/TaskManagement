import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { API_BASE_URL } from '../api.config';

export type TeamRole = 'Admin' | 'Member';

export interface Team {
  id: number;
  name: string;
  description?: string;
  ownerId: number;
  ownerName: string;
  myRole: TeamRole;
  memberCount: number;
  createdAt: string;
}

export interface TeamMemberInfo {
  userId: number;
  fullName: string;
  username: string;
  email: string;
  role: TeamRole;
  joinedAt: string;
}

export interface TeamInvitation {
  id: number;
  teamId: number;
  teamName: string;
  email: string;
  invitedByName: string;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Expired';
  createdAt: string;
}

interface MessageResponse {
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private http = inject(HttpClient);
  private api = `${API_BASE_URL}/teams`;

  // Davet edilen kullanıcıya düşen bekleyen istekler (bildirim zili + takım sayfası)
  private pendingSubject = new BehaviorSubject<TeamInvitation[]>([]);
  pendingInvitations$ = this.pendingSubject.asObservable();

  // Bir davet kabul edildiğinde takım listesinin yenilenmesi için
  private teamsChangedSubject = new BehaviorSubject<number>(0);
  teamsChanged$ = this.teamsChangedSubject.asObservable();

  getMyTeams(): Observable<Team[]> {
    return this.http.get<Team[]>(this.api);
  }

  createTeam(name: string, description?: string): Observable<MessageResponse & { teamId: number }> {
    return this.http
      .post<MessageResponse & { teamId: number }>(this.api, { name, description })
      .pipe(tap(() => this.teamsChangedSubject.next(Date.now())));
  }

  getMembers(teamId: number): Observable<TeamMemberInfo[]> {
    return this.http.get<TeamMemberInfo[]>(`${this.api}/${teamId}/members`);
  }

  removeMember(teamId: number, userId: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.api}/${teamId}/members/${userId}`);
  }

  invite(teamId: number, email: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.api}/${teamId}/invitations`, { email });
  }

  getSentInvitations(teamId: number): Observable<TeamInvitation[]> {
    return this.http.get<TeamInvitation[]>(`${this.api}/${teamId}/invitations`);
  }

  cancelInvitation(teamId: number, invitationId: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.api}/${teamId}/invitations/${invitationId}`);
  }

  refreshPendingInvitations(): void {
    this.http.get<TeamInvitation[]>(`${this.api}/invitations/pending`).subscribe({
      next: list => this.pendingSubject.next(list),
      error: () => this.pendingSubject.next([])
    });
  }

  respond(invitationId: number, accept: boolean): Observable<MessageResponse> {
    return this.http
      .post<MessageResponse>(`${this.api}/invitations/${invitationId}/respond`, { accept })
      .pipe(tap(() => {
        this.pendingSubject.next(this.pendingSubject.value.filter(i => i.id !== invitationId));
        if (accept) this.teamsChangedSubject.next(Date.now());
      }));
  }
}
