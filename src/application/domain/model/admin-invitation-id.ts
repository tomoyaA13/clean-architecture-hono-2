import { BaseValueObject } from './base/base-value-object';

/**
 * 管理者招待IDを表す値オブジェクト
 */
export class AdminInvitationId extends BaseValueObject<'AdminInvitationId', string> {
  /**
   * IDの妥当性を検証
   * @param value 検証するID文字列
   * @returns 有効な場合はtrue
   */
  protected isValid(value: string): boolean {
    return !!value && value.trim().length > 0;
  }

  /**
   * 管理者招待IDの生成ファクトリーメソッド
   * @param id ID文字列（nullの場合は新規作成を表す）
   * @returns AdminInvitationId値オブジェクトまたはnull
   */
  static create(id: string | null): AdminInvitationId | null {
    return id === null ? null : new AdminInvitationId(id);
  }
}
