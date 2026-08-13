import {
  calcularCobertura,
  calcularOportunidade,
  calcularConversao,
  calcularAderencia,
  calcularOnTime,
  calcularSaving,
  calcularReducaoCusto,
} from "./kpiEngine";

import {
  calcularScore,
  obterStatusScore,
} from "./scoreEngine";

import {
  calcularHistoricoScore,
} from "./scoreHistory";

// ==========================================
// DASHBOARD
// ==========================================

export function calcularDashboard(
  dados,
  dataInicio = null,
  dataFim = null
) {

  if (
    !dados ||
    dados.length === 0
  ) {
    return null;
  }

  // ========================================
  // FILTRO DE PERÍODO
  // ========================================

  let dadosPeriodo = [...dados];

  const mesInicio =
    dataInicio
      ? obterMesReferencia(dataInicio)
      : null;

  const mesFim =
    dataFim
      ? obterMesReferencia(dataFim)
      : null;

  if (mesInicio) {

    dadosPeriodo =
      dadosPeriodo.filter(
        (item) =>
          item.mesReferencia >=
          mesInicio
      );

  }

  if (mesFim) {

    dadosPeriodo =
      dadosPeriodo.filter(
        (item) =>
          item.mesReferencia <=
          mesFim
      );

  }

  if (
    dadosPeriodo.length === 0
  ) {
    return null;
  }

  // ========================================
  // ORDENAR
  // ========================================

  const dadosOrdenados =
    [...dadosPeriodo].sort(
      (a, b) =>
        a.mes - b.mes
    );

  // ========================================
  // ÚLTIMO REGISTRO
  // ========================================

  const ultimoRegistro =
    dadosOrdenados[
      dadosOrdenados.length - 1
    ];

  // ========================================
  // CRONOGRAMA
  // ========================================

  const diasAtraso =
    Number(
      ultimoRegistro.diasAtraso ?? 0
    );

  // ========================================
  // MALHA
  // SNAPSHOT DO ÚLTIMO MÊS
  // ========================================

  const rotasTotais =
    ultimoRegistro.rotasTotais;

  const rotasDisponibilizadas =
    ultimoRegistro.rotasDisponibilizadas;

  const rotasSinergia =
    ultimoRegistro.rotasSinergia;

  const oportunidades =
    ultimoRegistro.oportunidades;

  // ========================================
  // OPERAÇÃO
  // ========================================

  const rotasExecutadas =
    ultimoRegistro.rotasExecutadas;

  const usuariosAtivos =
    ultimoRegistro.usuariosAtivos;

  // ========================================
  // EMBARQUES
  // CONSOLIDADO DO PERÍODO
  // ========================================

  const embarquesPlanejados =
    dadosOrdenados.reduce(
      (total, item) =>
        total +
        Number(
          item.embarquesPlanejados || 0
        ),
      0
    );

  const embarquesRealizados =
    dadosOrdenados.reduce(
      (total, item) =>
        total +
        Number(
          item.embarquesRealizados || 0
        ),
      0
    );

  // ========================================
  // FINANCEIRO
  // ========================================

  const baseline =
    dadosOrdenados.reduce(
      (total, item) =>
        total +
        Number(
          item.baseline || 0
        ),
      0
    );

  const realizado =
    dadosOrdenados.reduce(
      (total, item) =>
        total +
        Number(
          item.realizado || 0
        ),
      0
    );

  // ========================================
  // ON TIME
  // ========================================

  const embarquesOnTime =
    dadosOrdenados.reduce(
      (total, item) =>
        total +
        Number(
          item.embarquesOnTime || 0
        ),
      0
    );

  const embarquesTotal =
    dadosOrdenados.reduce(
      (total, item) =>
        total +
        Number(
          item.embarquesTotal || 0
        ),
      0
    );

  // ========================================
  // SUSTENTABILIDADE
  // ========================================

  const co2 =
    dadosOrdenados.reduce(
      (total, item) =>
        total +
        Number(
          item.co2 || 0
        ),
      0
    );

  const arvores =
    dadosOrdenados.reduce(
      (total, item) =>
        total +
        Number(
          item.arvores || 0
        ),
      0
    );

  const camposFutebol =
    dadosOrdenados.reduce(
      (total, item) =>
        total +
        Number(
          item.camposFutebol || 0
        ),
      0
    );

  // ========================================
  // KPIs
  // ========================================

  const cobertura =
    calcularCobertura(
      rotasDisponibilizadas,
      rotasTotais
    );

  const oportunidade =
    calcularOportunidade(
      rotasSinergia,
      rotasDisponibilizadas
    );

  const conversao =
    calcularConversao(
      rotasExecutadas,
      oportunidades
    );

  const aderencia =
    calcularAderencia(
      embarquesRealizados,
      embarquesPlanejados
    );

  const onTime =
    calcularOnTime(
      embarquesOnTime,
      embarquesTotal
    );

  // ========================================
  // FINANCEIRO
  // ========================================

  const saving =
    calcularSaving(
      baseline,
      realizado
    );

  const reducaoCusto =
    calcularReducaoCusto(
      baseline,
      realizado
    );

  // SaaS do último mês
  const investimento =
    Number(
      ultimoRegistro.saas || 0
    );

  // ========================================
  // VOLUME
  // Crescimento do último mês
  // em relação ao mês anterior
  // ========================================

  let volume = null;

  if (
    dadosOrdenados.length >= 2
  ) {

    const atual =
      dadosOrdenados[
        dadosOrdenados.length - 1
      ];

    const anterior =
      dadosOrdenados[
        dadosOrdenados.length - 2
      ];

    const embarquesAtual =
      Number(
        atual.embarquesRealizados || 0
      );

    const embarquesAnterior =
      Number(
        anterior.embarquesRealizados || 0
      );

    if (
      embarquesAnterior > 0
    ) {

      volume =
        (
          (
            embarquesAtual -
            embarquesAnterior
          ) /
          embarquesAnterior
        ) *
        100;

    }

  }

  // ========================================
  // HISTÓRICO DO SCORE
  // ========================================

  const historicoScore =
    calcularHistoricoScore(
      dadosPeriodo
    );

  // ========================================
  // SCORE
  // ========================================

  const scoreResultado =
    calcularScore({

      // CRONOGRAMA
      diasAtraso,

      // UTILIZAÇÃO
      usuariosAtivos,

      // MALHA
      cobertura,

      oportunidade,

      // OPERAÇÃO
      conversao,

      aderencia,

      volume,

      // FINANCEIRO
      saving,

      investimento,

      // SLA
      onTime,

    });

  // ========================================
  // STATUS
  // ========================================

  const statusScore =
    obterStatusScore(
      scoreResultado.score
    );

  // ========================================
  // RETORNO
  // ========================================

  return {

    // ======================================
    // CRONOGRAMA
    // ======================================

    diasAtraso,

    // ======================================
    // MALHA
    // ======================================

    rotasTotais,

    rotasDisponibilizadas,

    rotasSinergia,

    oportunidades,

    // ======================================
    // OPERAÇÃO
    // ======================================

    rotasExecutadas,

    embarquesPlanejados,

    embarquesRealizados,

    usuariosAtivos,

    // ======================================
    // FINANCEIRO
    // ======================================

    baseline,

    realizado,

    saving,

    reducaoCusto,

    investimento,

    roi:
      scoreResultado.roi,

    // ======================================
    // SUSTENTABILIDADE
    // ======================================

    co2,

    arvores,

    camposFutebol,

    // ======================================
    // KPIs
    // ======================================

    cobertura,

    oportunidade,

    conversao,

    aderencia,

    onTime,

    volume,

    // ======================================
    // SCORE
    // ======================================

    score:
      scoreResultado.score,

    pontuacoes:
      scoreResultado.pontuacoes,

    indicadoresScore:
      scoreResultado.indicadores,

    resumoScore:
      scoreResultado.resumo,

    pontosAtencao:
      scoreResultado.pontosAtencao,

    pontosFortes:
      scoreResultado.pontosFortes,

    statusScore,

    // ======================================
    // HISTÓRICO DO SCORE
    // ======================================

    historicoScore,

    // ======================================
    // PERÍODO
    // ======================================

    dataInicio:
      dadosOrdenados[0].mes,

    dataFim:
      ultimoRegistro.mes,

  };
}

// ==========================================
// REFERÊNCIA MENSAL
// ==========================================

function obterMesReferencia(
  data
) {

  const ano =
    data.getFullYear();

  const mes =
    String(
      data.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  return `${ano}-${mes}`;
}