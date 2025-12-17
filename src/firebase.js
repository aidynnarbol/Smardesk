// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// ⚙️ Твой конфиг из Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyAEi8lshRmMBZzzYHqy9N2cq3A2YV1NLN8", // твой ключ
  authDomain: "smardesk-25f84.firebaseapp.com",
  projectId: "smardesk-25f84",
  storageBucket: "smardesk-25f84.firebasestorage.app",
  messagingSenderId: "197039163389",
  appId: "11:197039163389:web:fefec128c1314366e73b94"
};

// Инициализация
const app = initializeApp(firebaseConfig);

// Экспорт сервисов
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
