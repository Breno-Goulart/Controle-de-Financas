import '../css/style.css'; // Adicionada esta linha
// public/js/configuracoes.js

// Início da alteração: Centralização da configuração do Firebase
// Removido firebaseConfig e initializeApp, agora importados de firebaseConfig.js
import { auth, db } from "/js/firebaseConfig.js"; // Importa auth e db do novo arquivo de configuração
import {
    onAuthStateChanged,
    signOut,
    updateProfile,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    getFirestore, // Mantido para clareza, embora 'db' já esteja importado
    doc,
    getDoc,
    updateDoc,
    collection,
    query,
    where,
    getDocs,
    writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"; // Corrigido o domínio para gstatic.com
// Fim da alteração: Centralização da configuração do Firebase

// Centralized messages
const MESSAGES = {
    loadError: "Não foi possível carregar suas informações. Tente novamente mais tarde.",
    profileNotFound: "Perfil não encontrado. Por favor, preencha suas informações.",
    profileUpdateSuccess: "Perfil atualizado com sucesso!",
    profileUpdateError: "Ocorreu um erro ao atualizar o perfil. Tente novamente.",
    passwordMismatch: "As senhas não coincidem.",
    passwordInvalid: "A senha deve ter no mínimo 6 caracteres, incluindo letras e números.",
    passwordSameAsOld: "A nova senha não pode ser igual à senha atual.",
    passwordUpdateSuccess: "Senha alterada com sucesso!",
    familyIdEmpty: "O campo Chave da Família não pode estar vazio.",
    familyIdInvalid: "A Chave da Família informada não foi encontrada ou é inválida.",
    familyIdUpdateSuccess: "Chave da Família atualizada com sucesso!",
    familyIdUpdateError: "Falha ao atualizar a Chave da Família.",
    reauthPrompt: "Por favor, insira sua senha.",
    reauthWrongPassword: "Senha incorreta. Tente novamente. Esqueceu sua senha?",
    reauthNetworkError: "Erro de rede. Verifique sua conexão.",
    reauthGenericError: "Ocorreu um erro. Tente novamente.",
    reauthLockout: (seconds) => `Muitas tentativas. Tente novamente em ${seconds} segundos.`,
    emptyField: (fieldName) => `O campo ${fieldName} não pode estar vazio.`,
    lengthInvalid: (fieldName) => `${fieldName} deve ter entre 2 e 50 caracteres.`
};

// UI Elements
const loader = document.getElementById("loader");
const mainContent = document.getElementById("mainContent");
const userName = document.getElementById("userName");
const logoutButton = document.getElementById("logoutButton");
const toast = document.getElementById("toast");
const toastIcon = document.getElementById("toastIcon");
const toastMessage = document.getElementById("toastMessage");
const themeToggleBtn = document.getElementById('theme-toggle');
const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');

// Forms & Inputs
const profileForm = document.getElementById("profileForm");
const nomeInput = document.getElementById("nome");
const sobrenomeInput = document.getElementById("sobrenome");
const passwordForm = document.getElementById("passwordForm");
const newPasswordInput = document.getElementById("newPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");
const familyForm = document.getElementById("familyForm");
const familiaIdInput = document.getElementById("familiaId");
const emailInput = document.getElementById("email");

// Elementos de erro específicos
const nomeError = document.getElementById('nome-error');
const sobrenomeError = document.getElementById('sobrenome-error');
const newPasswordError = document.getElementById('newPassword-error');
const confirmPasswordError = document.getElementById('confirmPassword-error');
const familiaIdError = document.getElementById('familiaId-error');

// Password Criteria UI
const passwordCriteria = {
    charLength: document.getElementById('charLength'),
    hasNumber: document.getElementById('hasNumber'),
    hasLetter: document.getElementById('hasLetter'),
};

// Reauth Modal
const reauthModal = document.getElementById("reauthModal");
const reauthForm = document.getElementById("reauthForm");
const currentPasswordInput = document.getElementById("currentPassword");
const reauthError = document.getElementById("reauthError");
const lockoutTimer = document.getElementById("lockoutTimer");
const cancelReauthBtn = document.getElementById("cancelReauthBtn");

let currentUser = null;
let pendingAction = null;
let failedReauthAttempts = 0;
const MAX_REAUTH_ATTEMPTS = 5;
const REAUTH_LOCKOUT_DURATION = 60000;

// --- UTILITY FUNCTIONS ---
const showToast = (message, isError = false) => {
    toastMessage.textContent = message;
    toastIcon.textContent = isError ? '✕' : '✓';
    // Remove todas as classes de cor antes de adicionar as novas
    toast.classList.remove("bg-green-600", "bg-red-600", "dark:bg-green-700", "dark:bg-red-700"); 
    
    if (isError) {
        toast.classList.add("bg-red-600", "dark:bg-red-700");
    } else {
        toast.classList.add("bg-green-600", "dark:bg-green-700");
    }
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 4000);
};

