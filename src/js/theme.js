import '../css/style.css';

/**
 * Aplica o tema (dark/light) no documento e atualiza o ícone do botão.
 * @param {string} theme - O tema a ser aplicado ('dark' ou 'light').
 */
const applyTheme = (theme) => {
    // Busca os ícones dentro desta função para garantir que já existam.
    const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
    const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');

    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        if (themeToggleLightIcon) themeToggleLightIcon.classList.remove('hidden');
        if (themeToggleDarkIcon) themeToggleDarkIcon.classList.add('hidden');
    } else {
        document.documentElement.classList.remove('dark');
        if (themeToggleDarkIcon) themeToggleDarkIcon.classList.remove('hidden');
        if (themeToggleLightIcon) themeToggleLightIcon.classList.add('hidden');
    }
    // Salva a preferência do usuário para visitas futuras.
    localStorage.setItem('theme', theme);
};

/**
 * Define o tema inicial da página com base na preferência salva ou na do sistema.
 */
const initializeTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(savedTheme || (systemPrefersDark ? 'dark' : 'light'));
};

/**
 * Adiciona a funcionalidade de clique ao botão de tema.
 */
const setupThemeToggle = () => {
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            // Verifica se o modo escuro está ativo e alterna para o outro.
            const isDarkMode = document.documentElement.classList.contains('dark');
            applyTheme(isDarkMode ? 'light' : 'dark');
        });
    }
};

// --- PONTO CHAVE DA CORREÇÃO ---
// Espera o HTML da página estar completamente pronto antes de executar o código.
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    setupThemeToggle();
});