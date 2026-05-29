import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  setDoc,
  orderBy,
  query,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Adds an expense document to the expenses collection.
 * @param {object} data - Expense fields to store
 * @returns {Promise<object>} Saved document with Firestore id
 */
export async function addExpense(data) {
  const docRef = await addDoc(collection(db, 'expenses'), data);
  return { id: docRef.id, ...data };
}

/**
 * Fetches all expenses ordered by date descending.
 * @returns {Promise<object[]>}
 */
export async function getExpenses() {
  const expensesQuery = query(
    collection(db, 'expenses'),
    orderBy('date', 'desc')
  );
  const snapshot = await getDocs(expensesQuery);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

/**
 * Reads the company profile from settings/profile.
 * @returns {Promise<object|null>}
 */
export async function getProfile() {
  const profileRef = doc(db, 'settings', 'profile');
  const snapshot = await getDoc(profileRef);
  if (!snapshot.exists()) {
    return null;
  }
  return snapshot.data();
}

/**
 * Saves company profile data to settings/profile.
 * @param {object} data - Profile fields
 * @returns {Promise<object>}
 */
export async function saveProfile(data) {
  const profileRef = doc(db, 'settings', 'profile');
  await setDoc(profileRef, data, { merge: true });
  return data;
}
