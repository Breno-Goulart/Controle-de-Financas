/**
 * @fileoverview Componente para exibir uma lista de transações.
 * @author Breno Goulart
 */

import { formatCurrency, formatDate } from '../utils/formatters.js';

class TransactionList {
    /**
     * Construtor do TransactionList.
     * @param {string} listId - O ID do elemento onde a lista será renderizada.
     * @param {Function} onEdit - Callback para quando uma transação é clicada para edição.
     * @param {Function} onDelete - Callback para quando uma transação é clicada para exclusão.
     */
    constructor(listId, onEdit, onDelete) {
        this.listElement = document.getElementById(listId);
        this.onEdit = onEdit;
        this.onDelete = onDelete;

        if (!this.listElement) {
            console.error(`Elemento com ID '${listId}' não encontrado para a lista de transações.`);
        }
    }

    /**
     * Renderiza a lista de transações.
     * @param {Array<Object>} transactions - Um array de objetos de transação.
     */
    render(transactions) {
        if (!this.listElement) return;

        this.listElement.innerHTML = ''; // Limpa a lista existente

        if (transactions.length === 0) {
            this.listElement.innerHTML = '<p class="text-center text-gray-500 dark:text-gray-400">Nenhuma transação encontrada.</p>';
            return;
        }

        const ul = document.createElement('ul');
        ul.className = 'divide-y divide-gray-200 dark:divide-gray-700';

        transactions.forEach(transaction => {
            const li = document.createElement('li');
            li.className = 'py-4 flex justify-between items-center';
            li.dataset.id = transaction.id; // Armazena o ID para fácil acesso

            const amountClass = transaction.type === 'receita' ? 'text-green-600' : 'text-red-600';
            const sign = transaction.type === 'receita' ? '+' : '-';

            li.innerHTML = `
                <div>
                    <p class="text-lg font-semibold text-gray-900 dark:text-white">${transaction.description}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">${formatDate(transaction.date)}</p>
                </div>
                <div class="flex items-center space-x-4">
                    <p class="text-lg font-bold ${amountClass}">
                        ${sign}${formatCurrency(transaction.amount)}
                    </p>
                    <button class="edit-btn text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-600 focus:outline-none">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zm-3.586 3.586l-2.828 2.828.793.793 2.828-2.828-.793-.793zM10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0 2a10 10 0 100-20 10 10 0 000 20z" clip-rule="evenodd" />
                        </svg>
                    </button>
                    <button class="delete-btn text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-600 focus:outline-none">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </div>
            `;

            ul.appendChild(li);
        });

        this.listElement.appendChild(ul);
        this._setupActionButtons();
    }

    /**
     * Configura os event listeners para os botões de ação (editar, deletar).
     * @private
     */
    _setupActionButtons() {
        this.listElement.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const transactionId = event.currentTarget.closest('li').dataset.id;
                this.onEdit(transactionId);
            });
        });

        this.listElement.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const transactionId = event.currentTarget.closest('li').dataset.id;
                this.onDelete(transactionId);
            });
        });
    }
}

export default TransactionList;
