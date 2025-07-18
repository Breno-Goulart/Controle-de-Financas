import '../css/style.css';
// public/js/relatorio.js

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
const filterForm = document.getElementById("filterForm");
const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");
const tipoSelect = document.getElementById("tipo");
const filterFeedback = document.getElementById("filterFeedback");
const exportSection = document.getElementById("exportSection");
const reportSummary = document.getElementById("reportSummary");
const exportPdfBtn = document.getElementById("exportPdfBtn");
const exportExcelBtn = document.getElementById("exportExcelBtn");
const exportLoader = document.getElementById("exportLoader");
const exportStatus = document.getElementById("exportStatus");
const toast = document.getElementById("toast");

let currentUser = null;
let familiaId = null;
let filteredData = []; // Armazena os dados filtrados para exportação
let usersMap = {}; // Para mapear UIDs a nomes de usuário

// Função auxiliar para exibir toast
const showToast = (message, isError = false) => {
    toast.textContent = message;
    // Remove todas as classes de cor antes de adicionar as novas
    toast.classList.remove("bg-green-600", "bg-red-600", "dark:bg-green-700", "dark:bg-red-700"); 
    
    if (isError) {
        toast.classList.add("bg-red-600", "dark:bg-red-700");
    } else {
        toast.classList.add("bg-green-600", "dark:bg-green-700");
    }
    toast.classList.remove("hidden");
    setTimeout(() => {
        toast.classList.add("hidden");
    }, 4000);
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

// Carregar dados para o relatório
const generateReportData = async () => {
    if (!familiaId) {
        showToast("Usuário não vinculado a uma família.", true);
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
        console.error("Erro ao carregar usuários da família para relatório:", error);
        showToast("Erro ao carregar usuários da família.", true);
        return;
    }

    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    const tipo = tipoSelect.value;

    if (!startDate || !endDate) {
        filterFeedback.textContent = "Por favor, selecione as datas inicial e final.";
        filterFeedback.classList.remove("hidden");
        return;
    }

    filterFeedback.classList.add("hidden");
    loader.classList.remove("hidden");
    mainContent.classList.add("hidden");
    exportSection.classList.add("hidden"); // Esconde a seção de exportação enquanto carrega

    const startTimestamp = Timestamp.fromDate(new Date(startDate));
    const endTimestamp = Timestamp.fromDate(new Date(endDate + 'T23:59:59'));

    const lancamentosCol = collection(db, "artifacts", "controle-de-financas-6e2d9", "public", "data", "lancamentos");
    let q = query(
        lancamentosCol,
        where("familiaId", "==", familiaId),
        where("data", ">=", startTimestamp),
        where("data", "<=", endTimestamp),
        orderBy("data", "asc")
    );

    if (tipo !== "todos") {
        if (tipo === "receita") {
            q = query(q, where("tipo", "in", ["receita", "entrada"]));
        } else if (tipo === "despesa") {
            q = query(q, where("tipo", "in", ["despesa", "saida"]));
        }
    }

    try {
        const querySnapshot = await getDocs(q);
        let totalReceitas = 0;
        let totalDespesas = 0;
        filteredData = []; // Limpa dados anteriores

        querySnapshot.forEach(docSnap => {
            const data = docSnap.data();
            // Adicionar nome do usuário ao dado filtrado
            data.nomeUsuario = usersMap[data.usuarioId] || 'Usuário Desconhecido';
            filteredData.push(data);

            if (data.tipo === "receita" || data.tipo === "entrada") {
                totalReceitas += data.valor || 0;
            } else if (data.tipo === "despesa" || data.tipo === "saida") {
                totalDespesas += data.valor || 0;
            }
        });

        const saldo = totalReceitas - totalDespesas;
        reportSummary.innerHTML = `
            <p><strong>Período:</strong> ${formatDate(startTimestamp)} - ${formatDate(endTimestamp)}</p>
            <p><strong>Total de Receitas:</strong> ${formatCurrency(totalReceitas)}</p>
            <p><strong>Total de Despesas:</strong> ${formatCurrency(totalDespesas)}</p>
            <p><strong>Saldo:</strong> ${formatCurrency(saldo)}</p>
        `;
        exportSection.classList.remove("hidden");
        exportPdfBtn.disabled = false;
        exportExcelBtn.disabled = false;

    } catch (error) {
        console.error("Erro ao gerar relatório:", error);
        showToast("Erro ao gerar relatório. Tente novamente.", true);
        exportSection.classList.add("hidden");
    } finally {
        loader.classList.add("hidden");
        mainContent.classList.remove("hidden");
    }
};

// Exportar para PDF (usando jsPDF e autoTable - simulado)
exportPdfBtn.addEventListener("click", async () => {
    showExportLoader("Gerando PDF...");
    exportPdfBtn.disabled = true;
    exportExcelBtn.disabled = true;

    // Simulação de atraso para demonstração
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Exemplo de como você usaria jsPDF e autoTable (necessitaria incluir as libs)
    // const { jsPDF } = window.jspdf;
    // const doc = new jsPDF();
    // doc.text("Relatório Financeiro", 10, 10);
    // doc.autoTable({
    //     head: [['Descrição', 'Data', 'Tipo', 'Valor', 'Usuário']],
    //     body: filteredData.map(item => [
    //         item.descricao,
    //         formatDate(item.data),
    //         item.tipo,
    //         formatCurrency(item.valor),
    //         item.nomeUsuario
    //     ])
    // });
    // doc.save("relatorio_financeiro.pdf");

    showExportLoader("PDF gerado!", false);
    showToast("Relatório PDF gerado com sucesso!");
    exportPdfBtn.disabled = false;
    exportExcelBtn.disabled = false;
});

// Exportar para Excel (usando SheetJS - simulado)
exportExcelBtn.addEventListener("click", async () => {
    showExportLoader("Gerando Excel...");
    exportPdfBtn.disabled = true;
    exportExcelBtn.disabled = true;

    // Simulação de atraso para demonstração
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Exemplo de como você usaria SheetJS (necessitaria incluir a lib)
    // const ws_data = [
    //     ['Descrição', 'Data', 'Tipo', 'Valor', 'Categoria', 'Forma de Pagamento', 'Observação', 'Usuário'],
    //     ...filteredData.map(item => [
    //         item.descricao,
    //         formatDate(item.data),
    //         item.tipo,
    //         item.valor,
    //         item.categoria,
    //         item.formaPagamento,
    //         item.observacao,
    //         item.nomeUsuario
    //     ])
    // ];
    // const ws = XLSX.utils.aoa_to_sheet(ws_data);
    // const wb = XLSX.utils.book_new();
    // XLSX.utils.book_append_sheet(wb, ws, "Relatorio");
    // XLSX.writeFile(wb, "relatorio_financeiro.xlsx");

    showExportLoader("Excel gerado!", false);
    showToast("Relatório Excel gerado com sucesso!");
    exportPdfBtn.disabled = false;
    exportExcelBtn.disabled = false;
});

const showExportLoader = (message, isLoading = true) => {
    exportLoader.classList.toggle("hidden", !isLoading);
    exportStatus.textContent = message;
};


// Event Listeners
filterForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    await generateReportData();
});

logoutButton.addEventListener("click", async () => {
    try {
        await signOut(auth);
        window.location.href = "./login.html";
    } catch (error) {
        console.error("Erro ao fazer logout:", error);
        showToast("Erro ao fazer logout.", true);
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
                showToast("Usuário não vinculado a uma família. Por favor, configure sua família.", true);
                loader.classList.add("hidden");
                mainContent.classList.remove("hidden");
                return;
            }
            // Define as datas padrão para o último mês
            const today = new Date();
            const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            startDateInput.value = firstDayOfMonth.toISOString().slice(0, 10);
            endDateInput.value = lastDayOfMonth.toISOString().slice(0, 10);

            await generateReportData();
        } else {
            console.error("Dados do usuário não encontrados no Firestore.");
            showToast("Dados do usuário não encontrados. Por favor, tente novamente.", true);
            loader.classList.add("hidden");
            mainContent.classList.remove("hidden");
        }
    } else {
        window.location.href = "./login.html";
    }
});
