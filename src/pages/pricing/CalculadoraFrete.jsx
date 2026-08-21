/**
 * CalculadoraFrete.jsx
 * Componente principal da Calculadora de Frete LogShare — React v2.0
 * Porta fiel do HTML v18.3 com parâmetros editáveis e persistência JSON.
 */

import { useState, useMemo, useCallback, useId } from 'react';
import { jsPDF } from 'jspdf';
import { calcularFrete, parseMoedaBR, parsePercentualBR } from '../../utils/pricingEngine';
import { usePricingParams } from '../../hooks/usePricingParams';
import { useCadastros } from '../../hooks/useCadastros';
import { obterTabelaAntt } from './PricingAnttModal';
import { registrarFrete, obterHistorico } from './PricingHistorico';
import { TIPOS_CARGA } from '../../constants/pricingDefaults';
import PricingParametros from './PricingParametros';
import PricingAnttModal from './PricingAnttModal';
import PricingHistorico from './PricingHistorico';
import PricingCadastros from './PricingCadastros';
import BenchmarkMercado from '../../components/BenchmarkMercado';
import BenchmarkHistoricoModal from '../../components/BenchmarkHistoricoModal';
import { useCustosOperacionais } from '../../hooks/useCustosOperacionais';
import { consultarBenchmarkHub } from '../../services/hubHistoricoService';

// ─────────────────────────────────────────────────────────────────────────────
// FORMATAÇÃO
// ─────────────────────────────────────────────────────────────────────────────
const fmt = {
  moeda: (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0),
  perc:  (v) => `${Number(v || 0).toFixed(2).replace('.', ',')}%`,
  num:   (v) => new Intl.NumberFormat('pt-BR').format(v || 0),
  km:    (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 3 }).format(v || 0) + '/km',
};

function parseMoedaInput(str) {
  if (!str) return 0;
  return parseMoedaBR(str);
}

function formatarMoedaInput(v) {
  if (!v && v !== 0) return '';
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
}

function formatarMoedaDigitacao(valor) {
  if (!valor) return '';
  const digitos = String(valor).replace(/\D/g, '');
  if (!digitos) return '';
  const num = Number(digitos) / 100;
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
}

