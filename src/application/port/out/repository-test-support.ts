export interface RepositoryTestSupport<T> {
  clear(ids?: T): Promise<void>;
}
