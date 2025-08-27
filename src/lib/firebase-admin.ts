
import admin from 'firebase-admin';
import { initializeApp, getApps, App } from 'firebase-admin/app';

// Quando o código é executado em um ambiente Google Cloud (como o App Hosting),
// as credenciais são encontradas automaticamente.
// Para desenvolvimento local, a variável de ambiente GOOGLE_APPLICATION_CREDENTIALS
// deve apontar para o seu arquivo de chave de conta de serviço.
// Este método de inicialização é o mais robusto e recomendado.

let app: App;

if (!getApps().length) {
  try {
    app = initializeApp({
      // Deixar em branco para usar as Credenciais Padrão da Aplicação (ADC)
      // O SDK encontrará o projectId a partir das credenciais.
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
    // Em caso de falha, podemos tentar uma inicialização mais explícita como fallback
    // para ambientes onde a ADC pode não estar configurada.
    try {
        app = initializeApp({
            projectId: 'vitalize-companion',
        });
    } catch (fallbackError) {
        console.error('Firebase admin fallback initialization error', fallbackError);
    }
  }
} else {
  app = getApps()[0];
}

export const authAdmin = admin.auth();
export const dbAdmin = admin.firestore();
