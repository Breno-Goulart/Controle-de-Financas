import '../css/style.css';
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
// public/js/relatorio.js

// Início da alteração: Centralização da configuração do Firebase
// Removido firebaseConfig e initializeApp, agora importados de firebaseConfig.js
import { auth, db } from "/js/firebaseConfig.js"; // Importa auth e db do novo arquivo de configuração
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
// NOVO: Importar 'httpsCallable' para chamar a Cloud Function
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";

// Fim da alteração: Centralização da configuração do Firebase

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

// NOVO: Inicializar o Firebase Functions
const functions = getFunctions(); // Obtém a instância do Firebase Functions
const generateReportCallable = httpsCallable(functions, 'generateReport'); // Cria uma função invocável para 'generateReport'

// --- UTILITY FUNCTIONS ---
const formatDate = (timestamp) => {
    // A Cloud Function agora retorna ISO strings, então parseamos
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    // Garante que a data seja válida antes de formatar
    if (isNaN(date.getTime())) {
        return 'Data Inválida';
    }
    return date.toLocaleDateString('pt-BR');
};
const formatCurrency = (value) => (typeof value === 'number') ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00';

const showToast = (message, isError = false) => {
    toast.textContent = message;
    toast.classList.remove('hidden', 'bg-green-600', 'bg-red-600', 'dark:bg-green-700', 'dark:bg-red-700');
    if (isError) {
        toast.classList.add('bg-red-600', 'dark:bg-red-700');
    } else {
        toast.classList.add('bg-green-600', 'dark:bg-green-700');
    }
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 4000);
};

// --- DATA FETCHING (AGORA VIA CLOUD FUNCTION) ---
const generateReportData = async () => {
    if (!familiaId) {
        showToast("Usuário não vinculado a uma família.", true);
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
    showExportLoader("Coletando dados do servidor...", true); // Mostra loader de exportação

    try {
        // NOVO: Chamar a Cloud Function para buscar os dados
        const result = await generateReportCallable({
            startDate: startDate,
            endDate: endDate,
            tipo: tipo,
        });

        const { reportData, summary } = result.data; // A Cloud Function retorna um objeto com reportData e summary

        filteredData = reportData; // Atualiza os dados filtrados com o retorno da Cloud Function

        // NOVO: Buscar usuários da família e criar um mapa (similar ao lancamentos.js)
        // Isso ainda é feito no frontend porque a Cloud Function não retorna o nome completo
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
            console.error("Erro ao carregar usuários da família para relatório (frontend):", error);
            showToast("Erro ao carregar usuários da família para exibição.", true);
            // Continua mesmo com erro, mas os nomes de usuário podem não aparecer
        }

        // Mapear nomeUsuario aos dados recebidos da Cloud Function
        filteredData.forEach(item => {
            item.nomeUsuario = usersMap[item.usuarioId] || 'Usuário Desconhecido';
        });

        reportSummary.innerHTML = `
            <p><strong>Período:</strong> ${formatDate(summary.startDate)} - ${formatDate(summary.endDate)}</p>
            <p><strong>Total de Receitas:</strong> ${formatCurrency(summary.totalReceitas)}</p>
            <p><strong>Total de Despesas:</strong> ${formatCurrency(summary.totalDespesas)}</p>
            <p><strong>Saldo:</strong> ${formatCurrency(summary.saldo)}</p>
        `;
        exportSection.classList.remove("hidden");
        exportPdfBtn.disabled = false;
        exportExcelBtn.disabled = false;
        showExportLoader("Dados carregados!", false); // Esconde loader de exportação

    } catch (error) {
        console.error("Erro ao chamar Cloud Function de relatório:", error);
        let errorMessage = "Erro ao gerar relatório. Tente novamente.";
        if (error.code === 'unauthenticated') {
            errorMessage = "Sessão expirada ou não autenticado. Por favor, faça login novamente.";
        } else if (error.code === 'invalid-argument') {
            errorMessage = error.message;
        } else if (error.code === 'permission-denied') {
            errorMessage = "Permissão negada. Você não está vinculado a uma família.";
        }
        showToast(errorMessage, true);
        exportSection.classList.add("hidden");
        showExportLoader("", false); // Esconde loader de exportação
    } finally {
        loader.classList.add("hidden");
        mainContent.classList.remove("hidden");
    }
};

