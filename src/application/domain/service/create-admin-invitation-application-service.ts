import { AdminInvitation } from '../model/admin-invitation';
import { DomainError, ErrorType } from '../../../common/errors/domain-error';

/**
 * 管理者招待に関するドメインサービス
 *
 * ドメインサービスの責務：
 * - 純粋なドメインロジック(業務上の決まりごと)を提供する
 * - エンティティに属さないドメインロジックを実装する
 * - 外部依存を持たない（ポートやアダプターに依存しない）
 * - ドメインオブジェクトのみを操作する
 */
export class AdminInvitationDomainService {
  /**
   * 招待の有効性を検証する
   * @param invitation 検証する招待オブジェクト
   * @throws {DomainError<ErrorType.BUSINESS_RULE_VIOLATION>} 招待の有効期限切れ、またはステータスが無効な場合
   */
  validateInvitation(invitation: AdminInvitation): void {
    if (invitation.isExpired()) {
      throw new DomainError(ErrorType.BUSINESS_RULE_VIOLATION, '招待の有効期限が切れています', { expiresAt: invitation.expiresAt });
    }

    if (!invitation.isValid()) {
      throw new DomainError(ErrorType.BUSINESS_RULE_VIOLATION, '招待が有効ではありません', { status: invitation.status });
    }
  }

  /**
   * 招待の有効期限を延長するべきかどうかを判断し、必要であれば延長する
   * @param invitation 招待オブジェクト
   * @returns 延長が必要であれば元のオブジェクトを更新して返す（mutable実装）
   */
  extendInvitationIfNeeded(invitation: AdminInvitation): AdminInvitation {
    if (invitation.shouldExtendExpiration()) {
      // 残り時間が2時間未満なら24時間延長
      // 注：extendExpiration は invitation 自体を変更し、同じオブジェクトが返る
      return invitation.extendExpiration(24);
    }
    return invitation;
  }

  /**
   * 新しい管理者招待を作成する
   * @param email 招待先メールアドレス
   * @returns 新しい招待オブジェクト
   * @throws {DomainError<ErrorType.INVALID_PARAMETER>} メールアドレス形式が無効な場合 (AdminInvitation.createNew 内で発生)
   */
  createNewInvitation(email: string): AdminInvitation {
    return AdminInvitation.createNew(email);
  }

  /**
   * 検証用の招待リンクを構築する
   * @param invitation AdminInvitation オブジェクト
   * @param frontendOrigin フロントエンドのOrigin (例: "https://your-app.com")
   * @returns 検証用リンク (例: "https://your-app.com/admin/signup/setup?token=...")
   * @throws {DomainError<ErrorType.CONFIGURATION_ERROR>} frontendOrigin が指定されていない場合
   * @throws {DomainError<ErrorType.INVALID_PARAMETER>} frontendOrigin の形式が無効な場合
   */
  buildVerificationLink(invitation: AdminInvitation, frontendOrigin: string | null | undefined): string {
    // frontendOrigin が null や undefined, 空文字でないことを確認
    if (!frontendOrigin) {
      throw new DomainError(ErrorType.CONFIGURATION_ERROR, '招待リンクの生成に必要なフロントエンドURLが指定されていません。', {
        configMissing: 'frontendOrigin',
      });
    }

    try {
      // URLオブジェクトを使って安全に組み立てる
      // パス部分は Next.js のルーティングに合わせてください
      const verificationPath = '/admin/signup/setup';
      const url = new URL(verificationPath, frontendOrigin); // ベースURLとパスを結合

      // クエリパラメータにトークンを追加
      url.searchParams.set('token', invitation.invitationToken);

      return url.toString();
    } catch (error) {
      // new URL() が失敗した場合 (frontendOrigin が不正な形式など)
      console.error(`Invalid frontendOrigin provided: ${frontendOrigin}`, error);
      throw new DomainError(ErrorType.INVALID_PARAMETER, '提供されたフロントエンドURLの形式が無効です。', {
        frontendOrigin,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
