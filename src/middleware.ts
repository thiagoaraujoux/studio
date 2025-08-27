
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session');

  // Se não houver sessão e o usuário tentar acessar qualquer página exceto /login, redirecione para /login
  if (!session && request.nextUrl.pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Se houver uma sessão e o usuário tentar acessar /login, redirecione para a página inicial
  if (session && request.nextUrl.pathname === '/login') {
     return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
