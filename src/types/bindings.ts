// src/types/bindings.ts
import { z } from 'zod';

// Cloudflare Workersの環境変数バインディング
export type Bindings = {
  // アプリ全般の設定
  NODE_ENV: string;
  PORT_NUMBER: string;

  // データベース設定（Supabase）
  DATABASE_URL?: string;           // Transaction pooler URL
  DIRECT_DATABASE_URL?: string;    // Direct connection URL  
  USE_MOCK_DB?: string;

  // メール設定
  RESEND_API_KEY?: string;
  EMAIL_FROM_ADDRESS: string;
  EMAIL_REPLY_TO?: string;
  USE_MOCK_EMAIL?: string;
  FRONTEND_URL: string;

  // Cloudflare特有の環境変数
  CF_ACCOUNT_ID?: string;
  CF_ZONE_ID?: string;
  
  // KVやR2などのバインディング（必要に応じて追加）
  // MY_KV_NAMESPACE?: KVNamespace;
  // MY_R2_BUCKET?: R2Bucket;
};

// 環境変数のスキーマ定義（検証用）
export const EnvSchema = z.object({
  // アプリ全般の設定
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT_NUMBER: z.coerce.number().default(3000),

  // Supabase データベース設定
  DATABASE_URL: z.string().url().optional(),
  DIRECT_DATABASE_URL: z.string().url().optional(),
  USE_MOCK_DB: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),

  // メール設定
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM_ADDRESS: z.string().email().default('testing@resend.dev'),
  EMAIL_REPLY_TO: z.string().email().optional(),
  USE_MOCK_EMAIL: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),
  FRONTEND_URL: z.string().url(),

  // Cloudflare特有の環境変数
  CF_ACCOUNT_ID: z.string().optional(),
  CF_ZONE_ID: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;
