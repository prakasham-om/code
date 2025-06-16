import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// ✅ Correct Firebase config with proper storage bucket
const firebaseConfig = {
  apiKey: "AIzaSyCfnqSJNQ7ovPCXwUgyuSGfF9EUTKRqwvs",
  authDomain: "jbsss-99a4b.firebaseapp.com",
  databaseURL: "https://jbsss-99a4b-default-rtdb.firebaseio.com",
  projectId: "jbsss-99a4b",
  storageBucket: "jbsss-99a4b.appspot.com", // ✅ fixed here
  messagingSenderId: "907561878890",
  appId: "1:907561878890:web:ce9c162b79449f9ee7d113",
  measurementId: "G-MCW4P4VVVT",
};

// Avoid reinitializing Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Export Firestore and Storage
const firestore = getFirestore(app);
const storage = getStorage(app);

export { app, firestore, storage };
