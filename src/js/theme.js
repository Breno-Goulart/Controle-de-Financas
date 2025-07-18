import '../css/style.css';

// --- LÓGICA CENTRALIZADA DO TEMA ---

// Esta função aplica o tema e atualiza o ícone do botão.
const applyTheme = (theme) => {
    const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
    const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');

    // Garante que os ícones existem antes de tentar manipulá-los
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

// --- A LÓGICA CORRIGIDA ---

// Procuramos o botão no documento.
const themeToggleBtn = document.getElementById('theme-toggle');

// Se o botão existir na página atual, adicionamos a funcionalidade de clique.
if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        const isDarkMode = document.documentElement.classList.contains('dark');
        applyTheme(isDarkMode ? 'light' : 'dark');
    });
}

// Executa a inicialização do tema imediatamente.
initializeTheme();