import '../css/style.css'; // Adicionada esta linha
// public/js/cadastro.js

// Início da alteração: Centralização da configuração do Firebase
// Removido firebaseConfig e initializeApp, agora importados de firebaseConfig.js
import { auth, db } from "/js/firebaseConfig.js"; // Importa auth e db do novo arquivo de configuração
import {
    createUserWithEmailAndPassword,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
// Fim da alteração: Centralização da configuração do Firebase

const cadastroForm = document.getElementById('cadastroForm');
const nomeInput = document.getElementById('nome');
const sobrenomeInput = document.getElementById('sobrenome');
const emailInput = document.getElementById('email');
const senhaInput = document.getElementById('senha');
const submitButton = document.getElementById('submitButton');
const feedbackMessage = document.getElementById('feedbackMessage');

// Elementos de erro específicos
const nomeError = document.getElementById('nome-error');
const sobrenomeError = document.getElementById('sobrenome-error');
const emailError = document.getElementById('email-error');
const senhaError = document.getElementById('senha-error');


let feedbackTimeoutId;

// Foco automático no primeiro campo ao carregar a página
nomeInput.focus();

const showFeedback = (message, isError = false) => {
    clearTimeout(feedbackTimeoutId);
    feedbackMessage.textContent = message;
    feedbackMessage.classList.remove('hidden');

    // Remove todas as classes de cor antes de adicionar as novas
    feedbackMessage.classList.remove(
        'bg-green-100', 'text-green-800', 'dark:bg-green-900/50', 'dark:text-green-300',
        'bg-red-100', 'text-red-800', 'dark:bg-red-900/50', 'dark:text-red-300'
    );

    if (isError) {
        feedbackMessage.classList.add('bg-red-100', 'text-red-800', 'dark:bg-red-900/50', 'dark:text-red-300');
    } else {
        feedbackMessage.classList.add('bg-green-100', 'text-green-800', 'dark:bg-green-900/50', 'dark:text-green-300');
    }
};

// Função auxiliar para gerenciar o estado de envio de formulários
const setFormSubmitting = (formElement, isSubmitting) => {
    const button = formElement.querySelector('button[type="submit"], button[type="button"]'); // Seleciona botões de submit ou tipo button
    if (!button) return;
    button.disabled = isSubmitting;
    const buttonText = button.querySelector('#buttonText');
    const buttonLoader = button.querySelector('#buttonLoader');
    if (buttonText && buttonLoader) {
        buttonText.classList.toggle('hidden', isSubmitting);
        buttonLoader.classList.toggle('hidden', !isSubmitting);
    } else {
        // Fallback para botões sem span/div de loader
        button.textContent = isSubmitting ? "Carregando..." : button.dataset.originalText;
        if (!button.dataset.originalText) {
            button.dataset.originalText = button.textContent;
        }
    }
};

const inputs = [nomeInput, sobrenomeInput, emailInput, senhaInput];
inputs.forEach(input => {
    input.addEventListener('input', () => {
        input.setAttribute('aria-invalid', 'false');
        feedbackMessage.classList.add('hidden');
        // Esconde erros específicos ao digitar
        if (input.id === 'nome' && nomeError) nomeError.classList.add('hidden');
        if (input.id === 'sobrenome' && sobrenomeError) sobrenomeError.classList.add('hidden');
        if (input.id === 'email' && emailError) emailError.classList.add('hidden');
        if (input.id === 'senha' && senhaError) senhaError.classList.add('hidden');
    });
});

cadastroForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    inputs.forEach(input => input.setAttribute('aria-invalid', 'false'));
    // Esconde todas as mensagens de erro específicas no início do submit
    if (nomeError) nomeError.classList.add('hidden');
    if (sobrenomeError) sobrenomeError.classList.add('hidden');
    if (emailError) emailError.classList.add('hidden');
    if (senhaError) senhaError.classList.add('hidden');


    const nome = nomeInput.value.trim();
    const sobrenome = sobrenomeInput.value.trim();
    const email = emailInput.value.trim();
    const senha = senhaInput.value;

    if (!nome) {
        if (nomeError) {
            nomeError.textContent = 'Por favor, preencha o campo de nome.';
            nomeError.classList.remove('hidden');
        } else {
            showFeedback('Por favor, preencha o campo de nome.', true);
        }
        nomeInput.setAttribute('aria-invalid', 'true');
        nomeInput.focus();
        return;
    }
    if (!sobrenome) {
        if (sobrenomeError) {
            sobrenomeError.textContent = 'Por favor, preencha o campo de sobrenome.';
            sobrenomeError.classList.remove('hidden');
        } else {
            showFeedback('Por favor, preencha o campo de sobrenome.', true);
        }
        sobrenomeInput.setAttribute('aria-invalid', 'true');
        sobrenomeInput.focus();
        return;
    }
    if (!email) {
        if (emailError) {
            emailError.textContent = 'Por favor, preencha o campo de e-mail.';
            emailError.classList.remove('hidden');
        } else {
            showFeedback('Por favor, preencha o campo de e-mail.', true);
        }
        emailInput.setAttribute('aria-invalid', 'true');
        emailInput.focus();
        return;
    }
    if (!senha) {
        if (senhaError) {
            senhaError.textContent = 'Por favor, preencha o campo de senha.';
            senhaError.classList.remove('hidden');
        } else {
            showFeedback('Por favor, preencha o campo de senha.', true);
        }
        senhaInput.setAttribute('aria-invalid', 'true');
        senhaInput.focus();
        return;
    }
    if (senha.length < 6) {
        if (senhaError) {
            senhaError.textContent = 'A senha deve ter pelo menos 6 caracteres.';
            senhaError.classList.remove('hidden');
        } else {
            showFeedback('A senha deve ter pelo menos 6 caracteres.', true);
        }
        senhaInput.setAttribute('aria-invalid', 'true');
        senhaInput.focus();
        return;
    }

    setFormSubmitting(cadastroForm, true); // Ajustado para usar o formElement
    feedbackMessage.classList.add('hidden'); // Esconde o feedbackMessage geral ao iniciar o submit

    try {
        // 1. Criar usuário no Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
        const user = userCredential.user;

        // 2. Atualizar o perfil do Auth com o nome completo (displayName)
        await updateProfile(user, {
            displayName: `${nome} ${sobrenome}`
        });
        console.log('Perfil do Auth atualizado com displayName.');

        // 3. Criar documento no Firestore
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, {
            nome: nome,
            sobrenome: sobrenome,
            familiaId: null,
            criadoEm: serverTimestamp()
        });
        console.log('Documento criado no Firestore.');

        showFeedback('Cadastro realizado com sucesso! Redirecionando...');
        cadastroForm.reset();

        setTimeout(() => {
            window.location.href = './login.html';
        }, 2500);

    } catch (error) {
        console.error("Erro no cadastro:", error.code, error.message);
        const errorMessages = {
            'auth/email-already-in-use': 'Este e-mail já está em uso por outra conta.',
            'auth/invalid-email': 'O endereço de e-mail é inválido.',
            'auth/weak-password': 'A senha é muito fraca.',
        };
        const friendlyMessage = errorMessages[error.code] || 'Ocorreu um erro inesperado. Tente novamente.';
        showFeedback(friendlyMessage, true); // Continua usando o feedbackMessage geral para erros de autenticação
    } finally {
        setFormSubmitting(cadastroForm, false); // Ajustado para usar o formElement
    }
});
