import '../css/style.css'; // Adicionada esta linha
// js/lancamentos.js
// Este arquivo gerencia a lógica da página de lançamentos, incluindo CRUD, filtros e resumo financeiro.

// Início da alteração: Centralização da configuração do Firebase
// Removido firebaseConfig e initializeApp, agora importados de firebaseConfig.js
import { auth, db } from "./firebaseConfig.js"; // Importa auth e db do novo arquivo de configuração
import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    collection,
    doc,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    updateDoc,
    deleteDoc,
    Timestamp,
    writeBatch, // Import writeBatch
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
// Fim da alteração: Centralização da configuração do Firebase

// UI Elements
const userName = document.getElementById("userName");
const logoutButton = document.getElementById("logoutButton");
const lancamentosTableBody = document.getElementById("lancamentosTableBody");
const emptyState = document.getElementById("emptyState");
// Início da alteração: Remoção da variável 'message' e da função 'showMessage'
// A variável 'message' e a função 'showMessage' foram removidas pois 'mostrarToast' é o método consolidado para feedback.
// Fim da alteração: Remoção da variável 'message' e da função 'showMessage'

// Início da alteração: Referências aos elementos do resumo e link de usuário
const totalReceitasEl = document.getElementById("totalReceitas");
const totalDespesasEl = document.getElementById("totalDespesas");
const saldoAtualEl = document.getElementById("saldoAtual");
const userNameLink = document.getElementById("userNameLink"); // Novo link para configurações
// Fim da alteração: Referências aos elementos do resumo e link de usuário

// Modal de Lançamento (EDITAR/CRIAR/TRANSFERIR/EXCLUIR) Elements
const btnNovoLancamento = document.getElementById("btnNovoLancamento");
const modalLancamento = document.getElementById("modalLancamento");
const modalCloseBtn = document.getElementById("modalCloseBtn");
const lancamentoFormModal = document.getElementById("lancamentoFormModal");
const modalFormTitle = document.getElementById("modalFormTitle");
const submitModalBtn = document.getElementById("submitModalBtn");
const cancelEditModalBtn = document.getElementById("cancelEditModalBtn");

const descricaoModalInput = document.getElementById("descricaoModal");
const valorModalInput = document.getElementById("valorModal");
const dataModalInput = document.getElementById("dataModal");
const categoriaModalInput = document.getElementById("categoriaModal");
const tipoModalInput = document.getElementById("tipoModal");
const formaPagamentoModalInput = document.getElementById("formaPagamentoModal");
const observacaoModalInput = document.getElementById("observacaoModal"); // Novo campo
const tipoLancamentoModalInput = document.getElementById("tipoLancamentoModal");
const numParcelasRecorrenciasModalInput = document.getElementById("numParcelasRecorrenciasModal");
const numParcelasRecorrenciasContainer = document.getElementById("numParcelasRecorrenciasContainer");
const frequenciaRecorrenciaModalInput = document.getElementById("frequenciaRecorrenciaModal"); // Novo
const frequenciaRecorrenciaContainer = document.getElementById("frequenciaRecorrenciaContainer"); // Novo
const dataFimRecorrenciaModalInput = document.getElementById("dataFimRecorrenciaModal"); // Novo
const dataFimRecorrenciaContainer = document.getElementById("dataFimRecorrenciaContainer"); // Novo

// Ações Adicionais no Modal
const additionalActionsContainer = document.getElementById("additionalActions");
const transferUserSelect = document.getElementById("transferUserSelect");
const confirmTransferBtn = document.getElementById("confirmTransferBtn");
const deleteLaunchBtn = document.getElementById("deleteLaunchBtn");

// Filtros Elements
const filtrosForm = document.getElementById("filtrosForm");
const filterMonth = document.getElementById("filterMonth");
const filterYear = document.getElementById("filterYear");
const filterDay = document.getElementById("filterDay");
const filterCategoriaInput = document.getElementById("filterCategoria");
const filterTipoSelect = document.getElementById("filterTipo");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");

// Toast Element
const toast = document.getElementById("toast");
let toastTimeout;

// Modal de Confirmação (para exclusão)
const modalConfirmacao = document.getElementById("modalConfirmacao");
const confirmacaoMensagem = document.getElementById("confirmacaoMensagem");
const confirmacaoSim = document.getElementById("confirmacaoSim");
const confirmacaoNao = document.getElementById("confirmacaoNao");

// Garante que todos os modais comecem escondidos para prevenir problemas de cache do navegador
if (modalLancamento) modalLancamento.classList.add("hidden");
if (modalConfirmacao) modalConfirmacao.classList.add("hidden");


// State
let currentUser = null;
let familiaId = null;
let editingId = null; // ID do lançamento sendo editado
let currentLancamentos = [];
let currentUserName = null;
let currentUserId = null;
let pendingConfirmAction = null; // Armazena a ação a ser confirmada (exclusão)

// Função para exibir notificação toast (substitui a antiga showMessage)
function mostrarToast(mensagem, type = "success") { // Adicionado 'type' para consistência
    if (!toast) return;

    toast.textContent = mensagem;
    toast.classList.remove("bg-green-600", "bg-red-600"); // Limpa cores anteriores
    if (type === "success") {
        toast.classList.add("bg-green-600");
    } else if (type === "error") {
        toast.classList.add("bg-red-600");
    }
    toast.classList.add("show-toast");

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove("show-toast");
    }, 3000);
}

// Formatação
const formatCurrency = (value) =>
    typeof value === "number" ?
    value.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    }) :
    "R$ 0,00";

// Início da alteração: Limpeza de Logs de Depuração na formatDate
// Função para formatar datas de diferentes formatos para exibição (DD/MM/YYYY)
// Agora recebe o objeto de lançamento completo e prioriza ano, mes, dia
const formatDate = (launchData) => {
    try {
        // Bloco para priorizar ano, mês, dia
        if (launchData && launchData.ano !== undefined && launchData.mes !== undefined && launchData.dia !== undefined) {
            const dateObjFromFields = new Date(launchData.ano, launchData.mes - 1, launchData.dia);
            if (!isNaN(dateObjFromFields.getTime())) {
                return dateObjFromFields.toLocaleDateString("pt-BR");
            }
        }

        // Fallback: Usar a propriedade 'data' do objeto de lançamento como rawDate
        const rawDate = launchData.data;

        if (!rawDate) {
            return "N/A";
        }

        // Firebase Timestamp
        if (typeof rawDate.toDate === "function") {
            const dateObj = rawDate.toDate();
            return dateObj.toLocaleDateString("pt-BR");
        }

        // String ISO ou timestamp numérico
        if (typeof rawDate === "string" || typeof rawDate === "number") {
            const parsedDate = new Date(rawDate);
            if (!isNaN(parsedDate.getTime())) {
                return parsedDate.toLocaleDateString("pt-BR");
            }
        }

        // Objeto com seconds (ex: { seconds: 1234567890, nanoseconds: 0 }) - Isso ocorre se o Firestore não reidrata o Timestamp
        if (typeof rawDate === "object" && rawDate.seconds !== undefined && rawDate.nanoseconds !== undefined) {
            const timestamp = new Date(rawDate.seconds * 1000);
            return timestamp.toLocaleDateString("pt-BR");
        }

        return "N/A";
    } catch (e) {
        console.warn("formatDate: ERROR in CATCH BLOCK during formatting. launchData was:", launchData, "Error:", e);
        return "N/A";
    }
};
// Fim da alteração: Limpeza de Logs de Depuração na formatDate

