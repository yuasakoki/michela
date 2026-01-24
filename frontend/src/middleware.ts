import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/dashboard", "/customer"];
const isDev = process.env.NODE_ENV === "development";

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (isDev) {
        console.log("[Middleware] pathname:", pathname);
    }

    const isProtectedRoute = protectedRoutes.some(route =>
        pathname.startsWith(route)
    );

    if (!isProtectedRoute) {
        return NextResponse.next();
    }

    const token = request.cookies.get("michela_auth_token");

    if (!token) {
        if (isDev) {
            console.log("[Middleware] NO TOKEN → redirect to /");
        }
        return NextResponse.redirect(new URL("/", request.url));
    }

    // JWTの正当性は Flask 側で保証
    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/customer/:path*"],
};
