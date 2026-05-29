const admin = require('firebase-admin');
const { getUnsyncedExpenses, markSynced } = require('./sqlite');

let firestore = null;
let firebaseEnabled = false;
let firebaseInitError = null;

function normalizePrivateKey(rawKey) {
  if (!rawKey) return '';
  let key = String(rawKey).trim();

  // Remove ALL surrounding quotes aggressively
  key = key.replace(/^["']+|["']+$/g, '').trim();

  // Replace literal \n with real newlines
  key = key.replace(/\\n/g, '\n');

  // If key is all on one line (no newlines in body), reformat it
  if (!key.includes('\n')) {
    const begin = '-----BEGIN PRIVATE KEY-----';
    const end   = '-----END PRIVATE KEY-----';
    const body  = key.replace(begin, '').replace(end, '').replace(/\s/g, '');
    const lines = body.match(/.{1,64}/g) || [];
    key = `${begin}\n${lines.join('\n')}\n${end}\n`;
  }

  return key;
}

function initFirebase() {
  if (admin.apps.length) {
    firestore = admin.firestore();
    firebaseEnabled = true;
    return;
  }

  const projectId   = (process.env.FIREBASE_PROJECT_ID   || '').replace(/[",]/g, '').trim();
  const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || '').replace(/[",]/g, '').trim();
  const privateKey  = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY || '');

  console.log('[firebase] project_id   :', projectId);
  console.log('[firebase] client_email :', clientEmail);
  console.log('[firebase] private_key starts with:', privateKey.slice(0, 40));

  if (!projectId || !clientEmail || !privateKey) {
    firebaseInitError = 'Missing FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY in .env';
    console.error('[firebase]', firebaseInitError);
    return;
  }

  if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    firebaseInitError = 'FIREBASE_PRIVATE KEY invalid — must start with -----BEGIN PRIVATE KEY-----';
    console.error('[firebase]', firebaseInitError);
    return;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
    firestore = admin.firestore();
    firebaseEnabled = true;
    console.log('[firebase] Initialized successfully from .env');
  } catch (err) {
    firebaseInitError = err.message;
    console.error('[firebase] Init failed:', err.message);
  }
}

function isFirebaseEnabled() {
  return firebaseEnabled && firestore !== null;
}

function getFirebaseStatus() {
  return { enabled: isFirebaseEnabled(), error: firebaseInitError };
}

async function syncToFirebase() {
  if (!isFirebaseEnabled()) {
    const err = new Error(firebaseInitError || 'Firebase not configured');
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
      console.error(`[firebase] Failed to sync expense id ${row.id}:`, err.message);
      failed += 1;
    }
  }

  return { synced, failed };
}

initFirebase();

module.exports = { syncToFirebase, isFirebaseEnabled, getFirebaseStatus, initFirebase };