// Início da alteração: Lógica de cálculo e exibição do resumo (updateSummary)
const updateSummary = () => {
    const totalReceitas = currentLancamentos
        .filter(l => l.tipo === "entrada" || l.tipo === "receita")
        .reduce((sum, l) => sum + (l.valor || 0), 0);

    const totalDespesas = currentLancamentos
        .filter(l => l.tipo === "saida" || l.tipo === "despesa")
        .reduce((sum, l) => sum + (l.valor || 0), 0);

    const saldoAtual = totalReceitas - totalDespesas;

    totalReceitasEl.textContent = formatCurrency(totalReceitas);
    totalDespesasEl.textContent = formatCurrency(totalDespesas);
    saldoAtualEl.textContent = formatCurrency(saldoAtual);

    // Cores para o saldo
    saldoAtualEl.classList.remove("text-green-600", "text-red-600", "text-gray-800");
    if (saldoAtual > 0) saldoAtualEl.classList.add("text-green-600");
    else if (saldoAtual < 0) saldoAtualEl.classList.add("text-red-600");
    else saldoAtualEl.classList.add("text-gray-800");
};
// Fim da alteração: Lógica de cálculo e exibição do resumo (updateSummary)


// Funções para abrir e fechar o modal de lançamento (centralizado)
function openModal() {
    // Início da alteração: Utiliza style.display para mostrar o modal
    modalLancamento.style.display = "flex";
    // Removido: modalLancamento.classList.remove("hidden");
    // Fim da alteração
    descricaoModalInput.focus();
}

function closeModal() {
    // Início da alteração: Utiliza style.display para esconder o modal
    modalLancamento.style.display = "none";
    // Removido: modalLancamento.classList.add("hidden");
    // Fim da alteração
    closeConfirmModal(); // Garante que o modal de confirmação também seja fechado
    resetFormModal();
}

// Reset formulário do modal de lançamento
function resetFormModal() {
    lancamentoFormModal.reset();
    editingId = null;
    modalFormTitle.textContent = "Novo Lançamento";
    submitModalBtn.textContent = "Salvar Lançamento";
    cancelEditModalBtn.classList.add("hidden");
    tipoLancamentoModalInput.value = "normal";
    numParcelasRecorrenciasContainer.classList.add("hidden");
    numParcelasRecorrenciasModalInput.value = 1;
    frequenciaRecorrenciaContainer.classList.add("hidden"); // Esconde frequência
    dataFimRecorrenciaContainer.classList.add("hidden"); // Esconde data fim
    additionalActionsContainer.classList.add("hidden"); // Esconde ações adicionais

    // Adiciona esta linha para garantir que o pop-up de confirmação seja sempre escondido
    if (modalConfirmacao) modalConfirmacao.classList.add("hidden");
}

// Início da alteração: Refatoração do preenchimento do modal (fillFormModal)
// Preenche formulário do modal de lançamento para edição
function fillFormModal(data) {
    editingId = data.id; // Define o ID de edição
    descricaoModalInput.value = data.descricao || "";
    valorModalInput.value = data.valor ? data.valor.toFixed(2) : "";
    dataModalInput.value = data.data instanceof Timestamp ? data.data.toDate().toISOString().slice(0, 10) : "";
    categoriaModalInput.value = data.categoria || "";
    tipoModalInput.value = data.tipo || "";
    formaPagamentoModalInput.value = data.formaPagamento || "";
    observacaoModalInput.value = data.observacao || ""; // Preenche observação

    // Substituir as condições if/else if para usar o novo campo tipoLancamento
    if (data.tipoLancamento === "parcelado") { // Usando o novo campo tipoLancamento
        tipoLancamentoModalInput.value = "parcelado";
        numParcelasRecorrenciasModalInput.value = data.totalParcelas || 1;
        numParcelasRecorrenciasContainer.classList.remove("hidden");
        frequenciaRecorrenciaContainer.classList.add("hidden"); // Esconde frequência
        dataFimRecorrenciaContainer.classList.add("hidden"); // Esconde data fim
    } else if (data.tipoLancamento === "recorrente") { // Usando o novo campo tipoLancamento
        tipoLancamentoModalInput.value = "recorrente";
        numParcelasRecorrenciasContainer.classList.add("hidden"); // Esconde para recorrente
        frequenciaRecorrenciaContainer.classList.remove("hidden"); // Mostra frequência
        dataFimRecorrenciaContainer.classList.remove("hidden"); // Mostra data fim

        frequenciaRecorrenciaModalInput.value = data.frequencia || "mensal"; // Preenche frequência
        dataFimRecorrenciaModalInput.value = data.dataFim instanceof Timestamp ? data.dataFim.toDate().toISOString().slice(0, 10) : ""; // Preenche data fim
    } else { // normal
        tipoLancamentoModalInput.value = "normal";
        numParcelasRecorrenciasContainer.classList.add("hidden");
        frequenciaRecorrenciaContainer.classList.add("hidden");
        dataFimRecorrenciaContainer.classList.add("hidden");
        numParcelasRecorrenciasModalInput.value = 1; // Reseta valor
    }

    modalFormTitle.textContent = "Editar Lançamento";
    submitModalBtn.textContent = "Salvar Alterações";
    cancelEditModalBtn.classList.remove("hidden");
    additionalActionsContainer.classList.remove("hidden"); // Mostra ações adicionais

    // Preenche o select de transferência (se o usuário não for o autor atual)
    populateTransferUsers(data.usuarioId); // Passa o ID do usuário atual para pré-selecionar

    openModal(); // Abre o modal com os dados preenchidos
}
// Fim da alteração: Refatoração do preenchimento do modal (fillFormModal)

