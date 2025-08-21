// src/application/port/in/create-admin-invitation-use-case.ts
import { AdminInvitation } from '../../../domain/model/admin-invitation';

export interface CreateAdminInvitationCommand {
  email: string;
  frontendOrigin: string;
}

export interface CreateAdminInvitationResult {
  invitation: AdminInvitation;
  verificationLink: string;
}

export interface CreateAdminInvitationUseCase {
  createInvitation(command: CreateAdminInvitationCommand): Promise<CreateAdminInvitationResult>;
}
