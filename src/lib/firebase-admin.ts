
import admin from 'firebase-admin';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Importa as credenciais da conta de serviço do arquivo JSON
import serviceAccount from '../../vitalize-companion-firebase-adminsdk.json';

if (!getApps().length) {
  try {
    // Inicializa o SDK do Firebase Admin com as credenciais da conta de serviço
    initializeApp({
      credential: cert(serviceAccount),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export const authAdmin = admin.auth();
