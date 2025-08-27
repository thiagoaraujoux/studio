
import admin from 'firebase-admin';

// O projectId é codificado diretamente para garantir que o Admin SDK
// valide os tokens para o projeto correto ("vitalize-companion"), resolvendo
// o erro de 'incorrect "aud" (audience) claim'.
const projectId = "vitalize-companion";

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      projectId: projectId,
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export const authAdmin = admin.auth();
