import '../css/style.css';
// public/js/historico.js

import { auth, db } from "/js/firebaseConfig.js";
import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    collection,
    query,
    where,
    orderBy,
    getDocs,
    doc,
    getDoc,
    Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// UI Elements
const userName = document.getElementById("userName");
const logoutButton = document.getElementById("logoutButton");
const loader = document.getElementById("loader");
const mainContent = document.getElementById("mainContent");
const historicoList = document.getElementById("historicoList");
const emptyState = document.getElementById("emptyState");
const filterForm = document.getElementById("filterForm");
const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");
const categoriaInput = document.getElementById("categoria");
const tipoSelect = document.getElementById("tipo");
const filterFeedback = document.getElementById("filterFeedback");

let currentUser = null;
let familiaId = null;
let usersMap = {}; // Adicionado para armazenar nomes de usuários da família

// Função auxiliar para exibir feedback
const showFilterFeedback = (message, isError = false) => {
    filterFeedback.textContent = message;
    filterFeedback.classList.remove("hidden", "bg-red-100", "text-red-800", "bg-yellow-100", "text-yellow-800", "dark:bg-red-900/50", "dark:text-red-300", "dark:bg-yellow-900/50", "dark:text-yellow-300"); // Removidas classes dark:
    if (isError) {
        filterFeedback.classList.add("bg-red-100", "text-red-800", "dark:bg-red-900/50", "dark:text-red-300"); // Adicionadas classes dark:
    } else {
        filterFeedback.classList.add("bg-yellow-100", "text-yellow-800", "dark:bg-yellow-900/50", "dark:text-yellow-300"); // Adicionadas classes dark:
    }
    filterFeedback.classList.remove("hidden");
    setTimeout(() => {
        filterFeedback.classList.add("hidden");
    }, 5000);
};

// Formatação de moeda
const formatCurrency = (value) =>
    typeof value === "number" ?
    value.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    }) :
    "R$ 0,00";

// Formatação de data
const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    let date;
    if (timestamp.toDate) {
        date = timestamp.toDate();
    } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
        date = new Date(timestamp);
    } else {
        return "N/A";
    }
    return date.toLocaleDateString("pt-BR");
};

// Carregar lançamentos
const loadHistorico = async () => {
    if (!familiaId) {
        emptyState.textContent = "Usuário não vinculado a uma família.";
        emptyState.classList.remove("hidden");
        mainContent.classList.remove("hidden");
        loader.classList.add("hidden");
        return;
    }

    // NOVO: Buscar usuários da família e criar um mapa (similar ao lancamentos.js)
    try {
        const usersCol = collection(db, "users");
        const qUsers = query(usersCol, where("familiaId", "==", familiaId));
        const usersSnapshot = await getDocs(qUsers);
        usersMap = {}; // Limpa o mapa a cada carregamento para garantir dados frescos
        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            usersMap[doc.id] = `${userData.nome || ''} ${userData.sobrenome || ''}`.trim() || userData.email;
        });
    } catch (error) {
        console.error("Erro ao carregar usuários da família para histórico:", error);
        showFilterFeedback("Erro ao carregar usuários da família.", true);
        return;
    }

    const lancamentosCol = collection(db, "artifacts", "controle-de-financas-6e2d9", "public", "data", "lancamentos");
    let q = query(lancamentosCol, where("familiaId", "==", familiaId));

    // Aplicar filtros de data
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;

    if (startDate) {
        const startTimestamp = Timestamp.fromDate(new Date(startDate));
        q = query(q, where("data", ">=", startTimestamp));
    }
    if (endDate) {
        const endTimestamp = Timestamp.fromDate(new Date(endDate + 'T23:59:59')); // Inclui o dia inteiro
        q = query(q, where("data", "<=", endTimestamp));
    }

    // Aplicar filtro de categoria
    const categoria = categoriaInput.value.trim();
    if (categoria) {
        q = query(q, where("categoria", "==", categoria));
    }

    // Aplicar filtro de tipo
    const tipo = tipoSelect.value;
    if (tipo && tipo !== "todos") {
        if (tipo === "receita") {
            q = query(q, where("tipo", "in", ["receita", "entrada"]));
        } else if (tipo === "despesa") {
            q = query(q, where("tipo", "in", ["despesa", "saida"]));
        }
    }

    q = query(q, orderBy("data", "desc")); // Ordenar por data mais recente

    try {
        const querySnapshot = await getDocs(q);
        historicoList.innerHTML = ""; // Limpa a lista antes de adicionar novos itens
        emptyState.classList.add("hidden");

        if (querySnapshot.empty) {
            emptyState.classList.remove("hidden");
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const isReceita = data.tipo === "receita" || data.tipo === "entrada";
            const textColorClass = isReceita ? "text-green-600 dark:text-green-300" : "text-red-600 dark:text-red-300"; // Adicionado dark:text-

            // Usar o usersMap para obter o nome do usuário
            const nomeUsuario = usersMap[data.usuarioId] || 'Usuário Desconhecido';

            const row = `
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">${data.descricao || 'N/A'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${formatDate(data.data)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${data.categoria || 'N/A'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-right ${textColorClass}">${formatCurrency(data.valor)}</td>
                </tr>
            `;
            historicoList.innerHTML += row;
        });

    } catch (error) {
        console.error("Erro ao carregar histórico:", error);
        showFilterFeedback("Erro ao carregar histórico.", true);
    } finally {
        loader.classList.add("hidden");
        mainContent.classList.remove("hidden");
    }
};

// Event Listeners
filterForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    await loadHistorico();
});

logoutButton.addEventListener("click", async () => {
    try {
        await signOut(auth);
        window.location.href = "./login.html";
    } catch (error) {
        console.error("Erro ao fazer logout:", error);
        alert("Erro ao fazer logout. Tente novamente."); // Considerar usar um modal customizado
    }
});

// Auth State Observer
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        // Buscar familiaId do Firestore
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            familiaId = userDocSnap.data().familiaId || null;
            if (userName) userName.textContent = user.displayName || user.email;
            if (!familiaId) {
                showFilterFeedback("Usuário não vinculado a uma família. Por favor, configure sua família.", true);
                emptyState.textContent = "Sem dados para exibir. Usuário não vinculado a uma família.";
                emptyState.classList.remove("hidden");
                loader.classList.add("hidden");
                mainContent.classList.remove("hidden");
                return;
            }
            await loadHistorico();
        } else {
            console.error("Dados do usuário não encontrados no Firestore.");
            showFilterFeedback("Dados do usuário não encontrados. Por favor, tente novamente.", true);
            loader.classList.add("hidden");
            mainContent.classList.remove("hidden");
        }
    } else {
        window.location.href = "./login.html";
    }
});
