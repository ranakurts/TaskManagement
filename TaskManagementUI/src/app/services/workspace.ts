import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface WorkspaceInvitation {
  id: string;
  fromUser: string;
  toEmail: string;
  workspaceName: string;
  status: 'pending' | 'accepted' | 'rejected';
}

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {
  private getActiveEmail(): string {
    return localStorage.getItem('ranacore_active_email') || 'kagan@ranacore.ai';
  }

  // Davet gönder (Kağan -> Alp'e atıyor)
  sendInvitation(toEmail: string, workspaceName: string) {
    const fromUser = this.getActiveEmail();
    const invitationsJson = localStorage.getItem('ranacore_invitations');
    const invitations: WorkspaceInvitation[] = invitationsJson ? JSON.parse(invitationsJson) : [];

    const newInvite: WorkspaceInvitation = {
      id: Math.random().toString(36).substr(2, 9),
      fromUser,
      toEmail: toEmail.trim().toLowerCase(),
      workspaceName,
      status: 'pending'
    };

    invitations.push(newInvite);
    localStorage.setItem('ranacore_invitations', JSON.stringify(invitations));

    // Hedef kullanıcının (Alp'in) bildirimlerine bu daveti ekle
    const targetNotifsKey = `ranacore_notifications_${toEmail.trim().toLowerCase()}`;
    const targetNotifsJson = localStorage.getItem(targetNotifsKey);
    const targetNotifs = targetNotifsJson ? JSON.parse(targetNotifsJson) : [];

    targetNotifs.unshift({
      id: newInvite.id,
      title: 'Yeni Çalışma Alanı Daveti',
      message: `${fromUser} sizi "${workspaceName}" çalışma alanına davet etti.`,
      time: 'Az önce',
      read: false,
      isInvite: true,
      inviteId: newInvite.id
    });
    localStorage.setItem(targetNotifsKey, JSON.stringify(targetNotifs));
  }

  // Alp daveti kabul ediyor
  acceptInvitation(inviteId: string) {
    const invitationsJson = localStorage.getItem('ranacore_invitations');
    if (!invitationsJson) return;

    let invitations: WorkspaceInvitation[] = JSON.parse(invitationsJson);
    const invite = invitations.find(i => i.id === inviteId);
    
    if (invite) {
      invite.status = 'accepted';
      localStorage.setItem('ranacore_invitations', JSON.stringify(invitations));

      // Alp'in aktif hesap listesine bu workspace'i ekle
      const activeEmail = this.getActiveEmail();
      const accountsJson = localStorage.getItem('ranacore_accounts');
      if (accountsJson) {
        let accounts = JSON.parse(accountsJson);
        let acc = accounts.find((a: any) => a.email === activeEmail);
        if (acc) {
          acc.workspace = invite.workspaceName;
          localStorage.setItem('ranacore_accounts', JSON.stringify(accounts));
        }
      }
    }
  }

  // Alp daveti reddediyor
  rejectInvitation(inviteId: string) {
    const invitationsJson = localStorage.getItem('ranacore_invitations');
    if (!invitationsJson) return;

    let invitations: WorkspaceInvitation[] = JSON.parse(invitationsJson);
    const invite = invitations.find(i => i.id === inviteId);
    if (invite) {
      invite.status = 'rejected';
      localStorage.setItem('ranacore_invitations', JSON.stringify(invitations));
    }
  }
}