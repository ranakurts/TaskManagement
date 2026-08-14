import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InviteService {
  private http = inject(HttpClient);
  private apiUrl = 'https://localhost:7122/api/invitations';

  private getHeaders(): HttpHeaders {
    let token = localStorage.getItem('Token') || 
                localStorage.getItem('token') || 
                localStorage.getItem('jwtToken') || 
                localStorage.getItem('access_token') ||
                localStorage.getItem('auth_token') || '';

    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  sendInvitation(email: string, workspaceId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/send`, { email, workspaceId }, { headers: this.getHeaders() });
  }

  getPendingInvitations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/pending`, { headers: this.getHeaders() });
  }

  respondInvitation(invitationId: number, accept: boolean): Observable<any> {
    return this.http.post(`${this.apiUrl}/respond`, { invitationId, accept }, { headers: this.getHeaders() });
  }
}