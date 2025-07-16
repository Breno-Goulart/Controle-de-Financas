// public/js/firebaseConfig.js

// Importe as funções que você precisa dos SDKs do Firebase usando as URLs completas
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// A sua configuração da web app do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBaU7hR3ncm4X5TGcIl44NTqmR_naHCKIg",
  authDomain: "controle-de-financas-6e2d9.firebaseapp.com",
  projectId: "controle-de-financas-6e2d9",
  storageBucket: "controle-de-financas-6e2d9.appspot.com",
  messagingSenderId: "492470735943",
  appId: "1:492470735943:web:80b44a627cfdfd6f8ccd62"
};

// Inicialize o Firebase
const app = initializeApp(firebaseConfig);

// Inicialize os serviços do Firebase que você irá usar (Authentication e Firestore)
const auth = getAuth(app);
const db = getFirestore(app);

// Exporte as variáveis 'auth' e 'db' para que possam ser usadas em outros ficheiros
// como o 'lancamentos.js'
export { auth, db };
