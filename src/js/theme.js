import '../css/style.css'; // Adicionada esta linha
// --- LÓGICA CENTRALIZADA DO TEMA ---

// Esta função aplica o tema e atualiza o ícone do botão.
const applyTheme = (theme) => {
    const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
    const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');

    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        if (themeToggleLightIcon && themeToggleDarkIcon) {
            themeToggleLightIcon.classList.remove('hidden');
            themeToggleDarkIcon.classList.add('hidden');
        }
    } else {
        document.documentElement.classList.remove('dark');
        if (themeToggleLightIcon && themeToggleDarkIcon) {
            themeToggleDarkIcon.classList.remove('hidden');
            themeToggleLightIcon.classList.add('hidden');
        }
    }
    // Guarda a preferência para visitas futuras.
    localStorage.setItem('theme', theme);
};

// Esta função é chamada para definir o tema inicial da página.
const initializeTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    // Prioriza a escolha guardada, senão usa a do sistema.
    applyTheme(savedTheme ? savedTheme : (systemPrefersDark ? 'dark' : 'light'));
};

// Adiciona o 'ouvinte de evento' diretamente, sem esperar pelo DOMContentLoaded.
const themeToggleBtn = document.getElementById('theme-toggle');
if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        const isDarkMode = document.documentElement.classList.contains('dark');
        applyTheme(isDarkMode ? 'light' : 'dark');
    });
}

// Executa a inicialização do tema imediatamente para evitar o "flash" da cor errada.
initializeTheme();
