
import admin from 'firebase-admin';
import { initializeApp, getApps } from 'firebase-admin/app';

// Quando o código é executado em um ambiente Google Cloud (como o App Hosting),
// as credenciais são encontradas automaticamente.
// Para desenvolvimento local, você deve definir a variável de ambiente
// GOOGLE_APPLICATION_CREDENTIALS para apontar para o seu arquivo de chave de conta de serviço.
// Ex: export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/keyfile.json"

if (!getApps().length) {
  try {
    initializeApp({
      projectId: 'vitalize-companion',
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export const authAdmin = admin.auth();
export const dbAdmin = admin.firestore();
