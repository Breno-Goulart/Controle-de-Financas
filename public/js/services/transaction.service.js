/**
 * @fileoverview Serviço de transações do Firestore.
 * Gerencia operações CRUD para transações de usuários e famílias.
 * @author Breno Goulart
 */

import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    doc
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { db, auth, appId } from './firebaseConfig.js'; // Importa as instâncias centralizadas
import { mostrarToast } from '../utils/ui.js'; // Importa a função de toast

class TransactionService {
    constructor() {
        this.db = db;
        this.auth = auth;
        this.appId = appId;
    }

    /**
     * Obtém a referência da coleção de transações para o usuário atual.
     * @returns {import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js").CollectionReference|null}
     * A referência da coleção ou null se o usuário não estiver logado.
     */
    _getTransactionsCollectionRef() {
        const userId = this.auth.currentUser?.uid;
        if (!userId) {
            mostrarToast('Usuário não autenticado. Faça login para gerenciar transações.', 'error');
            return null;
        }
        return collection(this.db, `artifacts/${this.appId}/users/${userId}/transactions`);
    }

    /**
     * Adiciona uma nova transação ao Firestore.
     * @param {Object} transactionData - Os dados da transação a serem adicionados.
     * @returns {Promise<Object|null>} A transação adicionada com seu ID ou null em caso de erro.
     */
    async addTransaction(transactionData) {
        try {
            const transactionsColRef = this._getTransactionsCollectionRef();
            if (!transactionsColRef) return null;

            const docRef = await addDoc(transactionsColRef, {
                ...transactionData,
                timestamp: new Date() // Adiciona um timestamp para ordenação e filtragem
            });
            mostrarToast('Transação adicionada com sucesso!', 'success');
            return { id: docRef.id, ...transactionData };
        } catch (error) {
            console.error("Erro ao adicionar transação:", error);
            this._handleFirestoreError(error);
            return null;
        }
    }

    /**
     * Obtém todas as transações de um usuário.
     * @returns {Promise<Array<Object>>} Uma lista de objetos de transação.
     */
    async getTransactions() {
        try {
            const transactionsColRef = this._getTransactionsCollectionRef();
            if (!transactionsColRef) return [];

            const q = query(transactionsColRef);
            const querySnapshot = await getDocs(q);
            const transactions = [];
            querySnapshot.forEach((doc) => {
                transactions.push({ id: doc.id, ...doc.data() });
            });
            return transactions;
        } catch (error) {
            console.error("Erro ao obter transações:", error);
            this._handleFirestoreError(error);
            return [];
        }
    }

    /**
     * Obtém transações filtradas por mês e ano.
     * @param {number} month - O mês (1-12).
     * @param {number} year - O ano.
     * @returns {Promise<Array<Object>>} Uma lista de objetos de transação filtrados.
     */
    async getTransactionsByMonthAndYear(month, year) {
        try {
            const transactionsColRef = this._getTransactionsCollectionRef();
            if (!transactionsColRef) return [];

            // Firestore queries for date ranges require a start and end date.
            // Create Date objects for the beginning and end of the specified month/year.
            const startDate = new Date(year, month - 1, 1); // Month is 0-indexed in JavaScript Date
            const endDate = new Date(year, month, 0); // Last day of the month

            const q = query(
                transactionsColRef,
                where("timestamp", ">=", startDate),
                where("timestamp", "<=", endDate)
            );

            const querySnapshot = await getDocs(q);
            const transactions = [];
            querySnapshot.forEach((doc) => {
                transactions.push({ id: doc.id, ...doc.data() });
            });
            return transactions;
        } catch (error) {
            console.error(`Erro ao obter transações para ${month}/${year}:`, error);
            this._handleFirestoreError(error);
            return [];
        }
    }

    /**
     * Atualiza uma transação existente.
     * @param {string} transactionId - O ID da transação a ser atualizada.
     * @param {Object} updatedData - Os dados a serem atualizados na transação.
     * @returns {Promise<boolean>} True se a atualização for bem-sucedida, false caso contrário.
     */
    async updateTransaction(transactionId, updatedData) {
        try {
            const userId = this.auth.currentUser?.uid;
            if (!userId) {
                mostrarToast('Usuário não autenticado.', 'error');
                return false;
            }
            const transactionDocRef = doc(this.db, `artifacts/${this.appId}/users/${userId}/transactions`, transactionId);
            await updateDoc(transactionDocRef, updatedData);
            mostrarToast('Transação atualizada com sucesso!', 'success');
            return true;
        } catch (error) {
            console.error("Erro ao atualizar transação:", error);
            this._handleFirestoreError(error);
            return false;
        }
    }

    /**
     * Exclui uma transação.
     * @param {string} transactionId - O ID da transação a ser excluída.
     * @returns {Promise<boolean>} True se a exclusão for bem-sucedida, false caso contrário.
     */
    async deleteTransaction(transactionId) {
        try {
            const userId = this.auth.currentUser?.uid;
            if (!userId) {
                mostrarToast('Usuário não autenticado.', 'error');
                return false;
            }
            const transactionDocRef = doc(this.db, `artifacts/${this.appId}/users/${userId}/transactions`, transactionId);
            await deleteDoc(transactionDocRef);
            mostrarToast('Transação excluída com sucesso!', 'success');
            return true;
        } catch (error) {
            console.error("Erro ao excluir transação:", error);
            this._handleFirestoreError(error);
            return false;
        }
    }

    /**
     * Lida com erros do Firestore e exibe mensagens amigáveis.
     * @param {Error} error - O objeto de erro do Firestore.
     */
    _handleFirestoreError(error) {
        let errorMessage = 'Ocorreu um erro inesperado no banco de dados. Tente novamente.';
        switch (error.code) {
            case 'permission-denied':
                errorMessage = 'Permissão negada. Você não tem acesso a este recurso.';
                break;
            case 'unavailable':
                errorMessage = 'Serviço indisponível. Verifique sua conexão com a internet.';
                break;
            case 'not-found':
                errorMessage = 'Documento não encontrado.';
                break;
            default:
                // console.error("Firestore Error Code:", error.code);
                // console.error("Firestore Error Message:", error.message);
                break;
        }
        mostrarToast(errorMessage, 'error');
    }
}

export const transactionService = new TransactionService();
