import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const PROTECTED_PATHS = ['/admin/dashboard', '/admin/products', '/admin/subscribers'];
const COOKIE_NAME = 'admin_session';

function getSecret(): Uint8Array {
  return new TextEncoder().encode(process.env.JWT_SECRET!);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protege todas as rotas /admin/* exceto /admin (login)
  const isProtected =
    pathname.startsWith('/admin/') ||
    PROTECTED_PATHS.some((p) => pathname === p);

  if (!isProtected) return NextResponse.next();

  const sessionCookie = request.cookies.get(COOKIE_NAME);

  if (!sessionCookie?.value) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  try {
    await jwtVerify(sessionCookie.value, getSecret());
    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL('/admin', request.url));
    response.cookies.delete(COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: ['/admin/:path+'],
};
