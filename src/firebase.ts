import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDxLxPCL6iEJaaxDH3Iuovh05S1VwBrvHc",
  authDomain: "gen-lang-client-0149185465.firebaseapp.com",
  projectId: "gen-lang-client-0149185465",
  storageBucket: "gen-lang-client-0149185465.firebasestorage.app",
  messagingSenderId: "376837782875",
  appId: "1:376837782875:web:d20fa7278078fe38fc2e7e"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-36eaadb4-3c43-496a-893d-d7010868f696");
