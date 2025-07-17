// js/services/transaction.service.js

// Importa as instâncias de db e auth do seu arquivo de configuração do Firebase
import { db, auth } from './firebase.config.js';
import {
    collection,
    addDoc,
    query,
    where,
    orderBy, // Note: orderBy can cause issues if indexes are not set up. Using for example.
    doc,
    updateDoc,
    deleteDoc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/**
 * Obtém a referência da coleção de transações para o usuário atual.
 * @param {string} userId - O ID do usuário.
 * @returns {import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js").CollectionReference} A referência da coleção de transações.
 */
const getTransactionsCollectionRef = (userId) => {
    // Define o caminho da coleção para dados privados do usuário
    // A estrutura é: /users/{userId}/transactions
    // O __app_id é tratado automaticamente pelo contexto do Firebase inicializado com __firebase_config
    return collection(db, `users/${userId}/transactions`);
};

/**
 * Adiciona uma nova transação para o usuário logado.
 * @param {object} transactionData - Os dados da transação a serem adicionados.
 * @returns {Promise<void>} Uma promessa que resolve quando a transação é adicionada.
 */
export const addTransaction = async (transactionData) => {
    try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
            console.error("Erro: Usuário não autenticado para adicionar transação.");
            throw new Error("Usuário não autenticado.");
        }
        await addDoc(getTransactionsCollectionRef(userId), {
            ...transactionData,
            userId: userId, // Garante que a transação esteja vinculada ao usuário
            createdAt: new Date() // Adiciona um timestamp de criação
        });
        console.log("Transação adicionada com sucesso!");
    } catch (error) {
        console.error("Erro ao adicionar transação:", error);
        throw error;
    }
};

/**
 * Observa as transações do usuário logado em tempo real.
 * @param {function(Array<object>): void} callback - Função de callback que recebe a lista de transações.
 * @returns {function(): void} Uma função para cancelar a observação (unsubscribe).
 */
export const onTransactionsChanged = (callback) => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
        console.warn("Nenhum usuário autenticado. Não é possível observar transações.");
        // Retorna uma função vazia para evitar erros se não houver usuário
        return () => {};
    }

    // Cria uma query para buscar as transações do usuário atual, ordenadas por data de criação
    // ATENÇÃO: O uso de orderBy pode exigir a criação de índices no Firestore.
    // Se encontrar erros de "missing index", remova o orderBy ou crie o índice.
    const q = query(
        getTransactionsCollectionRef(userId),
        where("userId", "==", userId), // Garante que estamos pegando apenas as transações do usuário
        orderBy("createdAt", "desc") // Ordena pela data de criação (mais recente primeiro)
    );

    // Retorna a função de unsubscribe do onSnapshot
    return onSnapshot(q, (snapshot) => {
        const transactions = [];
        snapshot.forEach((doc) => {
            transactions.push({ id: doc.id, ...doc.data() });
        });
        callback(transactions); // Chama o callback com a lista de transações
    }, (error) => {
        console.error("Erro ao observar transações:", error);
        // Você pode querer chamar o callback com um array vazio ou um erro, dependendo da sua lógica de UI
        callback([]);
    });
};

/**
 * Atualiza uma transação existente.
 * @param {string} transactionId - O ID da transação a ser atualizada.
 * @param {object} newData - Os novos dados para a transação.
 * @returns {Promise<void>} Uma promessa que resolve quando a transação é atualizada.
 */
export const updateTransaction = async (transactionId, newData) => {
    try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
            console.error("Erro: Usuário não autenticado para atualizar transação.");
            throw new Error("Usuário não autenticado.");
        }
        const transactionRef = doc(getTransactionsCollectionRef(userId), transactionId);
        await updateDoc(transactionRef, newData);
        console.log(`Transação ${transactionId} atualizada com sucesso!`);
    } catch (error) {
        console.error(`Erro ao atualizar transação ${transactionId}:`, error);
        throw error;
    }
};

/**
 * Remove uma transação existente.
 * @param {string} transactionId - O ID da transação a ser removida.
 * @returns {Promise<void>} Uma promessa que resolve quando a transação é removida.
 */
export const deleteTransaction = async (transactionId) => {
    try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
            console.error("Erro: Usuário não autenticado para remover transação.");
            throw new Error("Usuário não autenticado.");
        }
        const transactionRef = doc(getTransactionsCollectionRef(userId), transactionId);
        await deleteDoc(transactionRef);
        console.log(`Transação ${transactionId} removida com sucesso!`);
    } catch (error) {
        console.error(`Erro ao remover transação ${transactionId}:`, error);
        throw error;
    }
};
