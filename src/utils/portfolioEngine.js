import {
  calcularDashboard,
} from "./dashboardEngine";

// ==========================================
// PORTFOLIO ENGINE
// ==========================================

export function calcularPortfolio(
  dados
) {

  if (
    !dados ||
    dados.length === 0
  ) {
    return null;
  }

  // ========================================
  // CLIENTES
  // ========================================

  const clientes = [
    ...new Set(
      dados
        .map(
          (item) =>
            item.cliente
        )
        .filter(Boolean)
    ),
  ];

  // ========================================
  // CALCULAR CADA POC
  // ========================================

  const pocs =
    clientes
      .map(
        (cliente) => {

          const dadosCliente =
            dados.filter(
              (item) =>
                item.cliente ===
                cliente
            );

          if (
            dadosCliente.length === 0
          ) {
            return null;
          }

          // ==================================
          // DATAS DO CLIENTE
          // ==================================

          const datas =
            dadosCliente
              .map(
                (item) =>
                  item.mes
              )
              .filter(Boolean)
              .sort(
                (a, b) =>
                  a - b
              );

          const dataInicio =
            datas[0] || null;

          const dataFim =
            datas[
              datas.length - 1
            ] || null;

          // ==================================
          // DASHBOARD
          // ==================================

          const dashboard =
            calcularDashboard(
              dadosCliente,
              dataInicio,
              dataFim
            );

          if (!dashboard) {
            return null;
          }

          // ==================================
          // HISTÓRICO
          // ==================================

          const historico =
            dashboard
              .historicoScore ||
            [];

          // ==================================
          // SCORE ATUAL
          // ==================================

          const scoreAtual =
            Number(
              dashboard.score || 0
            );

          // ==================================
          // SCORE ANTERIOR
          // ==================================

          let scoreAnterior =
            null;

          if (
            historico.length >= 2
          ) {

            scoreAnterior =
              Number(
                historico[
                  historico.length - 2
                ].score || 0
              );

          }

          // ==================================
          // VARIAÇÃO
          // ==================================

          let variacaoScore =
            null;

          if (
            scoreAnterior !== null
          ) {

            variacaoScore =
              scoreAtual -
              scoreAnterior;

          }

          // ==================================
          // TENDÊNCIA
          // ==================================

          let tendencia =
            "na";

          if (
            variacaoScore !== null
          ) {

            if (
              variacaoScore > 1
            ) {

              tendencia =
                "melhorando";

            } else if (
              variacaoScore < -1
            ) {

              tendencia =
                "piorando";

            } else {

              tendencia =
                "estavel";

            }

          }

          // ==================================
          // STATUS DOS INDICADORES
          // ==================================

          const indicadores =
            Object.values(
              dashboard
                .indicadoresScore ||
                {}
            );

          const indicadoresDentro =
            indicadores.filter(
              (item) =>
                item.status ===
                "verde"
            ).length;

          const indicadoresAtencao =
            indicadores.filter(
              (item) =>
                item.status ===
                "amarelo"
            ).length;

          const indicadoresFora =
            indicadores.filter(
              (item) =>
                item.status ===
                "vermelho"
            ).length;

          const indicadoresNA =
            indicadores.filter(
              (item) =>
                item.status ===
                "na"
            ).length;

          // ==================================
          // PRINCIPAL PONTO DE ATENÇÃO
          // ==================================

          let principalAtencao =
            null;

          if (
            dashboard
              .pontosAtencao &&
            dashboard
              .pontosAtencao.length > 0
          ) {

            principalAtencao =
              dashboard
                .pontosAtencao[0];

          } else {

            const foraMeta =
              indicadores
                .filter(
                  (item) =>
                    item.status ===
                    "vermelho"
                )
                .sort(
                  (a, b) =>
                    Number(
                      a.atingimento || 0
                    ) -
                    Number(
                      b.atingimento || 0
                    )
                );

            if (
              foraMeta.length > 0
            ) {

              principalAtencao =
                foraMeta[0];

            }

          }

          // ==================================
          // RECOMENDAÇÃO
          // ==================================

          const recomendacao =
            obterRecomendacao(
              scoreAtual,
              indicadoresFora
            );

          // ==================================
          // RETORNO DA POC
          // ==================================

          return {

            cliente,

            // SCORE
            score:
              scoreAtual,

            scoreAnterior,

            variacaoScore,

            tendencia,

            // RECOMENDAÇÃO
            recomendacao,

            // INDICADORES
            indicadoresDentro,

            indicadoresAtencao,

            indicadoresFora,

            indicadoresNA,

            totalIndicadores:
              indicadores.length,

            principalAtencao,

            // STATUS
            status:
              dashboard.statusScore,

            // KPIs
            cobertura:
              dashboard.cobertura,

            oportunidade:
              dashboard.oportunidade,

            conversao:
              dashboard.conversao,

            aderencia:
              dashboard.aderencia,

            onTime:
              dashboard.onTime,

            volume:
              dashboard.volume,

            // FINANCEIRO
            roi:
              dashboard.roi,

            baseline:
              dashboard.baseline,

            realizado:
              dashboard.realizado,

            saving:
              dashboard.saving,

            investimento:
              dashboard.investimento,

            // SUSTENTABILIDADE
            co2:
              dashboard.co2,

            arvores:
              dashboard.arvores,

            camposFutebol:
              dashboard.camposFutebol,

            // MALHA
            rotasTotais:
              dashboard.rotasTotais,

            rotasDisponibilizadas:
              dashboard.rotasDisponibilizadas,

            rotasSinergia:
              dashboard.rotasSinergia,

            oportunidades:
              dashboard.oportunidades,

            // OPERAÇÃO
            rotasExecutadas:
              dashboard.rotasExecutadas,

            embarquesPlanejados:
              dashboard.embarquesPlanejados,

            embarquesRealizados:
              dashboard.embarquesRealizados,

            usuariosAtivos:
              dashboard.usuariosAtivos,

            // HISTÓRICO
            historicoScore:
              dashboard.historicoScore ||
              [],

            // INDICADORES COMPLETOS
            indicadoresScore:
              dashboard.indicadoresScore ||
              {},

            pontosAtencao:
              dashboard.pontosAtencao ||
              [],

            pontosFortes:
              dashboard.pontosFortes ||
              [],

          };

        }
      )
      .filter(Boolean);

  // ========================================
  // VALIDAR
  // ========================================

  if (
    pocs.length === 0
  ) {
    return null;
  }

  // ========================================
  // SCORE MÉDIO
  // ========================================

  const scoreMedio =
    calcularMedia(
      pocs.map(
        (item) =>
          item.score
      )
    );

  // ========================================
  // TENDÊNCIAS
  // ========================================

  const emEvolucao =
    pocs.filter(
      (item) =>
        item.tendencia ===
        "melhorando"
    ).length;

  const estaveis =
    pocs.filter(
      (item) =>
        item.tendencia ===
        "estavel"
    ).length;

  const emQueda =
    pocs.filter(
      (item) =>
        item.tendencia ===
        "piorando"
    ).length;

  // ========================================
  // RECOMENDAÇÕES
  // ========================================

  const go =
    pocs.filter(
      (item) =>
        item.recomendacao ===
        "GO"
    ).length;

  const acompanhamento =
    pocs.filter(
      (item) =>
        item.recomendacao ===
        "GO COM ACOMPANHAMENTO"
    ).length;

  const revisar =
    pocs.filter(
      (item) =>
        item.recomendacao ===
        "REVISAR"
    ).length;

  // ========================================
  // FINANCEIRO
  // ========================================

  const investimentoTotal =
    somar(
      pocs,
      "investimento"
    );

  const baselineTotal =
    somar(
      pocs,
      "baseline"
    );

  const realizadoTotal =
    somar(
      pocs,
      "realizado"
    );

  const savingTotal =
    somar(
      pocs,
      "saving"
    );

  let roiMedio =
    null;

  if (
    investimentoTotal > 0
  ) {

    roiMedio =
      (
        savingTotal /
        investimentoTotal
      ) *
      100;

  }

  // ========================================
  // SUSTENTABILIDADE
  // ========================================

  const co2Total =
    somar(
      pocs,
      "co2"
    );

  const arvoresTotal =
    somar(
      pocs,
      "arvores"
    );

  const camposFutebolTotal =
    somar(
      pocs,
      "camposFutebol"
    );

  // ========================================
  // INDICADORES CONSOLIDADOS
  // ========================================

  const indicadoresDentro =
    somar(
      pocs,
      "indicadoresDentro"
    );

  const indicadoresAtencao =
    somar(
      pocs,
      "indicadoresAtencao"
    );

  const indicadoresFora =
    somar(
      pocs,
      "indicadoresFora"
    );

  // ========================================
  // RETORNO
  // ========================================

  return {

    totalPocs:
      pocs.length,

    scoreMedio,

    emEvolucao,

    estaveis,

    emQueda,

    go,

    acompanhamento,

    revisar,

    // INDICADORES
    indicadoresDentro,

    indicadoresAtencao,

    indicadoresFora,

    // FINANCEIRO
    investimentoTotal,

    baselineTotal,

    realizadoTotal,

    savingTotal,

    roiMedio,

    // SUSTENTABILIDADE
    co2Total,

    arvoresTotal,

    camposFutebolTotal,

    // POCs
    pocs,

  };

}

// ==========================================
// RECOMENDAÇÃO
// ==========================================

function obterRecomendacao(
  score,
  indicadoresFora
) {

  // ========================================
  // GO
  // ========================================

  if (
    score >= 80 &&
    indicadoresFora === 0
  ) {

    return "GO";

  }

  // ========================================
  // ACOMPANHAMENTO
  // ========================================

  if (
    score >= 60
  ) {

    return "GO COM ACOMPANHAMENTO";

  }

  // ========================================
  // REVISAR
  // ========================================

  return "REVISAR";
}

// ==========================================
// SOMAR
// ==========================================

function somar(
  lista,
  campo
) {

  return lista.reduce(
    (total, item) =>
      total +
      Number(
        item[campo] || 0
      ),
    0
  );
}

// ==========================================
// MÉDIA
// ==========================================

function calcularMedia(
  valores
) {

  if (
    !valores ||
    valores.length === 0
  ) {

    return 0;

  }

  const soma =
    valores.reduce(
      (total, valor) =>
        total +
        Number(
          valor || 0
        ),
      0
    );

  return (
    soma /
    valores.length
  );
}