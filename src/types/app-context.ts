// src/types/app-context.ts
import { PrismaClient } from '@prisma/client';
import { EnvConfig } from '../common/env-config';
import { Bindings } from './bindings';

/**
 * アプリケーション全体で使用する Variables の型定義
 */
export type AppVariables = {
  envConfig: EnvConfig;
  prisma?: PrismaClient;  // モックDB使用時は undefined の可能性がある
};

/**
 * Hono Context の型定義
 */
export type AppContext = {
  Bindings: Bindings;
  Variables: AppVariables;
};
