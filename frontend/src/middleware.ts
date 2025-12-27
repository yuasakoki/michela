import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 保護されたルート（ログインが必要なページ）
const protectedRoutes = ['/dashboard', '/customer'];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 保護されたルートかチェック
    const isProtectedRoute = protectedRoutes.some(route =>
        pathname.startsWith(route)
    );

    if (isProtectedRoute) {
        // クッキーまたはヘッダーから認証トークンを確認
        const token = request.cookies.get('michela_auth_token');

        if (!token) {
            // 未ログインの場合、ログインページにリダイレクト
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/customer/:path*'],
};
