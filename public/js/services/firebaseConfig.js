/**
 * @fileoverview Configuração centralizada do Firebase para a aplicação.
 * Este módulo inicializa o Firebase e exporta as instâncias de autenticação e Firestore.
 * @author Breno Goulart
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInWithCustomToken, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// As variáveis globais __app_id, __firebase_config e __initial_auth_token
// são fornecidas pelo ambiente Canvas em tempo de execução.
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Inicializa o Firebase App
const app = initializeApp(firebaseConfig);

// Obtém as instâncias de Auth e Firestore
const auth = getAuth(app);
const db = getFirestore(app);

/**
 * Realiza o login inicial do usuário.
 * Se um token de autenticação personalizado for fornecido, ele será usado.
 * Caso contrário, o usuário será autenticado anonimamente.
 * Esta função deve ser chamada uma vez no início da aplicação.
 */
async function initializeAuth() {
    try {
        if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
        } else {
            await signInAnonymously(auth);
        }
        // console.log("Firebase Auth inicializado com sucesso.");
    } catch (error) {
        console.error("Erro ao inicializar Firebase Auth:", error);
        // Em um ambiente de produção, você pode querer mostrar um toast de erro aqui
        // ou redirecionar para uma página de erro.
    }
}

// Exporta as instâncias para serem usadas em outros módulos
export { auth, db, initializeAuth, appId };
