/**
 * @fileoverview Módulo para funções de interface de usuário, como exibir toasts.
 * @author Breno Goulart
 */

/**
 * Exibe uma mensagem de toast na interface do usuário.
 * Esta função é um substituto para `alert()` e `confirm()`, fornecendo feedback não-bloqueante.
 *
 * @param {string} message - A mensagem a ser exibida no toast.
 * @param {string} type - O tipo de mensagem (ex: 'success', 'error', 'info', 'warning').
 * Isso pode ser usado para aplicar estilos diferentes ao toast.
 * @param {number} duration - Duração em milissegundos para o toast permanecer visível.
 */
export function mostrarToast(message, type = 'info', duration = 3000) {
    // Cria o elemento do toast
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg text-white z-50 transform transition-transform duration-300 ease-out translate-y-full opacity-0`;

    // Define a cor de fundo com base no tipo
    switch (type) {
        case 'success':
            toast.classList.add('bg-green-500');
            break;
        case 'error':
            toast.classList.add('bg-red-500');
            break;
        case 'warning':
            toast.classList.add('bg-yellow-500');
            break;
        case 'info':
        default:
            toast.classList.add('bg-blue-500');
            break;
    }

    toast.textContent = message;

    // Adiciona o toast ao corpo do documento
    document.body.appendChild(toast);

    // Animação para mostrar o toast
    setTimeout(() => {
        toast.classList.remove('translate-y-full', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');
    }, 10); // Pequeno atraso para garantir que a transição ocorra

    // Animação para esconder e remover o toast
    setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-full', 'opacity-0');
        toast.addEventListener('transitionend', () => {
            toast.remove();
        }, { once: true });
    }, duration);
}

// Não há mais a função showMessage, pois foi substituída por mostrarToast.
