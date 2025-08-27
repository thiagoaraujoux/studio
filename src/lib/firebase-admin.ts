
import admin from 'firebase-admin';
import { initializeApp, getApps, App } from 'firebase-admin/app';

let app: App;

// Esta é a forma mais simples e robusta de inicialização.
// Ela confia que o ambiente de execução (seja local ou na nuvem)
// já está configurado com as credenciais necessárias.
// Isso remove todas as fontes de erro relacionadas a credenciais explícitas.
if (!getApps().length) {
    app = initializeApp();
} else {
    app = getApps()[0];
}

export const authAdmin = admin.auth();
export const dbAdmin = admin.firestore();
