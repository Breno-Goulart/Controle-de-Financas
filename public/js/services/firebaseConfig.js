// js/services/firebase.config.js

// Importa as funções necessárias do Firebase SDK 10.12.2
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Sua configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBaU7hR3ncm4X5TGcIl44NTqmR_naHCKIg",
  authDomain: "controle-de-financas-6e2d9.firebaseapp.com",
  projectId: "controle-de-financas-6e2d9",
  storageBucket: "controle-de-financas-6e2d9.firebasestorage.app",
  messagingSenderId: "492470735943",
  appId: "1:492470735943:web:80b44a627cfdfd6f8ccd62"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Obtém as instâncias de autenticação e Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);
