// src/common/env-config.ts
import { Context } from 'hono';
import { Bindings, EnvSchema } from '../types/bindings';

export class EnvConfig {
  private readonly validatedEnv: Record<string, any>;
  private readonly rawEnv: Bindings;

  constructor(env: Bindings) {
    this.rawEnv = env;
    
    // 環境変数を検証
    const parseResult = EnvSchema.safeParse({
      NODE_ENV: env.NODE_ENV,
      PORT_NUMBER: env.PORT_NUMBER ? parseInt(env.PORT_NUMBER) : undefined,
      POSTGRES_PRISMA_URL: env.POSTGRES_PRISMA_URL,
      POSTGRES_URL_NON_POOLING: env.POSTGRES_URL_NON_POOLING,
      USE_MOCK_DB: env.USE_MOCK_DB,
      RESEND_API_KEY: env.RESEND_API_KEY,
      EMAIL_FROM_ADDRESS: env.EMAIL_FROM_ADDRESS,
      EMAIL_REPLY_TO: env.EMAIL_REPLY_TO,
      USE_MOCK_EMAIL: env.USE_MOCK_EMAIL,
      FRONTEND_URL: env.FRONTEND_URL,
      CF_ACCOUNT_ID: env.CF_ACCOUNT_ID,
      CF_ZONE_ID: env.CF_ZONE_ID,
    });

    if (!parseResult.success) {
      console.error('❌ 環境変数が無効です:');
      console.error(JSON.stringify(parseResult.error.format(), null, 2));
      throw new Error('環境変数の検証に失敗しました');
    }

    this.validatedEnv = parseResult.data;
    
    // 本番環境での追加検証
    this.validateProduction();
  }

  private validateProduction(): void {
    if (this.validatedEnv.NODE_ENV === 'production') {
      // 本番環境でRESEND_API_KEYが必須（モックメールを使わない場合）
      if (!this.validatedEnv.USE_MOCK_EMAIL && !this.validatedEnv.RESEND_API_KEY) {
        throw new Error('本番環境でUSE_MOCK_EMAIL=falseの場合、RESEND_API_KEYは必須です');
      }

      // 本番環境ではデータベース接続情報が必須（モックDBを使わない場合）
      if (!this.validatedEnv.USE_MOCK_DB && !this.validatedEnv.POSTGRES_PRISMA_URL) {
        throw new Error('本番環境でUSE_MOCK_DB=falseの場合、POSTGRES_PRISMA_URLは必須です');
      }
    }
  }

  // ゲッターメソッド
  get config() {
    return {
      env: {
        nodeEnv: this.validatedEnv.NODE_ENV,
        isProduction: this.validatedEnv.NODE_ENV === 'production',
        isTest: this.validatedEnv.NODE_ENV === 'test',
        isDevelopment: this.validatedEnv.NODE_ENV === 'development',
      },
      app: {
        port: this.validatedEnv.PORT_NUMBER,
      },
      email: {
        apiKey: this.validatedEnv.RESEND_API_KEY,
        fromAddress: this.validatedEnv.EMAIL_FROM_ADDRESS,
        defaultReplyTo: this.validatedEnv.EMAIL_REPLY_TO,
        useMock: this.validatedEnv.USE_MOCK_EMAIL || this.validatedEnv.NODE_ENV === 'test',
        frontEndUrl: this.validatedEnv.FRONTEND_URL,
      },
      database: {
        url: this.validatedEnv.POSTGRES_PRISMA_URL,
        urlNonPooling: this.validatedEnv.POSTGRES_URL_NON_POOLING,
        useMock: this.validatedEnv.USE_MOCK_DB || false,
      },
      cloudflare: {
        accountId: this.validatedEnv.CF_ACCOUNT_ID,
        zoneId: this.validatedEnv.CF_ZONE_ID,
      },
    };
  }

  // 生の環境変数にアクセスする必要がある場合
  get raw(): Bindings {
    return this.rawEnv;
  }
}

// ヘルパー関数：Contextから環境設定を取得
export function getEnvConfig(c: Context<{ Bindings: Bindings }>): EnvConfig {
  return new EnvConfig(c.env);
}
