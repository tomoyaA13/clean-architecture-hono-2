import { PrismaClient } from '@prisma/client';
import { LoadAdminInvitationPort } from '../../../application/port/out/load-admin-invitation-port';
import { SaveAdminInvitationPort } from '../../../application/port/out/save-admin-invitation-port';
import { MockAdminInvitationRepository } from './mock-admin-invitation-repository';
import { PrismaAdminInvitationRepository } from './prisma-admin-invitation-repository';

export interface AdminInvitationRepository extends LoadAdminInvitationPort, SaveAdminInvitationPort {}

export class AdminInvitationRepositoryFactory {
  static create(useMockDb: boolean, prisma?: PrismaClient): AdminInvitationRepository {
    if (useMockDb) {
      return new MockAdminInvitationRepository();
    }

    if (!prisma) {
      throw new Error('PrismaClient is required when not using mock database');
    }

    return new PrismaAdminInvitationRepository(prisma);
  }
}
