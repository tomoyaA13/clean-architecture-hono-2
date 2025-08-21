// src/application/port/out/save-admin-invitation-port.ts
import { AdminInvitation } from '../../../domain/model/admin-invitation';

export interface SaveAdminInvitationPort {
  save(invitation: AdminInvitation): Promise<void>;
}
