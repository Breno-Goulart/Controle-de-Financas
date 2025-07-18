import '../css/style.css'; // Adicionada esta linha
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { auth, db } from "/js/firebaseConfig.js";

// UI Elements
const loader = document.getElementById("loader");
const familiaContainer = document.getElementById("familiaContainer");
const familiaForm = document.getElementById("familiaForm");
const familiaIdInput = document.getElementById("familiaIdInput");
const salvarChaveButton = document.getElementById("salvarChaveButton");
const criarChaveButton = document.getElementById("criarChaveButton");
const feedbackMessage = document.getElementById("feedbackMessage");
const logoutButton = document.getElementById("logoutButton");
// Removido: const logoutButtonFamilia = document.getElementById("logoutButtonFamilia");
const userName = document.getElementById("userName");

// Elementos de erro específicos
const familiaIdInputError = document.getElementById('familiaIdInput-error');


let feedbackTimeoutId;

// Funções de feedback e formulário
const showFeedback = (message, isError = false, autoHide = true) => {
    clearTimeout(feedbackTimeoutId);
    feedbackMessage.classList.remove("hidden");
    feedbackMessage.textContent = message;

    feedbackMessage.classList.remove("bg-red-100", "text-red-800", "bg-green-100", "text-green-800");
    if (isError) {
        feedbackMessage.classList.add("bg-red-100", "text-red-800");
    } else {
        feedbackMessage.classList.add("bg-green-100", "text-green-800");
    }

    if (autoHide) {
        feedbackTimeoutId = setTimeout(() => feedbackMessage.classList.add("hidden"), 5000);
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

// Lógica de Autenticação e Redirecionamento CORRIGIDA
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Se o utilizador estiver logado, mostramos sempre o formulário de família
        // A lógica de redirecionamento automático foi removida
        if(userName) userName.textContent = user.displayName || user.email;
        loader.classList.add("hidden");
        familiaContainer.classList.remove("hidden");
    } else {
        // Se o utilizador não estiver logado, redireciona para o login
        window.location.href = "login.html";
    }
});

// Evento para o botão de criar nova chave
criarChaveButton.addEventListener("click", () => {
    familiaIdInputError.classList.add('hidden'); // Esconde erro específico
    familiaIdInput.setAttribute('aria-invalid', 'false');

    const novaChave = crypto.randomUUID().slice(0, 8).toUpperCase();
    familiaIdInput.value = novaChave;
    familiaIdInput.focus();
    showFeedback("Uma nova chave foi gerada! Clique em 'Usar esta chave' para salvar.", false);
});

// Evento para salvar a chave
familiaForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    familiaIdInput.setAttribute('aria-invalid', 'false');
    familiaIdInputError.classList.add('hidden'); // Esconde erro específico


    const chaveFamilia = familiaIdInput.value.trim();
    if (!chaveFamilia) {
        familiaIdInputError.textContent = "Por favor, insira ou crie uma chave de família.";
        familiaIdInputError.classList.remove('hidden');
        familiaIdInput.setAttribute('aria-invalid', 'true');
        familiaIdInput.focus();
        return;
    }

    const user = auth.currentUser;
    if (!user) {
        showFeedback("Sessão expirada. Redirecionando para login...", true, false);
        setTimeout(() => window.location.href = "login.html", 2000);
        return;
    }

    setFormSubmitting(familiaForm, true); // Ajustado para usar o formElement
    showFeedback("Salvando sua chave de família...", false, false);

    try {
        // IMPORTANTE: Primeiro, atualizamos o `familiaId` do utilizador
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, { familiaId: chaveFamilia }, { merge: true });

        // SEGUNDO: Garantimos que o documento da família existe na coleção "families"
        const familyDocRef = doc(db, "families", chaveFamilia);
        await setDoc(familyDocRef, { nome: `Família ${chaveFamilia}`, criadoEm: new Date() }, { merge: true });


        showFeedback("Chave salva com sucesso! Redirecionando para lançamentos...", false, false);
        setTimeout(() => {
            window.location.href = "lancamentos.html";
        }, 2000);

    } catch (error) {
        console.error("Erro ao salvar a chave de família:", error);
        showFeedback("Ocorreu um erro ao salvar. Tente novamente.", true);
        setFormSubmitting(familiaForm, false); // Ajustado para usar o formElement
    }
});

// Limpa feedback ao digitar
familiaIdInput.addEventListener('input', () => {
    familiaIdInput.setAttribute('aria-invalid', 'false');
    feedbackMessage.classList.add('hidden');
    familiaIdInputError.classList.add('hidden'); // Esconde erro específico
});

const handleLogout = async (e) => {
    e.preventDefault();
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Erro ao fazer logout:", error);
    }
}

// Logout
if(logoutButton) logoutButton.addEventListener("click", handleLogout);
// Removido: if(logoutButtonFamilia) logoutButtonFamilia.addEventListener("click", handleLogout);