// Funções para o modal de confirmação (para exclusão)
function openConfirmModal(message, onConfirmCallback) {
    // Início da alteração: Utiliza style.display para mostrar o modal de confirmação
    modalConfirmacao.style.display = "flex";
    // Removido: modalConfirmacao.classList.remove("hidden");
    // Fim da alteração
    confirmacaoMensagem.textContent = message;
    pendingConfirmAction = onConfirmCallback; // Armazena a callback
}

function closeConfirmModal() {
    // Início da alteração: Utiliza style.display para esconder o modal de confirmação
    modalConfirmacao.style.display = "none";
    // Removido: modalConfirmacao.classList.add("hidden");
    // Fim da alteração
    pendingConfirmAction = null; // Limpa a callback
}

// Busca usuários da mesma família e preenche o select de transferência
async function populateTransferUsers(currentAuthorUid = null) {
    transferUserSelect.innerHTML = '<option value="">Carregando usuários...</option>';
    try {
        const usersCol = collection(db, "users");
        const q = query(usersCol, where("familiaId", "==", familiaId));
        const snapshot = await getDocs(q);
        transferUserSelect.innerHTML = '<option value="">Selecione um usuário</option>'; // Opção padrão

        let foundCurrentAuthor = false;
        snapshot.docs.forEach(docSnap => {
            const userData = docSnap.data();
            const fullName = `${userData.nome || ''} ${userData.sobrenome || ''}`.trim();

            const option = document.createElement('option');
            option.value = userData.uid;
            option.textContent = fullName || userData.email;

            if (userData.uid === currentAuthorUid) {
                option.selected = true;
                foundCurrentAuthor = true;
            }
            transferUserSelect.appendChild(option);
        });

        // Se o autor atual não for encontrado (ex: usuário excluído), selecione a opção padrão
        if (!foundCurrentAuthor && currentAuthorUid) {
            transferUserSelect.value = ""; // Garante que nada esteja selecionado se o autor não estiver na lista
        }

    } catch (error) {
        console.error("Erro ao carregar usuários para transferência:", error);
        transferUserSelect.innerHTML = '<option value="">Erro ao carregar usuários</option>';
        mostrarToast("Erro ao carregar usuários para transferência.", "error");
    }
}


// Substitua a sua função renderLancamentos inteira por esta
function renderLancamentos(lancamentos) {
    lancamentosTableBody.innerHTML = ""; // Limpa o corpo da tabela
    emptyState.classList.toggle("hidden", lancamentos.length > 0);

    if (lancamentos.length === 0) {
        return;
    }

    // Agrupamento por ano e mês
    const groupedLancamentos = {}; // { 'YYYY-MM': [lancamento1, ...] }

    lancamentos.forEach(l => {
        const date = l.data instanceof Timestamp ? l.data.toDate() : new Date(l.data);
        const year = date.getFullYear();
        const month = date.getMonth(); // 0-indexed month
        const groupKey = `${year}-${String(month).padStart(2, '0')}`;

        if (!groupedLancamentos[groupKey]) {
            groupedLancamentos[groupKey] = [];
        }
        groupedLancamentos[groupKey].push(l);
    });

    // Ordena os grupos de meses (do mais recente para o mais antigo)
    const sortedGroupKeys = Object.keys(groupedLancamentos).sort().reverse();

    sortedGroupKeys.forEach(groupKey => {
        const [year, month] = groupKey.split('-').map(Number);
        const monthName = new Date(year, month).toLocaleString('pt-BR', { month: 'long' });
        
        // Cria o cabeçalho do grupo (ex: "Julho de 2024")
        const groupHeader = document.createElement('tr');
        groupHeader.innerHTML = `
            <td colspan="9" class="bg-gray-200 dark:bg-gray-700 font-bold text-gray-800 dark:text-white p-2 sticky top-0 z-10">
                ${monthName.charAt(0).toUpperCase() + monthName.slice(1)} de ${year}
            </td>
        `;
        lancamentosTableBody.appendChild(groupHeader);
        
        // Ordena os lançamentos dentro de cada mês
        const lancamentosDoMes = groupedLancamentos[groupKey];
        lancamentosDoMes.sort((a, b) => (b.data.toDate ? b.data.toDate() : new Date(b.data)) - (a.data.toDate ? a.data.toDate() : new Date(a.data)));

        lancamentosDoMes.forEach(l => {
            const isReceita = l.tipo === "receita" || l.tipo === "entrada";
            const textColor = isReceita ? "text-green-600" : "text-red-600";

            const row = document.createElement("tr");
            row.classList.add('cursor-pointer', 'dark:hover:bg-gray-600');
            row.addEventListener("click", () => fillFormModal(l));

            // ⭐ Ponto principal da alteração: a célula da data
            const dataCellHTML = `
                <td>
                    ${formatDate(l)}
                    ${l.tipoLancamento === 'parcelado' && l.dataOriginal ? `<br><small class="text-gray-500 dark:text-gray-400">Compra: ${formatDate({ data: l.dataOriginal })}</small>` : ''}
                </td>
            `;

            row.innerHTML = `
                ${dataCellHTML}
                <td>${l.descricao || "N/A"}</td>
                <td>${l.tipoLancamento === "parcelado" ? `${l.parcelaAtual}/${l.totalParcelas}` : 'Não'}</td>
                <td class="${textColor}">${formatCurrency(l.valor)}</td>
                <td>${l.tipo || "N/A"}</td>
                <td>${l.categoria || "N/A"}</td>
                <td>${l.formaPagamento || "N/A"}</td>
                <td>${l.tipoLancamento === "recorrente" ? 'Sim' : 'Não'}</td>
                <td>${l.nomeUsuario || '---'}</td>
            `;

            lancamentosTableBody.appendChild(row);
        });
    });
}

// Popula os filtros de ano dinamicamente
const populateYearFilter = () => {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 5; // Anos para trás
    const endYear = currentYear + 1; // Anos para frente, incluindo o próximo

    filterYear.innerHTML = '<option value="">Todos</option>';
    for (let year = currentYear; year >= startYear; year--) {
        const option = document.createElement("option");
        option.value = year;
        option.textContent = year;
        filterYear.appendChild(option);
    }
};

// Seta o mês e ano atual nos filtros ao carregar
const setCurrentMonthAndYearFilters = () => {
    const today = new Date();
    filterMonth.value = (today.getMonth() + 1).toString();
    filterYear.value = today.getFullYear().toString();
    filterDay.value = "";
};

