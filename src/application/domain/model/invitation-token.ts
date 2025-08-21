import { BaseValueObject } from './base/base-value-object';

/**
 * 招待トークンを表す値オブジェクト
 */
export class InvitationToken extends BaseValueObject<'InvitationToken', string> {
  /**
   * トークンの妥当性を検証
   * @param value 検証するトークン文字列
   * @returns 有効な場合はtrue
   */
  protected isValid(value: string): boolean {
    return !!value && value.trim().length > 0;
  }

  /**
   * 新しい招待トークンを生成するファクトリーメソッド
   * @returns InvitationToken値オブジェクト
   */
  static generate(): InvitationToken {
    const token = crypto.randomUUID();
    return new InvitationToken(token);
  }

  /**
   * 既存の招待トークンから値オブジェクトを生成するファクトリーメソッド
   * @param token トークン文字列
   * @returns InvitationToken値オブジェクト
   */
  static create(token: string): InvitationToken {
    return new InvitationToken(token);
  }
}
