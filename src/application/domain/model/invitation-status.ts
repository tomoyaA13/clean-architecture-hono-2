import { BaseValueObject } from './base/base-value-object';

/**
 * 招待ステータスの有効な値のリスト
 */
export const INVITATION_STATUSES = ['pending', 'accepted', 'expired'] as const;

/**
 * 招待ステータスの型定義
 */
export type InvitationStatusValue = (typeof INVITATION_STATUSES)[number];

/**
 * 招待ステータスを表す値オブジェクト
 */
export class InvitationStatus extends BaseValueObject<'InvitationStatus', InvitationStatusValue> {
  /**
   * ステータスの妥当性を検証
   * @param value 検証するステータス文字列
   * @returns 有効な場合はtrue
   */
  protected isValid(value: string): boolean {
    return INVITATION_STATUSES.includes(value as InvitationStatusValue);
  }

  /**
   * 「保留中」ステータスの値オブジェクトを生成
   * @returns InvitationStatus値オブジェクト
   */
  static pending(): InvitationStatus {
    return new InvitationStatus('pending');
  }

  /**
   * 「承認済み」ステータスの値オブジェクトを生成
   * @returns InvitationStatus値オブジェクト
   */
  static accepted(): InvitationStatus {
    return new InvitationStatus('accepted');
  }

  /**
   * 「期限切れ」ステータスの値オブジェクトを生成
   * @returns InvitationStatus値オブジェクト
   */
  static expired(): InvitationStatus {
    return new InvitationStatus('expired');
  }

  /**
   * 指定されたステータス文字列から値オブジェクトを生成
   * @param status ステータス文字列
   * @returns InvitationStatus値オブジェクト
   */
  static create(status: InvitationStatusValue): InvitationStatus {
    return new InvitationStatus(status);
  }

  /**
   * 保留中ステータスかどうかを判定
   * @returns 保留中の場合はtrue
   */
  isPending(): boolean {
    return this.value === 'pending';
  }

  /**
   * 承認済みステータスかどうかを判定
   * @returns 承認済みの場合はtrue
   */
  isAccepted(): boolean {
    return this.value === 'accepted';
  }

  /**
   * 期限切れステータスかどうかを判定
   * @returns 期限切れの場合はtrue
   */
  isExpired(): boolean {
    return this.value === 'expired';
  }
}