// Coleta os filtros atuais do formulário
const getCurrentFilters = () => {
    return {
        month: filterMonth.value,
        year: filterYear.value,
        day: filterDay.value,
        categoria: filterCategoriaInput.value.trim(),
        tipo: filterTipoSelect.value,
    };
};

/**
 * Busca lançamentos do Firestore com base nos filtros fornecidos.
 * @param {object} filters Objeto contendo os filtros ativos (month, year, day, categoria, tipo).
 */
async function loadLancamentos(filters = {}) {
    if (!familiaId) {
        console.warn("familiaId não disponível. Não foi possível carregar lançamentos.");
        emptyState.textContent = "Sem dados para exibir. Usuário não vinculado a uma família.";
        emptyState.classList.remove("hidden");
        return;
    }

    const lancamentosCol = collection(db, "artifacts", "controle-de-financas-6e2d9", "public", "data", "lancamentos");
    let q = query(lancamentosCol, where("familiaId", "==", familiaId));

    // Aplicar filtros de data usando mes e ano
    const selectedMonth = parseInt(filters.month);
    const selectedYear = parseInt(filters.year);
    const selectedDay = parseInt(filters.day);

    if (selectedYear) {
        q = query(q, where("ano", "==", selectedYear));
        if (selectedMonth) {
            q = query(q, where("mes", "==", selectedMonth));
        }
    }

    // Aplicar filtro de tipo
    if (filters.tipo && filters.tipo !== "todos") {
        if (filters.tipo === "receita") {
            q = query(q, where("tipo", "in", ["receita", "entrada"]));
        } else if (filters.tipo === "despesa") {
            q = query(q, where("tipo", "in", ["despesa", "saida"]));
        }
    }

    // Aplicar filtro de categoria
    if (filters.categoria) {
        q = query(q, where("categoria", "==", filters.categoria));
    }

    // Ordenar sempre por data para consistência na exibição
    q = query(q, orderBy("data", "desc"));

    try {
        const snapshot = await getDocs(q);
        let fetchedLancamentos = snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            data.id = docSnap.id;
            if (data.data && !(data.data instanceof Timestamp)) {
                data.data = new Timestamp(data.data.seconds, data.data.nanoseconds);
            }
            if (data.dataOriginal && !(data.dataOriginal instanceof Timestamp)) {
                data.dataOriginal = new Timestamp(data.dataOriginal.seconds, data.dataOriginal.nanoseconds);
            }
            return data;
        });

        // Filtragem local por dia, se um dia específico for selecionado
        if (selectedDay) {
            fetchedLancamentos = fetchedLancamentos.filter(l => {
                const dateObj = l.data instanceof Timestamp ? l.data.toDate() : new Date(l.data);
                return dateObj.getDate() === selectedDay;
            });
        }

        currentLancamentos = fetchedLancamentos;
        renderLancamentos(currentLancamentos);
        // Início da alteração: Chamar updateSummary após carregar e renderizar os lançamentos
        updateSummary();
        // Fim da alteração: Chamar updateSummary após carregar e renderizar os lançamentos
    } catch (error) {
        console.error("Erro ao carregar lançamentos:", error);
        mostrarToast("Erro ao carregar lançamentos.", "error");
    }
}

