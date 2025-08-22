import { AdminInvitation } from '../../../domain/model/admin-invitation';
import { DomainError, ErrorType } from '../../../common/errors/domain-error';

export class AdminInvitationDomainService {
  generateToken(): string {
    // UUIDベースのトークン生成（簡略化）
    return `inv_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new DomainError(ErrorType.VALIDATION_ERROR, '無効なメールアドレス形式です');
    }
  }

  createInvitation(email: string): AdminInvitation {
    this.validateEmail(email);

    const id = `invitation_${Date.now()}`;
    const token = this.generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24時間後に期限切れ

    return AdminInvitation.create({
      id,
      email,
      token,
      expiresAt,
    });
  }

  buildVerificationLink(frontendOrigin: string, token: string): string {
    return `${frontendOrigin}/admin/verify?token=${token}`;
  }
}
