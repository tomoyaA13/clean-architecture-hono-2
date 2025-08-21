import { AdminInvitation } from '../../domain/model/admin-invitation';

export interface LoadAdminInvitationPort {
  findPendingByEmail(email: string): Promise<AdminInvitation | null>;
}
