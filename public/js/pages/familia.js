// public/js/familia.js
// Este arquivo contém todo o código JavaScript que foi movido de public/familia.html
// Início do código JavaScript movido de public/familia.html

import { auth, db } from "./firebaseConfig.js"; // Importa auth e db do arquivo de configuração centralizado
import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    doc,
    getDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const loader = document.getElementById("loader");
const familiaContainer = document.getElementById("familiaContainer");
const familiaForm = document.getElementById("familiaForm");
const familiaIdInput = document.getElementById("familiaIdInput");
const salvarChaveButton = document.getElementById("salvarChaveButton");
const criarChaveButton = document.getElementById("criarChaveButton");
const feedbackMessage = document.getElementById("feedbackMessage");
const logoutButton = document.getElementById("logoutButton");

let feedbackTimeoutId;

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

const setFormSubmitting = (isSubmitting) => {
    salvarChaveButton.disabled = isSubmitting;
    criarChaveButton.disabled = isSubmitting;
    salvarChaveButton.textContent = isSubmitting ? "Salvando..." : "Usar esta chave";
};

// Lógica principal na verificação de estado de autenticação
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Usuário está logado, verificar se já tem familiaId
        try {
            const userDocRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(userDocRef);

            if (docSnap.exists() && docSnap.data().familiaId) {
                // Se já tem, redireciona para o lancamentos.html
                console.log("Usuário já tem familiaId. Redirecionando para lançamentos...");
                window.location.href = "./lancamentos.html";
            } else {
                // Se não tem, mostra o formulário para configurar
                loader.classList.add("hidden");
                familiaContainer.classList.remove("hidden");
            }
        } catch (error) {
            console.error("Erro ao buscar dados do usuário:", error);
            showFeedback("Erro ao carregar seus dados. Tente recarregar a página.", true, false);
            loader.classList.add("hidden");
        }
    } else {
        // Usuário não está logado, redireciona para o login
        console.log("Usuário não logado. Redirecionando para login...");
        window.location.href = "login.html";
    }
});

// Evento para o botão de criar nova chave
criarChaveButton.addEventListener("click", () => {
    const novaChave = crypto.randomUUID().slice(0, 8).toUpperCase();
    familiaIdInput.value = novaChave;
    familiaIdInput.focus();
    showFeedback("Uma nova chave foi gerada! Clique em 'Usar esta chave' para salvar.", false);
});

// Evento para salvar a chave
familiaForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    familiaIdInput.setAttribute('aria-invalid', 'false');

    const chaveFamilia = familiaIdInput.value.trim();
    if (!chaveFamilia) {
        showFeedback("Por favor, insira ou crie uma chave de família.", true);
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

    setFormSubmitting(true);
    showFeedback("Salvando sua chave de família...", false, false);

    try {
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, { familiaId: chaveFamilia }, { merge: true });

        showFeedback("Chave salva com sucesso! Redirecionando para lançamentos...", false, false);
        setTimeout(() => {
            window.location.href = "lancamentos.html";
        }, 2000);

    } catch (error) {
        console.error("Erro ao salvar a chave de família:", error);
        showFeedback("Ocorreu um erro ao salvar. Tente novamente.", true);
        setFormSubmitting(false);
    }
});

// Limpa feedback ao digitar
familiaIdInput.addEventListener('input', () => {
    familiaIdInput.setAttribute('aria-invalid', 'false');
    feedbackMessage.classList.add('hidden');
});

// Logout
logoutButton.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
        await signOut(auth);
        // onAuthStateChanged irá lidar com o redirecionamento
    } catch (error) {
        console.error("Erro ao fazer logout:", error);
        showFeedback("Erro ao tentar sair.", true);
    }
});

// Fim do código JavaScript movido
