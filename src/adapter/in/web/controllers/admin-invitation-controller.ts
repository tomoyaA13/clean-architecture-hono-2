import { Context } from 'hono';
import { CreateAdminInvitationUseCase } from '../../../../application/port/in/create-admin-invitation-use-case';
import { DomainError, ErrorType } from '../../../../common/errors/domain-error';
import { EnvConfig } from '../../../../common/env-config';
import { AppContext } from '../../../../types/app-context';

/**
 * 受信アダプター は 受信ポート(ユースケースインターフェイス) を使用します。
 * Cloudflare Workers環境で動作するように設計
 */
export class AdminInvitationsController {
  constructor(
    private readonly createAdminInvitationUseCase: CreateAdminInvitationUseCase,
    private readonly envConfig: EnvConfig,
  ) {}

  /**
   * 管理者招待を作成するハンドラー
   */
  async create(c: Context<AppContext>) {
    const { email } = await c.req.json<{ email: string }>();
    const config = this.envConfig.config;

    // 環境設定からフロントエンドURLを取得
    const frontendOrigin = config.email.frontEndUrl;

    if (!frontendOrigin) {
      throw new DomainError(ErrorType.CONFIGURATION_ERROR, '招待リンクの生成に必要なフロントエンドURLが設定されていません。');
    }

    // UseCase に frontendOrigin を渡して招待を作成
    const result = await this.createAdminInvitationUseCase.createInvitation({
      email,
      frontendOrigin: frontendOrigin,
    });

    return c.json(
      {
        data: {
          message: '確認メールを送信しました',
          email: result.invitation.email,
          // デバッグやテスト用にリンクを含めることも可能（本番では不要な場合も）
          ...(config.env.isDevelopment && { verificationLink: result.verificationLink }),
        },
      },
      201,
    );
  }
}