const setFormSubmitting = (formElement, isSubmitting) => {
    const button = formElement.querySelector('button[type="submit"]');
    if (!button) return;
    button.disabled = isSubmitting;
    const buttonText = button.querySelector('.button-text');
    const buttonLoader = button.querySelector('.button-loader');
    if (buttonText && buttonLoader) {
        buttonText.classList.toggle('hidden', isSubmitting);
        buttonLoader.classList.toggle('hidden', !isSubmitting);
    }
};

const validatePassword = (password) => /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/.test(password);

const setInputInvalid = (input, message, errorElement) => {
    input.classList.add('border-red-500', 'dark:border-red-500');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    }
    input.focus();
    // showToast(message, true); // Removido para evitar toast duplicado com erro específico
};

const clearInputValidation = (input, errorElement) => {
    input.classList.remove('border-red-500', 'dark:border-red-500');
    if (errorElement) {
        errorElement.classList.add('hidden');
    }
};

// --- PASSWORD VALIDATION & UI ---
const updatePasswordCriteriaUI = (password) => {
    const validations = {
        length: password.length >= 6,
        number: /\d/.test(password),
        letter: /[a-zA-Z]/.test(password),
    };

    const updateCriteria = (element, isValid) => {
        element.classList.toggle('text-green-600', isValid);
        element.classList.toggle('dark:text-green-400', isValid);
        element.classList.toggle('text-gray-400', !isValid);
        element.classList.toggle('dark:text-gray-500', !isValid);
    };

    updateCriteria(passwordCriteria.charLength, validations.length);
    updateCriteria(passwordCriteria.hasNumber, validations.number);
    updateCriteria(passwordCriteria.hasLetter, validations.letter);
};

// --- MODAL & REAUTH LOGIC ---
const startLockoutTimer = () => {
    lockoutTimer.classList.remove('hidden');
    let timeLeft = REAUTH_LOCKOUT_DURATION / 1000;

    const timerInterval = setInterval(() => {
        timeLeft--;
        lockoutTimer.textContent = `Tente novamente em ${timeLeft}s`;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            lockoutTimer.classList.add('hidden');
            failedReauthAttempts = 0;
        }
    }, 1000);
};

const openReauthModal = (action) => {
    if (failedReauthAttempts >= MAX_REAUTH_ATTEMPTS) {
        showToast(MESSAGES.reauthLockout(REAUTH_LOCKOUT_DURATION / 1000), true);
        if (lockoutTimer.classList.contains('hidden')) {
             startLockoutTimer();
        }
        return;
    }
    pendingAction = action;
    reauthModal.classList.remove('hidden');
    currentPasswordInput.focus();
};

const closeReauthModal = () => {
    reauthModal.classList.add('hidden');
    reauthForm.reset();
    pendingAction = null;
    reauthError.classList.add('hidden'); // Esconde erro do modal de reautenticação
};

cancelReauthBtn.addEventListener('click', closeReauthModal);

// --- DATA HANDLING & VALIDATION ---
const checkFamiliaIdExists = async (id) => {
    if (!id) return false;
    const familyDocRef = doc(db, "families", id);
    const docSnap = await getDoc(familyDocRef);
    return docSnap.exists();
};

const loadUserData = async (user) => {
    try {
        const userDocRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            nomeInput.value = data.nome || '';
            sobrenomeInput.value = data.sobrenome || '';
            emailInput.value = user.email;
            familiaIdInput.value = data.familiaId || '';
        } else {
            showToast(MESSAGES.profileNotFound, true);
        }
        mainContent.classList.remove("hidden");
    } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error);
        showToast(MESSAGES.loadError, true);
    } finally {
        loader.classList.add("hidden");
    }
};

// --- EVENT LISTENERS ---
nomeInput.addEventListener('input', () => clearInputValidation(nomeInput, nomeError));
sobrenomeInput.addEventListener('input', () => clearInputValidation(sobrenomeInput, sobrenomeError));
newPasswordInput.addEventListener('input', () => {
    clearInputValidation(newPasswordInput, newPasswordError);
    updatePasswordCriteriaUI(newPasswordInput.value);
});
confirmPasswordInput.addEventListener('input', () => clearInputValidation(confirmPasswordInput, confirmPasswordError));
familiaIdInput.addEventListener('input', () => clearInputValidation(familiaIdInput, familiaIdError));


document.querySelectorAll('.password-toggle').forEach(button => {
    button.addEventListener('click', () => {
        const input = button.closest('.relative').querySelector('input');
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        button.setAttribute('aria-label', isPassword ? 'Ocultar senha' : 'Mostrar senha');
    });
});

profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Limpa erros anteriores
    clearInputValidation(nomeInput, nomeError);
    clearInputValidation(sobrenomeInput, sobrenomeError);

    const newName = nomeInput.value.trim();
    const newLastName = sobrenomeInput.value.trim();

    if (!newName || newName.length < 2 || newName.length > 50) {
        setInputInvalid(nomeInput, MESSAGES.lengthInvalid('Nome'), nomeError);
        return;
    }
    if (!newLastName || newLastName.length < 2 || newLastName.length > 50) {
        setInputInvalid(sobrenomeInput, MESSAGES.lengthInvalid('Sobrenome'), sobrenomeError);
        return;
    }

    const newDisplayName = `${newName} ${newLastName}`; // Guarda o nome completo numa variável

    setFormSubmitting(profileForm, true);
    try {
        const userDocRef = doc(db, "users", currentUser.uid);
        await updateDoc(userDocRef, { nome: newName, sobrenome: newLastName });
        await updateProfile(currentUser, { displayName: newDisplayName });

        userName.textContent = newDisplayName;
        showToast(MESSAGES.profileUpdateSuccess);

    } catch (error) {
        console.error("Erro ao atualizar perfil:", error);
        showToast(MESSAGES.profileUpdateError, true);
    } finally {
        setFormSubmitting(profileForm, false);
    }
});

passwordForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // Limpa erros anteriores
    clearInputValidation(newPasswordInput, newPasswordError);
    clearInputValidation(confirmPasswordInput, confirmPasswordError);

    if (!validatePassword(newPasswordInput.value)) {
        setInputInvalid(newPasswordInput, MESSAGES.passwordInvalid, newPasswordError);
        return;
    }
    if (newPasswordInput.value !== confirmPasswordInput.value) {
        setInputInvalid(confirmPasswordInput, MESSAGES.passwordMismatch, confirmPasswordError);
        // showToast(MESSAGES.passwordMismatch, true); // Já é tratado pelo setInputInvalid
        return;
    }

    openReauthModal('password');
});

familyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Limpa erros anteriores
    clearInputValidation(familiaIdInput, familiaIdError);

    const newFamiliaId = familiaIdInput.value.trim();
    if (!newFamiliaId) {
        setInputInvalid(familiaIdInput, MESSAGES.familyIdEmpty, familiaIdError);
        return;
    }

    setFormSubmitting(familyForm, true);
    try {
        const familiaExists = await checkFamiliaIdExists(newFamiliaId);
        if (!familiaExists) {
            setInputInvalid(familiaIdInput, MESSAGES.familyIdInvalid, familiaIdError);
            return;
        }

        const userDocRef = doc(db, "users", currentUser.uid);
        await updateDoc(userDocRef, { familiaId: newFamiliaId });
        showToast(MESSAGES.familyIdUpdateSuccess);
    } catch (error) {
        console.error("Erro ao atualizar familiaId:", error);
        showToast(MESSAGES.familyIdUpdateError, true);
    } finally {
        setFormSubmitting(familyForm, false);
    }
});

reauthForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    reauthError.classList.add('hidden'); // Limpa erro do modal de reautenticação

    const password = currentPasswordInput.value;
    if (!password) {
        reauthError.textContent = MESSAGES.reauthPrompt;
        reauthError.classList.remove('hidden');
        return;
    }

    if (password === newPasswordInput.value) {
        showToast(MESSAGES.passwordSameAsOld, true);
        closeReauthModal();
        return;
    }

    const credential = EmailAuthProvider.credential(currentUser.email, password);
    try {
        await reauthenticateWithCredential(currentUser, credential);
        failedReauthAttempts = 0;

        if (pendingAction === 'password') {
            await updatePassword(currentUser, newPasswordInput.value);
            showToast(MESSAGES.passwordUpdateSuccess);
            passwordForm.reset();
            updatePasswordCriteriaUI('');
        }

        closeReauthModal();
    } catch (error) {
        console.error("Erro de reautenticação:", error);
        failedReauthAttempts++;
        let message = MESSAGES.reauthGenericError;
        if (error.code === 'auth/wrong-password') message = MESSAGES.reauthWrongPassword;
        else if (error.code === 'auth/network-request-failed') message = MESSAGES.reauthNetworkError;

        if (failedReauthAttempts >= MAX_REAUTH_ATTEMPTS) {
            startLockoutTimer();
            message = MESSAGES.reauthLockout(REAUTH_LOCKOUT_DURATION / 1000);
            closeReauthModal();
            showToast(message, true);
            return;
        }

        reauthError.textContent = message;
        reauthError.classList.remove('hidden');
    }
});

// --- AUTHENTICATION ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        userName.textContent = user.displayName || 'Usuário';
        loadUserData(user);
    } else {
        window.location.replace("login.html");
    }
});

logoutButton.addEventListener("click", async () => {
    if (confirm("Tem certeza de que deseja sair?")) {
        try {
            await signOut(auth);
            window.location.replace("login.html");
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
        }
    }
});
