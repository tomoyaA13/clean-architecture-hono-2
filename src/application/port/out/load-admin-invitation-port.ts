// src/application/port/out/load-admin-invitation-port.ts
import { AdminInvitation } from '../../../domain/model/admin-invitation';

export interface LoadAdminInvitationPort {
  findByEmail(email: string): Promise<AdminInvitation | null>;
  findByToken(token: string): Promise<AdminInvitation | null>;
}
