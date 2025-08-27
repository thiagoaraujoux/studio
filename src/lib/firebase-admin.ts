
import admin from 'firebase-admin';

const projectId = "vitalize-companion";

if (!admin.apps.length) {
  try {
    // A inicialização simplificada, apenas com o projectId, permite que o SDK 
    // use as Credenciais Padrão da Aplicação (ADC) do ambiente de desenvolvimento.
    // Isso resolve o erro "failed to fetch a valid Google OAuth2 access token" 
    // e também garante que o servidor valide os tokens para o projeto correto ("vitalize-companion").
    admin.initializeApp({
      projectId: projectId,
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export const authAdmin = admin.auth();