// Adicionar ou editar lançamento (agora usando o formulário do modal)
lancamentoFormModal.addEventListener("submit", async (e) => {
    e.preventDefault();
    const descricao = descricaoModalInput.value.trim();
    const valor = parseFloat(valorModalInput.value);
    const dataValue = dataModalInput.value;
    const categoria = categoriaModalInput.value.trim();
    const tipo = tipoModalInput.value;
    const formaPagamento = formaPagamentoModalInput.value.trim();
    const observacao = observacaoModalInput.value.trim();
    const tipoLancamento = tipoLancamentoModalInput.value;
    let numParcelasRecorrencias = parseInt(numParcelasRecorrenciasModalInput.value); // Usar let para poder ajustar
    const frequencia = frequenciaRecorrenciaModalInput.value; // Captura frequência
    const dataFimValue = dataFimRecorrenciaModalInput.value; // Captura data fim

    if (!descricao || isNaN(valor) || valor <= 0 || !dataValue || !tipo) {
        mostrarToast("Preencha todos os campos corretamente.", "error");
        return;
    }
    // Validação para tipo de lançamento e número de parcelas/recorrências
    if ((tipoLancamento === "parcelado" || tipoLancamento === "recorrente") && (isNaN(numParcelasRecorrencias) || numParcelasRecorrencias <= 0)) {
        mostrarToast("Para lançamentos parcelados/recorrentes, o número de parcelas/recorrências deve ser maior que zero.", "error");
        return;
    }
    // Se for um lançamento normal, mas os campos de parcelamento/recorrência estão visíveis, garantir que não sejam enviados dados inválidos
    if (tipoLancamento === "normal" && !numParcelasRecorrenciasContainer.classList.contains("hidden")) {
        numParcelasRecorrenciasModalInput.value = 1; // Forçar reset do valor
        numParcelasRecorrencias = 1; // Ajustar a variável também
    }
    // Se for recorrente e o número não foi especificado, usar 12 como padrão
    if (tipoLancamento === "recorrente" && (isNaN(numParcelasRecorrencias) || numParcelasRecorrencias <= 0)) {
        numParcelasRecorrencias = 12;
    }


    // Ajuste na criação da data original para evitar problemas de fuso horário
    const [year, month, day] = dataValue.split("-").map(Number);
    const originalDate = new Date(year, month - 1, day); // Data original do lançamento
    const dataFimTimestamp = dataFimValue ? Timestamp.fromDate(new Date(dataFimValue)) : null; // Converte dataFim para Timestamp

    try {
        const lancamentosCol = collection(db, "artifacts", "controle-de-financas-6e2d9", "public", "data", "lancamentos");
        const batch = writeBatch(db); // Inicia um batch para operações atômicas

        if (editingId) {
            // Lógica de edição para um lançamento existente
            const docRef = doc(db, "artifacts", "controle-de-financas-6e2d9", "public", "data", "lancamentos", editingId);
            const originalDocSnap = await getDoc(docRef);
            const originalData = originalDocSnap.data();

            // Campos básicos que sempre podem ser atualizados
            const commonUpdateData = {
                descricao, // Descrição pura
                valor,
                data: Timestamp.fromDate(originalDate), // Data do lançamento/parcela atual
                categoria: categoria || null,
                tipo,
                formaPagamento: formaPagamento || null,
                observacao: observacao || null,
                mes: originalDate.getMonth() + 1,
                ano: originalDate.getFullYear(),
                dia: originalDate.getDate(), // Adicionado para consistência na edição
            };

            // Início da alteração: Ajuste da lógica de edição para usar tipoLancamento
            if (originalData.tipoLancamento === "normal") { // Usando o novo campo tipoLancamento
                if (tipoLancamento === "normal") {
                    // Continua sendo normal, apenas atualiza os campos
                    const updatedData = {
                        ...commonUpdateData,
                        dataOriginal: Timestamp.fromDate(originalDate),
                        tipoLancamento: "normal", // Garante que o tipo seja mantido
                        uidParceladoOriginal: null,
                        uidRecorrenteOriginal: null,
                    };
                    batch.update(docRef, updatedData);
                    mostrarToast("Lançamento normal atualizado com sucesso.");
                } else {
                    // Lançamento normal foi alterado para parcelado ou recorrente
                    // Excluir o documento original e criar a nova série
                    batch.delete(docRef); // Exclui o lançamento original

                    const newUid = crypto.randomUUID(); // Novo ID de grupo para a nova série

                    if (tipoLancamento === "parcelado") {
                        for (let i = 0; i < numParcelasRecorrencias; i++) {
                            const installmentDate = new Date(originalDate.getFullYear(), originalDate.getMonth() + i, originalDate.getDate());
                            if (installmentDate.getMonth() !== (originalDate.getMonth() + i) % 12) {
                                installmentDate.setDate(0);
                            }
                            let currentDocRef;
                            // A primeira parcela é o mestre, seu ID será o UID da série
                            if (i === 0) {
                                currentDocRef = doc(collection(db, "artifacts", "controle-de-financas-6e2d9", "public", "data", "lancamentos"), newUid);
                            } else {
                                // As parcelas subsequentes recebem um ID auto-gerado
                                currentDocRef = doc(collection(db, "artifacts", "controle-de-financas-6e2d9", "public", "data", "lancamentos"));
                            }

                            batch.set(currentDocRef, {
                                descricao: descricao, // Descrição pura
                                valor,
                                data: Timestamp.fromDate(installmentDate),
                                categoria: categoria || null,
                                tipo,
                                formaPagamento: formaPagamento || null,
                                observacao: observacao || null,
                                familiaId,
                                tipoLancamento: "parcelado", // Novo campo para padronizar o tipo
                                uidParceladoOriginal: newUid, // Renomeado de uidLancamentoOriginal
                                parcelaAtual: i + 1,
                                totalParcelas: numParcelasRecorrencias,
                                uidRecorrenteOriginal: null, // Explicitamente null para parcelados
                                mes: installmentDate.getMonth() + 1,
                                ano: installmentDate.getFullYear(),
                                dia: installmentDate.getDate(),
                                dataOriginal: Timestamp.fromDate(originalDate),
                                criadoEm: Timestamp.now(),
                                nomeUsuario: currentUserName,
                                usuarioId: currentUserId,
                            });
                        }
                        mostrarToast(`${numParcelasRecorrencias} parcelas adicionadas (convertidas) com sucesso.`);
                    } else if (tipoLancamento === "recorrente") {
                        const numRecorrenciasToCreate = numParcelasRecorrencias > 0 ? numParcelasRecorrencias : 12;
                        // Cria o mestre recorrente
                        const masterDocRef = doc(collection(db, "artifacts", "controle-de-financas-6e2d9", "public", "data", "lancamentos"));
                        batch.set(masterDocRef, {
                            descricao: descricao, // Descrição pura do mestre
                            valor,
                            data: Timestamp.fromDate(originalDate), // Data do mestre
                            categoria: categoria || null,
                            tipo,
                            formaPagamento: formaPagamento || null,
                            observacao: observacao || null,
                            familiaId,
                            tipoLancamento: "recorrente", // Novo campo para padronizar o tipo
                            uidParceladoOriginal: null, // Explicitamente null para recorrentes
                            uidRecorrenteOriginal: masterDocRef.id,
                            frequencia: frequencia || "mensal", // Frequência do mestre
                            dataFim: dataFimTimestamp, // Data fim do mestre
                            mes: originalDate.getMonth() + 1,
                            ano: originalDate.getFullYear(),
                            dia: originalDate.getDate(),
                            criadoEm: Timestamp.now(),
                            nomeUsuario: currentUserName,
                            usuarioId: currentUserId,
                        });
                        mostrarToast(`Série convertida para ${numRecorrenciasToCreate} lançamentos recorrentes.`);
                    }
                }
            } else { // Lançamento original era parcelado ou recorrente
                // A edição de tipo de série ou número de parcelas/recorrências para
                // lançamentos já em série será tratada como exclusão da série antiga
                // e criação de uma nova, se o tipo ou o número de parcelas/recorrências mudar.
                // Caso contrário, apenas atualiza os campos comuns do documento individual.

                let shouldRecreateSeries = false;
                if (originalData.tipoLancamento === "parcelado" && tipoLancamento === "recorrente") { // De parcelado para recorrente
                    shouldRecreateSeries = true;
                } else if (originalData.tipoLancamento === "recorrente" && tipoLancamento === "parcelado") { // De recorrente para parcelado
                    shouldRecreateSeries = true;
                } else if (originalData.tipoLancamento === "parcelado" && tipoLancamento === "parcelado" && originalData.totalParcelas !== numParcelasRecorrencias) { // Parcelado, mas mudou o número de parcelas
                    shouldRecreateSeries = true;
                } else if (originalData.tipoLancamento === "recorrente" && tipoLancamento === "recorrente" && (originalData.frequencia !== frequencia || !originalData.dataFim?.isEqual(dataFimTimestamp))) { // Recorrente, mas mudou frequência/dataFim
                    shouldRecreateSeries = true;
                } else if (originalData.tipoLancamento !== tipoLancamento) { // Mudou para normal
                    shouldRecreateSeries = true;
                }


                if (shouldRecreateSeries) {
                    const queryField = originalData.tipoLancamento === "parcelado" ? "uidParceladoOriginal" : "uidRecorrenteOriginal";
                    const queryValue = originalData.tipoLancamento === "parcelado" ? originalData.uidParceladoOriginal : originalData.uidRecorrenteOriginal;

                    // Validação de queryValue na recriação de séries
                    if (queryValue === undefined || queryValue === null) {
                        console.error("Erro (Cliente): Lançamento em série sem UID de agrupamento válido para recriação. ID do documento:", editingId, "Dados:", originalData);
                        mostrarToast("Erro ao recriar série: Lançamento mal formatado. Não foi possível consultar a série original.", "error");
                        closeModal();
                        await loadLancamentos(getCurrentFilters());
                        return; // Sai da função para evitar o erro do where()
                    }

                    const qSeries = query(lancamentosCol, where(queryField, "==", queryValue));
                    const seriesSnapshot = await getDocs(qSeries);
                    seriesSnapshot.docs.forEach(docToDelete => {
                        batch.delete(doc(lancamentosCol, docToDelete.id));
                    });

                    const newUid = crypto.randomUUID(); // Novo UID para a nova série
                    if (tipoLancamento === "parcelado") {
                        for (let i = 0; i < numParcelasRecorrencias; i++) {
                            const installmentDate = new Date(originalDate.getFullYear(), originalDate.getMonth() + i, originalDate.getDate());
                            if (installmentDate.getMonth() !== (originalDate.getMonth() + i) % 12) {
                                installmentDate.setDate(0);
                            }
                            let currentDocRef;
                            // A primeira parcela é o mestre, seu ID será o UID da série
                            if (i === 0) {
                                currentDocRef = doc(collection(db, "artifacts", "controle-de-financas-6e2d9", "public", "data", "lancamentos"), newUid);
                            } else {
                                // As parcelas subsequentes recebem um ID auto-gerado
                                currentDocRef = doc(collection(db, "artifacts", "controle-de-financas-6e2d9", "public", "data", "lancamentos"));
                            }

                            batch.set(currentDocRef, {
                                descricao: descricao, // Descrição pura
                                valor,
                                data: Timestamp.fromDate(installmentDate),
                                categoria: categoria || null,
                                tipo,
                                formaPagamento: formaPagamento || null,
                                observacao: observacao || null,
                                familiaId,
                                tipoLancamento: "parcelado", // Novo campo para padronizar o tipo
                                uidParceladoOriginal: newUid, // Renomeado de uidLancamentoOriginal
                                parcelaAtual: i + 1,
                                totalParcelas: numParcelasRecorrencias,
                                uidRecorrenteOriginal: null, // Explicitamente null para parcelados
                                mes: installmentDate.getMonth() + 1,
                                ano: installmentDate.getFullYear(),
                                dia: installmentDate.getDate(),
                                dataOriginal: Timestamp.fromDate(originalDate),
                                criadoEm: Timestamp.now(),
                                nomeUsuario: currentUserName,
                                usuarioId: currentUserId,
                            });
                        }
                        mostrarToast(`Série convertida para ${numParcelasRecorrencias} parcelas.`);
                    } else if (tipoLancamento === "recorrente") {
                        const numRecorrenciasToCreate = numParcelasRecorrencias > 0 ? numParcelasRecorrencias : 12;
                        // Cria o mestre recorrente
                        const masterDocRef = doc(collection(db, "artifacts", "controle-de-financas-6e2d9", "public", "data", "lancamentos"));
                        batch.set(masterDocRef, {
                            descricao: descricao, // Descrição pura do mestre
                            valor,
                            data: Timestamp.fromDate(originalDate), // Data do mestre
                            categoria: categoria || null,
                            tipo,
                            formaPagamento: formaPagamento || null,
                            observacao: observacao || null,
                            familiaId,
                            tipoLancamento: "recorrente", // Novo campo para padronizar o tipo
                            uidParceladoOriginal: null, // Explicitamente null para recorrentes
                            uidRecorrenteOriginal: masterDocRef.id,
                            frequencia: frequencia || "mensal", // Frequência do mestre
                            dataFim: dataFimTimestamp, // Data fim do mestre
                            mes: originalDate.getMonth() + 1,
                            ano: originalDate.getFullYear(),
                            dia: originalDate.getDate(),
                            criadoEm: Timestamp.now(),
                            nomeUsuario: currentUserName,
                            usuarioId: currentUserId,
                        });
                        mostrarToast(`Série convertida para ${numRecorrenciasToCreate} lançamentos recorrentes.`);
                    } else { // Convertido para normal
                        const dataTimestamp = Timestamp.fromDate(originalDate);
                        const newDocRef = doc(collection(db, "artifacts", "controle-de-financas-6e2d9", "public", "data", "lancamentos"));
                        batch.set(newDocRef, {
                            descricao,
                            valor,
                            data: dataTimestamp,
                            categoria: categoria || null,
                            tipo,
                            formaPagamento: formaPagamento || null,
                            observacao: observacao || null,
                            familiaId,
                            tipoLancamento: "normal",
                            uidParceladoOriginal: null,
                            uidRecorrenteOriginal: null,
                            mes: originalDate.getMonth() + 1,
                            ano: originalDate.getFullYear(),
                            dia: originalDate.getDate(),
                            dataOriginal: Timestamp.fromDate(originalDate),
                            criadoEm: Timestamp.now(),
                            nomeUsuario: currentUserName,
                            usuarioId: currentUserId,
                        });
                        mostrarToast("Lançamento normal convertido e atualizado com sucesso.");
                    }
                }
            }
            // Fim da alteração: Ajuste da lógica de edição para usar tipoLancamento
        } else {
            // Início da alteração: Refatoração da lógica de criação de lançamentos
            const seriesUid = crypto.randomUUID(); // Este será o UID para toda a série parcelada

            if (tipoLancamento === "parcelado") {
                for (let i = 0; i < numParcelasRecorrencias; i++) {
                    const installmentDate = new Date(originalDate.getFullYear(), originalDate.getMonth() + i, originalDate.getDate());
                    if (installmentDate.getMonth() !== (originalDate.getMonth() + i) % 12) {
                        installmentDate.setDate(0);
                    }

                    let currentDocRef;
                    // A primeira parcela é o mestre, seu ID será o UID da série
                    if (i === 0) {
                        currentDocRef = doc(collection(db, "artifacts", "controle-de-financas-6e2d9", "public", "data", "lancamentos"), seriesUid);
                    } else {
                        // As parcelas subsequentes recebem um ID auto-gerado
                        currentDocRef = doc(collection(db, "artifacts", "controle-de-financas-6e2d9", "public", "data", "lancamentos"));
                    }

                    batch.set(currentDocRef, {
                        descricao,
                        valor,
                        data: Timestamp.fromDate(installmentDate),
                        categoria: categoria || null,
                        tipo,
                        formaPagamento: formaPagamento || null,
                        observacao: observacao || null,
                        familiaId,
                        tipoLancamento: "parcelado", // Novo campo para padronizar o tipo
                        uidParceladoOriginal: seriesUid, // Renomeado de uidLancamentoOriginal
                        parcelaAtual: i + 1,
                        totalParcelas: numParcelasRecorrencias,
                        uidRecorrenteOriginal: null, // Explicitamente null para parcelados
                        mes: installmentDate.getMonth() + 1,
                        ano: installmentDate.getFullYear(),
                        dia: installmentDate.getDate(),
                        dataOriginal: Timestamp.fromDate(originalDate),
                        criadoEm: Timestamp.now(),
                        nomeUsuario: currentUserName,
                        usuarioId: currentUserId,
                    });
                }
                mostrarToast(`${numParcelasRecorrencias} parcelas adicionadas com sucesso.`);
            } else if (tipoLancamento === "recorrente") {
                const numRecorrenciasToCreate = numParcelasRecorrencias > 0 ? numParcelasRecorrencias : 12;
                // Para lançamentos recorrentes, o mestre é criado primeiro
                const masterDocRef = doc(collection(db, "artifacts", "controle-de-financas-6e2d9", "public", "data", "lancamentos"));
                batch.set(masterDocRef, {
                    descricao,
                    valor,
                    data: Timestamp.fromDate(originalDate),
                    categoria: categoria || null,
                    tipo,
                    formaPagamento: formaPagamento || null,
                    observacao: observacao || null,
                    familiaId,
                    tipoLancamento: "recorrente", // Novo campo para padronizar o tipo
                    uidParceladoOriginal: null, // Explicitamente null para recorrentes
                    uidRecorrenteOriginal: masterDocRef.id,
                    frequencia: frequencia || "mensal",
                    dataFim: dataFimTimestamp,
                    mes: originalDate.getMonth() + 1,
                    ano: originalDate.getFullYear(),
                    dia: originalDate.getDate(),
                    criadoEm: Timestamp.now(),
                    nomeUsuario: currentUserName,
                    usuarioId: currentUserId,
                });
                mostrarToast(`Lançamento recorrente mestre adicionado. ${numRecorrenciasToCreate} ocorrências serão geradas.`);
            } else { // normal
                const dataTimestamp = Timestamp.fromDate(originalDate);
                const newDocRef = doc(collection(db, "artifacts", "controle-de-financas-6e2d9", "public", "data", "lancamentos"));
                batch.set(newDocRef, {
                    descricao,
                    valor,
                    data: dataTimestamp,
                    categoria: categoria || null,
                    tipo,
                    formaPagamento: formaPagamento || null,
                    observacao: observacao || null,
                    familiaId,
                    tipoLancamento: "normal", // Novo campo para padronizar o tipo
                    uidParceladoOriginal: null, // Explicitamente null para normais
                    uidRecorrenteOriginal: null, // Explicitamente null para normais
                    mes: originalDate.getMonth() + 1,
                    ano: originalDate.getFullYear(),
                    dia: originalDate.getDate(),
                    dataOriginal: Timestamp.fromDate(originalDate),
                    criadoEm: Timestamp.now(),
                    nomeUsuario: currentUserName,
                    usuarioId: currentUserId,
                });
                mostrarToast("Lançamento adicionado com sucesso.");
            }
            // Fim da alteração: Refatoração da lógica de criação de lançamentos
        }
        await batch.commit(); // Executa todas as operações do batch
        closeModal();
        await loadLancamentos(getCurrentFilters());
    } catch (error) {
        console.error("Erro ao salvar lançamento:", error);
        mostrarToast("Erro ao salvar lançamento. Tente novamente.", "error");
    }
});

