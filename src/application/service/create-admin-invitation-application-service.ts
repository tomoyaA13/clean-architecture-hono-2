import {
  CreateAdminInvitationUseCase,
  CreateAdminInvitationCommand,
  CreateAdminInvitationResult,
} from '../port/in/create-admin-invitation-use-case';
import { LoadAdminInvitationPort } from '../port/out/load-admin-invitation-port';
import { SaveAdminInvitationPort } from '../port/out/save-admin-invitation-port';
import { SendEmailPort } from '../port/out/send-email-port';
import { AdminInvitationDomainService } from '../domain/service/admin-invitation-domain-service';
import { DomainError, ErrorType } from '../../common/errors/domain-error';

export class CreateAdminInvitationApplicationService implements CreateAdminInvitationUseCase {
  constructor(
    private readonly domainService: AdminInvitationDomainService,
    private readonly loadPort: LoadAdminInvitationPort,
    private readonly savePort: SaveAdminInvitationPort,
    private readonly emailPort: SendEmailPort,
  ) {}

  async createInvitation(command: CreateAdminInvitationCommand): Promise<CreateAdminInvitationResult> {
    // 既存の招待を確認
    const existingInvitation = await this.loadPort.findByEmail(command.email);
    if (existingInvitation && !existingInvitation.isExpired() && !existingInvitation.isUsed()) {
      throw new DomainError(ErrorType.CONFLICT, 'この電子メールアドレスの有効な招待が既に存在します');
    }

    // 新しい招待を作成
    const invitation = this.domainService.createInvitation(command.email);

    // 招待を保存
    await this.savePort.save(invitation);

    // 検証リンクを生成
    const verificationLink = this.domainService.buildVerificationLink(command.frontendOrigin, invitation.token);

    // メールを送信
    const emailResult = await this.emailPort.send({
      to: invitation.email,
      subject: '管理者招待',
      html: this.createEmailHtml(verificationLink),
    });

    if (!emailResult.success) {
      throw new DomainError(ErrorType.INTERNAL_ERROR, `メール送信に失敗しました: ${emailResult.error}`);
    }

    return {
      invitation,
      verificationLink,
    };
  }

  private createEmailHtml(verificationLink: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>管理者招待</title>
        </head>
        <body>
          <h1>管理者への招待</h1>
          <p>管理者として招待されました。以下のリンクをクリックして確認してください：</p>
          <p><a href="${verificationLink}">${verificationLink}</a></p>
          <p>このリンクは24時間後に期限切れとなります。</p>
        </body>
      </html>
    `;
  }
}
