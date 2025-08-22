import { PrismaClient } from '@prisma/client';
import { AdminInvitation } from '../../../domain/model/admin-invitation';
import { LoadAdminInvitationPort } from '../../../application/port/out/load-admin-invitation-port';
import { SaveAdminInvitationPort } from '../../../application/port/out/save-admin-invitation-port';
import { RepositoryTestSupport } from '../../../application/port/out/repository-test-support';

export class PrismaAdminInvitationRepository implements LoadAdminInvitationPort, SaveAdminInvitationPort, RepositoryTestSupport<string[]> {
  constructor(private readonly prisma: PrismaClient) {}

  async findByEmail(email: string): Promise<AdminInvitation | null> {
    const invitation = await this.prisma.admin_invitations.findFirst({
      where: { email },
      include: { status: true },
    });

    if (!invitation) {
      return null;
    }

    return AdminInvitation.reconstruct({
      id: invitation.id,
      email: invitation.email,
      token: invitation.invitation_token,
      expiresAt: invitation.expires_at,
      createdAt: invitation.created_at,
      usedAt: null, // ステータスに基づいて判定する必要がある場合は修正
    });
  }

  async findByToken(token: string): Promise<AdminInvitation | null> {
    const invitation = await this.prisma.admin_invitations.findUnique({
      where: { invitation_token: token },
      include: { status: true },
    });

    if (!invitation) {
      return null;
    }

    return AdminInvitation.reconstruct({
      id: invitation.id,
      email: invitation.email,
      token: invitation.invitation_token,
      expiresAt: invitation.expires_at,
      createdAt: invitation.created_at,
      usedAt: null, // ステータスに基づいて判定する必要がある場合は修正
    });
  }

  async save(invitation: AdminInvitation): Promise<void> {
    await this.prisma.admin_invitations.upsert({
      where: { id: invitation.id },
      update: {
        email: invitation.email,
        invitation_token: invitation.token,
        expires_at: invitation.expiresAt,
        status_code: invitation.isUsed() ? 'accepted' : 'pending', // ステータスのマッピング
      },
      create: {
        id: invitation.id,
        email: invitation.email,
        invitation_token: invitation.token,
        expires_at: invitation.expiresAt,
        status_code: 'pending', // 新規作成時は待機中
        created_at: invitation.createdAt,
      },
    });
  }

  async clear(ids?: string[]): Promise<void> {
    if (ids && ids.length > 0) {
      await this.prisma.admin_invitations.deleteMany({
        where: { id: { in: ids } },
      });
    } else {
      await this.prisma.admin_invitations.deleteMany();
    }
  }
}
