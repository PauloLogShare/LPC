/**
 * pricingEngine.js
 * Motor de cálculo puro da Calculadora de Frete LogShare.
 *
 * REGRAS:
 * - Sem dependências de React, DOM ou estado.
 * - Recebe inputs e params como objetos simples, retorna resultado.
 * - Todas as fórmulas foram validadas contra o HTML v18.3.
 */

import { ANTT_EIXOS } from '../constants/pricingDefaults';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Converte string no formato monetário BR para número.
 * Ex: "R$ 1.234,56" → 1234.56 | "1.234,56" → 1234.56
 */
export function parseMoedaBR(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  const limpo = String(str)
    .replace(/R\$\s?/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const val = parseFloat(limpo);
  return isNaN(val) ? 0 : val;
}

/**
 * Converte string de percentual BR para número decimal.
 * Ex: "9,25%" → 0.0925 | "0,035%" → 0.00035
 */
export function parsePercentualBR(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  const limpo = String(str).replace('%', '').replace(',', '.');
  const val = parseFloat(limpo);
  return isNaN(val) ? 0 : val / 100;
}

/**
 * Calcula margem percentual: resultado / base × 100
 * Retorna 0 se base for 0.
 */
export function calcularMargem(resultado, base) {
  if (!base || base === 0) return 0;
  return (resultado / base) * 100;
}

// ─────────────────────────────────────────────────────────────────────────────
// ANTT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcula o valor mínimo da ANTT para uma operação.
 * Fórmula: (CCD × distância) + CC
 *
 * @param {string} tipoCarga - Ex: "Carga Geral"
 * @param {string|number} eixos - Ex: "6" ou 6
 * @param {number} distancia - Distância em km
 * @param {Array} tabelaAntt - Array de linhas da tabela ANTT
 * @returns {number|null} Valor mínimo em R$, ou null se dados insuficientes
 */
export function calcularMinimoAntt(tipoCarga, eixos, distancia, tabelaAntt) {
  if (!tabelaAntt || !tipoCarga || !distancia) return null;

  const linhaCCD = tabelaAntt.find(
    (l) => l.carga === tipoCarga && l.coeficiente === 'CCD'
  );
  const linhaCC = tabelaAntt.find(
    (l) => l.carga === tipoCarga && l.coeficiente === 'CC'
  );

  if (!linhaCCD || !linhaCC) return null;

  const eixoIndex = ANTT_EIXOS.indexOf(String(eixos));
  if (eixoIndex === -1) return null;

  const parseBR = (v) =>
    parseFloat(String(v || '0').replace(/\./g, '').replace(',', '.')) || 0;

  const valorCCD = parseBR(linhaCCD.valores[eixoIndex]);
  const valorCC  = parseBR(linhaCC.valores[eixoIndex]);

  return valorCCD * distancia + valorCC;
}

// ─────────────────────────────────────────────────────────────────────────────
// MOTOR PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcula o resultado completo de uma operação de frete.
 *
 * @param {Object} inputs - Dados do formulário
 * @param {number} inputs.valorReceber    - Valor a receber do embarcador (R$)
 * @param {number} inputs.valorPagar      - Valor a pagar à transportadora (R$)
 * @param {number} inputs.valorCarga      - Valor da carga (R$) — base para GRIS
 * @param {number} inputs.pedagio         - Valor do pedágio (R$)
 * @param {number} inputs.custosExtras    - Custos extras (R$)
 * @param {number} inputs.distancia       - Distância em km
 * @param {number} inputs.percentualGris  - % GRIS informado (decimal, ex: 0.0003)
 * @param {number} inputs.prazoRecebimento - Prazo de recebimento (dias)
 * @param {number} inputs.prazoPagamento   - Prazo de pagamento (dias)
 * @param {number} inputs.potencialEmbarcador   - Potencial de viagens do embarcador
 * @param {number} inputs.potencialTransportador - Potencial de viagens do transportador
 * @param {boolean} inputs.transAgilUtilizada   - Se TransÁgil foi utilizada
 * @param {string} inputs.tipoCarga   - Tipo de carga (para validação ANTT)
 * @param {string} inputs.eixos       - Quantidade de eixos (para validação ANTT)
 *
 * @param {Object} params - Parâmetros editáveis (ver PRICING_DEFAULTS)
 * @param {Array}  tabelaAntt - Tabela ANTT atual
 *
 * @returns {Object} Resultado completo com todos os custos e margens
 */
export function calcularFrete(inputs, params, tabelaAntt) {
  const {
    valorReceber = 0,
    valorPagar = 0,
    valorCarga = 0,
    pedagio = 0,
    custosExtras = 0,
    distancia = 0,
    percentualGris = 0,
    prazoRecebimento = 0,
    prazoPagamento = 0,
    potencialEmbarcador = 0,
    potencialTransportador = 0,
    transAgilUtilizada = false,
    tipoCarga = '',
    eixos = '6',
  } = inputs;

  const {
    custoGr,
    aliquotaRecuperacao,
    custoOperacaoFixo,
    aliquotaIpef,
    taxaFinanceiraMensal,
    grisBase,
  } = params;

  // ── Custos individuais ────────────────────────────────────────────────────
  const custoIpef         = valorPagar * aliquotaIpef;
  const custoOperacao     = custoOperacaoFixo;
  const diasFinanciados   = prazoRecebimento - prazoPagamento;
  const custoFinanceiro   = (diasFinanciados / 30) * taxaFinanceiraMensal * valorPagar;
  const ajusteGris        = valorCarga * (percentualGris - grisBase);
  const custoGrisAjuste   = -ajusteGris; // positivo = custo; negativo = receita extra
  const custoPedagioExtras = pedagio + custosExtras;
  const custoTransportador = valorPagar + custoPedagioExtras;

  const custosTotaisBase =
    custoIpef + custoOperacao + custoFinanceiro + custoGrisAjuste +
    custoPedagioExtras + custoGr;

  // ── Valor exibido transportadora (com ou sem TransÁgil) ──────────────────
  const valorExibidoTransportadora = transAgilUtilizada
    ? valorPagar + valorPagar * aliquotaRecuperacao
    : valorPagar;

  // ── Resultados brutos ─────────────────────────────────────────────────────
  const resultadoBruto       = valorReceber - custoTransportador;
  const resultadoMargemBruta = valorReceber - valorPagar;

  // ── Cenário 1: Sem recuperação fiscal ────────────────────────────────────
  const baseSemRecuperacao     = valorReceber * (1 - aliquotaRecuperacao);
  const custoOperacionalTotal  = custoTransportador + custosTotaisBase - custoPedagioExtras;
  const resultadoSemRecuperacao =
    baseSemRecuperacao -
    valorPagar -
    custoPedagioExtras -
    custoIpef -
    custoOperacao -
    custoFinanceiro -
    custoGr -
    custoGrisAjuste;

  // ── Cenário 2: Com recuperação fiscal (Exceto Simples Nacional) ──────────
  const recuperacaoFiscal       = valorPagar * aliquotaRecuperacao;
  const pisCofinsSobreReceita   = valorReceber * aliquotaRecuperacao;
  const resultadoComRecuperacao =
    valorReceber +
    recuperacaoFiscal -
    valorPagar -
    pisCofinsSobreReceita -
    custoIpef -
    custoOperacao -
    custoFinanceiro -
    custoGrisAjuste -
    custoPedagioExtras -
    custoGr;

  // ── Cenário 3: TransÁgil ─────────────────────────────────────────────────
  const custoPisCofinsTransAgil  = valorPagar * aliquotaRecuperacao;
  const valorPagarComPisCofins   = valorPagar + custoPisCofinsTransAgil;
  const pisCofinsSobreReceitaTA  = valorReceber * aliquotaRecuperacao;
  const recuperacaoTransAgil     = valorPagarComPisCofins * aliquotaRecuperacao;
  const custosTotaisTransAgil    =
    custoIpef + custoOperacao + custoFinanceiro + custoGrisAjuste +
    custoPedagioExtras + custoGr;
  const resultadoTransAgil =
    valorReceber -
    valorPagarComPisCofins -
    pisCofinsSobreReceitaTA -
    custosTotaisTransAgil +
    recuperacaoTransAgil;

  // ── Potencial de viagens ─────────────────────────────────────────────────
  const potencialViagens =
    potencialEmbarcador > 0 && potencialTransportador > 0
      ? Math.min(potencialEmbarcador, potencialTransportador)
      : (potencialEmbarcador || potencialTransportador || 0);

  // ── Capital de Giro Necessário (Working Capital) ──────────────────────────
  // Defasagem em dias entre o recebimento do embarcador e o pagamento ao transportador
  const gapDias = Math.max(0, prazoRecebimento - prazoPagamento);
  
  // Quantidade de viagens executadas durante o período de defasagem (ex: 10 viagens/mês em 45 dias = 15 viagens)
  // Só calcula se o potencial de viagens for informado e maior que zero!
  const viagensNoGap = (potencialViagens > 0 && gapDias > 0)
    ? (potencialViagens / 30) * gapDias
    : 0;

  // Montante de capital de giro necessário para sustentar a operação durante o gap financeiro
  const capitalGiroNecessario = (potencialViagens > 0 && gapDias > 0)
    ? viagensNoGap * custoTransportador
    : 0;
  const custoCapitalGiroMensal = (capitalGiroNecessario * taxaFinanceiraMensal);

  // ── Margens percentuais ──────────────────────────────────────────────────
  const margemBruta =
    valorPagar > 0 ? ((valorReceber / valorPagar) - 1) * 100 : 0;
  const margemSemRecuperacao  = calcularMargem(resultadoSemRecuperacao, baseSemRecuperacao);
  const margemComRecuperacao  = calcularMargem(resultadoComRecuperacao, valorReceber);
  const margemTransAgil       = calcularMargem(resultadoTransAgil, valorReceber);

  // ── Valor/km ─────────────────────────────────────────────────────────────
  const valorKm = distancia > 0 ? custoTransportador / distancia : 0;

  // ── Validação ANTT ───────────────────────────────────────────────────────
  const valorMinimoAntt =
    distancia > 0 ? calcularMinimoAntt(tipoCarga, eixos, distancia, tabelaAntt) : null;

  const statusAnttReceber =
    valorMinimoAntt !== null && distancia > 0 && valorReceber > 0
      ? (valorReceber >= (valorMinimoAntt - 0.01) ? 'acima' : 'abaixo')
      : null;

  const statusAnttPagar =
    valorMinimoAntt !== null && distancia > 0 && valorPagar > 0
      ? (valorPagar >= (valorMinimoAntt - 0.01) ? 'acima' : 'abaixo')
      : null;

  return {
    // Custos
    custoIpef,
    custoOperacao,
    custoFinanceiro,
    custoGrisAjuste,
    custoPedagioExtras,
    custoTransportador,
    custosTotaisBase,
    valorExibidoTransportadora,

    // Recuperação
    recuperacaoFiscal,
    recuperacaoTransAgil,

    // Resultados
    resultadoBruto,
    resultadoMargemBruta,
    resultadoSemRecuperacao,
    resultadoComRecuperacao,
    resultadoTransAgil,

    // Margens (%)
    margemBruta,
    margemSemRecuperacao,
    margemComRecuperacao,
    margemTransAgil,

    // Potencial
    potencialViagens,
    potencialSemRecuperacao:   resultadoSemRecuperacao * potencialViagens,
    potencialComRecuperacao:   resultadoComRecuperacao * potencialViagens,
    potencialTransAgil:        resultadoTransAgil * potencialViagens,

    // Capital de Giro (Working Capital)
    gapDias,
    viagensNoGap,
    capitalGiroNecessario,
    custoCapitalGiroMensal,

    // Auxiliares
    valorKm,
    baseSemRecuperacao,
    diasFinanciados,

    // ANTT
    valorMinimoAntt,
    statusAnttReceber,
    statusAnttPagar,
  };
}
