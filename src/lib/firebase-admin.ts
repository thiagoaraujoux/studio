
import admin from 'firebase-admin';

// Garante que a variável de ambiente seja lida.
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (!admin.apps.length) {
  admin.initializeApp({
    // A inicialização padrão pode não pegar o projeto correto em alguns ambientes.
    // Fornecer a credencial e o ID do projeto explicitamente garante a conexão correta.
    credential: admin.credential.applicationDefault(),
    projectId: projectId,
  });
}

export const authAdmin = admin.auth();
