
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session');

  const { pathname } = request.nextUrl;

  // Rotas públicas que não exigem autenticação
  const publicPaths = ['/login', '/quiz'];

  // Se não houver sessão e o usuário tentar acessar uma página protegida
  if (!session && !publicPaths.includes(pathname) && pathname !== '/') {
    return NextResponse.redirect(new URL('/quiz', request.url));
  }

  // Se houver uma sessão e o usuário tentar acessar /login ou /quiz, redirecione para o dashboard
  if (session && publicPaths.includes(pathname)) {
     return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Se o usuário estiver na raiz, redirecione para o quiz (se não logado) ou dashboard (se logado)
  if (pathname === '/') {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/quiz', request.url));
    }
  }


  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
