import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function getServiceAccount() {
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!key) return undefined;
  
  try {
    const serviceAccount = JSON.parse(key);
    // Next.js dotenv loads single-quoted strings literally, meaning \n becomes backslash+n.
    // We must replace them with actual newlines AFTER JSON parsing so the crypto module can read the PEM.
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    return serviceAccount;
  } catch (e) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY. Please ensure it is valid JSON.", e);
    return undefined;
  }
}

import { getAuth } from 'firebase-admin/auth';

function ensureApp() {
  if (getApps().length) return;
  const serviceAccount = getServiceAccount();

  if (serviceAccount) {
    initializeApp({ credential: cert(serviceAccount) });
  } else {
    console.warn("Using application default credentials because FIREBASE_SERVICE_ACCOUNT_KEY is invalid or missing.");
    initializeApp();
  }
}

// Inicialização preguiçosa: se as credenciais estiverem ausentes/inválidas, o erro
// acontece dentro do try/catch das rotas (JSON legível) e não na importação do módulo.
function lazy<T extends object>(factory: () => T): T {
  let instance: T | null = null;
  return new Proxy({} as T, {
    get(_t, prop) {
      if (!instance) {
        ensureApp();
        instance = factory();
      }
      const value = (instance as any)[prop];
      return typeof value === 'function' ? value.bind(instance) : value;
    },
  });
}

export const db = lazy(() => getFirestore());
export const auth = lazy(() => getAuth());
