// src/js/theme.js - VERSÃO CORRIGIDA E ROBUSTA
import '../css/style.css';

/**
 * Aplica o tema (dark/light) no documento e atualiza o ícone do botão.
 * @param {string} theme - O tema a ser aplicado ('dark' ou 'light').
 */
const applyTheme = (theme) => {
    const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
    const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');

    // Define qual classe e ícones devem ser mostrados
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        if (themeToggleLightIcon) themeToggleLightIcon.classList.remove('hidden');
        if (themeToggleDarkIcon) themeToggleDarkIcon.classList.add('hidden');
    } else {
        document.documentElement.classList.remove('dark');
        if (themeToggleDarkIcon) themeToggleDarkIcon.classList.remove('hidden');
        if (themeToggleLightIcon) themeToggleLightIcon.classList.add('hidden');
    }
    // Salva a preferência do usuário no armazenamento local para visitas futuras.
    localStorage.setItem('theme', theme);
};

/**
 * Configura o botão de toggle para alternar o tema ao ser clicado.
 */
const setupThemeToggle = () => {
    const themeToggleBtn = document.getElementById('theme-toggle');
    // Só adiciona o evento se o botão existir na página atual
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            // Verifica se o modo escuro está ativo e alterna para o outro.
            const isDarkMode = document.documentElement.classList.contains('dark');
            applyTheme(isDarkMode ? 'light' : 'dark');
        });
    }
};

/**
 * Define o tema inicial da página assim que ela é carregada.
 */
const initializeTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    // Usa o tema salvo, ou a preferência do sistema, ou o padrão (claro).
    applyTheme(savedTheme || (systemPrefersDark ? 'dark' : 'light'));
};

// --- PONTO CHAVE DA CORREÇÃO ---
// Este evento garante que o código abaixo só será executado DEPOIS que
// todo o HTML da página estiver pronto. Isso resolve a "condição de corrida".
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    setupThemeToggle();
});
