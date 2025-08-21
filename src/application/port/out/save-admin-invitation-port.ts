import { AdminInvitation } from '../../domain/model/admin-invitation';

export interface SaveAdminInvitationPort {
  save(invitation: AdminInvitation): Promise<AdminInvitation>;
}
