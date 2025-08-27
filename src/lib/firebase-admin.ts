
import admin from 'firebase-admin';

// Garante que a variável de ambiente seja lida.
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    // Especifica explicitamente qual projeto do Firebase o SDK Admin deve usar.
    // Isso resolve o erro "incorrect aud claim".
    projectId: projectId,
  });
}

export const authAdmin = admin.auth();
