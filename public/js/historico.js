// Os imports devem ficar no topo, fora de qualquer bloco.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, query, where, orderBy, limit, startAfter, getDocs, Timestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { auth, db } from "./firebaseConfig.js"; // Importação centralizada

// Este bloco garante que o código abaixo só rode depois que a página HTML estiver pronta.
document.addEventListener('DOMContentLoaded', () => {

    // Elementos da UI
    const loader = document.getElementById("loader");
    const mainContent = document.getElementById("mainContent");
    const userName = document.getElementById("userName");
    const logoutButton = document.getElementById("logoutButton");
    const filterForm = document.getElementById("filterForm");
    const clearFiltersBtn = document.getElementById("clearFiltersBtn");
    const historicoList = document.getElementById("historicoList");
    const emptyState = document.getElementById("emptyState");
    const loadMoreContainer = document.getElementById("loadMoreContainer");
    const loadMoreBtn = document.getElementById("loadMoreBtn");
    const filterFeedback = document.getElementById("filterFeedback");

    // Estado da Aplicação
    let currentFamiliaId = null;
    let lastVisibleDoc = null;
    let isFetching = false;
    const PAGE_SIZE = 20;

    // Funções Utilitárias
    const formatCurrency = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const formatDate = (timestamp) => timestamp ? timestamp.toDate().toLocaleDateString('pt-BR') : 'N/A';

    const setFormEnabled = (enabled) => {
        if(filterForm) {
            Array.from(filterForm.elements).forEach(el => el.disabled = !enabled);
        }
    };

    // Lógica de Fetching (Busca de Dados)
    const fetchHistorico = async (familiaId, loadMore = false) => {
        if (isFetching) return;
        isFetching = true;
        if(loadMoreBtn) loadMoreBtn.disabled = true;

        if (!loadMore) {
            if(historicoList) historicoList.innerHTML = '';
            lastVisibleDoc = null;
        }

        try {
            const lancamentosRef = collection(db, "artifacts", "controle-de-financas-6e2d9", "public", "data", "lancamentos");
            let q = query(lancamentosRef, where("familiaId", "==", familiaId), orderBy("data", "desc"));
            
            // ... (o restante do seu código original) ...
            // Esta parte não precisa mudar, apenas a estrutura em volta.

            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            const categoria = document.getElementById('categoria').value.trim();
            const tipo = document.getElementById('tipo').value;
            
            if (startDate) q = query(q, where("data", ">=", Timestamp.fromDate(new Date(startDate + 'T00:00:00'))));
            if (endDate) q = query(q, where("data", "<=", Timestamp.fromDate(new Date(endDate + 'T23:59:59'))));
            if (tipo !== 'todos') q = query(q, where("tipo", "==", tipo));
            if (categoria) q = query(q, where("categoria", ">=", categoria), where("categoria", "<=", categoria + '\uf8ff'));

            if (loadMore && lastVisibleDoc) {
                q = query(q, startAfter(lastVisibleDoc));
            }

            q = query(q, limit(PAGE_SIZE));

            const querySnapshot = await getDocs(q);
            const docs = querySnapshot.docs;
            
            if (docs.length === 0 && !loadMore) {
                if(emptyState) emptyState.classList.remove('hidden');
            } else {
                if(emptyState) emptyState.classList.add('hidden');
            }

            docs.forEach(doc => {
                const data = doc.data();
                const isDespesa = data.tipo === 'despesa';
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap"><div class="text-sm font-medium text-gray-900 dark:text-white">${data.descricao}</div></td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${formatDate(data.data)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${data.categoria}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${isDespesa ? 'text-red-600' : 'text-green-600'}">
                        ${isDespesa ? '-' : '+'} ${formatCurrency(data.valor)}
                    </td>
                `;
                if(historicoList) historicoList.appendChild(row);
            });

            lastVisibleDoc = docs[docs.length - 1];
            if(loadMoreContainer) loadMoreContainer.classList.toggle('hidden', docs.length < PAGE_SIZE);

        } catch (error) {
            console.error("Erro ao buscar histórico: ", error);
            if(filterFeedback) {
                filterFeedback.textContent = "Erro ao carregar os dados. Tente novamente.";
                filterFeedback.classList.remove('hidden');
            }
        } finally {
            isFetching = false;
            if(loadMoreBtn) loadMoreBtn.disabled = false;
            if(loader) loader.classList.add("hidden");
            if(mainContent) mainContent.classList.remove("hidden");
            setFormEnabled(true);
        }
    };

    // Event Listeners
    if(filterForm) {
        filterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // ... (código do listener)
            fetchHistorico(currentFamiliaId, false);
        });
    }

    if(clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            if(filterForm) filterForm.reset();
            if(filterFeedback) filterFeedback.classList.add('hidden');
            fetchHistorico(currentFamiliaId, false);
        });
    }

    if(loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            fetchHistorico(currentFamiliaId, true);
        });
    }
    
    // Lógica de Autenticação
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            if(userName) userName.textContent = user.displayName || 'Usuário';
            try {
                const userDocRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(userDocRef);
                if (docSnap.exists() && docSnap.data().familiaId) {
                    currentFamiliaId = docSnap.data().familiaId;
                    fetchHistorico(currentFamiliaId);
                } else {
                    window.location.href = "familia.html";
                }
            } catch (error) {
                // ... (código de erro)
            }
        } else {
            window.location.href = "login.html";
        }
    });

    if(logoutButton) {
        logoutButton.addEventListener("click", async () => {
            try {
                await signOut(auth);
            } catch (error) {
                console.error("Erro ao fazer logout:", error);
            }
        });
    }

}); // Fim do DOMContentLoaded