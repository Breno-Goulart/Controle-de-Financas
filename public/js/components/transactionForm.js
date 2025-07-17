/**
 * @fileoverview Componente de formulário para adicionar/editar transações.
 * @author Breno Goulart
 */

import { mostrarToast } from '../utils/ui.js';

class TransactionForm {
    /**
     * Construtor do TransactionForm.
     * @param {string} formId - O ID do formulário no HTML.
     * @param {Function} onSubmit - Função de callback a ser executada ao submeter o formulário.
     */
    constructor(formId, onSubmit) {
        this.form = document.getElementById(formId);
        this.onSubmit = onSubmit;
        this.transactionId = null; // Para armazenar o ID da transação em caso de edição

        if (this.form) {
            this._setupEventListeners();
        } else {
            console.error(`Formulário com ID '${formId}' não encontrado.`);
        }
    }

    /**
     * Configura os event listeners para o formulário.
     * @private
     */
    _setupEventListeners() {
        this.form.addEventListener('submit', this._handleSubmit.bind(this));
    }

    /**
     * Lida com a submissão do formulário.
     * @param {Event} event - O evento de submissão.
     * @private
     */
    _handleSubmit(event) {
        event.preventDefault();

        const type = this.form.querySelector('#transaction-type').value;
        const amount = parseFloat(this.form.querySelector('#transaction-amount').value);
        const description = this.form.querySelector('#transaction-description').value;
        const date = this.form.querySelector('#transaction-date').value;

        if (isNaN(amount) || amount <= 0) {
            mostrarToast('Por favor, insira um valor válido para a transação.', 'warning');
            return;
        }
        if (!description.trim()) {
            mostrarToast('Por favor, insira uma descrição para a transação.', 'warning');
            return;
        }
        if (!date) {
            mostrarToast('Por favor, selecione uma data para a transação.', 'warning');
            return;
        }

        const transactionData = {
            type,
            amount,
            description,
            date,
            id: this.transactionId // Inclui o ID se for uma edição
        };

        this.onSubmit(transactionData);
        this.resetForm();
    }

    /**
     * Preenche o formulário com os dados de uma transação para edição.
     * @param {Object} transaction - O objeto da transação a ser editada.
     */
    fillFormForEdit(transaction) {
        this.transactionId = transaction.id;
        this.form.querySelector('#transaction-type').value = transaction.type;
        this.form.querySelector('#transaction-amount').value = transaction.amount;
        this.form.querySelector('#transaction-description').value = transaction.description;
        this.form.querySelector('#transaction-date').value = transaction.date;

        // Altera o texto do botão para indicar edição
        const submitButton = this.form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = 'Atualizar Transação';
        }
    }

    /**
     * Reseta o formulário para seus valores padrão.
     */
    resetForm() {
        this.form.reset();
        this.transactionId = null; // Limpa o ID da transação
        // Restaura o texto do botão
        const submitButton = this.form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = 'Adicionar Transação';
        }
    }
}

export default TransactionForm;
