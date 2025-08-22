import { AdminInvitation } from '../../../domain/model/admin-invitation';
import { LoadAdminInvitationPort } from '../../../application/port/out/load-admin-invitation-port';
import { SaveAdminInvitationPort } from '../../../application/port/out/save-admin-invitation-port';
import { RepositoryTestSupport } from '../../../application/port/out/repository-test-support';

/**
 * モック実装のリポジトリ
 * テストや開発時にデータベース接続なしで動作
 */
export class MockAdminInvitationRepository implements LoadAdminInvitationPort, SaveAdminInvitationPort, RepositoryTestSupport<string[]> {
  private invitations: Map<string, AdminInvitation> = new Map();

  async findByEmail(email: string): Promise<AdminInvitation | null> {
    for (const invitation of this.invitations.values()) {
      if (invitation.email === email) {
        return invitation;
      }
    }
    return null;
  }

  async findByToken(token: string): Promise<AdminInvitation | null> {
    for (const invitation of this.invitations.values()) {
      if (invitation.token === token) {
        return invitation;
      }
    }
    return null;
  }

  async save(invitation: AdminInvitation): Promise<void> {
    this.invitations.set(invitation.id, invitation);
  }

  async clear(ids?: string[]): Promise<void> {
    if (ids && ids.length > 0) {
      ids.forEach((id) => this.invitations.delete(id));
    } else {
      this.invitations.clear();
    }
  }

  // テスト用のヘルパーメソッド
  getAll(): AdminInvitation[] {
    return Array.from(this.invitations.values());
  }

  size(): number {
    return this.invitations.size;
  }
}
