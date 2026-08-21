import {
  calcularCobertura,
  calcularOportunidade,
  calcularConversao,
  calcularAderencia,
  calcularOnTime,
  calcularSaving,
  calcularReducaoCusto,
} from "./kpiEngine";

import { calcularScore, obterStatusScore } from "./scoreEngine";
import { calcularHistoricoScore } from "./scoreHistory";

// ==========================================
// DASHBOARD (MOTOR DE CÁLCULO ANTI-FALHAS)
// ==========================================
export function calcularDashboard(dados, dataInicio = null, dataFim = null) {
  if (!dados || dados.length === 0) return null;

  // ========================================
  // FILTRO DE PERÍODO
  // ========================================
  let dadosPeriodo = [...dados];
  const mesInicio = dataInicio ? obterMesReferencia(dataInicio) : null;
  const mesFim = dataFim ? obterMesReferencia(dataFim) : null;

  if (mesInicio) dadosPeriodo = dadosPeriodo.filter((item) => item.mesReferencia >= mesInicio);
  if (mesFim) dadosPeriodo = dadosPeriodo.filter((item) => item.mesReferencia <= mesFim);
  if (dadosPeriodo.length === 0) return null;

  // ========================================
  // SNAPSHOT CORRETO: ÚLTIMO MÊS DE CADA CLIENTE
  // ========================================
  const ultimosRegistrosPorCliente = {};
  dadosPeriodo.forEach(reg => {
    const cliente = reg.cliente || "Desconhecido";
    if (!ultimosRegistrosPorCliente[cliente]) {
      ultimosRegistrosPorCliente[cliente] = reg;
    } else {
      if (reg.mesReferencia > ultimosRegistrosPorCliente[cliente].mesReferencia) {
        ultimosRegistrosPorCliente[cliente] = reg;
      }
    }
  });

  let rotasTotais = 0, rotasDisponibilizadas = 0, rotasSinergia = 0, oportunidades = 0;
  let rotasExecutadas = 0, usuariosAtivos = 0, diasAtraso = 0;
  let embarquesPlanejadosSnapshot = 0, embarquesRealizadosSnapshot = 0;

  Object.values(ultimosRegistrosPorCliente).forEach(reg => {
    rotasTotais += Number(reg.rotasTotais || 0);
    rotasDisponibilizadas += Number(reg.rotasDisponibilizadas || 0);
    rotasSinergia += Number(reg.rotasSinergia || reg.rotasMatch || 0);
    oportunidades += Number(reg.oportunidades || 0);
    rotasExecutadas += Number(reg.rotasExecutadas || 0);
    usuariosAtivos += Number(reg.usuariosAtivos || 0);
    diasAtraso = Math.max(diasAtraso, Number(reg.diasAtraso || 0));
    embarquesPlanejadosSnapshot += Number(reg.embarquesPlanejados || 0);
    embarquesRealizadosSnapshot += Number(reg.embarquesRealizados || 0);
  });

  // ========================================
  // CONSOLIDADOS DO PERÍODO COMPLETO
  // ========================================
  const embarquesPlanejados = dadosPeriodo.reduce((total, item) => total + Number(item.embarquesPlanejados || 0), 0);
  const embarquesRealizados = dadosPeriodo.reduce((total, item) => total + Number(item.embarquesRealizados || 0), 0);
  const baseline = dadosPeriodo.reduce((total, item) => total + Number(item.baseline || 0), 0);
  const realizado = dadosPeriodo.reduce((total, item) => total + Number(item.realizado || 0), 0);
  const embarquesOnTime = dadosPeriodo.reduce((total, item) => total + Number(item.embarquesOnTime || 0), 0);
  const embarquesTotal = dadosPeriodo.reduce((total, item) => total + Number(item.embarquesTotal || 0), 0);
  const co2 = dadosPeriodo.reduce((total, item) => total + Number(item.co2 || 0), 0);
  const arvores = dadosPeriodo.reduce((total, item) => total + Number(item.arvores || 0), 0);
  const camposFutebol = dadosPeriodo.reduce((total, item) => total + Number(item.camposFutebol || 0), 0);
  const investimento = dadosPeriodo.reduce((total, item) => total + Number(item.saas || 0), 0);

  // ========================================
  // CÁLCULO DOS KPIs E FINANCEIRO
  // ========================================
  const cobertura = calcularCobertura(rotasDisponibilizadas, rotasTotais);
  const oportunidade = calcularOportunidade(rotasSinergia, rotasDisponibilizadas);
  const conversao = calcularConversao(rotasExecutadas, oportunidades);
  const aderencia = calcularAderencia(embarquesRealizados, embarquesPlanejados);
  const onTime = calcularOnTime(embarquesOnTime, embarquesTotal);

  // MÁGICA DO SAVING E ROI:
  const reducaoCusto = baseline - realizado;
  const savingLiquido = reducaoCusto - investimento; 
  const metaRoiSaaS = investimento * 2; 

  const roiCalculado = investimento > 0 
    ? (savingLiquido / metaRoiSaaS) * 100 
    : (savingLiquido > 0 ? "Infinito" : 0);

  let volume = 0;
  const dadosOrdenados = [...dadosPeriodo].sort((a, b) => new Date(a.mes) - new Date(b.mes));
  if (dadosOrdenados.length >= 2) {
    const atual = dadosOrdenados[dadosOrdenados.length - 1];
    const anterior = dadosOrdenados[dadosOrdenados.length - 2];
    const embarquesAtual = Number(atual.embarquesRealizados || 0);
    const embarquesAnterior = Number(anterior.embarquesRealizados || 0);
    if (embarquesAnterior > 0) {
      volume = ((embarquesAtual - embarquesAnterior) / embarquesAnterior) * 100;
    } else {
      volume = embarquesAtual > 0 ? 100 : 0;
    }
  } else if (dadosOrdenados.length === 1) {
    volume = 0;
  }

  // ========================================
  // CÁLCULO DE TENDÊNCIAS (ÚLTIMO MÊS VS PERÍODO)
  // ========================================
  const tendenciasKpi = {};
  if (dadosOrdenados.length >= 2) {
    const ultimo = dadosOrdenados[dadosOrdenados.length - 1];
    const anterior = dadosOrdenados[dadosOrdenados.length - 2];

    // 1. Cronograma (dias de atraso: menor atraso é positivo/alta)
    const dUlt = Number(ultimo.diasAtraso || 0);
    const dAnt = Number(anterior.diasAtraso || 0);
    const diffDias = dUlt - dAnt;
    if (diffDias < 0) {
      tendenciasKpi.cronograma = {
        tendencia: "alta",
        tendenciaDetalhe: `${diffDias} dias`
      };
    } else if (diffDias > 0) {
      tendenciasKpi.cronograma = {
        tendencia: "queda",
        tendenciaDetalhe: `+${diffDias} dias`
      };
    } else {
      tendenciasKpi.cronograma = {
        tendencia: "estavel",
        tendenciaDetalhe: `0 dias`
      };
    }

    // 2. Utilização (usuários ativos)
    const uUlt = Number(ultimo.usuariosAtivos || 0);
    const uAnt = Number(anterior.usuariosAtivos || 0);
    const diffUsers = uUlt - uAnt;
    if (diffUsers > 0) {
      tendenciasKpi.utilizacao = {
        tendencia: "alta",
        tendenciaDetalhe: `+${diffUsers} usuár.`
      };
    } else if (diffUsers < 0) {
      tendenciasKpi.utilizacao = {
        tendencia: "queda",
        tendenciaDetalhe: `${diffUsers} usuár.`
      };
    } else {
      tendenciasKpi.utilizacao = {
        tendencia: "estavel",
        tendenciaDetalhe: `0 usuár.`
      };
    }

    // 3. Cobertura
    const cobUlt = Number(ultimo.rotasTotais || 0) > 0 ? (Number(ultimo.rotasDisponibilizadas || 0) / Number(ultimo.rotasTotais || 0)) * 100 : 0;
    const cobAnt = Number(anterior.rotasTotais || 0) > 0 ? (Number(anterior.rotasDisponibilizadas || 0) / Number(anterior.rotasTotais || 0)) * 100 : 0;
    const diffCob = cobUlt - cobAnt;
    tendenciasKpi.cobertura = {
      tendencia: diffCob > 0 ? "alta" : (diffCob < 0 ? "queda" : "estavel"),
      tendenciaDetalhe: diffCob > 0 ? `+${diffCob.toFixed(1)}%` : `${diffCob.toFixed(1)}%`
    };

    // 4. Oportunidade
    const opUlt = Number(ultimo.rotasDisponibilizadas || 0) > 0 ? (Number(ultimo.rotasSinergia || 0) / Number(ultimo.rotasDisponibilizadas || 0)) * 100 : 0;
    const opAnt = Number(anterior.rotasDisponibilizadas || 0) > 0 ? (Number(anterior.rotasSinergia || 0) / Number(anterior.rotasDisponibilizadas || 0)) * 100 : 0;
    const diffOp = opUlt - opAnt;
    tendenciasKpi.oportunidade = {
      tendencia: diffOp > 0 ? "alta" : (diffOp < 0 ? "queda" : "estavel"),
      tendenciaDetalhe: diffOp > 0 ? `+${diffOp.toFixed(1)}%` : `${diffOp.toFixed(1)}%`
    };

    // 5. Conversão
    const cvUlt = Number(ultimo.oportunidades || 0) > 0 ? (Number(ultimo.rotasExecutadas || 0) / Number(ultimo.oportunidades || 0)) * 100 : 0;
    const cvAnt = Number(anterior.oportunidades || 0) > 0 ? (Number(anterior.rotasExecutadas || 0) / Number(anterior.oportunidades || 0)) * 100 : 0;
    const diffCv = cvUlt - cvAnt;
    tendenciasKpi.conversao = {
      tendencia: diffCv > 0 ? "alta" : (diffCv < 0 ? "queda" : "estavel"),
      tendenciaDetalhe: diffCv > 0 ? `+${diffCv.toFixed(1)}%` : `${diffCv.toFixed(1)}%`
    };

    // 6. Aderência
    const ultPlan = Number(ultimo.embarquesPlanejados || 0);
    const ultReal = Number(ultimo.embarquesRealizados || 0);
    const antPlan = Number(anterior.embarquesPlanejados || 0);
    const antReal = Number(anterior.embarquesRealizados || 0);
    const adUlt = (ultPlan > 0 && ultReal > 0) ? (ultReal / ultPlan) * 100 : 0;
    const adAnt = (antPlan > 0 && antReal > 0) ? (antReal / antPlan) * 100 : 0;
    const diffAd = adUlt - adAnt;

    if (ultPlan === 0 && ultReal === 0 && (antReal > 0 || embarquesRealizados > 0)) {
      tendenciasKpi.aderencia = {
        tendencia: "queda",
        tendenciaDetalhe: "-100.0%"
      };
    } else {
      tendenciasKpi.aderencia = {
        tendencia: diffAd > 0 ? "alta" : (diffAd < 0 ? "queda" : "estavel"),
        tendenciaDetalhe: diffAd > 0 ? `+${diffAd.toFixed(1)}%` : `${diffAd.toFixed(1)}%`
      };
    }

    // 7. Volume
    const volNum = Number(volume || 0);
    if (volNum > 0) {
      tendenciasKpi.volume = {
        tendencia: "alta",
        tendenciaDetalhe: `+${volNum.toFixed(1)}%`
      };
    } else if (volNum < 0) {
      tendenciasKpi.volume = {
        tendencia: "queda",
        tendenciaDetalhe: `${volNum.toFixed(1)}%`
      };
    } else {
      tendenciasKpi.volume = {
        tendencia: "estavel",
        tendenciaDetalhe: "0.0%"
      };
    }

    // 8. ROI
    const baseUlt = Number(ultimo.baseline || 0);
    const realUlt = Number(ultimo.realizado || 0);
    const saasUlt = Number(ultimo.saas || 0);
    const savLiqUlt = (baseUlt - realUlt) - saasUlt;
    const roiUlt = saasUlt > 0 ? (savLiqUlt / (saasUlt * 2)) * 100 : (savLiqUlt > 0 ? 100 : 0);

    const baseAnt = Number(anterior.baseline || 0);
    const realAnt = Number(anterior.realizado || 0);
    const saasAnt = Number(anterior.saas || 0);
    const savLiqAnt = (baseAnt - realAnt) - saasAnt;
    const roiAnt = saasAnt > 0 ? (savLiqAnt / (saasAnt * 2)) * 100 : (savLiqAnt > 0 ? 100 : 0);
    const diffRoi = roiUlt - roiAnt;

    tendenciasKpi.roi = {
      tendencia: diffRoi > 0 ? "alta" : (diffRoi < 0 ? "queda" : "estavel"),
      tendenciaDetalhe: diffRoi > 0 ? `+${diffRoi.toFixed(1)}%` : `${diffRoi.toFixed(1)}%`
    };

    // 9. On Time
    const otUlt = Number(ultimo.embarquesTotal || 0) > 0 ? (Number(ultimo.embarquesOnTime || 0) / Number(ultimo.embarquesTotal || 0)) * 100 : 0;
    const otAnt = Number(anterior.embarquesTotal || 0) > 0 ? (Number(anterior.embarquesOnTime || 0) / Number(anterior.embarquesTotal || 0)) * 100 : 0;
    const diffOt = otUlt - otAnt;
    tendenciasKpi.onTime = {
      tendencia: diffOt > 0 ? "alta" : (diffOt < 0 ? "queda" : "estavel"),
      tendenciaDetalhe: diffOt > 0 ? `+${diffOt.toFixed(1)}%` : `${diffOt.toFixed(1)}%`
    };
  } else if (dadosOrdenados.length === 1) {
    const unico = dadosOrdenados[0];
    const uPlan = Number(unico.embarquesPlanejados || 0);
    const uReal = Number(unico.embarquesRealizados || 0);
    const uUsers = Number(unico.usuariosAtivos || 0);
    const uDias = Number(unico.diasAtraso || 0);
    const uBase = Number(unico.baseline || 0);
    const uCusto = Number(unico.realizado || 0);
    const uSaas = Number(unico.saas || 0);
    const uSavLiq = (uBase - uCusto) - uSaas;
    const uRoi = uSaas > 0 ? (uSavLiq / (uSaas * 2)) * 100 : (uSavLiq > 0 ? 100 : 0);

    tendenciasKpi.cronograma = {
      tendencia: uDias === 0 ? "alta" : (uDias <= 7 ? "estavel" : "queda"),
      tendenciaDetalhe: `${uDias} dias`
    };
    tendenciasKpi.utilizacao = {
      tendencia: uUsers >= 1 ? "alta" : "queda",
      tendenciaDetalhe: `${uUsers >= 1 ? '+' : ''}${uUsers} usuár.`
    };
    tendenciasKpi.aderencia = {
      tendencia: (uPlan === 0 && uReal === 0) ? "estavel" : (uReal >= uPlan ? "alta" : "queda"),
      tendenciaDetalhe: (uPlan === 0 && uReal === 0) ? "0.0%" : `${uPlan > 0 ? ((uReal/uPlan)*100).toFixed(1) : 0}%`
    };
    tendenciasKpi.volume = {
      tendencia: "estavel",
      tendenciaDetalhe: "0.0%"
    };
    tendenciasKpi.roi = {
      tendencia: uRoi >= 100 ? "alta" : (uRoi >= 50 ? "estavel" : "queda"),
      tendenciaDetalhe: `${uRoi >= 100 ? '+' : ''}${uRoi.toFixed(1)}%`
    };
    tendenciasKpi.cobertura = {
      tendencia: "estavel",
      tendenciaDetalhe: "0.0%"
    };
    tendenciasKpi.oportunidade = {
      tendencia: "estavel",
      tendenciaDetalhe: "0.0%"
    };
    tendenciasKpi.conversao = {
      tendencia: "estavel",
      tendenciaDetalhe: "0.0%"
    };
    tendenciasKpi.onTime = {
      tendencia: "estavel",
      tendenciaDetalhe: "0.0%"
    };
  }

  const historicoScore = calcularHistoricoScore(dadosPeriodo);
  
  const scoreResultado = calcularScore({
    diasAtraso, usuariosAtivos, cobertura, oportunidade, conversao, aderencia, volume, saving: savingLiquido, investimento, onTime,
  });
  const statusScore = obterStatusScore(scoreResultado.score);

  // ========================================
  // 🚀 INJEÇÃO DE ROI E TENDÊNCIAS NOS CARDS 🚀
  // ========================================
  if (scoreResultado.indicadores) {
    Object.keys(scoreResultado.indicadores).forEach(chave => {
      const ind = scoreResultado.indicadores[chave];
      
      // Tendência
      if (tendenciasKpi[chave]) {
        ind.tendencia = tendenciasKpi[chave].tendencia;
        ind.tendenciaDetalhe = tendenciasKpi[chave].tendenciaDetalhe;
      }

      // ROI
      if (ind.nome && ind.nome.toUpperCase().includes("ROI")) {
        ind.resultado = roiCalculado;
        
        if (roiCalculado === "Infinito") {
          ind.atingimento = 100;
          ind.status = "verde";
        } else {
          ind.atingimento = roiCalculado >= 100 ? 100 : (roiCalculado > 0 ? roiCalculado : 0);
          ind.status = roiCalculado >= 100 ? "verde" : (roiCalculado >= 50 ? "amarelo" : "vermelho");
        }
      }
    });
  }

  return {
    diasAtraso, rotasTotais, rotasDisponibilizadas, rotasSinergia, oportunidades, rotasExecutadas, 
    embarquesPlanejados, embarquesRealizados, usuariosAtivos, baseline, realizado, 
    saving: savingLiquido, reducaoCusto, investimento, 
    roi: roiCalculado, co2, arvores, camposFutebol, cobertura, 
    oportunidade, conversao, aderencia, onTime, volume, score: scoreResultado.score, 
    pontuacoes: scoreResultado.pontuacoes, indicadoresScore: scoreResultado.indicadores, 
    resumoScore: scoreResultado.resumo, pontosAtencao: scoreResultado.pontosAtencao, 
    pontosFortes: scoreResultado.pontosFortes, statusScore, historicoScore,
    dataInicio: dadosOrdenados.length > 0 ? dadosOrdenados[0].mes : null,
    dataFim: dadosOrdenados.length > 0 ? dadosOrdenados[dadosOrdenados.length - 1].mes : null,
  };
}

function obterMesReferencia(data) {
  if (!data) return "";
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  return `${ano}-${mes}`;
}
