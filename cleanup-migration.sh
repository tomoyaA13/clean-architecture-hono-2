#!/bin/bash

# Clean Architecture Option 3への移行クリーンアップスクリプト
# このスクリプトを実行して、古いディレクトリ構造を削除してください

echo "🧹 古いディレクトリ構造をクリーンアップしています..."

# 古い admin-invitations ディレクトリを削除
if [ -d "src/adapter/in/web/routes/admin-invitations" ]; then
    rm -rf src/adapter/in/web/routes/admin-invitations
    echo "✅ src/adapter/in/web/routes/admin-invitations を削除しました"
else
    echo "ℹ️  src/adapter/in/web/routes/admin-invitations は既に削除されています"
fi

# configureOpenAPI.bak ファイルを削除
if [ -f "src/adapter/in/web/lib/configureOpenAPI.bak" ]; then
    rm src/adapter/in/web/lib/configureOpenAPI.bak
    echo "✅ configureOpenAPI.bak を削除しました"
fi

echo ""
echo "🎉 クリーンアップが完了しました！"
echo ""
echo "📁 新しいディレクトリ構造："
echo "   /adapter/in/web/"
echo "     ├── routers/            # ルーター層"
echo "     │   └── admin-invitations.router.ts"
echo "     ├── routes/             # ルート定義層"
echo "     │   └── admin-invitations.routes.ts"
echo "     ├── handlers/           # ハンドラー層"
echo "     │   └── admin-invitations.handlers.ts"
echo "     └── controllers/        # コントローラー層"
echo "         └── admin-invitation-controller.ts"
echo ""
echo "✨ Clean Architecture Option 3への移行が完了しました！"