// ─────────────────────────────────────────────────────────────────────────────
// GERAÇÃO DE ID ÚNICO
// ─────────────────────────────────────────────────────────────────────────────
const SEQ_KEY = 'logshare_id_sequencial';
function gerarId() {
  let seq = parseInt(localStorage.getItem(SEQ_KEY) || '1000') + 1;
  localStorage.setItem(SEQ_KEY, seq);
  return `${seq}-${Date.now()}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// GERAÇÃO DE PDF
// ─────────────────────────────────────────────────────────────────────────────
function gerarPdf(campos, resultado, params, id) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, pad = 16;
  let y = 18;

  // Header Barra Superior
  doc.setFillColor(5, 42, 103);
  doc.rect(0, 0, W, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16); doc.setFont('helvetica', 'bold');
  doc.text('LogShare — Proposta Comercial de Frete', pad, 13);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.text(`Protocolo: #${id} · Emissão: ${new Date().toLocaleString('pt-BR')} · Status: Envio para Aprovação`, pad, 21);
  y = 36;

  // 1. Dados da Operação & Rota
  doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(5, 42, 103);
  doc.text('1. Dados da Operação, Rota e Condições Comerciais', pad, y); y += 5;

  const infoCol1 = [
    ['Embarcador', campos.embarcador || '—'],
    ['Transportador / Parceiro', campos.parceiro || '—'],
    ['Origem', campos.origem || '—'],
    ['Destino', campos.destino || '—'],
    ['Distância da Rota', campos.distancia ? `${campos.distancia} km` : '—'],
  ];

  const infoCol2 = [
    ['Tipo de Carga', campos.tipoCarga || '—'],
    ['Eixos / Veículo', `${campos.eixos} Eixos`],
    ['Prazo de Recebimento', `${campos.prazoRecebimento || 0} dias`],
    ['Prazo de Pagamento', `${campos.prazoPagamento || 0} dias`],
    ['Gap Financeiro (Ciclo)', `${resultado.gapDias} dias`],
    ['TransÁgil Utilizada?', campos.transAgil ? 'Sim (Recuperação Ativa)' : 'Não'],
  ];

  doc.setFontSize(8.5);
  const startYInfo = y;
  infoCol1.forEach(([k, v]) => {
    doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 116, 139); doc.text(k + ':', pad, y);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 41, 59); doc.text(String(v), pad + 38, y);
    y += 5;
  });

  let y2 = startYInfo;
  infoCol2.forEach(([k, v]) => {
    doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 116, 139); doc.text(k + ':', 110, y2);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 41, 59); doc.text(String(v), 155, y2);
    y2 += 5;
  });

  y = Math.max(y, y2) + 4;

  // 2. Capital de Giro & Fluxo de Caixa
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(pad, y, W - pad * 2, 16, 2, 2, 'F');
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(146, 64, 14);
  doc.text('Capital de Giro & Fluxo de Caixa', pad + 4, y + 5.5);
  doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(120, 53, 15);
  
  const capText = resultado.potencialViagens > 0
    ? `Potencial: ${resultado.potencialViagens} rotas/mês  |  Viagens no Ciclo do Gap: ${Number(resultado.viagensNoGap).toFixed(1)} rotas  |  Capital de Giro Necessário: ${fmt.moeda(resultado.capitalGiroNecessario)}`
    : `Potencial de viagens não informado no cadastro (Capital de Giro projetado: R$ 0,00)`;
  doc.text(capText, pad + 4, y + 11.5);
  y += 22;

  // 3. Indicadores Financeiros & Margens (Com % e R$)
  doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(5, 42, 103);
  doc.text('2. Indicadores de Rentabilidade & Margens', pad, y); y += 5;

  const kpis = [
    { label: 'Margem Bruta (Alvo)', perc: fmt.perc(resultado.margemBruta), val: fmt.moeda(resultado.resultadoMargemBruta), destaque: false },
    { label: 'Margem Sem Recuperação', perc: fmt.perc(resultado.margemSemRecuperacao), val: fmt.moeda(resultado.resultadoSemRecuperacao), destaque: !campos.transAgil },
    { label: 'Margem Com Recuperação', perc: fmt.perc(resultado.margemComRecuperacao), val: fmt.moeda(resultado.resultadoComRecuperacao), destaque: false },
    { label: 'Margem TransÁgil (Cenário Ativo)', perc: fmt.perc(resultado.margemTransAgil), val: fmt.moeda(resultado.resultadoTransAgil), destaque: campos.transAgil },
  ];

  kpis.forEach((kpi, i) => {
    const x = pad + (i % 2) * 90;
    if (i % 2 === 0 && i > 0) y += 18;
    doc.setFillColor(kpi.destaque ? 240 : 248, kpi.destaque ? 253 : 250, kpi.destaque ? 244 : 252);
    doc.setDrawColor(kpi.destaque ? 22 : 226, kpi.destaque ? 163 : 232, kpi.destaque ? 74 : 240);
    doc.roundedRect(x, y - 4, 85, 15, 2, 2, 'FD');
    
    doc.setFontSize(8); doc.setTextColor(kpi.destaque ? 21 : 100, kpi.destaque ? 128 : 116, kpi.destaque ? 61 : 139); doc.setFont('helvetica', 'bold');
    doc.text(kpi.label, x + 4, y + 1);
    
    doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59);
    doc.text(`${kpi.perc}  (${kpi.val})`, x + 4, y + 7.5);
  });
  y += 20;

  // 4. DRE Sintética / Resumo Financeiro
  doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(5, 42, 103);
  doc.text('3. DRE Sintética da Operação', pad, y); y += 5;

  const resumo = [
    ['Receita Bruta (Valor a Receber do Embarcador)', fmt.moeda(parseMoedaInput(campos.valorReceber)), true],
    ['(-) Custo do Frete (Valor a Pagar ao Transportador)', fmt.moeda(parseMoedaInput(campos.valorPagar)), false],
    ['(-) Custo IPEF', fmt.moeda(resultado.custoIpef), false],
    ['(-) Custo Operacional', fmt.moeda(resultado.custoOperacao), false],
    ['(-) Custo Financeiro', fmt.moeda(resultado.custoFinanceiro), false],
    ['(-) Custo Gerenciamento de Risco (GR)', fmt.moeda(params.custoGr), false],
    ['(-) Pedágio + Custos Extras', fmt.moeda(resultado.custoPedagioExtras), false],
    ['(-) Ajuste GRIS / AdValorem', fmt.moeda(resultado.custoGrisAjuste), false],
    ['(=) Resultado Líquido da Operação (Lucro Bruto)', fmt.moeda(resultado.resultadoMargemBruta), true],
  ];

  doc.setFontSize(8.5);
  resumo.forEach(([k, v, isDestaque]) => {
    if (isDestaque) {
      doc.setFillColor(241, 245, 249);
      doc.rect(pad, y - 3.5, W - pad * 2, 5.5, 'F');
      doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 23, 42);
    } else {
      doc.setFont('helvetica', 'normal'); doc.setTextColor(71, 85, 105);
    }
    doc.text(k, pad + 2, y);
    doc.setFont('helvetica', 'bold');
    doc.text(v, 190, y, { align: 'right' });
    y += 5.5;
  });

  if (campos.observacoes) {
    y += 3;
    doc.setFontSize(9.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(5, 42, 103);
    doc.text('Observações & Diretrizes:', pad, y); y += 4.5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(51, 65, 85);
    const lines = doc.splitTextToSize(campos.observacoes, W - pad * 2);
    doc.text(lines, pad, y);
  }

  // Footer
  doc.setFillColor(5, 42, 103);
  doc.rect(0, 285, W, 12, 'F');
  doc.setTextColor(255, 255, 255); doc.setFontSize(8.5); doc.setFont('helvetica', 'normal');
  doc.text('LogShare — Performance Center · Documento confidencial para aprovação comercial', W / 2, 292, { align: 'center' });

  doc.save(`Proposta_LogShare_${id}_${new Date().toISOString().slice(0,10)}.pdf`);
}

