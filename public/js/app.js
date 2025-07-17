// app.js

// Importa os serviços e componentes necessários
import { authService } from './services/auth.service.js';
import { transactionService } from './services/transaction.service.js';
import { renderTransactionList } from './components/transactionList.js';
import { initTransactionForm } from './components/transactionForm.js';
// CORREÇÃO AQUI: Importa apenas 'mostrarToast' que é a função exportada por ui.js
import { mostrarToast } from './utils/ui.js';

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
    // IMPORTANTE: A função 'hideLoading()' não está definida no ui.js fornecido.
    // Você precisará implementá-la ou remover a chamada se não for usá-la.
    unsubscribeFromTransactions = transactionService.onTransactionsChanged((transactions) => {
        renderTransactionList(
            transactions,
            transactionsListContainer,
            handleDeleteTransaction, // Callback para exclusão
            handleEditTransaction   // Callback para edição
        );
        // hideLoading(); // COMENTADO: Função não exportada por ui.js. Remova o comentário se implementá-la.
    });
}

// Função para lidar com a exclusão de uma transação
function handleDeleteTransaction(transactionId) {
    // IMPORTANTE: A função 'showConfirmModal()' não está definida no ui.js fornecido.
    // Você precisará implementá-la ou remover a chamada se não for usá-la.
    // showConfirmModal(
    //     'Confirmar Exclusão',
    //     'Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.',
    //     async () => {
    //         showLoading(); // COMENTADO: Função não exportada por ui.js.
    //         try {
    //             await transactionService.deleteTransaction(transactionId);
    //             mostrarToast('Transação excluída com sucesso!', 'success'); // CORREÇÃO AQUI
    //         } catch (error) {
    //             console.error("Erro ao excluir transação:", error);
    //             mostrarToast(`Erro ao excluir transação: ${error.message}`, 'error'); // CORREÇÃO AQUI
    //         } finally {
    //             hideLoading(); // COMENTADO: Função não exportada por ui.js.
    //         }
    //     }
    // );

    // Alternativa simples caso não vá implementar showConfirmModal agora:
    if (confirm('Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.')) {
        // showLoading(); // COMENTADO
        transactionService.deleteTransaction(transactionId)
            .then(() => {
                mostrarToast('Transação excluída com sucesso!', 'success'); // CORREÇÃO AQUI
            })
            .catch(error => {
                console.error("Erro ao excluir transação:", error);
                mostrarToast(`Erro ao excluir transação: ${error.message}`, 'error'); // CORREÇÃO AQUI
            })
            .finally(() => {
                // hideLoading(); // COMENTADO
            });
    }
}

// Função para lidar com a edição de uma transação
function handleEditTransaction(transactionId) {
    // CORREÇÃO AQUI: Usando 'mostrarToast'
    mostrarToast(`Funcionalidade de edição para a transação ${transactionId} será implementada em breve!`, 'info');
    console.log(`Editar transação com ID: ${transactionId}`);
}


// --- Event Listeners ---

// Listener para o botão de login
if (loginButton) {
    loginButton.addEventListener('click', async () => {
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) {
            // CORREÇÃO AQUI: Usando 'mostrarToast'
            mostrarToast('Por favor, insira e-mail e senha.', 'error');
            return;
        }

        // showLoading(); // COMENTADO: Função não exportada por ui.js.
        try {
            await authService.login(email, password);
            // CORREÇÃO AQUI: Usando 'mostrarToast'
            mostrarToast('Login realizado com sucesso!', 'success');
        } catch (error) {
            console.error("Erro no login:", error);
            // Exibir mensagem de erro específica para o usuário
            if (error.code === 'auth/invalid-email') {
                mostrarToast('E-mail inválido.', 'error'); // CORREÇÃO AQUI
            } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                mostrarToast('E-mail ou senha incorretos.', 'error'); // CORREÇÃO AQUI
            } else {
                mostrarToast(`Erro no login: ${error.message}`, 'error'); // CORREÇÃO AQUI
            }
        } finally {
            // hideLoading(); // COMENTADO: Função não exportada por ui.js.
        }
    });
}


// Listener para o botão de logout
if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
        // showLoading(); // COMENTADO: Função não exportada por ui.js.
        try {
            await authService.logout();
            // CORREÇÃO AQUI: Usando 'mostrarToast'
            mostrarToast('Logout realizado com sucesso!', 'success');
            // Remove o listener de transações ao deslogar
            if (unsubscribeFromTransactions) {
                unsubscribeFromTransactions();
                unsubscribeFromTransactions = null;
            }
        } catch (error) {
            console.error("Erro ao deslogar:", error);
            // CORREÇÃO AQUI: Usando 'mostrarToast'
            mostrarToast(`Erro ao deslogar: ${error.message}`, 'error');
        } finally {
            // hideLoading(); // COMENTADO: Função não exportada por ui.js.
        }
    });
}

// --- Lógica de Autenticação (onAuthStateChanged) ---
// Este é o principal orquestrador da UI
authService.onAuthStateChanged(user => {
    if (user) {
        // Usuário logado
        if (loginSection) loginSection.classList.add('hidden');
        if (appSection) appSection.classList.remove('hidden');
        if (currentUserEmailSpan) currentUserEmailSpan.textContent = user.email;

        // showLoading(); // COMENTADO: Função não exportada por ui.js.
        startListeningToTransactions(); // Inicia a observação das transações
        initTransactionForm(transactionFormElement); // Inicializa o formulário de transações
    } else {
        // Usuário deslogado
        if (loginSection) loginSection.classList.remove('hidden');
        if (appSection) appSection.classList.add('hidden');
        if (currentUserEmailSpan) currentUserEmailSpan.textContent = '';
        // hideLoading(); // COMENTADO: Função não exportada por ui.js.
    }
});

// Inicialização (garante que o loading seja escondido se não houver autenticação inicial)
// hideLoading(); // COMENTADO: Função não exportada por ui.js.