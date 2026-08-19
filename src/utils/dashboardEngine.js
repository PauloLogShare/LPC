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

  Object.values(ultimosRegistrosPorCliente).forEach(reg => {
    rotasTotais += Number(reg.rotasTotais || 0);
    rotasDisponibilizadas += Number(reg.rotasDisponibilizadas || 0);
    rotasSinergia += Number(reg.rotasSinergia || reg.rotasMatch || 0);
    oportunidades += Number(reg.oportunidades || 0);
    rotasExecutadas += Number(reg.rotasExecutadas || 0);
    usuariosAtivos += Number(reg.usuariosAtivos || 0);
    diasAtraso = Math.max(diasAtraso, Number(reg.diasAtraso || 0));
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

  let volume = null;
  const dadosOrdenados = [...dadosPeriodo].sort((a, b) => new Date(a.mes) - new Date(b.mes));
  if (dadosOrdenados.length >= 2) {
    const atual = dadosOrdenados[dadosOrdenados.length - 1];
    const anterior = dadosOrdenados[dadosOrdenados.length - 2];
    const embarquesAtual = Number(atual.embarquesRealizados || 0);
    const embarquesAnterior = Number(anterior.embarquesRealizados || 0);
    if (embarquesAnterior > 0) {
      volume = ((embarquesAtual - embarquesAnterior) / embarquesAnterior) * 100;
    }
  }

  const historicoScore = calcularHistoricoScore(dadosPeriodo);
  
  const scoreResultado = calcularScore({
    diasAtraso, usuariosAtivos, cobertura, oportunidade, conversao, aderencia, volume, saving: savingLiquido, investimento, onTime,
  });
  const statusScore = obterStatusScore(scoreResultado.score);

  // ========================================
  // 🚀 INJEÇÃO FORÇADA DO ROI NO CARD ESTRATÉGICO 🚀
  // ========================================
  if (scoreResultado.indicadores) {
    Object.values(scoreResultado.indicadores).forEach(ind => {
      // Se o indicador for o do ROI, nós sobrescrevemos o valor do motor antigo!
      if (ind.nome && ind.nome.toUpperCase().includes("ROI")) {
        ind.resultado = roiCalculado;
        
        // Ajusta a cor e o status do Card visualmente
        if (roiCalculado === "Infinito") {
          ind.atingimento = 100;
          ind.status = "verde";
        } else {
          // Se for negativo (-36%), vai ficar com status vermelho automaticamente
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
