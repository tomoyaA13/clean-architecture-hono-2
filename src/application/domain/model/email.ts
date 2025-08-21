import { BaseValueObject } from './base/base-value-object';
import { DomainError, ErrorType } from '../../../common/errors/domain-error';

/**
 * メールアドレスを表す値オブジェクト
 */
export class Email extends BaseValueObject<'Email', string> {
  /**
   * 指定された文字列がメールアドレスとして有効かどうかを検証
   * @param value 検証するメールアドレス文字列
   * @returns 有効な場合はtrue、無効な場合はfalse
   */
  protected isValid(value: string): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }

    // メールアドレスの最大長チェック（RFC 5321による制限）
    if (value.length > 254) {
      return false;
    }

    // 基本的なメールアドレスのフォーマット検証
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(value);
  }

  /**
   * 値がメールアドレスとして無効な場合、より詳細なエラーメッセージをカスタマイズ
   * BaseValueObjectのコンストラクタから呼び出される
   */
  protected getValidationError(value: string): DomainError {
    if (!value || typeof value !== 'string') {
      return new DomainError(ErrorType.INVALID_PARAMETER, 'メールアドレスは必須です', { value });
    }

    if (value.length > 254) {
      return new DomainError(ErrorType.INVALID_PARAMETER, 'メールアドレスが長すぎます', { value, length: value.length });
    }

    return new DomainError(ErrorType.INVALID_PARAMETER, '無効なメールアドレス形式です', { value });
  }

  /**
   * メールアドレスの比較（大文字小文字を区別しない）
   * @param a 比較対象メールアドレス1
   * @param b 比較対象メールアドレス2
   * @returns 等価の場合はtrue
   */
  protected compareValues(a: string, b: string): boolean {
    return a.toLowerCase() === b.toLowerCase();
  }

  /**
   * メールアドレスの生成ファクトリーメソッド
   * @param email メールアドレス文字列
   * @returns Email値オブジェクト
   */
  static create(email: string): Email {
    return new Email(email);
  }
}
