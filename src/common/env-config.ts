import { z } from 'zod';

// 環境変数のスキーマ定義
const EnvSchema = z
  .object({
    // アプリ全般の設定
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT_NUMBER: z.coerce.number().default(3000),

    // データベース設定
    POSTGRES_PRISMA_URL: z.url().optional(),
    POSTGRES_URL_NON_POOLING: z.url().optional(),
    USE_MOCK_DB: z
      .enum(['true', 'false'])
      .optional()
      .transform((val) => val === 'true'),

    // メール設定
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM_ADDRESS: z.email().default('testing@resend.dev'),
    EMAIL_REPLY_TO: z.email().optional(),
    USE_MOCK_EMAIL: z
      .enum(['true', 'false'])
      .optional()
      .transform((val) => val === 'true'),
    FRONTEND_URL: z.url(),

    // Vercel関連設定（以下はVercelプラットフォームによって自動的に設定される環境変数）
    VERCEL_ENV: z.enum(['production', 'preview', 'development']).optional(),
    VERCEL_PROJECT_PRODUCTION_URL: z.string().optional(),
    VERCEL_BRANCH_URL: z.string().optional(),
    VERCEL_URL: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // 本番環境での追加検証
    if (data.NODE_ENV === 'production') {
      // 本番環境でRESEND_API_KEYが必須（モックメールを使わない場合）
      if (!data.USE_MOCK_EMAIL && !data.RESEND_API_KEY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['RESEND_API_KEY'],
          message: '本番環境でUSE_MOCK_EMAIL=falseの場合、RESEND_API_KEYは必須です',
        });
      }

      // 本番環境ではデータベース接続情報が必須（モックDBを使わない場合）
      if (!data.USE_MOCK_DB && !data.POSTGRES_PRISMA_URL) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['POSTGRES_PRISMA_URL'],
          message: '本番環境でUSE_MOCK_DB=falseの場合、POSTGRES_PRISMA_URLは必須です',
        });
      }
    }
  });

// 環境変数の型を定義
export type Env = z.infer<typeof EnvSchema>;

// 環境変数を検証
const parseResult = EnvSchema.safeParse(process.env);

// 検証に失敗した場合はエラーを表示して終了
if (!parseResult.success) {
  console.error('❌ 環境変数が無効です:');
  console.error(JSON.stringify(parseResult.error.format(), null, 2));
  process.exit(1);
}

// 検証済み環境変数
export const env = parseResult.data;

// アプリケーション設定を構築
export const envConfig = {
  env: {
    nodeEnv: env.NODE_ENV,
    isProduction: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test',
    isDevelopment: env.NODE_ENV === 'development',
  },
  app: {
    port: env.PORT_NUMBER,
  },
  email: {
    apiKey: env.RESEND_API_KEY,
    fromAddress: env.EMAIL_FROM_ADDRESS,
    defaultReplyTo: env.EMAIL_REPLY_TO,
    useMock: env.USE_MOCK_EMAIL || env.NODE_ENV === 'test',
    frontEndUrl: env?.FRONTEND_URL,
  },
  database: {
    url: env.POSTGRES_PRISMA_URL,
    urlNonPooling: env.POSTGRES_URL_NON_POOLING,
    useMock: env.USE_MOCK_DB || false,
  },
  vercel: {
    env: env.VERCEL_ENV,
    projectProductionUrl: env.VERCEL_PROJECT_PRODUCTION_URL,
    branchUrl: env.VERCEL_BRANCH_URL,
    url: env.VERCEL_URL,
  },
};
