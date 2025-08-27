
import admin from 'firebase-admin';

// O projectId é codificado diretamente para garantir que o Admin SDK
// valide os tokens para o projeto correto ("vitalize-companion"), resolvendo
// o erro de 'incorrect "aud" (audience) claim'.
const projectId = "vitalize-companion";

if (!admin.apps.length) {
  try {
    // Inicializa o app com o projectId explícito para garantir a correspondência da audiência.
    admin.initializeApp({
      projectId: projectId,
    });
    console.log("Firebase Admin SDK inicializado para o projeto:", projectId);
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
} else {
  console.log("Firebase Admin SDK já inicializado.");
}


export const authAdmin = admin.auth();
