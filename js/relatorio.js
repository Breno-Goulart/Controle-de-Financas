import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
// public/js/relatorio.js

// Início da alteração: Centralização da configuração do Firebase
// Removido firebaseConfig e initializeApp, agora importados de firebaseConfig.js
import { auth, db } from "./firebaseConfig.js"; // Importa auth e db do novo arquivo de configuração
import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    doc,
    getDoc,
    collection,
    query,
    where,
    orderBy,
    getDocs,
    Timestamp,
    startAfter,
    limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
// Fim da alteração: Centralização da configuração do Firebase

// UI Elements
const loader = document.getElementById("loader");
const mainContent = document.getElementById("mainContent");
const userName = document.getElementById("userName");
const logoutButton = document.getElementById("logoutButton");
const filterForm = document.getElementById("filterForm");
const filterFeedback = document.getElementById("filterFeedback");
const exportSection = document.getElementById("exportSection");
const reportSummary = document.getElementById("reportSummary");
const exportPdfBtn = document.getElementById("exportPdfBtn");
const exportExcelBtn = document.getElementById("exportExcelBtn");
const exportLoader = document.getElementById("exportLoader");
const exportStatus = document.getElementById("exportStatus");
const toast = document.getElementById("toast");

let currentFamiliaId = null;
let reportData = [];
const PAGE_SIZE = 100; // Carrega em lotes de 100 para a exportação

// --- UTILITY FUNCTIONS ---
const formatDate = (timestamp) => (timestamp && typeof timestamp.toDate === 'function') ? timestamp.toDate().toLocaleDateString('pt-BR') : 'N/A';
const formatCurrency = (value) => (typeof value === 'number') ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00';

const showToast = (message) => {
    toast.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
};

// --- DATA FETCHING ---
const fetchAllReportData = async () => {
    if (!currentFamiliaId) {
        // Substituído alert por showToast
        showToast("ID da família não encontrado. Faça login novamente.", "error");
        return [];
    }

    const startDateValue = document.getElementById('startDate').value;
    const endDateValue = document.getElementById('endDate').value;

    filterFeedback.classList.add("hidden");
    if (startDateValue && endDateValue && new Date(startDateValue) > new Date(endDateValue)) {
        filterFeedback.textContent = "A data inicial não pode ser maior que a data final.";
        filterFeedback.classList.remove("hidden");
        return null; // Indica erro de validação
    }

    exportLoader.classList.remove("hidden");
    exportStatus.textContent = "Coletando dados...";

    const lancamentosRef = collection(db, "artifacts", "controle-de-financas-6e2d9", "public", "data", "lancamentos");

    // Tratamento de data com UTC para evitar problemas de fuso horário
    const startDate = startDateValue ? Timestamp.fromDate(new Date(Date.UTC(
        new Date(startDateValue).getUTCFullYear(),
        new Date(startDateValue).getUTCMonth(),
        new Date(startDateValue).getUTCDate(), 0, 0, 0
    ))) : null;
    const endDate = endDateValue ? Timestamp.fromDate(new Date(Date.UTC(
        new Date(endDateValue).getUTCFullYear(),
        new Date(endDateValue).getUTCMonth(),
        new Date(endDateValue).getUTCDate(), 23, 59, 59
    ))) : null;
    const tipo = document.getElementById('tipo').value;

    let q = query(lancamentosRef, where("familiaId", "==", currentFamiliaId), orderBy("data", "desc"));

    if (startDate) q = query(q, where("data", ">=", startDate));
    if (endDate) q = query(q, where("data", "<=", endDate));
    if (tipo !== 'todos') q = query(q, where("tipo", "==", tipo));

    let allData = [];
    let lastDoc = null;
    let hasMore = true;

    while(hasMore) {
        let pageQuery = q;
        if(lastDoc) {
            pageQuery = query(q, startAfter(lastDoc), limit(PAGE_SIZE));
        } else {
            pageQuery = query(q, limit(PAGE_SIZE));
        }

        try {
            const querySnapshot = await getDocs(pageQuery);
            if(querySnapshot.empty) {
                hasMore = false;
            } else {
                allData.push(...querySnapshot.docs.map(doc => doc.data()));
                lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
                exportStatus.textContent = `Coletando dados... ${allData.length} registros encontrados.`;
            }
        } catch (error) {
            console.error("Erro ao buscar dados para o relatório:", error);
            // Substituído alert por showToast
            showToast("Falha ao buscar dados. Verifique o console para mais detalhes.", "error");
            exportLoader.classList.add("hidden");
            return null;
        }
    }

    exportLoader.classList.add("hidden");
    return allData;
};

