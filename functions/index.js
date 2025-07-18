const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

const LANCA_COLLECTION_PATH =
  "artifacts/controle-de-financas-6e2d9/public/data/lancamentos";
const USERS_COLLECTION_PATH = "users"; // Caminho para a coleção de usuários

// Função agendada para gerar lançamentos recorrentes mensalmente
exports.gerarLancamentosRecorrentesMensalmente = functions.pubsub
  .schedule("0 0 1 * *")
  .timeZone("America/Sao_Paulo")
  .onRun(async () => {
    console.log(
      `[Cloud Function - Recorrência] Executando em: ${new Date().toLocaleString(
        "pt-BR"
      )}`
    );

    const hoje = new Date();
    const mesParaGeracao = hoje.getMonth(); // ✅ Mês atual (0-indexed)
    const anoParaGeracao = hoje.getFullYear(); // ✅ Ano atual

    try {
      const mestresSnapshot = await db
        .collection(LANCA_COLLECTION_PATH)
        .where("tipoLancamento", "==", "recorrente")
        .get();

      if (mestresSnapshot.empty) {
        console.log("[Cloud Function - Recorrência] Nenhum lançamento recorrente encontrado.");
        return null;
      }

      const batch = db.batch();
      let ocorrenciasCriadas = 0;

      for (const doc of mestresSnapshot.docs) {
        const mestre = doc.data();
        const idMestre = doc.id;

        // Pula se não for o documento mestre da recorrência
        if (mestre.uidRecorrenteOriginal !== idMestre) {
          continue;
        }

        const mestreDate = mestre.data.toDate();
        const dia = mestreDate.getDate();

        // Cria a data da ocorrência para o mês atual
        const dataOcorrencia = new Date(anoParaGeracao, mesParaGeracao, dia);
        dataOcorrencia.setHours(0, 0, 0, 0); // Zera hora para comparação de data

        // Ajusta o dia se o mês não tiver o dia correspondente (ex: 31 de fev)
        if (dataOcorrencia.getMonth() !== mesParaGeracao) {
          dataOcorrencia.setDate(0); // Vai para o último dia do mês anterior
        }

        // Verifica se a recorrência já passou da data de fim, se houver
        if (mestre.dataFim) {
          const dataFim = mestre.dataFim.toDate();
          dataFim.setHours(23, 59, 59, 999); // Define para o final do dia
          if (dataOcorrencia > dataFim) {
            console.log(
              `[Cloud Function - Recorrência] Pulando "${mestre.descricao}" (${idMestre}) — passou dataFim.`
            );
            continue;
          }
        }

        // Verifica se uma ocorrência para este mestre e esta data já existe
        const jaExiste = await db
          .collection(LANCA_COLLECTION_PATH)
          .where("uidRecorrenteOriginal", "==", idMestre)
          .where("data", "==", admin.firestore.Timestamp.fromDate(dataOcorrencia))
          .limit(1)
          .get();

        if (!jaExiste.empty) {
          console.log(
            `[Cloud Function - Recorrência] Ocorrência já existe para "${mestre.descricao}" em ${dataOcorrencia.toLocaleDateString("pt-BR")}.`
          );
          continue;
        }

        // Cria a nova ocorrência recorrente
        const novaOcorrenciaRef = db.collection(LANCA_COLLECTION_PATH).doc();
        batch.set(novaOcorrenciaRef, {
          tipoLancamento: "recorrente",
          uidRecorrenteOriginal: idMestre,
          descricao: mestre.descricao || null,
          valor: mestre.valor || null,
          categoria: mestre.categoria || null,
          tipo: mestre.tipo || null,
          formaPagamento: mestre.formaPagamento || null,
          observacao: mestre.observacao || null,
          familiaId: mestre.familiaId || null,
          usuarioId: mestre.usuarioId || null,
          nomeUsuario: mestre.nomeUsuario || null, // Manter por compatibilidade, mas a ideia é buscar no frontend
          frequencia: mestre.frequencia || "mensal",
          dataOriginal: mestre.data || null,
          data: admin.firestore.Timestamp.fromDate(dataOcorrencia),
          ano: dataOcorrencia.getFullYear(),
          mes: dataOcorrencia.getMonth() + 1,
          dia: dataOcorrencia.getDate(),
          criadoEm: admin.firestore.Timestamp.now(),
        });

        ocorrenciasCriadas++;
      }

      if (ocorrenciasCriadas > 0) {
        await batch.commit();
        console.log(
          `[Cloud Function - Recorrência] ✅ ${ocorrenciasCriadas} ocorrência(s) recorrente(s) criada(s) com sucesso.`
        );
      } else {
        console.log("[Cloud Function - Recorrência] Nenhuma nova ocorrência gerada neste ciclo.");
      }

      return null;
    } catch (error) {
      console.error("[Cloud Function - Recorrência] Erro ao gerar recorrências:", error);
      return null;
    }
  });

