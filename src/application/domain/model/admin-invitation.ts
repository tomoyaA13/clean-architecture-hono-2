import { AdminInvitationId } from './admin-invitation-id';
import { Email } from './email';
import { InvitationToken } from './invitation-token';
import { InvitationStatus, InvitationStatusValue } from './invitation-status';
import { DomainError, ErrorType } from '../../../common/errors/domain-error';

/**
 * 管理者招待エンティティ
 * エンティティは id が必要であり、mutable(変更可能)です。
 */
export class AdminInvitation {
  /**
   * privateコンストラクタを使用する理由：
   * - オブジェクト生成を静的ファクトリーメソッド（create、createNewなど）に限定し、
   *   クラス外部からの直接インスタンス化を防止します
   * - これにより、すべてのインスタンス生成が適切なバリデーションとビジネスルールを
   *   通過することを保証します
   * - 生成の文脈や目的に応じた適切な初期化を強制できます
   * - ドメイン駆動設計の原則に従い、エンティティの生成プロセスを制御します
   */
  private constructor(
    private _id: AdminInvitationId | null,
    private _email: Email,
    private _invitationToken: InvitationToken,
    private _expiresAt: Date,
    private _status: InvitationStatus,
  ) {
    // 有効期限のバリデーション
    if (!(_expiresAt instanceof Date) || isNaN(_expiresAt.getTime())) {
      throw new DomainError(ErrorType.INVALID_PARAMETER, '有効な有効期限が必要です', { _expiresAt });
    }
  }

  /**
   * AdminInvitationエンティティを生成するファクトリーメソッド
   * @param id 招待ID
   * @param email メールアドレス文字列
   * @param invitationToken 招待トークン文字列
   * @param expiresAt 有効期限
   * @param status ステータス文字列
   * @returns AdminInvitationエンティティ
   */
  public static create(
    id: string | null,
    email: string,
    invitationToken: string,
    expiresAt: Date,
    status: InvitationStatusValue,
  ): AdminInvitation {
    return new AdminInvitation(
      AdminInvitationId.create(id),
      Email.create(email),
      InvitationToken.create(invitationToken),
      expiresAt,
      InvitationStatus.create(status),
    );
  }

  /**
   * 新しい管理者招待を作成するファクトリーメソッド
   */
  public static createNew(email: string): AdminInvitation {
    const now = new Date();
    // 24時間分のミリ秒を加算
    const twentyFourHoursInMs = 24 * 60 * 60 * 1000;
    const expiresAt = new Date(now.getTime() + twentyFourHoursInMs);
    return new AdminInvitation(null, Email.create(email), InvitationToken.generate(), expiresAt, InvitationStatus.pending());
  }

  /**
   * 招待IDのゲッター
   */
  public get id(): string | null {
    return this._id?.value ?? null;
  }

  /**
   * メールアドレスのゲッター
   */
  public get email(): string {
    return this._email.value;
  }

  /**
   * 招待トークンのゲッター
   */
  public get invitationToken(): string {
    return this._invitationToken.value;
  }

  /**
   * 有効期限のゲッター
   */
  public get expiresAt(): Date {
    return new Date(this._expiresAt.getTime());
  }

  /**
   * ステータスのゲッター
   */
  public get status(): InvitationStatusValue {
    return this._status.value;
  }

  /**
   * 招待が期限切れかどうかを判定
   */
  public isExpired(): boolean {
    return new Date() > this._expiresAt;
  }

  /**
   * 招待が有効かどうかを判定
   */
  public isValid(): boolean {
    return this._status.isPending() && !this.isExpired();
  }

  /**
   * 有効期限までの残り時間（時間単位）を取得
   */
  public getRemainingHours(): number {
    const now = new Date();
    return (this._expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
  }

  /**
   * 有効期限を延長すべきかどうかを判定
   */
  public shouldExtendExpiration(): boolean {
    return this.getRemainingHours() < 2;
  }

  /**
   * 有効期限を延長する
   * @param hours 延長する時間（時間単位）
   * @returns 自分自身（状態が更新されたオブジェクト）
   *
   * 注: このメソッドは元のオブジェクトの状態を直接変更します
   */
  public extendExpiration(hours: number): AdminInvitation {
    if (hours <= 0) {
      throw new DomainError(ErrorType.INVALID_PARAMETER, '延長時間は正の数である必要があります', { hours });
    }

    // 現在時刻のミリ秒
    const now = new Date();
    // 指定時間のミリ秒換算
    const hoursInMilliseconds = hours * 60 * 60 * 1000;
    // ミリ秒で新しい期限を計算し、内部状態を直接変更
    this._expiresAt = new Date(now.getTime() + hoursInMilliseconds);

    // AdminInvitation Entity は mutable なので、元のオブジェクトを return します。
    return this;
  }

  /**
   * ステータスを「承認済み」に変更する
   * @returns 自分自身（メソッドチェーン用）
   */
  public accept(): AdminInvitation {
    this._status = InvitationStatus.accepted();
    return this;
  }

  /**
   * ステータスを「期限切れ」に変更する
   * @returns 自分自身（メソッドチェーン用）
   */
  public expire(): AdminInvitation {
    this._status = InvitationStatus.expired();
    return this;
  }
}
