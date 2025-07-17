import '../css/style.css'; // Adicionada esta linha
// public/js/configuracoes.js

// Início da alteração: Centralização da configuração do Firebase
// Removido firebaseConfig e initializeApp, agora importados de firebaseConfig.js
import { auth, db } from "./firebaseConfig.js"; // Importa auth e db do novo arquivo de configuração
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
    collection, // Adicionado para a nova função updateUserLaunches
    query,      // Adicionado para a nova função updateUserLaunches
    where,      // Adicionado para a nova função updateUserLaunches
    getDocs,    // Adicionado para a nova função updateUserLaunches
    writeBatch  // Adicionado para a nova função updateUserLaunches
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
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
    toast.className = `fixed bottom-5 right-5 text-white py-2 px-4 rounded-lg shadow-lg z-50 flex items-center ${isError ? 'bg-red-600' : 'bg-green-600'}`;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 4000);
};

const setFormSubmitting = (form, isSubmitting) => {
    const button = form.querySelector('button[type="submit"]');
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

const setInputInvalid = (input, message) => {
    input.classList.add('border-red-500', 'dark:border-red-500');
    input.focus();
    showToast(message, true);
};

const clearInputValidation = (input) => input.classList.remove('border-red-500', 'dark:border-red-500');

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

// Início da alteração: Nova função para atualizar o nome nos lançamentos antigos
const updateUserLaunches = async (userId, newDisplayName) => {
    console.log(`Iniciando a atualização de lançamentos para o usuário: ${userId}`);
    const lancamentosRef = collection(db, "artifacts", "controle-de-financas-6e2d9", "public", "data", "lancamentos");
    const q = query(lancamentosRef, where("usuarioId", "==", userId));

    try {
        const querySnapshot = await getDocs(q);
        const batch = writeBatch(db);
        let updatedCount = 0;

        querySnapshot.forEach((doc) => {
            batch.update(doc.ref, { nomeUsuario: newDisplayName });
            updatedCount++;
        });

        if (updatedCount > 0) {
            await batch.commit();
            console.log(`${updatedCount} lançamentos foram atualizados com o novo nome.`);
            showToast(`${updatedCount} lançamentos atualizados com sucesso!`);
        } else {
            console.log("Nenhum lançamento encontrado para este usuário.");
        }
    } catch (error) {
        console.error("Erro ao atualizar os lançamentos:", error);
        showToast("Ocorreu um erro ao atualizar o histórico de lançamentos.", true);
    }
};
// Fim da alteração: Nova função para atualizar o nome nos lançamentos antigos

// --- EVENT LISTENERS ---
[nomeInput, sobrenomeInput, newPasswordInput, confirmPasswordInput, familiaIdInput].forEach(input => {
    input.addEventListener('input', () => clearInputValidation(input));
});

newPasswordInput.addEventListener('input', () => updatePasswordCriteriaUI(newPasswordInput.value));

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
    const newName = nomeInput.value.trim();
    const newLastName = sobrenomeInput.value.trim();

    if (!newName || newName.length < 2 || newName.length > 50) return setInputInvalid(nomeInput, MESSAGES.lengthInvalid('Nome'));
    if (!newLastName || newLastName.length < 2 || newLastName.length > 50) return setInputInvalid(sobrenomeInput, MESSAGES.lengthInvalid('Sobrenome'));

    const newDisplayName = `${newName} ${newLastName}`; // Guarda o nome completo numa variável

    setFormSubmitting(profileForm, true);
    try {
        const userDocRef = doc(db, "users", currentUser.uid);
        await updateDoc(userDocRef, { nome: newName, sobrenome: newLastName });
        await updateProfile(currentUser, { displayName: newDisplayName });

        userName.textContent = newDisplayName;
        showToast(MESSAGES.profileUpdateSuccess);

        // Início da alteração: Chamada da nova função updateUserLaunches
        await updateUserLaunches(currentUser.uid, newDisplayName);
        // Fim da alteração: Chamada da nova função updateUserLaunches

    } catch (error) {
        console.error("Erro ao atualizar perfil:", error);
        showToast(MESSAGES.profileUpdateError, true);
    } finally {
        setFormSubmitting(profileForm, false);
    }
});

passwordForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validatePassword(newPasswordInput.value)) return setInputInvalid(newPasswordInput, MESSAGES.passwordInvalid);
    if (newPasswordInput.value !== confirmPasswordInput.value) return showToast(MESSAGES.passwordMismatch, true);

    openReauthModal('password');
});

familyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newFamiliaId = familiaIdInput.value.trim();
    if (!newFamiliaId) return setInputInvalid(familiaIdInput, MESSAGES.familyIdEmpty);

    setFormSubmitting(familyForm, true);
    try {
        const familiaExists = await checkFamiliaIdExists(newFamiliaId);
        if (!familiaExists) {
            setInputInvalid(familiaIdInput, MESSAGES.familyIdInvalid);
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

// --- THEME TOGGLE LOGIC ---
const applyTheme = (theme) => {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        themeToggleLightIcon.classList.remove('hidden');
        themeToggleDarkIcon.classList.add('hidden');
    } else {
        document.documentElement.classList.remove('dark');
        themeToggleDarkIcon.classList.remove('hidden');
        themeToggleLightIcon.classList.add('hidden');
    }
};

themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
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