// Nova função HTTPS Callable para gerar relatórios
exports.generateReport = functions.https.onCall(async (data, context) => {
  // 1. Autenticação e Validação
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "A função deve ser chamada por um usuário autenticado."
    );
  }

  const userId = context.auth.uid;
  const { startDate, endDate, tipo } = data; // Recebe os filtros do frontend

  if (!startDate || !endDate) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "As datas inicial e final são obrigatórias."
    );
  }

  // 2. Obter familiaId do usuário que chamou a função
  let familiaId = null;
  try {
    const userDoc = await db.collection(USERS_COLLECTION_PATH).doc(userId).get();
    if (!userDoc.exists || !userDoc.data().familiaId) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Usuário não vinculado a uma família."
      );
    }
    familiaId = userDoc.data().familiaId;
  } catch (error) {
    console.error(
      `[Cloud Function - Relatório] Erro ao buscar familiaId para o usuário ${userId}:`,
      error
    );
    throw new functions.https.HttpsError(
      "internal",
      "Erro ao verificar informações do usuário."
    );
  }

  // 3. Preparar a consulta ao Firestore
  const startTimestamp = admin.firestore.Timestamp.fromDate(new Date(startDate));
  const endTimestamp = admin.firestore.Timestamp.fromDate(
    new Date(endDate + "T23:59:59")
  ); // Inclui o dia inteiro

  let q = db
    .collection(LANCA_COLLECTION_PATH)
    .where("familiaId", "==", familiaId)
    .where("data", ">=", startTimestamp)
    .where("data", "<=", endTimestamp)
    .orderBy("data", "asc"); // Ordena para consistência

  if (tipo && tipo !== "todos") {
    if (tipo === "receita") {
      q = q.where("tipo", "in", ["receita", "entrada"]);
    } else if (tipo === "despesa") {
      q = q.where("tipo", "in", ["despesa", "saida"]);
    }
  }

  // 4. Buscar os dados
  try {
    const querySnapshot = await q.get();
    const fetchedData = [];
    let totalReceitas = 0;
    let totalDespesas = 0;

    querySnapshot.forEach((docSnap) => {
      const itemData = docSnap.data();
      fetchedData.push({
        id: docSnap.id, // Inclui o ID do documento
        ...itemData,
        // Converte Timestamps para strings ISO para facilitar no frontend
        data: itemData.data ? itemData.data.toDate().toISOString() : null,
        dataOriginal: itemData.dataOriginal
          ? itemData.dataOriginal.toDate().toISOString()
          : null,
        dataFim: itemData.dataFim ? itemData.dataFim.toDate().toISOString() : null,
      });

      if (itemData.tipo === "receita" || itemData.tipo === "entrada") {
        totalReceitas += itemData.valor || 0;
      } else if (itemData.tipo === "despesa" || itemData.tipo === "saida") {
        totalDespesas += itemData.valor || 0;
      }
    });

    // 5. Retornar os dados e o resumo para o frontend
    return {
      success: true,
      reportData: fetchedData,
      summary: {
        totalReceitas: totalReceitas,
        totalDespesas: totalDespesas,
        saldo: totalReceitas - totalDespesas,
        startDate: startDate,
        endDate: endDate,
      },
    };
  } catch (error) {
    console.error(
      "[Cloud Function - Relatório] Erro ao buscar dados para o relatório:",
      error
    );
    throw new functions.https.HttpsError(
      "internal",
      "Erro ao gerar relatório. Tente novamente mais tarde.",
      error.message
    );
  }
});
