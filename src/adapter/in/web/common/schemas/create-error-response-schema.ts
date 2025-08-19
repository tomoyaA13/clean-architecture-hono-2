import { z } from '@hono/zod-openapi';

// https://www.speakeasy.com/openapi/frameworks/hono を参考にして書きました。
export function createErrorResponseSchema({ exampleCode, exampleMessage }: { exampleMessage: string; exampleCode: string }) {
  return z.object({
    error: z.object({
      message: z.string().openapi({ example: exampleMessage }),
      code: z.string().openapi({ example: exampleCode }),
    }),
  });
}