cancelEditModalBtn.addEventListener("click", () => {
    closeModal();
});

// Início da alteração: Ajuste da lógica do FAB (btnNovoLancamento)
// Confirmar que o btnNovoLancamento.addEventListener("click", openModal); está presente e funcional
btnNovoLancamento.addEventListener("click", () => {
    resetFormModal();
    openModal();
});
// Fim da alteração: Ajuste da lógica do FAB (btnNovoLancamento)

modalCloseBtn.addEventListener("click", closeModal);
modalLancamento.addEventListener("click", (e) => {
    if (e.target === modalLancamento) {
        closeModal();
    }
});

// Lógica para mostrar/esconder campos de número de parcelas/recorrências e frequência/data fim
tipoLancamentoModalInput.addEventListener("change", () => {
    if (tipoLancamentoModalInput.value === "parcelado") {
        numParcelasRecorrenciasContainer.classList.remove("hidden");
        frequenciaRecorrenciaContainer.classList.add("hidden");
        dataFimRecorrenciaContainer.classList.add("hidden");
        numParcelasRecorrenciasModalInput.value = 1; // Padrão para parcelado
    } else if (tipoLancamentoModalInput.value === "recorrente") {
        // MODIFICADO: Esconde o container de número de parcelas/recorrências para recorrentes
        numParcelasRecorrenciasContainer.classList.add("hidden");
        frequenciaRecorrenciaContainer.classList.remove("hidden");
        dataFimRecorrenciaContainer.classList.remove("hidden");
        // REMOVIDO: numParcelasRecorrenciasModalInput.value = 12; // Padrão para recorrente
        frequenciaRecorrenciaModalInput.value = "mensal"; // Padrão
        dataFimRecorrenciaModalInput.value = ""; // Limpa data fim
    } else { // normal
        numParcelasRecorrenciasContainer.classList.add("hidden");
        frequenciaRecorrenciaContainer.classList.add("hidden");
        dataFimRecorrenciaContainer.classList.add("hidden");
        numParcelasRecorrenciasModalInput.value = 1; // Reseta valor
    }
});

