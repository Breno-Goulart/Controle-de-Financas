/**
 * @fileoverview Serviço de autenticação do Firebase.
 * Gerencia operações de login, cadastro e redefinição de senha.
 * @author Breno Goulart
 */

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    updateProfile,
    updateEmail,
    updatePassword
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { auth, db, appId } from './firebaseConfig.js'; // Importa as instâncias centralizadas
import { mostrarToast } from '../utils/ui.js'; // Importa a função de toast

class AuthService {
    constructor() {
        this.auth = auth;
        this.db = db;
        this.appId = appId;
    }

    /**
     * Registra um novo usuário com email e senha.
     * @param {string} email - O email do usuário.
     * @param {string} password - A senha do usuário.
     * @param {string} name - O nome do usuário.
     * @returns {Promise<Object|null>} O objeto do usuário autenticado ou null em caso de erro.
     */
    async register(email, password, name) {
        try {
            const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
            const user = userCredential.user;

            // Atualiza o perfil do usuário com o nome de exibição
            await updateProfile(user, { displayName: name });

            // Cria um documento para o usuário no Firestore (coleção privada)
            const userDocRef = doc(this.db, `artifacts/${this.appId}/users/${user.uid}/profile/data`);
            await setDoc(userDocRef, {
                email: user.email,
                name: name,
                createdAt: new Date()
            });

            mostrarToast('Cadastro realizado com sucesso!', 'success');
            return user;
        } catch (error) {
            console.error("Erro ao registrar:", error);
            this._handleAuthError(error);
            return null;
        }
    }

    /**
     * Realiza o login de um usuário com email e senha.
     * @param {string} email - O email do usuário.
     * @param {string} password - A senha do usuário.
     * @returns {Promise<Object|null>} O objeto do usuário autenticado ou null em caso de erro.
     */
    async login(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
            mostrarToast('Login realizado com sucesso!', 'success');
            return userCredential.user;
        } catch (error) {
            console.error("Erro ao fazer login:", error);
            this._handleAuthError(error);
            return null;
        }
    }

    /**
     * Realiza o logout do usuário.
     * @returns {Promise<void>}
     */
    async logout() {
        try {
            await signOut(this.auth);
            mostrarToast('Logout realizado com sucesso!', 'success');
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
            mostrarToast('Erro ao fazer logout. Tente novamente.', 'error');
        }
    }

    /**
     * Envia um email de redefinição de senha para o email fornecido.
     * @param {string} email - O email para o qual enviar o link de redefinição.
     * @returns {Promise<void>}
     */
    async resetPassword(email) {
        try {
            await sendPasswordResetEmail(this.auth, email);
            mostrarToast('Email de redefinição de senha enviado!', 'info');
        } catch (error) {
            console.error("Erro ao redefinir senha:", error);
            this._handleAuthError(error);
        }
    }

    /**
     * Obtém os dados do perfil do usuário logado.
     * @param {string} userId - O ID do usuário.
     * @returns {Promise<Object|null>} Os dados do perfil do usuário ou null.
     */
    async getUserProfile(userId) {
        try {
            const userDocRef = doc(this.db, `artifacts/${this.appId}/users/${userId}/profile/data`);
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
                return docSnap.data();
            } else {
                // console.log("Nenhum documento de perfil encontrado para o usuário!");
                return null;
            }
        } catch (error) {
            console.error("Erro ao obter perfil do usuário:", error);
            mostrarToast('Erro ao carregar perfil do usuário.', 'error');
            return null;
        }
    }

    /**
     * Atualiza o perfil do usuário (nome e email).
     * @param {Object} user - O objeto do usuário atual do Firebase.
     * @param {string} newName - O novo nome do usuário.
     * @param {string} newEmail - O novo email do usuário.
     * @returns {Promise<boolean>} True se a atualização for bem-sucedida, false caso contrário.
     */
    async updateUserProfile(user, newName, newEmail) {
        try {
            if (user.email !== newEmail) {
                await updateEmail(user, newEmail);
            }
            if (user.displayName !== newName) {
                await updateProfile(user, { displayName: newName });
            }

            // Atualiza o documento no Firestore
            const userDocRef = doc(this.db, `artifacts/${this.appId}/users/${user.uid}/profile/data`);
            await setDoc(userDocRef, {
                email: newEmail,
                name: newName
            }, { merge: true }); // Usa merge para não sobrescrever outros campos

            mostrarToast('Perfil atualizado com sucesso!', 'success');
            return true;
        } catch (error) {
            console.error("Erro ao atualizar perfil:", error);
            this._handleAuthError(error);
            return false;
        }
    }

    /**
     * Atualiza a senha do usuário.
     * @param {Object} user - O objeto do usuário atual do Firebase.
     * @param {string} newPassword - A nova senha.
     * @returns {Promise<boolean>} True se a atualização for bem-sucedida, false caso contrário.
     */
    async updateUserPassword(user, newPassword) {
        try {
            await updatePassword(user, newPassword);
            mostrarToast('Senha atualizada com sucesso!', 'success');
            return true;
        } catch (error) {
            console.error("Erro ao atualizar senha:", error);
            this._handleAuthError(error);
            return false;
        }
    }

    /**
     * Lida com erros de autenticação do Firebase e exibe mensagens amigáveis.
     * @param {Error} error - O objeto de erro do Firebase.
     */
    _handleAuthError(error) {
        let errorMessage = 'Ocorreu um erro inesperado. Tente novamente.';
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'Usuário não encontrado. Verifique seu email.';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Senha incorreta. Tente novamente.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'O formato do email é inválido.';
                break;
            case 'auth/email-already-in-use':
                errorMessage = 'Este email já está em uso.';
                break;
            case 'auth/weak-password':
                errorMessage = 'A senha é muito fraca. Escolha uma senha mais forte.';
                break;
            case 'auth/operation-not-allowed':
                errorMessage = 'Operação não permitida. Entre em contato com o suporte.';
                break;
            case 'auth/requires-recent-login':
                errorMessage = 'É necessário fazer login novamente para realizar esta operação.';
                break;
            case 'firestore/permission-denied':
                errorMessage = 'Permissão negada. Você não tem acesso a este recurso.';
                break;
            default:
                // console.error("Firebase Error Code:", error.code);
                // console.error("Firebase Error Message:", error.message);
                break;
        }
        mostrarToast(errorMessage, 'error');
    }
}

export const authService = new AuthService();
