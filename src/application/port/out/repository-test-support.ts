/**
 * この interface は 永続化アダプタ(src/adapter/out/persistence) において実装されます。
 * そして、この interface には 永続化アダプタ(src/adapter/out/persistence) の
 * テストにおいて必要な関数が定義されています。
 *
 * @template T - 消去（クリーンアップ）したい対象を特定するためのフィルタの型。リポジトリ(永続化アダプタ)ごとに最適な型を定義できます。
 *               例: 管理者招待リポジトリでは string[] (メールアドレスの配列) など
 *
 */
export interface RepositoryTestSupport<T = any> {
  /**
   * @param filters - 消去（クリーンアップ）したい対象を特定するための条件。
   *                 例: メールアドレスの配列や、{id: 'xxx'} のようなオブジェクト。
   *                 省略した場合は通常、テスト関連のすべてのデータが対象になります。
   */
  clearTestData(filters?: T): Promise<void>;
}