// Event listeners para o modal de confirmação (para exclusão)
confirmacaoSim.addEventListener("click", () => {
    if (pendingConfirmAction) {
        pendingConfirmAction();
    }
    closeConfirmModal();
});

confirmacaoNao.addEventListener("click", () => {
    closeConfirmModal();
});

// Event listeners para os botões de ação dentro do modal de edição
confirmTransferBtn.addEventListener("click", async () => {
    const selectedUid = transferUserSelect.value;
    const selectedUserName = transferUserSelect.options[transferUserSelect.selectedIndex].textContent;

    if (!selectedUid || selectedUid === "") {
        mostrarToast("Selecione um usuário para transferir.", "error");
        return;
    }

    if (editingId) { // Usa editingId que é o ID do lançamento aberto no modal
        try {
            await updateDoc(doc(db, "artifacts", "controle-de-financas-6e2d9", "public", "data", "lancamentos", editingId), {
                usuarioId: selectedUid,
                nomeUsuario: selectedUserName
            });
            mostrarToast("Transferência realizada com sucesso!");
            closeModal(); // Fecha o modal principal
            await loadLancamentos(getCurrentFilters()); // Recarrega a tabela para mostrar a mudança
        } catch (error) {
            console.error("Erro ao realizar transferência:", error);
            mostrarToast("Erro ao realizar transferência.", "error");
        }
    } else {
        mostrarToast("Nenhum lançamento selecionado para exclusão.", "error");
    }
});