// --- EXPORT FUNCTIONS ---
const exportToPDF = () => {
    if (reportData.length === 0) {
        // Substituído alert por showToast
        showToast("Nenhum dado para exportar. Gere um relatório primeiro.", "error");
        return;
    }

    exportLoader.classList.remove("hidden");
    exportStatus.textContent = "Gerando PDF...";

    const doc = new jsPDF(); // Removida a desestruturação de window.jspdf

    const totalReceitas = reportData.filter(l => l.tipo === 'receita').reduce((sum, l) => sum + l.valor, 0);
    const totalDespesas = reportData.filter(l => l.tipo === 'despesa').reduce((sum, l) => sum + l.valor, 0);
    const saldo = totalReceitas - totalDespesas;

    doc.setFontSize(18);
    doc.text("Relatório Financeiro", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    doc.text(`Período: ${startDate || 'Início'} a ${endDate || 'Fim'}`, 14, 30);

    const tableColumn = ["Data", "Descrição", "Categoria", "Tipo", "Valor", "Recorrente", "Obs."];
    const tableRows = [];
    reportData.forEach(item => {
        const itemData = [
            formatDate(item.data),
            item.descricao,
            item.categoria,
            item.tipo,
            formatCurrency(item.valor),
            item.recorrente ? 'Sim' : 'Não',
            item.observacao || ''
        ];
        tableRows.push(itemData);
    });

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        theme: 'striped',
        headStyles: { fillColor: [22, 160, 133] },
        columnStyles: { 6: { cellWidth: 40 } }
    });

    const finalY = doc.lastAutoTable.finalY || 50;
    doc.setFontSize(12);
    doc.text("Resumo do Período", 14, finalY + 15);
    doc.setFontSize(10);
    doc.text(`Total de Receitas: ${formatCurrency(totalReceitas)}`, 14, finalY + 22);
    doc.text(`Total de Despesas: ${formatCurrency(totalDespesas)}`, 14, finalY + 29);
    doc.setFont("helvetica", "bold");
    doc.text(`Saldo Final: ${formatCurrency(saldo)}`, 14, finalY + 36);

    doc.save("relatorio-financeiro.pdf");
    exportLoader.classList.add("hidden");
    showToast("Relatório PDF exportado com sucesso!");
};

const exportToExcel = () => {
    if (reportData.length === 0) {
        // Substituído alert por showToast
        showToast("Nenhum dado para exportar. Gere um relatório primeiro.", "error");
        return;
    }

    exportLoader.classList.remove("hidden");
    exportStatus.textContent = "Gerando Excel...";

    const formattedData = reportData.map(item => ({
        Data: formatDate(item.data),
        Descrição: item.descricao,
        Categoria: item.categoria,
        Tipo: item.tipo,
        Valor: item.valor,
        Recorrente: item.recorrente ? 'Sim' : 'Não',
        "Forma de Pagamento": item.formaPagamento,
        "Nº de Parcelas": item.parcelas,
        Observação: item.observacao
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Lançamentos");

    worksheet["!cols"] = [
        { wch: 12 }, { wch: 30 }, { wch: 20 }, { wch: 10 },
        { wch: 12 }, { wch: 10 }, { wch: 20 }, { wch: 15 }, { wch: 40 }
    ];

    XLSX.writeFile(workbook, "relatorio-financeiro.xlsx");
    exportLoader.classList.add("hidden");
    showToast("Relatório Excel exportado com sucesso!");
};


// --- EVENT LISTENERS ---
filterForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    reportData = await fetchAllReportData();

    if (reportData === null) return; // Erro de validação

    if (reportData.length > 0) {
        reportSummary.textContent = `Relatório gerado com ${reportData.length} lançamentos. Agora você pode exportar.`;
        exportSection.classList.remove('hidden');
        exportPdfBtn.disabled = false;
        exportExcelBtn.disabled = false;
    } else {
        reportSummary.textContent = "Nenhum dado encontrado para os filtros selecionados.";
        exportSection.classList.remove('hidden');
        exportPdfBtn.disabled = true;
        exportExcelBtn.disabled = true;
    }
});

exportPdfBtn.addEventListener('click', exportToPDF);
exportExcelBtn.addEventListener('click', exportToExcel);

// --- AUTHENTICATION ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        userName.textContent = user.displayName || 'Usuário';
        try {
            const userDocRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(userDocRef);

            if (docSnap.exists() && docSnap.data().familiaId) {
                currentFamiliaId = docSnap.data().familiaId;
                loader.classList.add("hidden");
                mainContent.classList.remove("hidden");
            } else {
                window.location.href = "familia.html";
            }
        } catch (error) {
            console.error("Erro ao buscar dados do usuário:", error);
            loader.textContent = "Erro ao carregar dados. Tente recarregar a página.";
        }
    } else {
        window.location.href = "login.html";
    }
});

logoutButton.addEventListener("click", async () => {
    try {
        await signOut(auth);
        window.location.href = "login.html";
    } catch (error) {
        console.error("Erro ao fazer logout:", error);
    }
});
