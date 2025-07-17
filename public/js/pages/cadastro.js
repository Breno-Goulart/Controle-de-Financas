/**
 * @fileoverview Lógica para a página de cadastro de usuário.
 * @author Breno Goulart
 */

import { authService } from '../services/auth.service.js';
import { mostrarToast } from '../utils/ui.js';

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');

    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const name = registerForm.querySelector('#name').value;
            const email = registerForm.querySelector('#email').value;
            const password = registerForm.querySelector('#password').value;
            const confirmPassword = registerForm.querySelector('#confirm-password').value;

            if (password !== confirmPassword) {
                mostrarToast('As senhas não coincidem!', 'error');
                return;
            }

            // Desabilita o botão para evitar múltiplos cliques
            const submitButton = registerForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Cadastrando...';

            try {
                const user = await authService.register(email, password, name);
                if (user) {
                    // Redireciona para a página de lançamentos após o cadastro bem-sucedido
                    window.location.href = 'lancamentos.html';
                }
            } finally {
                // Reabilita o botão
                submitButton.disabled = false;
                submitButton.textContent = 'Cadastrar';
            }
        });
    } else {
        console.error("Formulário de cadastro não encontrado.");
    }
});