// Início da alteração: Refatoração completa do bloco deleteLaunchBtn.addEventListener
deleteLaunchBtn.addEventListener("click", () => {
    if (editingId) {
        openConfirmModal(`Confirma exclusão do lançamento "${descricaoModalInput.value}"?`, async () => {
            try {
                const docRef = doc(db, "artifacts", "controle-de-financas-6e2d9", "public", "data", "lancamentos", editingId);
                const docSnap = await getDoc(docRef);
                const data = docSnap.data();

                // Início da alteração: Substituição das variáveis de controle para identificação de tipo de lançamento
                const isParcelaIndividual = data.tipoLancamento === "parcelado" && data.uidParceladoOriginal !== editingId;
                const isMestreParcelado = data.tipoLancamento === "parcelado" && data.uidParceladoOriginal === editingId;
                const isRecorrenteOcorrencia = data.tipoLancamento === "recorrente" && data.uidRecorrenteOriginal && data.uidRecorrenteOriginal !== editingId; // Ajustado para ser uma ocorrência, não o mestre
                const isMestreRecorrente = data.tipoLancamento === "recorrente" && data.uidRecorrenteOriginal === editingId;
                // Fim da alteração

                // 🔹 Cenário 1: Exclusão de uma ocorrência ou parcela individual
                if (isRecorrenteOcorrencia || isParcelaIndividual) {
                    await deleteDoc(docRef);
                    mostrarToast("Ocorrência/parcela excluída com sucesso!");
                    closeModal();
                    await loadLancamentos(getCurrentFilters());
                    return;
                }

                // Início da alteração: Ajuste da seleção do queryField e queryValue
                const queryField = data.tipoLancamento === "parcelado" ? "uidParceladoOriginal" : "uidRecorrenteOriginal";
                const queryValue = data.tipoLancamento === "parcelado" ? data.uidParceladoOriginal : data.uidRecorrenteOriginal;
                // Fim da alteração

                // 🔹 Cenário 2: Se há série (mestre parcelado ou recorrente), consulta e exclui todos os documentos relacionados
                // Início da alteração: Atualização da condição do if de exclusão de série
                if (isMestreParcelado || isMestreRecorrente) {
                // Fim da alteração
                    try {
                        // Removido console.log de depuração da consulta da série
                        // console.log("Tentando excluir série. QueryField:", queryField, "QueryValue:", queryValue);

                        const qSeries = query(
                            collection(db, "artifacts", "controle-de-financas-6e2d9", "public", "data", "lancamentos"),
                            where(queryField, "==", queryValue)
                        );
                        const snapshot = await getDocs(qSeries);

                        // Removido console.logs de depuração dos documentos da série
                        /*
                        console.log("Documento encontrado:", doc.id, doc.data());
                        */

                        if (!snapshot.empty) {
                            const batch = writeBatch(db);
                            snapshot.docs.forEach(docSnap => {
                                batch.delete(doc(db, "artifacts", "controle-de-financas-6e2d9", "public", "data", "lancamentos", docSnap.id));
                            });
                            await batch.commit();

                            mostrarToast("Série completa excluída com sucesso!");
                            closeModal();
                            await loadLancamentos(getCurrentFilters());
                            return;
                        }
                    } catch (queryError) {
                        // Removido console.warn de depuração da consulta da série
                        // console.warn("Erro ao consultar série. UID:", queryValue, "Erro:", queryError);
                        // Continua para excluir apenas o mestre
                    }
                }

                // 🔹 Cenário 3: Sem série ou consulta bloqueada — exclui apenas o mestre
                await deleteDoc(docRef);
                mostrarToast("Lançamento mestre excluído com sucesso!");
                closeModal();
                await loadLancamentos(getCurrentFilters());

            } catch (error) {
                console.error("Erro ao excluir:", error);
                mostrarToast("Erro ao excluir lançamento.", "error");
            }
        });
    } else {
        mostrarToast("Nenhum lançamento selecionado para exclusão.", "error");
    }
});
// Fim da alteração: Refatoração completa do bloco deleteLaunchBtn.addEventListener


// Event listeners para os filtros: Dispara loadLancamentos automaticamente
filterMonth.addEventListener("change", () => loadLancamentos(getCurrentFilters()));
filterYear.addEventListener("change", () => loadLancamentos(getCurrentFilters()));
filterDay.addEventListener("change", () => loadLancamentos(getCurrentFilters()));
filterCategoriaInput.addEventListener("input", () => loadLancamentos(getCurrentFilters()));
filterTipoSelect.addEventListener("change", () => loadLancamentos(getCurrentFilters()));


clearFiltersBtn.addEventListener("click", () => {
    filtrosForm.reset();
    setCurrentMonthAndYearFilters();
    loadLancamentos(getCurrentFilters());
});


// Logout
logoutButton.addEventListener("click", async () => {
    try {
        await signOut(auth);
        window.location.href = "./login.html";
    }
    catch (error) {
        console.error("Erro ao fazer logout:", error);
        mostrarToast("Erro ao fazer logout.", "error");
    }
});

// Estado auth
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "./login.html";
        return;
    }
    currentUser = user;
    currentUserId = user.uid;

    try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            familiaId = userData.familiaId || null;
            currentUserName = `${userData.nome || ''} ${userData.sobrenome || ''}`.trim();

            if (!familiaId) {
                mostrarToast("Usuário não possui família vinculada.", "error");
                lancamentosTableBody.innerHTML = "";
                emptyState.textContent = "Sem dados para exibir. Usuário não vinculado a uma família.";
                emptyState.classList.remove("hidden");
                return;
            }
            populateYearFilter();
            setCurrentMonthAndYearFilters();
            await loadLancamentos(getCurrentFilters());

            // Início da alteração: Remoção da lógica de abertura automática do modal (urlParams.get("novo"))
            // A lógica para abrir o modal automaticamente via URL foi removida,
            // pois a página agora é a principal e o FAB cuida da criação.
            // Fim da alteração: Remoção da lógica de abertura automática do modal

        } else {
            mostrarToast("Dados do usuário não encontrados.", "error");
        }
        userName.textContent = currentUserName || user.email;
        userName.classList.remove("hidden");
    } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error);
        mostrarToast("Erro ao carregar dados do usuário. Por favor, tente fazer login novamente.", "error");
    }
});
