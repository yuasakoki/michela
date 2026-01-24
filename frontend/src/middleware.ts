import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware（Bearer Token方式では認証チェックは行わない）
 *
 * Bearer TokenはlocalStorageに保存されるため、
 * サーバーサイドのmiddlewareからはアクセスできません。
 *
 * 認証チェックは以下で行われます：
 * - クライアントサイド: page.tsx / useAuth hook
 * - バックエンド: jwt_required デコレータ（401を返す）
 */
export function middleware(_request: NextRequest) {
    // Bearer Token方式ではmiddlewareでの認証チェックは不要
    // すべてのリクエストを通過させる
    return NextResponse.next();
}

export const config = {
    // 必要に応じてマッチャーを設定（現在は何もマッチしない）
    matcher: [],
};
