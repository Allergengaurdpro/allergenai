import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration for AllergenAI
const firebaseConfig = {
  apiKey: "AIzaSyB17Mi91iiJhWsumSz4o_-OfIfiqm-FTTw",
  authDomain: "allergenai-e8101.firebaseapp.com",
  projectId: "allergenai-e8101",
  storageBucket: "allergenai-e8101.firebasestorage.app",
  messagingSenderId: "376244230777",
  appId: "1:376244230777:web:eb8a16fa5bf2a7ff0ad2a8",
  measurementId: "G-6159TSNP9D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Export Firestore functions for convenience
export {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';

// Export Storage functions for convenience
export {
  ref,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage';

// Export Auth functions for convenience
export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

export default app;
