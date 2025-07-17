import '../style.css'; // Adicionada esta linha
// public/js/login.js
// Este arquivo contém todo o código JavaScript que foi movido de public/login.html
// Início do código JavaScript movido de public/login.html

import { auth, db } from "./firebaseConfig.js"; // Importa auth e db do arquivo de configuração centralizado
import {
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const loader = document.getElementById("loader");
const loginContainer = document.getElementById("loginContainer");
const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const senhaInput = document.getElementById("senha");
const loginButton = document.getElementById("loginButton");
const googleLoginButton = document.getElementById("googleLoginButton");
const feedbackMessage = document.getElementById("feedbackMessage");

let feedbackTimeoutId;

const showFeedback = (message, isError = false, autoHide = true) => {
    clearTimeout(feedbackTimeoutId);
    feedbackMessage.classList.remove("hidden");
    feedbackMessage.textContent = message;

    feedbackMessage.classList.remove(
        "bg-red-100",
        "text-red-800",
        "bg-blue-100",
        "text-blue-800"
    );
    if (isError) {
        feedbackMessage.classList.add("bg-red-100", "text-red-800");
    } else {
        feedbackMessage.classList.add("bg-blue-100", "text-blue-800");
    }

    if (autoHide) {
        feedbackTimeoutId = setTimeout(() => feedbackMessage.classList.add("hidden"), 5000);
    }
};

const setFormSubmitting = (isSubmitting) => {
    loginButton.disabled = isSubmitting;
    googleLoginButton.disabled = isSubmitting;
    loginButton.textContent = isSubmitting ? "Autenticando..." : "Entrar";
};

const createUserProfileIfNotExists = async (user) => {
    const userDocRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userDocRef);
    if (!docSnap.exists()) {
        console.log("Primeiro login. Criando perfil do usuário...");
        const [nome, ...sobrenomeParts] = (user.displayName || "Novo Usuário").split(" ");
        await setDoc(userDocRef, {
            nome: nome,
            sobrenome: sobrenomeParts.join(" ") || null,
            email: user.email,
            familiaId: null,
            criadoEm: serverTimestamp(),
        });
        console.log("Perfil criado com sucesso.");
    }
    return getDoc(userDocRef);
};

const handleLoginSuccess = async (user) => {
    if (!user) return;
    showFeedback("Login bem-sucedido! Verificando seus dados...", false, false);

    try {
        const userDocSnap = await createUserProfileIfNotExists(user);

        if (userDocSnap.data()?.familiaId) {
            console.log("Usuário tem familiaId. Redirecionando para o dashboard...");
            window.location.href = "./lancamentos.html";
        } else {
            console.log("Usuário sem familiaId. Redirecionando para a configuração de família...");
            window.location.href = "./familia.html";
        }
    } catch (error) {
        console.error("Erro ao buscar/criar dados do usuário no Firestore:", error);
        showFeedback("Não foi possível verificar seus dados. Tente novamente.", true);
        setFormSubmitting(false);
    }
};

const savedEmail = localStorage.getItem("userEmail");
if (savedEmail) {
    emailInput.value = savedEmail;
}

onAuthStateChanged(auth, (user) => {
    loader.classList.remove("hidden");
    loginContainer.classList.add("hidden");

    if (user) {
        handleLoginSuccess(user);
    } else {
        loader.classList.add("hidden");
        loginContainer.classList.remove("hidden");
    }
});

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Reset previous invalid states
    emailInput.setAttribute('aria-invalid', 'false');
    senhaInput.setAttribute('aria-invalid', 'false');

    const email = emailInput.value.trim();
    const senha = senhaInput.value;

    if (!email) {
        showFeedback("Por favor, preencha o campo de e-mail.", true);
        emailInput.setAttribute('aria-invalid', 'true');
        emailInput.focus();
        return;
    }
    if (!senha) {
        showFeedback("Por favor, preencha o campo de senha.", true);
        senhaInput.setAttribute('aria-invalid', 'true');
        senhaInput.focus();
        return;
    }

    localStorage.setItem("userEmail", email);
    setFormSubmitting(true);
    showFeedback("Autenticando...", false, false);

    try {
        await signInWithEmailAndPassword(auth, email, senha);
    } catch (error) {
        console.error("Erro no login com e-mail/senha:", error.code);
        const errorMessages = {
            "auth/user-not-found": "Nenhum usuário encontrado com este e-mail.",
            "auth/wrong-password": "A senha está incorreta. Tente novamente.",
            "auth/invalid-credential": "As credenciais fornecidas são inválidas.",
        };
        const friendlyMessage =
            errorMessages[error.code] || "Ocorreu um erro ao tentar fazer login.";
        showFeedback(friendlyMessage, true);
        setFormSubmitting(false);
    }
});

googleLoginButton.addEventListener("click", async () => {
    setFormSubmitting(true);
    showFeedback("Abrindo pop-up do Google...", false, false);

    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Erro no login com Google:", error.code);
        let friendlyMessage = "Não foi possível fazer login com o Google.";
        if (error.code === "auth/popup-closed-by-user") {
            friendlyMessage = "A janela de login foi fechada antes da conclusão.";
        } else if (error.code === "auth/network-request-failed") {
            friendlyMessage = "Erro de rede. Verifique sua conexão e tente novamente.";
        }
        showFeedback(friendlyMessage, true);
        setFormSubmitting(false);
    }
});

emailInput.addEventListener("input", () => {
    feedbackMessage.classList.add("hidden");
    emailInput.setAttribute('aria-invalid', 'false');
});
senhaInput.addEventListener("input", () => {
    feedbackMessage.classList.add("hidden");
    senhaInput.setAttribute('aria-invalid', 'false');
});

// Fim do código JavaScript movido