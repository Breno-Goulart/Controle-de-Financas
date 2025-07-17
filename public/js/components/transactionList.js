// js/components/transactionList.js

import { formatDate, formatMoney } from '../utils/formatters.js';

/**
 * Renderiza a lista de transações em uma tabela HTML.
 * @param {Array<object>} transactions - A lista de transações a serem renderizadas.
 * @param {HTMLElement} containerElement - O elemento DOM onde a lista será renderizada.
 * @param {function(string): void} onDeleteCallback - Callback para quando o botão de exclusão é clicado.
 * @param {function(string): void} onEditCallback - Callback para quando o botão de edição é clicado.
 */
export function renderTransactionList(transactions, containerElement, onDeleteCallback, onEditCallback) {
    if (!containerElement) {
        console.error("Erro: Elemento container para a lista de transações não encontrado.");
        return;
    }

    // Limpa o conteúdo anterior do container
    containerElement.innerHTML = '';

    if (transactions.length === 0) {
        containerElement.innerHTML = '<p class="text-gray-600 text-center py-4">Nenhuma transação encontrada.</p>';
        return;
    }

    const table = document.createElement('table');
    table.className = 'min-w-full bg-white rounded-lg shadow overflow-hidden';
    table.innerHTML = `
        <thead class="bg-gray-200">
            <tr>
                <th class="py-3 px-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Descrição</th>
                <th class="py-3 px-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Valor</th>
                <th class="py-3 px-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Tipo</th>
                <th class="py-3 px-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Data</th>
                <th class="py-3 px-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Ações</th>
            </tr>
        </thead>
        <tbody id="transactions-table-body">
            <!-- Transações serão inseridas aqui -->
        </tbody>
    `;

    containerElement.appendChild(table);
    const tbody = document.getElementById('transactions-table-body');

    transactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-200 hover:bg-gray-50';

        const amountClass = transaction.type === 'income' ? 'text-green-600' : 'text-red-600';

        row.innerHTML = `
            <td class="py-3 px-4 text-sm text-gray-800">${transaction.description}</td>
            <td class="py-3 px-4 text-sm ${amountClass}">${formatMoney(transaction.amount)}</td>
            <td class="py-3 px-4 text-sm text-gray-800">${transaction.type === 'income' ? 'Receita' : 'Despesa'}</td>
            <td class="py-3 px-4 text-sm text-gray-800">${formatDate(transaction.createdAt?.toDate().toISOString() || '')}</td>
            <td class="py-3 px-4 text-sm">
                <button data-id="${transaction.id}" class="edit-btn bg-blue-500 text-white px-3 py-1 rounded-lg text-xs mr-2 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400">
                    Editar
                </button>
                <button data-id="${transaction.id}" class="delete-btn bg-red-500 text-white px-3 py-1 rounded-lg text-xs hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400">
                    Excluir
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    // Adiciona event listeners para os botões de editar e excluir
    tbody.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const transactionId = event.target.dataset.id;
            onEditCallback(transactionId);
        });
    });

    tbody.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const transactionId = event.target.dataset.id;
            onDeleteCallback(transactionId);
        });
    });
}
