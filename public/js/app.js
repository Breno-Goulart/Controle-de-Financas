// app.js

// Importa os serviços e componentes necessários
import { auth } from './js/services/firebase.config.js';
import { AuthService } from './js/services/auth.service.js';
import { onTransactionsChanged, updateTransaction, deleteTransaction } from './js/services/transaction.service.js';
import { renderTransactionList } from './js/components/transactionList.js';
import { initTransactionForm } from './js/components/transactionForm.js';
import { showLoading, hideLoading, showMessage, showConfirmModal } from './js/components/ui.js';

// Elementos do DOM
const loginSection = document.getElementById('login-section');
const appSection = document.getElementById('app-section');
const emailInput = document.getElementById('email-input');
const passwordInput = document.getElementById('password-input');
const loginButton = document.getElementById('login-button');
const logoutButton = document.getElementById('logout-button');
const transactionsListContainer = document.getElementById('transactions-list-container');
const transactionFormElement = document.getElementById('transaction-form');
const currentUserEmailSpan = document.getElementById('current-user-email');

let unsubscribeFromTransactions = null; // Variável para armazenar a função de unsubscribe do listener

// Função para iniciar a observação das transações
function startListeningToTransactions() {
    // Se já houver um listener ativo, desinscreve-se primeiro para evitar duplicatas
    if (unsubscribeFromTransactions) {
        unsubscribeFromTransactions();
    }

    // Inicia a observação das transações e renderiza a lista
    unsubscribeFromTransactions = onTransactionsChanged((transactions) => {
        renderTransactionList(
            transactions,
            transactionsListContainer,
            handleDeleteTransaction, // Callback para exclusão
            handleEditTransaction   // Callback para edição
        );
        hideLoading(); // Esconde o loading após carregar as transações
    });
}

// Função para lidar com a exclusão de uma transação
function handleDeleteTransaction(transactionId) {
    showConfirmModal(
        'Confirmar Exclusão',
        'Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.',
        async () => {
            showLoading();
            try {
                await deleteTransaction(transactionId);
                showMessage('Transação excluída com sucesso!', 'success');
            } catch (error) {
                console.error("Erro ao excluir transação:", error);
                showMessage(`Erro ao excluir transação: ${error.message}`, 'error');
            } finally {
                hideLoading();
            }
        }
    );
}

// Função para lidar com a edição de uma transação
// Por simplicidade, esta função pode abrir um modal ou reutilizar o formulário de adição
// para preencher os dados da transação a ser editada.
function handleEditTransaction(transactionId) {
    // Em uma aplicação real, você buscaria os detalhes da transação pelo ID
    // e preencheria um formulário de edição.
    // Por enquanto, vamos apenas logar o ID e mostrar uma mensagem.
    showMessage(`Funcionalidade de edição para a transação ${transactionId} será implementada em breve!`, 'info');
    console.log(`Editar transação com ID: ${transactionId}`);

    // Exemplo de como você poderia integrar a edição com o transactionForm:
    // Você precisaria de um mecanismo para obter os dados da transação pelo ID
    // e passá-los para initTransactionForm.
    // const transactionToEdit = transactions.find(t => t.id === transactionId);
    // if (transactionToEdit) {
    //     initTransactionForm(transactionFormElement, transactionToEdit, () => {
    //         // Callback após a edição bem-sucedida
    //         // Fechar modal de edição, etc.
    //     });
    // }
}


// --- Event Listeners ---

// Listener para o botão de login
if (loginButton) {
    loginButton.addEventListener('click', async () => {
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) {
            showMessage('Por favor, insira e-mail e senha.', 'error');
            return;
        }

        showLoading();
        try {
            await AuthService.login(email, password);
            showMessage('Login realizado com sucesso!', 'success');
        } catch (error) {
            console.error("Erro no login:", error);
            // Exibir mensagem de erro específica para o usuário
            if (error.code === 'auth/invalid-email') {
                showMessage('E-mail inválido.', 'error');
            } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                showMessage('E-mail ou senha incorretos.', 'error');
            } else {
                showMessage(`Erro no login: ${error.message}`, 'error');
            }
        } finally {
            hideLoading();
        }
    });
}


// Listener para o botão de logout
if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
        showLoading();
        try {
            await AuthService.logout();
            showMessage('Logout realizado com sucesso!', 'success');
            // Remove o listener de transações ao deslogar
            if (unsubscribeFromTransactions) {
                unsubscribeFromTransactions();
                unsubscribeFromTransactions = null;
            }
        } catch (error) {
            console.error("Erro ao deslogar:", error);
            showMessage(`Erro ao deslogar: ${error.message}`, 'error');
        } finally {
            hideLoading();
        }
    });
}

// --- Lógica de Autenticação (onAuthStateChanged) ---
// Este é o principal orquestrador da UI
AuthService.onAuthStateChanged(user => {
    if (user) {
        // Usuário logado
        if (loginSection) loginSection.classList.add('hidden');
        if (appSection) appSection.classList.remove('hidden');
        if (currentUserEmailSpan) currentUserEmailSpan.textContent = user.email;

        showLoading(); // Mostra o loading enquanto as transações são carregadas
        startListeningToTransactions(); // Inicia a observação das transações
        initTransactionForm(transactionFormElement); // Inicializa o formulário de transações
    } else {
        // Usuário deslogado
        if (loginSection) loginSection.classList.remove('hidden');
        if (appSection) appSection.classList.add('hidden');
        if (currentUserEmailSpan) currentUserEmailSpan.textContent = '';
        hideLoading(); // Esconde o loading se não houver usuário logado
    }
});

// Inicialização (garante que o loading seja escondido se não houver autenticação inicial)
hideLoading();