// ─────────────────────────────────────────────────────────────────────────────
// INPUTS INICIAIS
// ─────────────────────────────────────────────────────────────────────────────
const INPUTS_VAZIOS = {
  embarcador: '', parceiro: '', origem: '', destino: '',
  valorReceber: '', valorPagar: '', valorCarga: '',
  pedagio: '', custosExtras: '', observacoes: '',
  distancia: '', potencialEmbarcador: '', potencialTransportador: '',
  prazoRecebimento: '', prazoPagamento: '', gris: '',
  tipoCarga: 'Carga Geral', eixos: '6', transAgil: false,
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTES INTERNOS
// ─────────────────────────────────────────────────────────────────────────────

function KpiCard({ titulo, margem, resultado, recuperacao, destaque, badgeAtivo }) {
  const corMargem = margem > 8 ? '#16a34a' : margem > 0 ? '#d97706' : '#dc2626';
  const bgDestaque = margem > 8 ? '#f0fdf4' : margem > 0 ? '#fffbeb' : '#fef2f2';

  return (
    <div
      style={{
        background: destaque ? bgDestaque : '#fff',
        borderRadius: '8px',
        padding: '7px 10px',
        boxShadow: destaque ? `0 2px 8px ${corMargem}30` : '0 1px 4px rgba(15,23,42,0.05)',
        border: destaque ? `2px solid ${corMargem}` : '1px solid #e2e8f0',
        borderLeft: destaque ? `5px solid ${corMargem}` : `3px solid ${corMargem}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Header do Card com Título e Badge posicionado sem sobreposição */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '4px', marginBottom: '2px' }}>
        <div style={{ fontSize: '10px', color: destaque ? '#0f172a' : '#64748b', fontWeight: destaque ? '800' : '700', lineHeight: 1.2 }}>
          {titulo}
        </div>
        {badgeAtivo && (
          <span
            style={{
              background: corMargem,
              color: '#fff',
              fontSize: '8.5px',
              fontWeight: '900',
              padding: '1px 5px',
              borderRadius: '4px',
              letterSpacing: '0.2px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            ✔ Cenário Escolhido
          </span>
        )}
      </div>

      <div style={{ fontSize: '18px', fontWeight: '900', color: corMargem, lineHeight: 1.1, margin: '2px 0' }}>
        {fmt.perc(margem)}
      </div>

      <div style={{ fontSize: '9.5px', color: '#475569', lineHeight: 1.2 }}>
        {recuperacao !== undefined && <span>Rec.: <strong>{fmt.moeda(recuperacao)}</strong> · </span>}
        Res.: <strong style={{ color: resultado < 0 ? '#dc2626' : '#16a34a' }}>{fmt.moeda(resultado)}</strong>
      </div>
    </div>
  );
}

function ResumoItem({ label, valor, cor }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2.5px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', gap: '6px' }}>
      <span style={{ fontSize: '10.5px', color: '#cbd5e1', lineHeight: 1.2 }}>{label}</span>
      <strong style={{ fontSize: '10.5px', color: cor || '#fff', whiteSpace: 'nowrap' }}>{valor}</strong>
    </div>
  );
}

function FormGroup({ label, children, tooltip }) {
  return (
    <div style={{ marginBottom: '4px' }}>
      <label style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: '#475569', marginBottom: '1px' }}>
        {label}
        {tooltip && <span style={{ marginLeft: '4px', fontSize: '9px', color: '#94a3b8', fontWeight: '500' }}>({tooltip})</span>}
      </label>
      {children}
    </div>
  );
}

const inputSt = {
  width: '100%', padding: '4px 8px', border: '1px solid #cbd5e1',
  borderRadius: '5px', fontSize: '11.5px', background: '#f8fafc',
  color: '#0f172a', fontWeight: '600', boxSizing: 'border-box', outline: 'none',
  minHeight: '26px',
};

// ─────────────────────────────────────────────────────────────────────────────
export default function CalculadoraFrete({ propostaInicial, dadosBrutos }) {
  const { params, atualizarParam, resetarParams } = usePricingParams();
  const { cadastros, embarcadores, parceiros, adicionar, atualizar, remover } = useCadastros();
  const { apuracao: custosParceiro, config: configCustos } = useCustosOperacionais();
  const [tabelaAntt, setTabelaAntt] = useState(obterTabelaAntt);
  const [campos, setCampos] = useState(() => {
    if (propostaInicial) {
      return {
        embarcador: propostaInicial.embarcador || '',
        parceiro: propostaInicial.parceiro || '',
        origem: propostaInicial.origem || '',
        destino: propostaInicial.destino || '',
        valorReceber: propostaInicial.valorReceber || '',
        valorPagar: propostaInicial.valorPagar || '',
        valorCarga: propostaInicial.valorCarga || '',
        pedagio: propostaInicial.pedagio || '',
        custosExtras: propostaInicial.custosExtras || '',
        observacoes: propostaInicial.observacoes || '',
        distancia: propostaInicial.distancia || '',
        potencialEmbarcador: propostaInicial.potencialEmbarcador || '',
        potencialTransportador: propostaInicial.potencialTransportador || '',
        prazoRecebimento: propostaInicial.prazoRecebimento || '',
        prazoPagamento: propostaInicial.prazoPagamento || '',
        gris: propostaInicial.gris || '',
        tipoCarga: propostaInicial.tipoCarga || 'Carga Geral',
        eixos: propostaInicial.eixos || '6',
        transAgil: propostaInicial.transAgil === 'Sim',
      };
    }
    return INPUTS_VAZIOS;
  });
  const [idAtual, setIdAtual] = useState(() => propostaInicial?.id || '');
  const [buscandoDist, setBuscandoDist] = useState(false);
  const [statusDist, setStatusDist] = useState('');
  const [errosAntt, setErrosAntt] = useState({ receber: null, pagar: null });
  const [periodoBenchmark, setPeriodoBenchmark] = useState('90');

  // Modais
  const [modal, setModal] = useState(null); // 'params' | 'antt' | 'historico' | 'cadastros'

  // ── Derivação dos inputs para o motor ──────────────────────────────────────
  const inputs = useMemo(() => ({
    valorReceber:         parseMoedaInput(campos.valorReceber),
    valorPagar:           parseMoedaInput(campos.valorPagar),
    valorCarga:           parseMoedaInput(campos.valorCarga),
    pedagio:              parseMoedaInput(campos.pedagio),
    custosExtras:         parseMoedaInput(campos.custosExtras),
    distancia:            Number(campos.distancia) || 0,
    percentualGris:       parsePercentualBR(campos.gris),
    prazoRecebimento:     Number(campos.prazoRecebimento) || 0,
    prazoPagamento:       Number(campos.prazoPagamento) || 0,
    potencialEmbarcador:  Number(campos.potencialEmbarcador) || 0,
    potencialTransportador: Number(campos.potencialTransportador) || 0,
    transAgilUtilizada:   campos.transAgil,
    tipoCarga:            campos.tipoCarga,
    eixos:                campos.eixos,
  }), [campos]);

  // ── Cálculo reativo ────────────────────────────────────────────────────────
  const resultado = useMemo(
    () => calcularFrete(inputs, params, tabelaAntt),
    [inputs, params, tabelaAntt]
  );

  // ── Inteligência de Mercado HUB LogShare (28.630 Fretes Finalizados) ─────
  const benchmarkHub = useMemo(() => {
    return consultarBenchmarkHub({
      origem: campos.origem,
      destino: campos.destino,
      distancia: Number(campos.distancia) || 0,
      eixos: campos.eixos,
    });
  }, [campos.origem, campos.destino, campos.distancia, campos.eixos]);

  // ── Custo Operacional do Parceiro Transportador (Break-Even R$/km * KM) ───
  const custoBreakEvenKm = custosParceiro?.custoOperacionalTotalPorKm || 5.839;
  const custoEstimadoTransportador = useMemo(() => {
    const dist = Number(campos.distancia) || 0;
    if (dist <= 0) return 0;
    
    // CUSTO OPERACIONAL TOTAL (BREAK-EVEN) * KM da rota + Pedágio + Custos Extras
    const pedagio = parseMoedaInput(campos.pedagio) || 0;
    const extras  = parseMoedaInput(campos.custosExtras) || 0;
    return Math.round((dist * custoBreakEvenKm) + pedagio + extras);
  }, [campos.distancia, campos.pedagio, campos.custosExtras, custoBreakEvenKm]);

  // ── Margem EBITDA do Cadastro do Parceiro Transportador ────────────────────
  const margemEbitdaParceiro = useMemo(() => {
    const raw = Number(configCustos?.markup?.margemLucroDesejadaPerc);
    if (isNaN(raw)) return 0.15;
    return raw > 1 ? raw / 100 : raw;
  }, [configCustos]);

  // ── Sugestão de Pagamento ao Transportador (Custo * EBITDA % com Piso ANTT) ─
  const sugestaoPagar = useMemo(() => {
    const anttMin  = resultado.valorMinimoAntt || 0;
    const custoOp  = custoEstimadoTransportador || 0;
    
    if (custoOp <= 0 && anttMin <= 0) return 0;

    // Custo Operacional * (1 + Margem de Lucro Desejada / EBITDA %)
    const valorComMargemEbitda = Math.round(custoOp * (1 + margemEbitdaParceiro));

    // Se o valor com margem for menor que o Piso ANTT, aplica o Piso ANTT
    return Math.max(valorComMargemEbitda, anttMin);
  }, [resultado.valorMinimoAntt, custoEstimadoTransportador, margemEbitdaParceiro]);

  // ── Média de Mercado Real (rec_valor_frete do HUB LogShare) ────────────────
  const mercadoReal = useMemo(() => {
    const temRota = Boolean(Number(campos.distancia) > 0 || (campos.origem && campos.destino));
    if (!temRota) return 0;

    // 1. Prioridade Máxima: rec_valor_frete do HUB de Dados LogShare
    if (benchmarkHub.encontrado && benchmarkHub.recValorFrete > 0) {
      return benchmarkHub.recValorFrete;
    }

    // 2. Histórico salvo de propostas
    const historico = obterHistorico();
    if (historico && historico.length > 0) {
      const matchHist = historico.filter((h) => {
        return (campos.origem && (h.origem || '').toLowerCase().includes(campos.origem.toLowerCase())) ||
               (campos.destino && (h.destino || '').toLowerCase().includes(campos.destino.toLowerCase()));
      });
      if (matchHist.length > 0) {
        const soma = matchHist.reduce((acc, cur) => acc + parseMoedaInput(cur.valorReceber), 0);
        const media = Math.round(soma / matchHist.length);
        if (media > 0) return media;
      }
    }

    if (inputs.valorReceber > 0) return Math.round(inputs.valorReceber * 1.04);
    if (resultado.valorMinimoAntt > 0) return Math.round(resultado.valorMinimoAntt * 1.085);
    return 0;
  }, [campos.origem, campos.destino, campos.distancia, inputs.valorReceber, resultado.valorMinimoAntt, benchmarkHub]);

  // Atualiza labels de validação ANTT
  useMemo(() => {
    if (resultado.valorMinimoAntt !== null) {
      setErrosAntt({
        receber: resultado.statusAnttReceber,
        pagar:   resultado.statusAnttPagar,
      });
    } else {
      setErrosAntt({ receber: null, pagar: null });
    }
  }, [resultado.valorMinimoAntt, resultado.statusAnttReceber, resultado.statusAnttPagar]);

  // ── Handlers de campos ─────────────────────────────────────────────────────
  const handleCampo = useCallback((campo, valor) => {
    setCampos((p) => ({ ...p, [campo]: valor }));
  }, []);

  function handleMoedaChange(campo, e) {
    const raw = e.target.value;
    const formatado = formatarMoedaDigitacao(raw);
    handleCampo(campo, formatado);
  }

  function limpar() {
    setCampos(INPUTS_VAZIOS);
    setIdAtual('');
    setStatusDist('');
    setErrosAntt({ receber: null, pagar: null });
  }

  // ── Cálculo automático de distância ───────────────────────────────────────
  async function calcularDistancia() {
    if (!campos.origem || !campos.destino) return;
    setBuscandoDist(true);
    setStatusDist('Buscando rota mais curta... ⏳');
    try {
      const normalizarParaGeocode = (str) => {
        if (!str) return '';
        return str.replace(/\s*\/\s*/g, ', ').trim();
      };
      const getCoords = async (cidade) => {
        const clean = normalizarParaGeocode(cidade);
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(clean + ', Brasil')}`);
        const data = await res.json();
        if (data?.length > 0) return { lat: data[0].lat, lon: data[0].lon };
        throw new Error('Local não encontrado: ' + cidade);
      };
      const [orig, dest] = await Promise.all([getCoords(campos.origem), getCoords(campos.destino)]);
      const rotaRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${orig.lon},${orig.lat};${dest.lon},${dest.lat}?alternatives=true&overview=false`);
      const rotaData = await rotaRes.json();
      if (rotaData.routes?.length > 0) {
        const menor = Math.min(...rotaData.routes.map((r) => r.distance));
        const km = Math.round(menor / 1000);
        handleCampo('distancia', String(km));
        setStatusDist(`✔ Distância: ${km} km (rota mais curta)`);
      } else throw new Error('Sem rota disponível.');
    } catch (e) {
      setStatusDist('⚠ Erro ao calcular distância. Informe manualmente.');
    } finally {
      setBuscandoDist(false);
    }
  }

  // ── Enviar para aprovação (gera PDF + registra histórico) ─────────────────
  async function enviarAprovacao() {
    if (!campos.embarcador || !campos.parceiro || !campos.valorReceber || !campos.valorPagar) {
      alert('Preencha os campos obrigatórios: Embarcador, Parceiro, Valor a Receber e Valor a Pagar.');
      return;
    }
    const id = idAtual || gerarId();
    setIdAtual(id);

    const registro = {
      id, dataHora: new Date().toLocaleString('pt-BR'),
      embarcador: campos.embarcador, parceiro: campos.parceiro,
      origem: campos.origem, destino: campos.destino,
      valorReceber: campos.valorReceber, valorPagar: campos.valorPagar,
      potencialViagens: resultado.potencialViagens,
      potencialEmbarcador: campos.potencialEmbarcador,
      potencialTransportador: campos.potencialTransportador,
      prazoRecebimento: campos.prazoRecebimento, prazoPagamento: campos.prazoPagamento,
      valorCarga: campos.valorCarga, gris: campos.gris,
      distancia: campos.distancia, pedagio: campos.pedagio,
      custosExtras: campos.custosExtras, tipoCarga: campos.tipoCarga,
      eixos: campos.eixos, transAgil: campos.transAgil ? 'Sim' : 'Não',
      observacoes: campos.observacoes,
      statusAntt: resultado.statusAnttPagar
        ? `${resultado.statusAnttPagar === 'acima' ? '✔' : '⚠'} ANTT mínima: ${fmt.moeda(resultado.valorMinimoAntt)}`
        : '',
      margemBruta: fmt.perc(resultado.margemBruta),
      resultadoSemRecuperacao: fmt.moeda(resultado.resultadoSemRecuperacao),
      resultadoComRecuperacao: fmt.moeda(resultado.resultadoComRecuperacao),
      resultadoTransAgil: fmt.moeda(resultado.resultadoTransAgil),
      capitalGiroNecessario: fmt.moeda(resultado.capitalGiroNecessario),
      viagensNoGap: resultado.viagensNoGap,
      gapDias: resultado.gapDias,
      statusAprovacao: 'pendente',
      solicitante: '', // reservado para fluxo de aprovação futuro
    };

    registrarFrete(registro);
    gerarPdf(campos, resultado, params, id);
  }

  // ── Restaurar proposta do histórico ────────────────────────────────────────
  function restaurarProposta(frete) {
    setCampos({
      embarcador: frete.embarcador || '',
      parceiro: frete.parceiro || '',
      origem: frete.origem || '',
      destino: frete.destino || '',
      valorReceber: frete.valorReceber || '',
      valorPagar: frete.valorPagar || '',
      valorCarga: frete.valorCarga || '',
      pedagio: frete.pedagio || '',
      custosExtras: frete.custosExtras || '',
      observacoes: frete.observacoes || '',
      distancia: frete.distancia || '',
      potencialEmbarcador: frete.potencialEmbarcador || '',
      potencialTransportador: frete.potencialTransportador || '',
      prazoRecebimento: frete.prazoRecebimento || '',
      prazoPagamento: frete.prazoPagamento || '',
      gris: frete.gris || '',
      tipoCarga: frete.tipoCarga || 'Carga Geral',
      eixos: frete.eixos || '6',
      transAgil: frete.transAgil === 'Sim',
    });
    setIdAtual(frete.id || '');
  }

  // ─── RENDER ──────────────────────────────────────────────────────────────
  const anttLabel = (tipo, valDigitado, valorMinimo) => {
    if (!tipo || !valorMinimo || valDigitado === undefined || valDigitado === null || valDigitado <= 0) return null;
    const num = Number(valDigitado);
    const min = Number(valorMinimo);
    
    // É considerado abaixo da ANTT apenas quando for estritamente menor (tolerância de 5 centavos contra dízima)
    const isAbaixo = num < (min - 0.05);

    if (isAbaixo) {
      return (
        <small style={{ display: 'block', marginTop: '3px', fontSize: '10.5px', fontWeight: '700', color: '#dc2626' }}>
          ⚠ Abaixo ANTT | Mínimo: {fmt.moeda(min)}
        </small>
      );
    }

    const isIgual = Math.abs(num - min) <= 0.05 || Math.round(num) === Math.round(min);
    return (
      <small style={{ display: 'block', marginTop: '3px', fontSize: '10.5px', fontWeight: '700', color: '#16a34a' }}>
        ✔ {isIgual ? 'Piso ANTT' : 'Acima ANTT'} | Mínimo: {fmt.moeda(min)}
      </small>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>

      {/* ── Toolbar / Cabeçalho no Padrão LPC ────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h2 className="lpc-section-title" style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Calculadora de Frete & Formação de Preço
            {idAtual && <span style={{ marginLeft: '8px', fontSize: '11px', fontWeight: '700', background: '#e2e8f0', color: '#475569', padding: '2px 7px', borderRadius: '6px' }}>#{idAtual}</span>}
          </h2>
          <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '1px' }}>Simulador oficial com inteligência de benchmark, ANTT e custos operacionais</div>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button onClick={limpar} style={toolBtn}>🗑 Limpar Campos</button>
          <button onClick={enviarAprovacao} style={{ ...toolBtn, background: '#14b8a6', color: '#fff', fontWeight: '800' }}>
            📄 Enviar para Aprovação (PDF)
          </button>
        </div>
      </div>

      {/* ── 4 KPIs com Destaque Dinâmico para Cenário TransÁgil ───────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
        <KpiCard
          titulo="Margem Bruta (Receber / Pagar)"
          margem={resultado.margemBruta}
          resultado={resultado.resultadoMargemBruta}
        />
        <KpiCard
          titulo="Margem sem Recuperação"
          margem={resultado.margemSemRecuperacao}
          resultado={resultado.resultadoSemRecuperacao}
        />
        <KpiCard
          titulo={<>Margem Recuperação<br/><small style={{fontWeight:500,fontSize:'9.5px'}}>(Exceto Simples Nacional)</small></>}
          margem={resultado.margemComRecuperacao}
          resultado={resultado.resultadoComRecuperacao}
          recuperacao={resultado.recuperacaoFiscal}
          destaque={!campos.transAgil}
          badgeAtivo={!campos.transAgil}
        />
        <KpiCard
          titulo="Margem Recuperação (TransÁgil)"
          margem={resultado.margemTransAgil}
          resultado={resultado.resultadoTransAgil}
          recuperacao={resultado.recuperacaoTransAgil}
          destaque={campos.transAgil}
          badgeAtivo={campos.transAgil}
        />
      </div>

      {/* ── Potencial de viagens & Indicadores Financeiros ─────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
        {[
          {
            label: 'Potencial da Oportunidade',
            valor: `${fmt.num(resultado.potencialViagens)} viagem${resultado.potencialViagens !== 1 ? 's' : ''}/mês`,
            sub: 'Volume mensal estimado',
            cor: '#14b8a6',
          },
          {
            label: 'Sem Recuperação',
            valor: fmt.moeda(resultado.potencialSemRecuperacao),
            sub: 'Margem total / mês',
            cor: '#0284c7',
          },
          {
            label: 'Exceto Simples Nacional',
            valor: fmt.moeda(resultado.potencialComRecuperacao),
            sub: 'Margem total / mês',
            cor: '#16a34a',
          },
          {
            label: 'TransÁgil',
            valor: fmt.moeda(resultado.potencialTransAgil),
            sub: 'Margem total / mês',
            cor: '#7c3aed',
          },
          {
            label: '💰 Capital de Giro',
            valor: resultado.potencialViagens > 0 ? fmt.moeda(resultado.capitalGiroNecessario) : 'R$ 0,00',
            sub: resultado.potencialViagens > 0
              ? `${Number(resultado.viagensNoGap).toFixed(1).replace('.0', '')} rotas no ciclo de ${resultado.gapDias} dias (${campos.prazoRecebimento || 0}d rec. - ${campos.prazoPagamento || 0}d pag.)`
              : 'Informe o potencial de viagens/mês',
            cor: '#f59e0b',
            destaque: true,
          },
        ].map(({ label, valor, sub, cor, destaque }) => (
          <div
            key={label}
            style={{
              background: destaque ? '#fffbeb' : '#fff',
              borderRadius: '8px',
              padding: '8px 12px',
              boxShadow: '0 1px 4px rgba(15,23,42,0.05)',
              borderLeft: `3px solid ${cor}`,
              border: destaque ? '1px solid #fef3c7' : 'none',
              borderLeftWidth: '3px',
            }}
          >
            <div style={{ fontSize: '10px', color: destaque ? '#b45309' : '#64748b', fontWeight: '800', marginBottom: '2px' }}>
              {label}
            </div>
            <div style={{ fontSize: '13.5px', fontWeight: '900', color: destaque ? '#b45309' : '#052a67' }}>
              {valor}
            </div>
            {sub && (
              <div style={{ fontSize: '9.5px', color: destaque ? '#d97706' : '#94a3b8', marginTop: '2px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={sub}>
                {sub}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── 1. Formulário da Rota + Resumo Financeiro ─────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2.2fr) 270px', gap: '8px' }}>

        {/* Formulário Compacto */}
        <div style={{ background: '#fff', borderRadius: '8px', padding: '12px 14px', boxShadow: '0 1px 4px rgba(15,23,42,0.05)', border: '1px solid #e2e8f0' }}>
          
          {/* Cabeçalho do Item 1 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '5px' }}>
            <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#052a67', color: '#fff', fontWeight: '900', fontSize: '10.5px', display: 'grid', placeItems: 'center' }}>1</span>
            <h3 style={{ fontSize: '13px', fontWeight: '900', color: '#052a67', margin: 0 }}>Dados da Operação & Formação de Preço</h3>
            <span style={{ fontSize: '12px', color: '#94a3b8', cursor: 'help' }} title="Preencha os dados da rota, valores de negociação e prazos da operação">🛈</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0 12px' }}>

            {/* Coluna 1: Embarcador */}
            <div>
              <div style={sectionTitle}>1. Embarcador</div>
              <FormGroup label="Cliente / Embarcador *">
                <select style={inputSt} value={campos.embarcador} onChange={(e) => handleCampo('embarcador', e.target.value)}>
                  <option value="">Selecione...</option>
                  {embarcadores.map((e) => <option key={e.id} value={e.nome}>{e.nome}</option>)}
                </select>
              </FormGroup>
              <FormGroup label="Prazo Recebimento (dias) *">
                <input type="number" style={inputSt} value={campos.prazoRecebimento} onChange={(e) => handleCampo('prazoRecebimento', e.target.value)} />
              </FormGroup>
              <FormGroup label="Valor a Receber (R$) *">
                <input type="text" style={inputSt} value={campos.valorReceber}
                  onChange={(e) => handleMoedaChange('valorReceber', e)}
                  placeholder="0,00" />
                {anttLabel(errosAntt.receber, parseMoedaInput(campos.valorReceber), resultado.valorMinimoAntt)}
              </FormGroup>
              <FormGroup label="Potencial de Viagens">
                <input type="number" style={inputSt} min="0" value={campos.potencialEmbarcador} onChange={(e) => handleCampo('potencialEmbarcador', e.target.value)} placeholder="0" />
              </FormGroup>
              <FormGroup label="Tipo de Produto / Carga">
                <select style={inputSt} value={campos.tipoCarga} onChange={(e) => handleCampo('tipoCarga', e.target.value)}>
                  {TIPOS_CARGA.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </FormGroup>
              <FormGroup label="Valor da Carga (R$)">
                <input type="text" style={inputSt} value={campos.valorCarga} onChange={(e) => handleMoedaChange('valorCarga', e)} placeholder="0,00" />
              </FormGroup>
              <FormGroup label="GRIS / AdValorem (%)" tooltip="informado em %">
                <input type="text" style={inputSt} value={campos.gris} onChange={(e) => handleCampo('gris', e.target.value)} placeholder="0,0300%" />
              </FormGroup>
            </div>

            {/* Coluna 2: Operação */}
            <div>
              <div style={sectionTitle}>2. Rota & Operação</div>
              <FormGroup label="Origem (Cidade, UF) *">
                <input type="text" style={inputSt} value={campos.origem} onChange={(e) => handleCampo('origem', e.target.value)} placeholder="Ex: Campinas, SP" />
              </FormGroup>
              <FormGroup label="Destino (Cidade, UF) *">
                <input type="text" style={inputSt} value={campos.destino} onChange={(e) => handleCampo('destino', e.target.value)} placeholder="Ex: Curitiba, PR" />
              </FormGroup>
              <FormGroup label="Distância (km)">
                <div style={{ display: 'flex', gap: '3px' }}>
                  <input type="number" style={{ ...inputSt, flex: 1 }} value={campos.distancia} onChange={(e) => handleCampo('distancia', e.target.value)} placeholder="408" />
                  <button
                    onClick={calcularDistancia} disabled={buscandoDist}
                    style={{ padding: '0 6px', background: '#14b8a6', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: '800', cursor: 'pointer', fontSize: '10.5px', whiteSpace: 'nowrap' }}
                  >📍 Auto</button>
                </div>
                {statusDist && <small style={{ display: 'block', marginTop: '1px', fontSize: '9.5px', color: '#64748b' }}>{statusDist}</small>}
              </FormGroup>
              <FormGroup label="Quantidade de Eixos / Veículo">
                <select style={inputSt} value={campos.eixos} onChange={(e) => handleCampo('eixos', e.target.value)}>
                  <option value="6">6 Eixos — Carreta LS / Vanderléia</option>
                  <option value="5">5 Eixos — Carreta Padrão</option>
                  <option value="7">7 Eixos — Bi-trem</option>
                  <option value="9">9 Eixos — Rodotrem</option>
                  <option value="3">3 Eixos — Truck</option>
                  <option value="2">2 Eixos — Toco / 3/4 / VUC</option>
                  <option value="4">4 Eixos</option>
                </select>
              </FormGroup>
              <FormGroup label="Pedágio (R$)">
                <input type="text" style={inputSt} value={campos.pedagio} onChange={(e) => handleMoedaChange('pedagio', e)} placeholder="0,00" />
              </FormGroup>
              <FormGroup label="Custos Extras (R$)">
                <input type="text" style={inputSt} value={campos.custosExtras} onChange={(e) => handleMoedaChange('custosExtras', e)} placeholder="0,00" />
              </FormGroup>
              <FormGroup label="Observações">
                <textarea style={{ ...inputSt, minHeight: '34px', maxHeight: '42px', resize: 'vertical' }} value={campos.observacoes} onChange={(e) => handleCampo('observacoes', e.target.value)} placeholder="Notas operacionais..." />
              </FormGroup>
            </div>

            {/* Coluna 3: Transportador */}
            <div>
              <div style={sectionTitle}>3. Transportador</div>
              <FormGroup label="Parceiro / Transportadora *">
                <select style={inputSt} value={campos.parceiro} onChange={(e) => handleCampo('parceiro', e.target.value)}>
                  <option value="">Selecione...</option>
                  {parceiros.map((p) => <option key={p.id} value={p.nome}>{p.nome}</option>)}
                </select>
              </FormGroup>
              <FormGroup label="Prazo Pagamento (dias) *">
                <input type="number" style={inputSt} value={campos.prazoPagamento} onChange={(e) => handleCampo('prazoPagamento', e.target.value)} />
              </FormGroup>
              <FormGroup label="Valor a Pagar (R$) *">
                <input type="text" style={inputSt} value={campos.valorPagar}
                  onChange={(e) => handleMoedaChange('valorPagar', e)}
                  placeholder="0,00" />
                {anttLabel(errosAntt.pagar, parseMoedaInput(campos.valorPagar), resultado.valorMinimoAntt)}
              </FormGroup>
              <FormGroup label="Potencial de Viagens">
                <input type="number" style={inputSt} min="0" value={campos.potencialTransportador} onChange={(e) => handleCampo('potencialTransportador', e.target.value)} placeholder="0" />
              </FormGroup>
              <FormGroup label="TransÁgil Utilizada?">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px', padding: '2px', border: '1px solid #cbd5e1', borderRadius: '5px', background: '#f8fafc' }}>
                  {[false, true].map((v) => (
                    <button key={String(v)} type="button"
                      onClick={() => handleCampo('transAgil', v)}
                      style={{
                        padding: '3px', border: 'none', borderRadius: '4px', fontWeight: '800', cursor: 'pointer', fontSize: '11px',
                        background: campos.transAgil === v ? '#14b8a6' : 'transparent',
                        color: campos.transAgil === v ? '#fff' : '#475569',
                        boxShadow: campos.transAgil === v ? '0 1px 3px rgba(20,184,166,0.3)' : 'none',
                      }}
                    >{v ? 'Sim' : 'Não'}</button>
                  ))}
                </div>
              </FormGroup>
            </div>
          </div>
        </div>

        {/* Resumo Financeiro Compacto */}
        <div style={{ background: 'linear-gradient(180deg, #052a67, #031d47)', borderRadius: '8px', padding: '10px 12px', color: '#fff', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '12px', fontWeight: '900', marginBottom: '6px' }}>Resumo Financeiro</div>
          <div style={{ flex: 1 }}>
            <ResumoItem label="Receita" valor={fmt.moeda(parseMoedaInput(campos.valorReceber))} cor="#4ade80" />
            <ResumoItem label="Valor à Transportadora" valor={`-${fmt.moeda(resultado.valorExibidoTransportadora)}`} cor="#f87171" />
            <ResumoItem label="Total de Custos" valor={`-${fmt.moeda(resultado.custosTotaisBase)}`} cor="#f87171" />
            <ResumoItem label="Lucro Bruto" valor={fmt.moeda(resultado.resultadoBruto)} cor={resultado.resultadoBruto >= 0 ? '#4ade80' : '#f87171'} />
            <div style={{ margin: '5px 0', borderTop: '1px solid rgba(255,255,255,0.15)', borderBottom: '1px solid rgba(255,255,255,0.15)', padding: '3px 0' }}>
              <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '700' }}>DETALHAMENTO DE CUSTOS</div>
            </div>
            <ResumoItem label="Valor/km" valor={fmt.moeda(resultado.valorKm) + '/km'} />
            <ResumoItem label="Custo IPEF" valor={`-${fmt.moeda(resultado.custoIpef)}`} cor="#f87171" />
            <ResumoItem label="Custo Operação" valor={`-${fmt.moeda(resultado.custoOperacao)}`} cor="#f87171" />
            <ResumoItem label="Custo Financeiro" valor={resultado.custoFinanceiro < 0 ? fmt.moeda(Math.abs(resultado.custoFinanceiro)) : `-${fmt.moeda(resultado.custoFinanceiro)}`} cor={resultado.custoFinanceiro < 0 ? '#4ade80' : '#f87171'} />
            <ResumoItem label="GRIS / AdValorem" valor={resultado.custoGrisAjuste > 0 ? `-${fmt.moeda(resultado.custoGrisAjuste)}` : fmt.moeda(Math.abs(resultado.custoGrisAjuste))} cor={resultado.custoGrisAjuste > 0 ? '#f87171' : '#4ade80'} />
            <ResumoItem label="Pedágio + Extras" valor={`-${fmt.moeda(resultado.custoPedagioExtras)}`} cor="#f87171" />
            <ResumoItem label="Custo GR" valor={`-${fmt.moeda(params.custoGr)}`} cor="#f87171" />

            <div style={{ margin: '5px 0', borderTop: '1px solid rgba(255,255,255,0.15)', borderBottom: '1px solid rgba(255,255,255,0.15)', padding: '3px 0' }}>
              <div style={{ fontSize: '9px', color: '#fbbf24', fontWeight: '800' }}>CAPITAL DE GIRO / FLUXO DE CAIXA</div>
            </div>
            <ResumoItem label="Gap Financeiro" valor={`${resultado.gapDias} dias`} />
            <ResumoItem label="Viagens no Ciclo" valor={resultado.potencialViagens > 0 ? `${Number(resultado.viagensNoGap).toFixed(1).replace('.0', '')} rotas` : '0 rotas'} />
            <ResumoItem label="Capital Necessário" valor={resultado.potencialViagens > 0 ? fmt.moeda(resultado.capitalGiroNecessario) : 'R$ 0,00'} cor="#f59e0b" />
          </div>
        </div>
      </div>

      {/* ── 2. Benchmark de Mercado & Radar de Competitividade ────────────── */}
      <BenchmarkMercado
        custoTransportador={custoEstimadoTransportador}
        valorPagarNegociado={parseMoedaInput(campos.valorPagar)}
        custoKmBreakEven={custoBreakEvenKm}
        anttReferencia={resultado.valorMinimoAntt || 0}
        nossaProposta={parseMoedaInput(campos.valorReceber)}
        mercadoMedio={mercadoReal}
        margemPercentual={resultado.margemBruta || 0}
        margemValor={resultado.resultadoMargemBruta || 0}
        sugestaoPagar={sugestaoPagar}
        temRotaPreenchida={Boolean(Number(campos.distancia) > 0 || (campos.origem && campos.destino))}
        benchmarkHub={benchmarkHub}
        onAplicarSugestaoReceber={(val) => handleCampo('valorReceber', formatarMoedaInput(val))}
        onAplicarSugestaoPagar={(val) => handleCampo('valorPagar', formatarMoedaInput(val))}
        onVerHistorico={(per) => {
          setPeriodoBenchmark(per || '90');
          setModal('benchmarkHistorico');
        }}
      />

      {/* ── Modais ────────────────────────────────────────────────────────── */}
      {modal === 'benchmarkHistorico' && (
        <BenchmarkHistoricoModal
          benchmarkHub={benchmarkHub}
          origem={campos.origem}
          destino={campos.destino}
          distancia={campos.distancia}
          eixosSelecionado={campos.eixos}
          periodoInicial={periodoBenchmark}
          onFechar={() => setModal(null)}
        />
      )}
      {modal === 'params' && (
        <PricingParametros
          params={params}
          onAtualizarParam={atualizarParam}
          onResetar={resetarParams}
          onFechar={() => setModal(null)}
        />
      )}
      {modal === 'antt' && (
        <PricingAnttModal
          tabela={tabelaAntt}
          onSave={(nova) => setTabelaAntt(nova)}
          onFechar={() => setModal(null)}
        />
      )}
      {modal === 'historico' && (
        <PricingHistorico
          onFechar={() => setModal(null)}
          onRestaurar={restaurarProposta}
        />
      )}
      {modal === 'cadastros' && (
        <PricingCadastros
          cadastros={cadastros}
          onAdicionar={adicionar}
          onAtualizar={atualizar}
          onRemover={remover}
          onFechar={() => setModal(null)}
        />
      )}
    </div>
  );
}

// ── Estilos compartilhados ───────────────────────────────────────────────────
const sectionTitle = {
  fontSize: '13px', fontWeight: '800', color: '#052a67',
  borderBottom: '2px solid #14b8a6', paddingBottom: '6px',
  marginBottom: '12px',
};

const toolBtn = {
  padding: '8px 12px', background: '#fff', border: 'none',
  borderRadius: '8px', boxShadow: '0 2px 8px rgba(15,23,42,0.07)',
  fontWeight: '700', color: '#052a67', cursor: 'pointer', fontSize: '12px',
  transition: 'all 0.15s',
};
