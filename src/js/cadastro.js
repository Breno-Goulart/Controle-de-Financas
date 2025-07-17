import '../css/style.css'; // Adicionada esta linha
// public/js/cadastro.js

// Início da alteração: Centralização da configuração do Firebase
// Removido firebaseConfig e initializeApp, agora importados de firebaseConfig.js
import { auth, db } from "./firebaseConfig.js"; // Importa auth e db do novo arquivo de configuração
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
const buttonText = document.getElementById('buttonText');
const buttonLoader = document.getElementById('buttonLoader');
const feedbackMessage = document.getElementById('feedbackMessage');

let feedbackTimeoutId;

// Foco automático no primeiro campo ao carregar a página
nomeInput.focus();

const showFeedback = (message, isError = false) => {
    clearTimeout(feedbackTimeoutId);
    feedbackMessage.textContent = message;
    feedbackMessage.classList.remove('hidden');

    feedbackMessage.classList.remove('bg-green-100', 'text-green-800', 'bg-red-100', 'text-red-800');
    if (isError) {
        feedbackMessage.classList.add('bg-red-100', 'text-red-800');
    } else {
        feedbackMessage.classList.add('bg-green-100', 'text-green-800');
    }
};

const setFormSubmitting = (isSubmitting) => {
    submitButton.disabled = isSubmitting;
    if (isSubmitting) {
        buttonText.classList.add('hidden');
        buttonLoader.classList.remove('hidden');
    } else {
        buttonText.classList.remove('hidden');
        buttonLoader.classList.add('hidden');
    }
};

const inputs = [nomeInput, sobrenomeInput, emailInput, senhaInput];
inputs.forEach(input => {
    input.addEventListener('input', () => {
        input.setAttribute('aria-invalid', 'false');
        feedbackMessage.classList.add('hidden');
    });
});

cadastroForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    inputs.forEach(input => input.setAttribute('aria-invalid', 'false'));

    const nome = nomeInput.value.trim();
    const sobrenome = sobrenomeInput.value.trim();
    const email = emailInput.value.trim();
    const senha = senhaInput.value;

    if (!nome) {
        showFeedback('Por favor, preencha o campo de nome.', true);
        nomeInput.setAttribute('aria-invalid', 'true');
        nomeInput.focus();
        return;
    }
    if (!sobrenome) {
        showFeedback('Por favor, preencha o campo de sobrenome.', true);
        sobrenomeInput.setAttribute('aria-invalid', 'true');
        sobrenomeInput.focus();
        return;
    }
    if (!email) {
        showFeedback('Por favor, preencha o campo de e-mail.', true);
        emailInput.setAttribute('aria-invalid', 'true');
        emailInput.focus();
        return;
    }
    if (!senha) {
        showFeedback('Por favor, preencha o campo de senha.', true);
        senhaInput.setAttribute('aria-invalid', 'true');
        senhaInput.focus();
        return;
    }
    if (senha.length < 6) {
        showFeedback('A senha deve ter pelo menos 6 caracteres.', true);
        senhaInput.setAttribute('aria-invalid', 'true');
        senhaInput.focus();
        return;
    }

    setFormSubmitting(true);
    feedbackMessage.classList.add('hidden');

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
        showFeedback(friendlyMessage, true);
    } finally {
        setFormSubmitting(false);
    }
});
