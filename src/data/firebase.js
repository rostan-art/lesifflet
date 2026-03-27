import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDI1QD3ljsYGmyD0PSmtz9kG3jxQgrHW-M",
  authDomain: "lesifflet-5baf1.firebaseapp.com",
  projectId: "lesifflet-5baf1",
  storageBucket: "lesifflet-5baf1.firebasestorage.app",
  messagingSenderId: "402411368848",
  appId: "1:402411368848:web:32e28e9c0f66dee10f8315",
};

// Initialize Firebase only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
