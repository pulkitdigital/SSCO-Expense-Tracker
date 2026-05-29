const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const { getUnsyncedExpenses, markSynced } = require('./sqlite');

let firestore = null;
let firebaseEnabled = false;
let firebaseInitError = null;

const SERVICE_ACCOUNT_FILENAMES = [
  'serviceAccountKey.json',
  'firebase-service-account.json',
];

const SERVICE_ACCOUNT_DIRS = [
  process.cwd(),
  path.join(process.cwd(), 'config'),
  path.join(__dirname, '..', '..'),
];

const ENV_KEYS = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'];

/**
 * Strip surrounding quotes and trailing commas often introduced when editing .env files.
 * @param {string|undefined} value
 * @returns {string}
 */
function cleanEnvValue(value) {
  if (value == null) return '';
  let cleaned = String(value).trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned.replace(/,+$/, '').trim();
}

/**
 * Normalize PEM private key from .env (escaped \n, real newlines, stray spaces).
 * @param {string} rawKey
 * @returns {string}
 */
function normalizePrivateKey(rawKey) {
  let key = cleanEnvValue(rawKey);
  if (!key) return '';

  key = key.replace(/\\n/g, '\n');
  key = key.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const begin = '-----BEGIN PRIVATE KEY-----';
  const end = '-----END PRIVATE KEY-----';
  const beginIndex = key.indexOf(begin);
  const endIndex = key.indexOf(end);

  if (beginIndex === -1 || endIndex === -1) {
    return key;
  }

  const body = key
    .slice(beginIndex + begin.length, endIndex)
    .replace(/\s+/g, '');

  const lines = body.match(/.{1,64}/g) || [];
  return `${begin}\n${lines.join('\n')}\n${end}\n`;
}

function resolveServiceAccountPath() {
  const explicitPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (explicitPath && fs.existsSync(explicitPath)) {
    return explicitPath;
  }

  for (const dir of SERVICE_ACCOUNT_DIRS) {
    for (const name of SERVICE_ACCOUNT_FILENAMES) {
      const filePath = path.join(dir, name);
      if (fs.existsSync(filePath)) {
        return filePath;
      }
    }
  }

  return null;
}

/**
 * @returns {{ serviceAccount: object, source: string } | { error: string }}
 */
function loadCredentialsFromFile() {
  const filePath = resolveServiceAccountPath();
  if (!filePath) {
    return { error: null };
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const serviceAccount = JSON.parse(raw);

    if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
      return {
        error: `Invalid service account file at ${filePath}: missing project_id, client_email, or private_key`,
      };
    }

    return {
      serviceAccount: {
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: normalizePrivateKey(serviceAccount.private_key),
      },
      source: filePath,
    };
  } catch (err) {
    return {
      error: `Failed to read service account file (${filePath}): ${err.message}`,
    };
  }
}

/**
 * @returns {{ credentials: object } | { error: string, missing?: string[] }}
 */
function loadCredentialsFromEnv() {
  const projectId = cleanEnvValue(process.env.FIREBASE_PROJECT_ID);
  const clientEmail = cleanEnvValue(process.env.FIREBASE_CLIENT_EMAIL);
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

  const missing = ENV_KEYS.filter((key) => {
    const val = process.env[key];
    return val == null || cleanEnvValue(val) === '';
  });

  if (missing.length > 0) {
    return {
      error: `Missing required Firebase environment variables: ${missing.join(', ')}`,
      missing,
    };
  }

  const privateKey = normalizePrivateKey(privateKeyRaw);

  if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    return {
      error:
        'FIREBASE_PRIVATE_KEY is invalid: must be a PEM private key starting with -----BEGIN PRIVATE KEY-----',
    };
  }

  if (!privateKey.includes('-----END PRIVATE KEY-----')) {
    return {
      error:
        'FIREBASE_PRIVATE_KEY is invalid: must end with -----END PRIVATE KEY-----',
    };
  }

  return {
    credentials: {
      projectId,
      clientEmail,
      privateKey,
    },
  };
}

/**
 * Initializes Firebase Admin. Never throws — logs errors and disables sync instead.
 */
function initFirebase() {
  if (admin.apps.length) {
    firestore = admin.firestore();
    firebaseEnabled = true;
    firebaseInitError = null;
    return;
  }

  try {
    const fromFile = loadCredentialsFromFile();

    if (fromFile.serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(fromFile.serviceAccount),
      });
      firestore = admin.firestore();
      firebaseEnabled = true;
      firebaseInitError = null;
      console.log(`[firebase] Initialized from service account file: ${fromFile.source}`);
      return;
    }

    if (fromFile.error) {
      console.warn(`[firebase] ${fromFile.error}`);
      console.warn('[firebase] Falling back to FIREBASE_* environment variables...');
    }

    const fromEnv = loadCredentialsFromEnv();

    if (fromEnv.error) {
      if (fromEnv.missing) {
        firebaseInitError = fromEnv.error;
        console.warn(`[firebase] ${fromEnv.error}`);
        console.warn(
          '[firebase] Sync disabled. Place serviceAccountKey.json in the Backend folder or set FIREBASE_* in .env'
        );
      } else {
        firebaseInitError = fromEnv.error;
        console.error(`[firebase] ${fromEnv.error}`);
        console.warn('[firebase] Sync disabled. API will continue without cloud sync.');
      }
      return;
    }

    admin.initializeApp({
      credential: admin.credential.cert(fromEnv.credentials),
    });
    firestore = admin.firestore();
    firebaseEnabled = true;
    firebaseInitError = null;
    console.log('[firebase] Initialized from environment variables');
  } catch (err) {
    firebaseInitError = err.message;
    console.error('[firebase] Initialization failed:', err.message);
    console.warn('[firebase] Sync disabled. API will continue without cloud sync.');
  }
}

function isFirebaseEnabled() {
  return firebaseEnabled && firestore !== null;
}

function getFirebaseStatus() {
  return {
    enabled: isFirebaseEnabled(),
    error: firebaseInitError,
  };
}

/**
 * Pushes all unsynced SQLite expense rows to Firestore.
 * @returns {Promise<{ synced: number, failed: number }>}
 */
async function syncToFirebase() {
  if (!isFirebaseEnabled()) {
    const message =
      firebaseInitError ||
      'Firebase is not configured. Add Backend/serviceAccountKey.json or valid FIREBASE_* variables in .env';
    const err = new Error(message);
    err.code = 'FIREBASE_UNAVAILABLE';
    throw err;
  }

  const rows = getUnsyncedExpenses();
  let synced = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const { id, ...data } = row;
      await firestore.collection('expenses').doc(String(id)).set({
        ...data,
        sqliteId: id,
        synced: true,
      });
      markSynced(id);
      synced += 1;
    } catch (err) {
      console.error(`Failed to sync expense id ${row.id}:`, err);
      failed += 1;
    }
  }

  return { synced, failed };
}

initFirebase();

module.exports = {
  syncToFirebase,
  isFirebaseEnabled,
  getFirebaseStatus,
  initFirebase,
};
