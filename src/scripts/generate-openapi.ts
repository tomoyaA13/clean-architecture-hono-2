/**
 * OpenAPIドキュメントをYAMLファイルとして生成するスクリプト
 * 
 * 使用方法:
 * 1. npm install js-yaml @types/js-yaml --save-dev
 * 2. npm run generate:openapi
 */

import { writeFileSync } from 'node:fs';
import * as yaml from 'js-yaml';
import { OpenAPIHono } from '@hono/zod-openapi';
import { AppContext } from '../types/app-context';
import adminInvitationsRouter from '../adapter/in/web/routes/admin-invitations';
import configureOpenAPI, { openAPIObjectConfig } from '../adapter/in/web/lib/configure-openapi';

// アプリケーションを初期化
const app = new OpenAPIHono<AppContext>();

// OpenAPIドキュメントの設定
configureOpenAPI(app);

// ルートを登録
app.route('/api/admin-invitations', adminInvitationsRouter);

// OpenAPI 3.1 ドキュメントを生成
const openAPIDocument = app.getOpenAPI31Document(openAPIObjectConfig);

// JSONファイルとして保存
writeFileSync('openapi.json', JSON.stringify(openAPIDocument, null, 2));
console.log('✅ OpenAPIドキュメントをopenapi.jsonとして生成しました');

// YAMLファイルとして保存
const yamlString = yaml.dump(openAPIDocument, {
  indent: 2,
  lineWidth: -1, // 行の折り返しを無効化
  noRefs: true,   // 参照を展開
});
writeFileSync('openapi.yaml', yamlString);
console.log('✅ OpenAPIドキュメントをopenapi.yamlとして生成しました');

// 統計情報を表示
const pathCount = Object.keys(openAPIDocument.paths || {}).length;
const schemaCount = Object.keys(openAPIDocument.components?.schemas || {}).length;

console.log(`
📊 OpenAPIドキュメント統計:
  - パス数: ${pathCount}
  - スキーマ数: ${schemaCount}
  - OpenAPIバージョン: ${openAPIDocument.openapi}
`);
