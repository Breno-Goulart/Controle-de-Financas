/**
 * @fileoverview Lógica para a página de configurações do usuário.
 * Permite ao usuário atualizar seu nome, email e senha.
 * @author Breno Goulart
 */

import { authService } from '../services/auth.service.js';
import { mostrarToast } from '../utils/ui.js';
import { applyTheme, toggleTheme } from '../utils/theme.js'; // Importa funções de tema

document.addEventListener('DOMContentLoaded', async () => {
    applyTheme(); // Aplica o tema ao carregar a página

    const user = authService.auth.currentUser;
    if (!user) {
        mostrarToast('Você precisa estar logado para acessar esta página.', 'error');
        window.location.href = 'login.html';
        return;
    }

    const profileForm = document.getElementById('profile-form');
    const passwordForm = document.getElementById('password-form');
    const themeToggle = document.getElementById('theme-toggle');
    const userIdDisplay = document.getElementById('user-id-display');

    if (userIdDisplay) {
        userIdDisplay.textContent = `Seu ID de Usuário: ${user.uid}`;
    }

    // Carregar dados do perfil
    const userProfile = await authService.getUserProfile(user.uid);
    if (userProfile && profileForm) {
        profileForm.querySelector('#name').value = userProfile.name || '';
        profileForm.querySelector('#email').value = userProfile.email || '';
    }

    // Event Listener para o formulário de atualização de perfil
    if (profileForm) {
        profileForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const newName = profileForm.querySelector('#name').value;
            const newEmail = profileForm.querySelector('#email').value;

            const submitButton = profileForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Atualizando...';

            try {
                const success = await authService.updateUserProfile(user, newName, newEmail);
                if (success) {
                    // O toast já é mostrado pelo authService
                }
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Atualizar Perfil';
            }
        });
    } else {
        console.error("Formulário de perfil não encontrado.");
    }

    // Event Listener para o formulário de atualização de senha
    if (passwordForm) {
        passwordForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const newPassword = passwordForm.querySelector('#new-password').value;
            const confirmNewPassword = passwordForm.querySelector('#confirm-new-password').value;

            if (newPassword !== confirmNewPassword) {
                mostrarToast('As novas senhas não coincidem!', 'error');
                return;
            }

            const submitButton = passwordForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Atualizando...';

            try {
                const success = await authService.updateUserPassword(user, newPassword);
                if (success) {
                    passwordForm.reset(); // Limpa o formulário após sucesso
                }
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Atualizar Senha';
            }
        });
    } else {
        console.error("Formulário de senha não encontrado.");
    }

    // Event Listener para o botão de alternar tema
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
});
