import { CreateAdminInvitationUseCase } from '../../../../application/port/in/create-admin-invitation-use-case';
import { DomainError, ErrorType } from '../../../../common/errors/domain-error';
import { EnvConfig } from '../../../../common/env-config';
import { Context } from 'hono';
import { AppContext } from '../../../../types/app-context';

/**
 * 受信アダプター は 受信ポート(ユースケースインターフェイス) を使用します。
 * Cloudflare Workers環境で動作するように設計
 */
export class AdminInvitationsController {
  constructor(
    public readonly createAdminInvitationUseCase: CreateAdminInvitationUseCase,
    public readonly envConfig: EnvConfig,
  ) {}

  /**
   * 管理者招待を作成するハンドラーメソッド
   * インスタンスメソッド
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
        },
      },
      201,
    );
  }
}
