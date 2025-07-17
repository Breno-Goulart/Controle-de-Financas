// js/services/auth.service.js

import { auth } from './firebase.config.js';
import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

export const AuthService = {
    login: async (email, password) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            console.log("Usuário logado com sucesso!");
        } catch (error) {
            console.error("Erro no login:", error);
            throw error; // Re-lança o erro para ser tratado onde a função for chamada
        }
    },

    logout: async () => {
        try {
            await signOut(auth);
            console.log("Usuário deslogado com sucesso!");
        } catch (error) {
            console.error("Erro ao deslogar:", error);
            throw error;
        }
    },

    onAuthStateChanged: (callback) => {
        onAuthStateChanged(auth, callback);
    }
};
