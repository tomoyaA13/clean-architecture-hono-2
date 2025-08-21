import { AdminInvitation } from '../../domain/model/admin-invitation';

export interface CreateAdminInvitationCommand {
  email: string;
  frontendOrigin: string;
}

export interface CreateAdminInvitationResult {
  invitation: AdminInvitation;
  emailSent: boolean;
  verificationLink: string;
}

/**
 * 受信ポート(ユースケースインターフェイス) は
 * 受信アダプタ(Controller や CLI アダプタ) によって使用され、
 * アプリケーションサービス によって実装されます。
 * ユースケースインターフェイスはエンティティを操作します。
 */
export interface CreateAdminInvitationUseCase {
  createInvitation(command: CreateAdminInvitationCommand): Promise<CreateAdminInvitationResult>;
}
