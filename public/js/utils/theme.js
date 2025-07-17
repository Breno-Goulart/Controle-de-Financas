/**
 * @fileoverview Módulo de utilitários para gerenciamento de tema (claro/escuro).
 * @author Breno Goulart
 */

/**
 * Aplica o tema salvo no localStorage ou o tema padrão do sistema.
 */
export function applyTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

/**
 * Alterna o tema entre claro e escuro e salva a preferência no localStorage.
 */
export function toggleTheme() {
    if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }
}
