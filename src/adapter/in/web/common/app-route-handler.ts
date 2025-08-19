import type { RouteConfig, RouteHandler } from '@hono/zod-openapi';

// https://www.speakeasy.com/openapi/frameworks/hono を参考にして書きました。
// The handlers are made type safe by the route types. The request and response data in the
// Hono context object is type checked using the schema defined in the routes. If you use
// an incorrect type, for example setting age: to 42, you’ll get a type error.
export type AppRouteHandler<R extends RouteConfig> = RouteHandler<R>;
