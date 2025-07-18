// Substitua o conteúdo de theme.js por este código
import '../css/style.css';

const applyTheme = (theme) => {
    const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
    const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');

    if (!themeToggleLightIcon || !themeToggleDarkIcon) return;

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

const initializeTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(savedTheme ? savedTheme : (systemPrefersDark ? 'dark' : 'light'));
};

const themeToggleBtn = document.getElementById('theme-toggle');
if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        const isDarkMode = document.documentElement.classList.contains('dark');
        applyTheme(isDarkMode ? 'light' : 'dark');
    });
}

initializeTheme();