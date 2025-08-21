// src/adapter/out/persistence/prisma-admin-invitation-repository.ts
import { AdminInvitation } from '../../../domain/model/admin-invitation';
import { LoadAdminInvitationPort } from '../../../application/port/out/load-admin-invitation-port';
import { SaveAdminInvitationPort } from '../../../application/port/out/save-admin-invitation-port';
import { RepositoryTestSupport } from '../../../application/port/out/repository-test-support';
import { PrismaClientFactory } from './prisma-client';

export class PrismaAdminInvitationRepository 
  implements LoadAdminInvitationPort, SaveAdminInvitationPort, RepositoryTestSupport<string[]> {
  
  private readonly prisma: any;

  constructor(databaseUrl: string) {
    this.prisma = PrismaClientFactory.getClient(databaseUrl);
  }

  async findByEmail(email: string): Promise<AdminInvitation | null> {
    const invitation = await this.prisma.adminInvitation.findUnique({
      where: { email },
    });

    if (!invitation) {
      return null;
    }

    return AdminInvitation.reconstruct({
      id: invitation.id,
      email: invitation.email,
      token: invitation.token,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
      usedAt: invitation.usedAt,
    });
  }

  async findByToken(token: string): Promise<AdminInvitation | null> {
    const invitation = await this.prisma.adminInvitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      return null;
    }

    return AdminInvitation.reconstruct({
      id: invitation.id,
      email: invitation.email,
      token: invitation.token,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
      usedAt: invitation.usedAt,
    });
  }

  async save(invitation: AdminInvitation): Promise<void> {
    await this.prisma.adminInvitation.upsert({
      where: { id: invitation.id },
      update: {
        email: invitation.email,
        token: invitation.token,
        expiresAt: invitation.expiresAt,
        usedAt: invitation.usedAt,
      },
      create: {
        id: invitation.id,
        email: invitation.email,
        token: invitation.token,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
      },
    });
  }

  async clear(ids?: string[]): Promise<void> {
    if (ids && ids.length > 0) {
      await this.prisma.adminInvitation.deleteMany({
        where: { id: { in: ids } },
      });
    } else {
      await this.prisma.adminInvitation.deleteMany();
    }
  }
}
