// src/application/port/out/repository-test-support.ts
export interface RepositoryTestSupport<T> {
  clear(ids?: T): Promise<void>;
}
