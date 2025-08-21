import { DomainError, ErrorType } from '../../../../common/errors/domain-error';

// このコードは
// https://pote-chil.com/posts/typescript-value-object
// https://typescriptbook.jp/reference/values-types-variables/structural-subtyping#%E3%83%96%E3%83%A9%E3%83%B3%E3%83%89%E5%9E%8B
// を参考にしています

// これは「型安全のための識別子」を作る特別な宣言です
// 実際の実行時コードには含まれず、TypeScriptの型システムの中だけで機能します
// `declare`：このコードは型情報のみを宣言し、JavaScript出力には含まれないという指示です
// `unique symbol`：TypeScript特有の型で、それぞれが互いに異なるシンボル値であることが保証されています
// 「シンボル値」とは：JavaScriptのプリミティブ型の一種で、必ず一意で、他のいかなるシンボルとも等しくなりません
// これは主にオブジェクトのプロパティキーとして使われ、名前の衝突を防ぎます
// この仕組みにより、同じ基本型(例:string)を持つ異なる値オブジェクト(例:EmailとUserId)を
// 型システム上で区別できるようになります

declare const brand: unique symbol;

/**
 * 値オブジェクトの基本となるクラス
 *
 * 値オブジェクトとは：同じ値を持つものは同じものとみなす、変更できないオブジェクトのこと
 * 例：メールアドレス、電話番号、ユーザーIDなど
 *
 * @template T - この値オブジェクトの名前を表す文字列（例：'Email', 'UserId'）
 * @template K - この値オブジェクトが内部に持つ実際の値の型（例：string, number）
 */
export abstract class BaseValueObject<T extends string, K> {
  // これは「型の区別」だけのためのプロパティです
  // https://typescriptbook.jp/reference/values-types-variables/structural-subtyping#%E3%83%96%E3%83%A9%E3%83%B3%E3%83%89%E5%9E%8B
  // 実際のデータとしては何も持ちませんが、TypeScriptの型チェックで
  // 「同じ値でも違う種類の値オブジェクト」を区別するために使います
  // 例：UserId型とProductId型が両方string型の値を持っていても、区別できる
  readonly _brand!: T;

  // これが値オブジェクトの実際の中身です（例：メールアドレスの文字列）
  // readonlyなので、一度作ったら変更できません
  readonly value: K;

  /**
   * 値オブジェクトのコンストラクタ
   * @param value 値
   * @throws {DomainError} 値が無効な場合
   */
  constructor(value: K) {
    if (!this.isValid(value)) {
      throw this.getValidationError(value);
    }
    this.value = value;
  }

  /**
   * 2つの値オブジェクトが同じかどうかを比較するメソッド
   *
   * @param other - 比較したい相手の値オブジェクト
   * @returns - 同じ値を持っていれば true、違う値なら false
   */
  equals(other: BaseValueObject<T, K>): boolean {
    // 完全に同じオブジェクト参照の場合、または
    // 値同士を比較して同じ場合は true を返す
    return this === other || this.compareValues(this.value, other.value);
  }

  /**
   * この値オブジェクトを文字列に変換するメソッド
   * 例：console.log()で表示するときに使われます
   *
   * @returns - この値オブジェクトの文字列表現
   */
  toString(): string {
    return String(this.value);
  }

  /**
   * 値が正しいかどうかをチェックするメソッド
   * このメソッドは子クラスで必ず実装する必要があります
   *
   * 例：EmailクラスならメールアドレスとしてOKかチェック
   * 例：Ageクラスなら年齢として妥当かチェック
   *
   * @param value - チェックする値
   * @returns - 値が正しければ true、おかしければ false
   */
  protected abstract isValid(value: K): boolean;

  /**
   * バリデーションエラーのカスタマイズ（子クラスでオーバーライド可能）
   * @param value 無効な値
   * @returns DomainError
   */
  protected getValidationError(value: K): DomainError {
    return new DomainError(ErrorType.INVALID_PARAMETER, '値オブジェクトの値が無効です', { value, valueObjectType: this.constructor.name });
  }

  /**
   * 2つの値を比較する方法を定義するメソッド
   * 必要に応じて子クラスでカスタマイズできます
   *
   * デフォルトでは「===」で比較しますが、複雑なオブジェクトの場合に
   * 子クラスでこのメソッドを上書きして比較方法を変えられます
   *
   * @param a - 比較する値1
   * @param b - 比較する値2
   * @returns - 2つの値が等しいと判断できれば true
   */
  protected compareValues(a: K, b: K): boolean {
    return a === b;
  }
}