// Exportar para PDF
exportPdfBtn.addEventListener("click", async () => {
    if (filteredData.length === 0) {
        showToast("Nenhum dado para exportar. Gere um relatório primeiro.", true);
        return;
    }

    showExportLoader("Gerando PDF...", true);
    exportPdfBtn.disabled = true;
    exportExcelBtn.disabled = true;

    // MODIFICADO: Definindo o PDF para A4 paisagem (landscape)
    const doc = new jsPDF('landscape', 'mm', 'a4'); // 'landscape' para horizontal, 'mm' para milímetros, 'a4' para o tamanho do papel

    const totalReceitas = filteredData.filter(l => l.tipo === 'receita' || l.tipo === 'entrada').reduce((sum, l) => sum + l.valor, 0);
    const totalDespesas = filteredData.filter(l => l.tipo === 'despesa' || l.tipo === 'saida').reduce((sum, l) => sum + l.valor, 0);
    const saldo = totalReceitas - totalDespesas;

    doc.setFontSize(18);
    doc.text("Relatório Financeiro", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    doc.text(`Período: ${formatDate(startDate)} a ${formatDate(endDate)}`, 14, 30);

    // MODIFICADO: Adicionadas colunas conforme sua solicitação e ajustado o cabeçalho
    const tableColumn = [
        "Data", "Descrição", "Categoria", "Tipo", "Valor",
        "Tipo Lanç.", "Parcelas", "Recorr.", "Frequência",
        "Data Original", "Data Fim Recorr.", "Forma Pag.", "Usuário", "Criado Em", "Obs."
    ];
    const tableRows = [];
    filteredData.forEach(item => {
        const isRecorrente = item.tipoLancamento === "recorrente";
        const isParcelado = item.tipoLancamento === "parcelado";

        const itemData = [
            formatDate(item.data),
            item.descricao || 'N/A',
            item.categoria || 'N/A',
            item.tipo || 'N/A',
            formatCurrency(item.valor),
            item.tipoLancamento || 'Normal', // Tipo de Lançamento
            isParcelado ? `${item.parcelaAtual || '?'}/${item.totalParcelas || '?'}` : 'N/A', // Parcelas
            isRecorrente ? 'Sim' : 'Não',
            isRecorrente ? (item.frequencia || 'N/A') : 'N/A', // Frequência
            isRecorrente ? 'N/A (Recorr.)' : (item.dataOriginal ? formatDate(item.dataOriginal) : 'N/A'), // Data Original
            isRecorrente ? (item.dataFim ? formatDate(item.dataFim) : 'Sem Data Fim') : 'N/A', // Data Fim Recorrência
            item.formaPagamento || 'N/A', // Forma de Pagamento
            item.nomeUsuario || '---',
            item.criadoEm ? formatDate(item.criadoEm) : 'N/A', // Criado Em
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
        // NOVO: Ajustado columnStyles para A4 paisagem (297mm de largura)
        // Distribuição de largura para 15 colunas. O total de largura de uma página A4 paisagem é ~297mm.
        // Margens padrão do autoTable são 10mm de cada lado, então 277mm disponíveis.
        columnStyles: {
            0: { cellWidth: 18 }, // Data
            1: { cellWidth: 35 }, // Descrição
            2: { cellWidth: 25 }, // Categoria
            3: { cellWidth: 15 }, // Tipo
            4: { cellWidth: 20 }, // Valor
            5: { cellWidth: 20 }, // Tipo Lanç.
            6: { cellWidth: 18 }, // Parcelas
            7: { cellWidth: 18 }, // Recorr.
            8: { cellWidth: 18 }, // Frequência
            9: { cellWidth: 20 }, // Data Original
            10: { cellWidth: 20 }, // Data Fim Recorr.
            11: { cellWidth: 25 }, // Forma Pag.
            12: { cellWidth: 25 }, // Usuário
            13: { cellWidth: 18 }, // Criado Em
            14: { cellWidth: 35 }  // Obs. (Ajustada para ser maior)
        },
        tableWidth: 'wrap', // Permite que a tabela se ajuste à largura da página
        margin: { left: 10, right: 10 }, // Margens para garantir que a tabela não transborde
        didParseCell: function (data) {
            // Centraliza o texto em colunas específicas se desejar (ex: Valor, Parcelas, Recorrência)
            if ([4, 6, 7].includes(data.column.index)) {
                data.cell.styles.halign = 'center';
            }
        }
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
    showExportLoader("Relatório PDF exportado!", false);
    showToast("Relatório PDF exportado com sucesso!");
    exportPdfBtn.disabled = false;
    exportExcelBtn.disabled = false;
});

// Exportar para Excel
exportExcelBtn.addEventListener("click", async () => {
    if (filteredData.length === 0) {
        showToast("Nenhum dado para exportar. Gere um relatório primeiro.", true);
        return;
    }

    showExportLoader("Gerando Excel...", true);
    exportPdfBtn.disabled = true;
    exportExcelBtn.disabled = true;

    const formattedData = filteredData.map(item => {
        const isRecorrente = item.tipoLancamento === "recorrente";
        const isParcelado = item.tipoLancamento === "parcelado";

        return {
            Data: formatDate(item.data),
            Descrição: item.descricao || 'N/A',
            Categoria: item.categoria || 'N/A',
            Tipo: item.tipo || 'N/A',
            Valor: item.valor,
            "Tipo Lançamento": item.tipoLancamento || 'Normal',
            "Parcelas": isParcelado ? `${item.parcelaAtual || ''}/${item.totalParcelas || ''}` : 'Não Aplicável',
            Recorrência: isRecorrente ? 'Sim' : 'Não',
            Frequência: isRecorrente ? (item.frequencia || 'N/A') : 'Não Aplicável',
            "Data Original": isRecorrente ? 'Não Aplicável (Recorrência)' : (item.dataOriginal ? formatDate(item.dataOriginal) : 'N/A'),
            "Data Fim Recorrência": isRecorrente ? (item.dataFim ? formatDate(item.dataFim) : 'Sem Data Fim') : 'Não Aplicável',
            "Forma de Pagamento": item.formaPagamento || 'N/A',
            Usuário: item.nomeUsuario || '---',
            "Criado Em": item.criadoEm ? formatDate(item.criadoEm) : 'N/A',
            Observação: item.observacao || ''
        };
    });

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Lançamentos");

    // Ajuste as larguras das colunas conforme necessário
    worksheet["!cols"] = [
        { wch: 12 }, // Data
        { wch: 30 }, // Descrição
        { wch: 20 }, // Categoria
        { wch: 10 }, // Tipo
        { wch: 12 }, // Valor
        { wch: 18 }, // Tipo Lançamento
        { wch: 15 }, // Parcelas
        { wch: 15 }, // Recorrência
        { wch: 15 }, // Frequência
        { wch: 18 }, // Data Original
        { wch: 18 }, // Data Fim Recorrência
        { wch: 20 }, // Forma Pagamento
        { wch: 20 }, // Usuário
        { wch: 18 }, // Criado Em
        { wch: 40 }  // Observação
    ];

    XLSX.writeFile(workbook, "relatorio-financeiro.xlsx");
    showExportLoader("Excel gerado!", false);
    showToast("Relatório Excel exportado com sucesso!");
    exportPdfBtn.disabled = false;
    exportExcelBtn.disabled = false;
});

const showExportLoader = (message, isLoading = true) => {
    exportLoader.classList.toggle("hidden", !isLoading);
    exportStatus.textContent = message;
};


// --- EVENT LISTENERS ---
filterForm.addEventListener('submit', async (e) => {
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

// --- AUTHENTICATION ---
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
