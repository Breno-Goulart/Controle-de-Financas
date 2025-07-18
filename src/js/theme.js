import '../css/style.css';

// A função 'applyTheme' permanece a mesma.
const applyTheme = (theme) => {
    const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
    const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');

    if (!themeToggleLightIcon || !themeToggleDarkIcon) {
        return;
    }

    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        themeToggleLightIcon.classList.remove('hidden');
        themeToggleDarkIcon.classList.add('hidden');
    } else {
        document.documentElement.classList.remove('dark');
        themeToggleDarkIcon.classList.remove('hidden');
        themeToggleLightIcon.classList.add('hidden');
    }
    localStorage.setItem('theme', theme);
};

// A função 'initializeTheme' permanece a mesma.
const initializeTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(savedTheme ? savedTheme : (systemPrefersDark ? 'dark' : 'light'));
};

// --- CORREÇÃO: Executar apenas quando o DOM estiver pronto ---
document.addEventListener('DOMContentLoaded', () => {
    // Agora, procuramos o botão e adicionamos o evento de clique aqui dentro.
    const themeToggleBtn = document.getElementById('theme-toggle');

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const isDarkMode = document.documentElement.classList.contains('dark');
            applyTheme(isDarkMode ? 'light' : 'dark');
        });
    }

    // A inicialização do tema também deve ocorrer aqui para garantir que os ícones sejam encontrados.
    initializeTheme();
});