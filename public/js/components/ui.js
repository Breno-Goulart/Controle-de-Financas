// js/components/ui.js

/**
 * Exibe um indicador de carregamento.
 * Adiciona um overlay e um spinner ao corpo do documento.
 */
export function showLoading() {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-overlay';
    loadingDiv.className = 'fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 rounded-lg';
    loadingDiv.innerHTML = `
        <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 rounded-lg"></div>
        <p class="text-white ml-4 text-lg">Carregando...</p>
    `;
    document.body.appendChild(loadingDiv);
}

/**
 * Oculta o indicador de carregamento.
 * Remove o overlay e o spinner do corpo do documento.
 */
export function hideLoading() {
    const loadingDiv = document.getElementById('loading-overlay');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

/**
 * Exibe uma mensagem de status para o usuário.
 * Cria um modal simples com a mensagem e um botão de fechar.
 * @param {string} message - A mensagem a ser exibida.
 * @param {'success' | 'error' | 'info'} type - O tipo da mensagem (afeta a cor do modal).
 */
export function showMessage(message, type = 'info') {
    const modalDiv = document.createElement('div');
    modalDiv.id = 'message-modal';
    modalDiv.className = 'fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 rounded-lg';

    let bgColor = '';
    let textColor = 'text-white';
    switch (type) {
        case 'success':
            bgColor = 'bg-green-600';
            break;
        case 'error':
            bgColor = 'bg-red-600';
            break;
        case 'info':
        default:
            bgColor = 'bg-blue-600';
            break;
    }

    modalDiv.innerHTML = `
        <div class="relative ${bgColor} ${textColor} p-8 rounded-lg shadow-lg max-w-sm w-full text-center">
            <p class="text-xl font-semibold mb-4">${message}</p>
            <button id="close-message-modal" class="mt-4 px-6 py-2 bg-white text-gray-800 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400">
                Fechar
            </button>
        </div>
    `;
    document.body.appendChild(modalDiv);

    document.getElementById('close-message-modal').addEventListener('click', () => {
        modalDiv.remove();
    });
}

/**
 * Exibe um modal de confirmação.
 * @param {string} title - O título do modal.
 * @param {string} content - O conteúdo da mensagem.
 * @param {function(): void} onConfirm - Callback para quando o usuário confirma.
 * @param {function(): void} [onCancel] - Callback opcional para quando o usuário cancela.
 */
export function showConfirmModal(title, content, onConfirm, onCancel = () => {}) {
    const modalDiv = document.createElement('div');
    modalDiv.id = 'confirm-modal';
    modalDiv.className = 'fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 rounded-lg';
    modalDiv.innerHTML = `
        <div class="relative bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
            <h3 class="text-2xl font-bold mb-4 text-gray-800">${title}</h3>
            <p class="text-gray-700 mb-6">${content}</p>
            <div class="flex justify-center space-x-4">
                <button id="confirm-button" class="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400">
                    Confirmar
                </button>
                <button id="cancel-button" class="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500">
                    Cancelar
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modalDiv);

    document.getElementById('confirm-button').addEventListener('click', () => {
        onConfirm();
        modalDiv.remove();
    });

    document.getElementById('cancel-button').addEventListener('click', () => {
        onCancel();
        modalDiv.remove();
    });
}
