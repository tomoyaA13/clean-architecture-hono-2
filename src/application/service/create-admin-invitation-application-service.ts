import {
  CreateAdminInvitationCommand,
  CreateAdminInvitationResult,
  CreateAdminInvitationUseCase,
} from '../port/in/create-admin-invitation-use-case';
import { LoadAdminInvitationPort } from '../port/out/load-admin-invitation-port';
import { SaveAdminInvitationPort } from '../port/out/save-admin-invitation-port';
import { SendEmailPort } from '../port/out/send-email-port';
import { DomainError, ErrorType } from '../../common/errors/domain-error';
import { AdminInvitation } from '../domain/model/admin-invitation';
import { AdminInvitationDomainService } from '../domain/service/create-admin-invitation-application-service';

/**
 * アプリケーションサービス は 受信ポート(ユースケースインターフェース) を実装します。
 * そして、ドメインサービスを利用します。
 */
export class CreateAdminInvitationApplicationService implements CreateAdminInvitationUseCase {
  constructor(
    private readonly adminInvitationDomainService: AdminInvitationDomainService,
    private readonly loadAdminInvitationPort: LoadAdminInvitationPort,
    private readonly saveAdminInvitationPort: SaveAdminInvitationPort,
    private readonly sendEmailPort: SendEmailPort,
  ) {}

  /**
   * 管理者招待を作成し、招待メールを送信します。
   * 既存の有効な招待がある場合は、必要に応じて有効期限を延長します。
   * @param command 招待作成コマンド (メールアドレス、フロントエンドOrigin)
   * @returns 招待情報、メール送信成否、検証リンク
   * @throws {DomainError<ErrorType.INVALID_PARAMETER>} メールアドレス形式が無効、またはフロントエンドURL形式が無効な場合
   * @throws {DomainError<ErrorType.RESOURCE_ALREADY_EXISTS>} メールアドレスが既に存在する (DB保存時など) 場合 (save ポートからスローされる可能性)
   * @throws {DomainError<ErrorType.REPOSITORY_ERROR>} 招待情報の検索または保存に失敗した場合
   * @throws {DomainError<ErrorType.EXTERNAL_SERVICE_ERROR>} メール送信に失敗した場合
   * @throws {DomainError<ErrorType.CONFIGURATION_ERROR>} フロントエンドURLが設定されていない場合
   * @throws {DomainError<ErrorType.UNKNOWN_ERROR>} その他の予期せぬエラーが発生した場合
   * @throws {DomainError<ErrorType.BUSINESS_RULE_VIOLATION>} (もしドメインロジックで発生する場合)
   */
  async createInvitation(command: CreateAdminInvitationCommand): Promise<CreateAdminInvitationResult> {
    try {
      const { email, frontendOrigin } = command;

      // 1. 既存の招待の検索
      let invitation = await this.findExistingInvitation(email);

      // 2. 招待の作成または更新
      if (invitation) {
        // extendInvitationIfNeeded は、渡された invitation オブジェクトの内部状態を直接変更する可能性があります。
        // しかし、この変更は `createInvitation` という単一ユースケースのスコープ内で、
        // フローの一部として意図的かつ明示的に行われるため、制御されたローカルな操作です。
        // したがって、これは異なるコンテキスト間で予期せぬ副作用を引き起こす
        // 「アクションアットアディスタンス」アンチパターンには該当しません。
        // (リポジトリ境界で新しいインスタンスを返す等の配慮は、主に後者を防ぐためのものです)
        // 結果は同じオブジェクト参照ですが、状態が変更されている可能性があります
        invitation = this.adminInvitationDomainService.extendInvitationIfNeeded(invitation);
      } else {
        invitation = this.adminInvitationDomainService.createNewInvitation(email);
      }

      // 3. 保存処理
      invitation = await this.saveAdminInvitationPort.save(invitation);

      // 4. 検証用リンクの生成 (変更: frontendOrigin を渡す)
      const verificationLink = this.adminInvitationDomainService.buildVerificationLink(invitation, frontendOrigin);

      // 5. メール送信
      const emailResult = await this.sendInvitationEmail(invitation, verificationLink);

      return {
        invitation,
        emailSent: emailResult.status === 'success',
        verificationLink: verificationLink, // 結果に追加
      };
    } catch (error) {
      // エラーハンドリング（ドメインエラーはそのまま再スロー、その他はラップ）
      if (error instanceof DomainError) {
        throw error;
      }

      console.error('Unexpected error in CreateAdminInvitationApplicationService:', error); // 予期せぬエラーはログに詳細を残す
      throw new DomainError(ErrorType.UNKNOWN_ERROR, '招待の作成中に予期せぬエラーが発生しました', {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 既存の招待を検索する
   * private メソッド: このメソッドはクラス内部の実装詳細であり、
   * インターフェースには露出していません。createInvitation ユースケース
   * 実装の一部として責任を分割するために使用されています。
   * @param email メールアドレス
   * @returns 既存の招待または null
   * @throws {DomainError<ErrorType.REPOSITORY_ERROR>} 招待情報の検索に失敗した場合
   */
  private async findExistingInvitation(email: string): Promise<AdminInvitation | null> {
    try {
      return await this.loadAdminInvitationPort.findPendingByEmail(email);
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }
      console.error('Error finding existing invitation:', error);
      throw new DomainError(ErrorType.REPOSITORY_ERROR, '既存の招待情報の検索に失敗しました', {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 招待メールを送信する
   * private メソッド: このメソッドはクラス内部の実装詳細であり、
   * インターフェースには露出していません。createInvitation ユースケース
   * 実装の一部として責任を分割するために使用されています。
   * @param invitation 招待オブジェクト
   * @param verificationLink 検証用リンク
   * @returns メール送信結果
   * @throws {DomainError<ErrorType.EXTERNAL_SERVICE_ERROR>} メール送信に失敗した場合、またはメール送信処理中に予期せぬエラーが発生した場合
   */
  private async sendInvitationEmail(
    invitation: AdminInvitation,
    verificationLink: string,
  ): Promise<{ status: 'success' | 'error'; message?: string }> {
    try {
      const emailResult = await this.sendEmailPort.sendEmail({
        email: invitation.email,
        subject: '管理者登録のご案内',
        initialSentence: '管理者アカウントへの招待が届きました。',
        secondSentenceEnding: `以下のリンクをクリックして登録を完了してください。このリンクは ${invitation.expiresAt.toLocaleString()} まで有効です。`,
        constructedLink: verificationLink,
      });

      if (emailResult.status === 'error') {
        // メール送信失敗は DomainError とする
        throw new DomainError(ErrorType.EXTERNAL_SERVICE_ERROR, emailResult.message || 'メール送信に失敗しました', {
          email: invitation.email,
        });
      }

      return emailResult;
    } catch (error) {
      if (error instanceof DomainError) {
        throw error; // すでに DomainError ならそのままスロー
      }
      console.error('Error sending invitation email:', error);
      // それ以外のエラーは EXTERNAL_SERVICE_ERROR としてラップ
      throw new DomainError(ErrorType.EXTERNAL_SERVICE_ERROR, 'メール送信処理中にエラーが発生しました', {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
