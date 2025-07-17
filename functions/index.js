const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

const LANCA_COLLECTION_PATH = "artifacts/controle-de-financas-6e2d9/public/data/lancamentos";

exports.gerarLancamentosRecorrentesMensalmente = functions.pubsub.schedule("0 0 1 * *")
  .timeZone("America/Sao_Paulo")
  .onRun(async () => {
    console.log(`[Cloud Function] Executando em: ${new Date().toLocaleString("pt-BR")}`);

    const hoje = new Date();
    const mesParaGeracao = hoje.getMonth(); // ✅ Mês atual
    const anoParaGeracao = hoje.getFullYear(); // ✅ Ano atual

    try {
      const mestresSnapshot = await db.collection(LANCA_COLLECTION_PATH)
        .where("tipoLancamento", "==", "recorrente")
        .get();

      if (mestresSnapshot.empty) {
        console.log("[Cloud Function] Nenhum lançamento recorrente encontrado.");
        return null;
      }

      const batch = db.batch();
      let ocorrenciasCriadas = 0;

      for (const doc of mestresSnapshot.docs) {
        const mestre = doc.data();
        const idMestre = doc.id;

        if (mestre.uidRecorrenteOriginal !== idMestre) {
          continue; // pula se não for o mestre recorrente
        }

        const mestreDate = mestre.data.toDate();
        const dia = mestreDate.getDate();

        const dataOcorrencia = new Date(anoParaGeracao, mesParaGeracao, dia);
        dataOcorrencia.setHours(0, 0, 0, 0);
        if (dataOcorrencia.getMonth() !== mesParaGeracao) {
          dataOcorrencia.setDate(0);
        }

        if (mestre.dataFim) {
          const dataFim = mestre.dataFim.toDate();
          dataFim.setHours(23, 59, 59, 999);
          if (dataOcorrencia > dataFim) {
            console.log(`[Cloud Function] Pulando "${mestre.descricao}" (${idMestre}) — passou dataFim.`);
            continue;
          }
        }

        const jaExiste = await db.collection(LANCA_COLLECTION_PATH)
          .where("uidRecorrenteOriginal", "==", idMestre)
          .where("data", "==", admin.firestore.Timestamp.fromDate(dataOcorrencia)) // ✅ Compatível
          .limit(1)
          .get();

        if (!jaExiste.empty) {
          console.log(`[Cloud Function] Ocorrência já existe para "${mestre.descricao}" em ${dataOcorrencia.toLocaleDateString("pt-BR")}.`);
          continue;
        }

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
          nomeUsuario: mestre.nomeUsuario || null,
          frequencia: mestre.frequencia || "mensal",
          dataOriginal: mestre.data || null,
          data: admin.firestore.Timestamp.fromDate(dataOcorrencia), // ✅ Corrigido
          ano: dataOcorrencia.getFullYear(),
          mes: dataOcorrencia.getMonth() + 1,
          dia: dataOcorrencia.getDate(),
          criadoEm: admin.firestore.Timestamp.now()
        });

        ocorrenciasCriadas++;
      }

      if (ocorrenciasCriadas > 0) {
        await batch.commit();
        console.log(`[Cloud Function] ✅ ${ocorrenciasCriadas} ocorrência(s) recorrente(s) criada(s) com sucesso.`);
      } else {
        console.log("[Cloud Function] Nenhuma nova ocorrência gerada neste ciclo.");
      }

      return null;
    } catch (error) {
      console.error("[Cloud Function] Erro ao gerar recorrências:", error);
      return null;
    }
  });
