// js/components/transactionForm.js

import { addTransaction, updateTransaction } from '../services/transaction.service.js';
import { showLoading, hideLoading, showMessage } from './ui.js';

/**
 * Inicializa o formulário de transações, configurando o listener de submissão.
 * @param {HTMLElement} formElement - O elemento do formulário HTML.
 * @param {object} [currentTransaction] - Objeto da transação atual para edição (opcional).
 * @param {function(): void} [onSuccessCallback] - Callback a ser executado após uma operação bem-sucedida.
 */
export function initTransactionForm(formElement, currentTransaction = null, onSuccessCallback = () => {}) {
    if (!formElement) {
        console.error("Erro: Elemento do formulário de transações não encontrado.");
        return;
    }

    const descriptionInput = formElement.querySelector('#transaction-description');
    const amountInput = formElement.querySelector('#transaction-amount');
    const typeSelect = formElement.querySelector('#transaction-type');
    const submitButton = formElement.querySelector('button[type="submit"]');

    // Preenche o formulário se estiver em modo de edição
    if (currentTransaction) {
        descriptionInput.value = currentTransaction.description || '';
        amountInput.value = currentTransaction.amount || '';
        typeSelect.value = currentTransaction.type || 'expense';
        submitButton.textContent = 'Atualizar Transação';
    } else {
        submitButton.textContent = 'Adicionar Transação';
    }

    formElement.addEventListener('submit', async (event) => {
        event.preventDefault(); // Impede o envio padrão do formulário

        const description = descriptionInput.value.trim();
        const amount = parseFloat(amountInput.value);
        const type = typeSelect.value;

        if (!description || isNaN(amount) || amount <= 0) {
            showMessage('Por favor, preencha todos os campos corretamente.', 'error');
            return;
        }

        showLoading();
        try {
            const transactionData = { description, amount, type };
            if (currentTransaction && currentTransaction.id) {
                await updateTransaction(currentTransaction.id, transactionData);
                showMessage('Transação atualizada com sucesso!', 'success');
            } else {
                await addTransaction(transactionData);
                showMessage('Transação adicionada com sucesso!', 'success');
                // Limpa o formulário apenas após adicionar uma nova transação
                descriptionInput.value = '';
                amountInput.value = '';
                typeSelect.value = 'expense';
            }
            onSuccessCallback(); // Executa o callback de sucesso
        } catch (error) {
            console.error("Erro na operação da transação:", error);
            showMessage(`Erro ao salvar transação: ${error.message}`, 'error');
        } finally {
            hideLoading();
        }
    });
}
