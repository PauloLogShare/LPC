/**
 * BenchmarkMercado.jsx
 * Componente visual de Benchmark de Mercado e Inteligência de Preço.
 * Inicia zerado e ativa em tempo real assim que os dados da rota (cidade, distância, eixos) são informados.
 */

import { useState, useMemo } from 'react';

const fmt = {
  moeda: (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(v || 0),
  perc:  (v) => `${Number(v || 0).toFixed(1).replace('.', ',')}%`,
  km:    (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 3 }).format(v || 0) + '/km',
};

function parseDataBR(dataStr) {
  if (!dataStr) return null;
  const parts = String(dataStr).split('/');
  if (parts.length !== 3) return null;
  const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
  return isNaN(d.getTime()) ? null : d;
}

export default function BenchmarkMercado({
  custoTransportador = 0,
  valorPagarNegociado = 0,
  custoKmBreakEven = 5.839,
  anttReferencia = 0,
  nossaProposta = 0,
  mercadoMedio = 0,
  margemPercentual = 0,
  margemValor = 0,
  sugestaoPagar = 0,
  temRotaPreenchida = false,
  benchmarkHub = null,
  onAplicarSugestaoReceber,
  onAplicarSugestaoPagar,
  onVerHistorico,
}) {
  const [periodo, setPeriodo] = useState('90');

  // Viagens da rota disponíveis
  const todasViagens = useMemo(() => {
    return benchmarkHub?.viagens || benchmarkHub?.todasViagensRota || [];
  }, [benchmarkHub]);

  // Recalcular médias do período (30, 60, 90, 180, 365 dias ou todos)
  const { viagensPeriodo, recMediaPeriodo, desMediaPeriodo, qtdViagensPeriodo } = useMemo(() => {
    if (!todasViagens || todasViagens.length === 0) {
      return {
        viagensPeriodo: [],
        recMediaPeriodo: benchmarkHub?.recValorFrete || 0,
        desMediaPeriodo: benchmarkHub?.desValorFrete || 0,
        qtdViagensPeriodo: benchmarkHub?.totalViagens || 0,
      };
    }

    if (periodo === 'todos') {
      const recs = todasViagens.map(v => v.rec ?? v.recValorFrete).filter(v => v > 0);
      const dess = todasViagens.map(v => v.des ?? v.desValorFrete).filter(v => v > 0);
      return {
        viagensPeriodo: todasViagens,
        recMediaPeriodo: recs.length > 0 ? Math.round(recs.reduce((a, b) => a + b, 0) / recs.length) : (benchmarkHub?.recValorFrete || 0),
        desMediaPeriodo: dess.length > 0 ? Math.round(dess.reduce((a, b) => a + b, 0) / dess.length) : (benchmarkHub?.desValorFrete || 0),
        qtdViagensPeriodo: todasViagens.length,
      };
    }

    const dias = Number(periodo) || 90;
    const nowTs = new Date().getTime();
    const cutoffTs = nowTs - (dias * 24 * 60 * 60 * 1000);

    const filtradas = todasViagens.filter(v => {
      const dt = parseDataBR(v.data);
      if (!dt) return false;
      return dt.getTime() >= cutoffTs && dt.getTime() <= nowTs;
    });

    const recs = filtradas.map(v => v.rec ?? v.recValorFrete).filter(v => v > 0);
    const dess = filtradas.map(v => v.des ?? v.desValorFrete).filter(v => v > 0);

    const recMedia = recs.length > 0
      ? Math.round(recs.reduce((a, b) => a + b, 0) / recs.length)
      : 0;

    const desMedia = dess.length > 0
      ? Math.round(dess.reduce((a, b) => a + b, 0) / dess.length)
      : 0;

    return {
      viagensPeriodo: filtradas,
      recMediaPeriodo: recMedia,
      desMediaPeriodo: desMedia,
      qtdViagensPeriodo: filtradas.length,
    };
  }, [todasViagens, periodo, benchmarkHub]);

  const cTransp   = Number(custoTransportador) || 0;
  const antt      = Number(anttReferencia) || 0;
  const proposta  = Number(nossaProposta) || 0;
  const mercado   = recMediaPeriodo > 0 ? recMediaPeriodo : (periodo === 'todos' ? (benchmarkHub?.recValorFrete || 0) : 0);

  const temDados = antt > 0 || cTransp > 0 || proposta > 0 || mercado > 0 || temRotaPreenchida;

  // Margem Calculada
  const margemEstimadaPerc = margemPercentual !== 0
    ? margemPercentual
    : (proposta > 0 && cTransp > 0 ? ((proposta - cTransp) / cTransp) * 100 : 0);
  
  const margemEstimadaValor = margemValor !== 0
    ? margemValor
    : (proposta > 0 && cTransp > 0 ? (proposta - cTransp) : 0);

  // Faixa competitiva sugerida (-2.5% a +2.5% da proposta ou do mercado/antt)
  const baseRefFaixa = proposta > 0 ? proposta : (mercado > 0 ? mercado : antt);
  const faixaMin = baseRefFaixa > 0 ? Math.round(baseRefFaixa * 0.976) : 0;
  const faixaMax = baseRefFaixa > 0 ? Math.round(baseRefFaixa * 1.024) : 0;

  // Comparações percentuais
  const percAbaixoMercado = (mercado > 0 && proposta > 0) ? ((mercado - proposta) / mercado) * 100 : 0;
  const percAcimaAntt     = (antt > 0 && proposta > 0) ? ((proposta - antt) / antt) * 100 : 0;

  // Escala da régua
  const valoresValidos = [cTransp, antt, proposta, mercado, faixaMin, faixaMax].filter((v) => v > 0);
  const minVal = valoresValidos.length > 0 ? Math.min(...valoresValidos) * 0.88 : 3000;
  const maxVal = valoresValidos.length > 0 ? Math.max(...valoresValidos) * 1.12 : 6000;
  const range  = maxVal - minVal || 1;

  const getPos = (val) => {
    if (!val || val <= 0) return 0;
    const p = ((val - minVal) / range) * 100;
    return Math.max(6, Math.min(94, p));
  };

  const posTransp   = getPos(cTransp);
  const posAntt     = getPos(antt);
  const posProp     = getPos(proposta);
  const posMerc     = getPos(mercado);
  const posFaixaMin = getPos(faixaMin);
  const posFaixaMax = getPos(faixaMax);

  // Marcadores de escala no eixo
  const ticks = [
    Math.round(minVal / 100) * 100,
    Math.round((minVal + range * 0.25) / 100) * 100,
    Math.round((minVal + range * 0.5) / 100) * 100,
    Math.round((minVal + range * 0.75) / 100) * 100,
    Math.round(maxVal / 100) * 100,
  ];

  return (
    <div style={st.card}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={st.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={st.badgeNumber}>2</span>
          <h3 style={st.title}>Benchmark de Mercado & Posicionamento de Preço</h3>
          <span style={st.infoIcon} title="Comparativo em tempo real baseado no Custo Operacional Break-Even do Transportador, Piso Regulatório ANTT e HUB de Dados LogShare">🛈</span>
        </div>
        <select
          style={st.selectPeriodo}
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
        >
          <option value="30">Últimos 30 dias</option>
          <option value="60">Últimos 60 dias</option>
          <option value="90">Últimos 90 dias</option>
          <option value="180">Últimos 180 dias</option>
          <option value="365">Último ano (365 dias)</option>
          <option value="todos">Todo o histórico</option>
        </select>
      </div>

      {/* ── Banner de Alerta de Divergência (Raio 60km / Cidades Correlatas) ── */}
      {temDados && benchmarkHub?.alertaDivergencia && (
        <div style={{
          background: '#fffbeb',
          border: '1px solid #fde68a',
          borderLeft: '4px solid #f59e0b',
          borderRadius: '6px',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px',
          fontSize: '11.5px',
          color: '#92400e',
          lineHeight: 1.4,
        }}>
          <span style={{ fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>⚠️</span>
          <div>
            <strong>Atenção sobre o Benchmark de Mercado:</strong> {benchmarkHub.motivoAlerta}
          </div>
        </div>
      )}

      {/* ── 4 Cards Superiores ───────────────────────────────────────────── */}
      <div style={st.kpisGrid}>
        {/* Card 1: Custo do Transportador (Break-Even) */}
        <div style={{ ...st.kpiCard, background: '#f8fafc', borderLeft: '4px solid #0284c7' }}>
          <div style={{ fontSize: '12px', fontWeight: '800', color: '#0369a1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Custo do Transportador</span>
            <span style={{ fontSize: '9px', background: '#e0f2fe', color: '#0369a1', padding: '1px 5px', borderRadius: '4px', fontWeight: '800' }}>Break-Even</span>
          </div>
          <div style={{ fontSize: '10.5px', color: '#64748b', margin: '2px 0 6px 0' }}>
            Custo Op. Total ({fmt.km(custoKmBreakEven)}) × KM
          </div>
          <div style={{ fontSize: '20px', fontWeight: '900', color: cTransp > 0 ? '#0284c7' : '#94a3b8' }}>
            {cTransp > 0 ? fmt.moeda(cTransp) : 'R$ 0,00'}
          </div>
          {valorPagarNegociado > 0 && (
            <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '3px' }}>
              Negociado a pagar: <strong style={{ color: '#0f172a' }}>{fmt.moeda(valorPagarNegociado)}</strong>
            </div>
          )}
          {desMediaPeriodo > 0 && (
            <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: valorPagarNegociado > 0 ? '1px' : '3px' }}>
              Média paga {periodo === 'todos' ? 'histórica' : `${periodo}d`}: <strong style={{ color: '#0369a1' }}>{fmt.moeda(desMediaPeriodo)}</strong>
            </div>
          )}
        </div>

        {/* Card 2: ANTT (Referência) */}
        <div style={{ ...st.kpiCard, background: '#faf5ff', borderLeft: '4px solid #7c3aed' }}>
          <div style={{ fontSize: '12px', fontWeight: '800', color: '#6d28d9', display: 'flex', alignItems: 'center', gap: '4px' }}>
            ANTT (Piso Regulatório) <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: antt > 0 ? '#c084fc' : '#cbd5e1' }} />
          </div>
          <div style={{ fontSize: '10.5px', color: '#64748b', margin: '2px 0 6px 0' }}>
            Valor mínimo legal da rota
          </div>
          <div style={{ fontSize: '20px', fontWeight: '900', color: antt > 0 ? '#5b21b6' : '#94a3b8' }}>
            {antt > 0 ? fmt.moeda(antt) : 'R$ 0,00'}
          </div>
        </div>

        {/* Card 3: Nossa Proposta */}
        <div style={{ ...st.kpiCard, background: '#f0fdf4', borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: '12px', fontWeight: '800', color: '#15803d', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Nossa Proposta <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: proposta > 0 ? '#86efac' : '#cbd5e1' }} />
          </div>
          <div style={{ fontSize: '10.5px', color: '#64748b', margin: '2px 0 6px 0' }}>
            Receita com base ANTT / Margem
          </div>
          <div style={{ fontSize: '20px', fontWeight: '900', color: proposta > 0 ? '#16a34a' : '#94a3b8' }}>
            {proposta > 0 ? fmt.moeda(proposta) : 'R$ 0,00'}
          </div>
        </div>

        {/* Card 4: Mercado / Transações */}
        <div style={{ ...st.kpiCard, background: '#f8fafc', borderLeft: '4px solid #475569' }}>
          <div style={{ fontSize: '12px', fontWeight: '800', color: '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Mercado / Transações <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: mercado > 0 ? '#94a3b8' : '#cbd5e1' }} />
          </div>
          <div style={{ fontSize: '10.5px', color: '#64748b', margin: '2px 0 6px 0' }}>
            {qtdViagensPeriodo > 0
              ? `HUB: ${qtdViagensPeriodo} viagem${qtdViagensPeriodo > 1 ? 's' : ''} (${periodo === 'todos' ? 'todo o histórico' : `últimos ${periodo}d`})`
              : `HUB: 0 viagens (${periodo === 'todos' ? 'no histórico' : `últimos ${periodo}d`})`}
          </div>
          <div style={{ fontSize: '20px', fontWeight: '900', color: mercado > 0 ? '#1e293b' : '#94a3b8' }}>
            {mercado > 0 ? fmt.moeda(mercado) : 'R$ 0,00'}
          </div>
        </div>
      </div>

      {/* ── Régua Visual / Slider Benchmark ──────────────────────────────── */}
      {!temDados ? (
        <div style={{ padding: '24px 16px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
          <div style={{ fontSize: '13px', fontWeight: '800', color: '#475569' }}>
            📍 Aguardando preenchimento da rota
          </div>
          <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '4px' }}>
            Informe a <strong>Origem</strong>, <strong>Destino</strong>, <strong>Distância (km)</strong> e <strong>Quantidade de Eixos</strong> no Item 1 para calcular automaticamente o Piso ANTT e o Benchmark de Mercado.
          </div>
        </div>
      ) : (
        <div style={st.gaugeContainer}>
          {/* Nível 1 (SUPERIOR): ANTT e Mercado */}
          <div style={{ position: 'relative', height: '36px', width: '100%', marginBottom: '4px' }}>
            {/* Pin ANTT (Superior) */}
            {antt > 0 && (
              <div style={{ position: 'absolute', left: `${posAntt}%`, transform: 'translateX(-50%)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                <span style={{ display: 'inline-block', background: '#f3e8ff', border: '1px solid #d8b4fe', color: '#6d28d9', padding: '1px 6px', borderRadius: '4px', fontSize: '10.5px', fontWeight: '800' }}>
                  ANTT: <strong>{fmt.moeda(antt)}</strong>
                </span>
              </div>
            )}

            {/* Pin Mercado (Superior) */}
            {mercado > 0 && (
              <div style={{ position: 'absolute', left: `${posMerc}%`, transform: 'translateX(-50%)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                <span style={{ display: 'inline-block', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', padding: '1px 6px', borderRadius: '4px', fontSize: '10.5px', fontWeight: '800' }}>
                  Mercado: <strong>{fmt.moeda(mercado)}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Linha Gradiente / Track */}
          <div style={st.trackWrapper}>
            {/* Faixa Competitiva Realçada */}
            {faixaMin > 0 && faixaMax > 0 && (
              <div
                style={{
                  position: 'absolute',
                  left: `${Math.min(posFaixaMin, posFaixaMax)}%`,
                  width: `${Math.max(6, Math.abs(posFaixaMax - posFaixaMin))}%`,
                  top: '-3px',
                  height: '16px',
                  background: '#16a34a',
                  borderRadius: '8px',
                  zIndex: 1,
                  boxShadow: '0 2px 8px rgba(22,163,74,0.3)',
                }}
                title={`Faixa competitiva sugerida: ${fmt.moeda(faixaMin)} - ${fmt.moeda(faixaMax)}`}
              />
            )}

            {/* Marcador Pontual: ANTT (Top) */}
            {antt > 0 && (
              <div style={{ position: 'absolute', left: `${posAntt}%`, top: '50%', transform: 'translate(-50%, -50%)', width: '10px', height: '10px', borderRadius: '50%', background: '#7c3aed', border: '2px solid #fff', zIndex: 2 }} />
            )}

            {/* Marcador Pontual: Mercado (Top) */}
            {mercado > 0 && (
              <div style={{ position: 'absolute', left: `${posMerc}%`, top: '50%', transform: 'translate(-50%, -50%)', width: '10px', height: '10px', borderRadius: '50%', background: '#334155', border: '2px solid #fff', zIndex: 2 }} />
            )}

            {/* Marcador Pontual: Custo Transportador (Bottom) */}
            {cTransp > 0 && (
              <div style={{ position: 'absolute', left: `${posTransp}%`, top: '50%', transform: 'translate(-50%, -50%)', width: '10px', height: '10px', borderRadius: '50%', background: '#0284c7', border: '2px solid #fff', zIndex: 2 }} />
            )}

            {/* Marcador Pontual: Nossa Proposta (Destaque Verde) */}
            {proposta > 0 && (
              <div style={{ position: 'absolute', left: `${posProp}%`, top: '50%', transform: 'translate(-50%, -50%)', width: '14px', height: '14px', borderRadius: '50%', background: '#16a34a', border: '2.5px solid #fff', boxShadow: '0 2px 6px rgba(0,0,0,0.3)', zIndex: 3 }} />
            )}
          </div>

          {/* Nível 2 (INFERIOR): Custo Transportador e Nossa Proposta */}
          <div style={{ position: 'relative', height: '42px', width: '100%', marginTop: '6px' }}>
            {/* Pin Custo Transportador (Inferior) */}
            {cTransp > 0 && (
              <div style={{ position: 'absolute', left: `${posTransp}%`, transform: 'translateX(-50%)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                <span style={{ display: 'inline-block', background: '#e0f2fe', border: '1px solid #7dd3fc', color: '#0369a1', padding: '1px 6px', borderRadius: '4px', fontSize: '10.5px', fontWeight: '800' }}>
                  Custo Transp: <strong>{fmt.moeda(cTransp)}</strong>
                </span>
              </div>
            )}

            {/* Pin Nossa Proposta (Inferior com Badge Destaque) */}
            {proposta > 0 && (
              <div style={{ position: 'absolute', left: `${posProp}%`, transform: 'translateX(-50%)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: '#16a34a', color: '#fff', padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '900', boxShadow: '0 2px 8px rgba(22,163,74,0.35)' }}>
                  📍 Proposta: {fmt.moeda(proposta)} {margemEstimadaPerc !== 0 ? `(${fmt.perc(margemEstimadaPerc)})` : ''}
                </div>
              </div>
            )}
          </div>

          {/* Ticks de Escala Inferiores */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', borderTop: '1px solid #f1f5f9', paddingTop: '4px', fontSize: '10px', color: '#94a3b8', fontWeight: '700' }}>
            {ticks.map((t, i) => (
              <span key={i}>{new Intl.NumberFormat('pt-BR').format(t)}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── Banner de Diagnóstico, Margem e Oportunidade ─────────────────── */}
      <div style={st.insightCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
          <div style={{ ...st.checkBadge, background: temDados ? '#16a34a' : '#94a3b8' }}>
            {temDados ? '✔' : 'i'}
          </div>
          <div>
            {proposta > 0 ? (
              <>
                <div style={{ fontSize: '12.5px', color: '#1e293b', lineHeight: 1.4 }}>
                  Nossa proposta de <strong>{fmt.moeda(proposta)}</strong> gera uma <strong>Margem de {fmt.perc(margemEstimadaPerc)} ({fmt.moeda(margemEstimadaValor)})</strong>
                  {mercado > 0 && ` — ficando ${fmt.perc(Math.abs(percAbaixoMercado))} ${percAbaixoMercado >= 0 ? 'abaixo' : 'acima'} da média de mercado`}
                  {antt > 0 && ` e ${fmt.perc(Math.abs(percAcimaAntt))} ${percAcimaAntt >= 0 ? 'acima' : 'abaixo'} do piso regulatório ANTT`}.
                </div>
                {faixaMin > 0 && (
                  <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '3px' }}>
                    Faixa competitiva recomendada: <strong style={{ color: '#0f172a' }}>{fmt.moeda(faixaMin)} – {fmt.moeda(faixaMax)}</strong>
                  </div>
                )}
              </>
            ) : antt > 0 ? (
              <>
                <div style={{ fontSize: '12.5px', color: '#1e293b', lineHeight: 1.4 }}>
                  Piso ANTT regulatório calculado para a rota: <strong>{fmt.moeda(antt)}</strong>. Média estimada de mercado: <strong>{fmt.moeda(mercado)}</strong>.
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '3px' }}>
                  Digite o <strong>Valor a Receber</strong> ou aplique a sugestão para calcular a margem e o radar de competitividade.
                </div>
              </>
            ) : (
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Aguardando preenchimento da rota (Origem, Destino, Distância e Eixos) para apuração de competitividade.
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {mercado > 0 && onAplicarSugestaoReceber && (
            <button
              type="button"
              style={{
                ...st.btnSugestao,
                background: '#f0fdf4',
                border: '1px solid #86efac',
                color: '#15803d',
              }}
              onClick={() => onAplicarSugestaoReceber(mercado)}
              title="Preenche o Valor a Receber do Embarcador com o preço de Mercado / Transações apurado no HUB"
            >
              💡 Aplicar Sugestão Embarcador (Mercado): <strong>{fmt.moeda(mercado)}</strong>
            </button>
          )}

          {sugestaoPagar > 0 && onAplicarSugestaoPagar && (
            <button
              type="button"
              style={{
                ...st.btnSugestao,
                background: '#f0fdfa',
                border: '1px solid #99f6e4',
                color: '#0f766e',
              }}
              onClick={() => onAplicarSugestaoPagar(sugestaoPagar)}
              title="Preenche o Valor a Pagar com a sugestão que respeita o Piso ANTT e atinge a margem alvo"
            >
              💡 Aplicar Sugestão Transportador: <strong>{fmt.moeda(sugestaoPagar)}</strong>
            </button>
          )}

          {onVerHistorico && (
            <button style={st.btnHistorico} onClick={() => onVerHistorico(periodo)}>
              Ver histórico detalhado
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const st = {
  card: {
    background: '#fff',
    borderRadius: '10px',
    padding: '16px',
    boxShadow: '0 1px 6px rgba(15,23,42,0.05)',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeNumber: {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    background: '#052a67',
    color: '#fff',
    fontWeight: '900',
    fontSize: '11px',
    display: 'grid',
    placeItems: 'center',
  },
  title: {
    fontSize: '14px',
    fontWeight: '900',
    color: '#052a67',
    margin: 0,
  },
  infoIcon: {
    fontSize: '13px',
    color: '#94a3b8',
    cursor: 'help',
  },
  selectPeriodo: {
    padding: '5px 10px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '11.5px',
    fontWeight: '700',
    color: '#334155',
    background: '#fff',
    cursor: 'pointer',
    outline: 'none',
  },
  kpisGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '10px',
  },
  kpiCard: {
    borderRadius: '8px',
    padding: '10px 12px',
    border: '1px solid #e2e8f0',
  },
  gaugeContainer: {
    padding: '10px 14px',
    background: '#fff',
    borderRadius: '8px',
    border: '1px solid #f1f5f9',
  },
  trackWrapper: {
    position: 'relative',
    height: '10px',
    background: 'linear-gradient(90deg, #60a5fa 0%, #a855f7 35%, #34d399 75%, #10b981 100%)',
    borderRadius: '5px',
    margin: '4px 0',
  },
  insightCard: {
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '8px',
    padding: '12px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  checkBadge: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    color: '#fff',
    fontWeight: '900',
    fontSize: '13px',
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
  },
  btnHistorico: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    background: '#fff',
    color: '#052a67',
    fontWeight: '800',
    fontSize: '11.5px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  btnSugestao: {
    padding: '6px 14px',
    borderRadius: '6px',
    border: '1px solid #16a34a',
    background: '#16a34a',
    color: '#fff',
    fontWeight: '800',
    fontSize: '11.5px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    boxShadow: '0 2px 6px rgba(22,163,74,0.25)',
  },
};
