
import { NextRequest, NextResponse } from 'next/server';
import { authAdmin } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get('Authorization');
    if (authorization?.startsWith('Bearer ')) {
      const idToken = authorization.split('Bearer ')[1];
      const decodedToken = await authAdmin.verifyIdToken(idToken);
      
      if (decodedToken) {
        // Token é válido, crie a sessão
        const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 dias
        const sessionCookie = await authAdmin.createSessionCookie(idToken, { expiresIn });
        const options = {
          name: 'session',
          value: sessionCookie,
          maxAge: expiresIn,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
        };

        const response = NextResponse.json({ status: 'success' }, { status: 200 });
        response.cookies.set(options);
        return response;
      }
    }
    return NextResponse.json({ status: 'unauthorized', message: 'Token de autorização ausente ou inválido.' }, { status: 401 });
  } catch (error) {
    console.error('Session login error:', error);
    return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
    try {
        const response = NextResponse.json({ status: 'success' }, { status: 200 });
        response.cookies.set('session', '', { maxAge: -1 });
        return response;
    } catch (error) {
        console.error('Session logout error:', error);
        return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
    }
}
