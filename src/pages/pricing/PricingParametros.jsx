/**
 * PricingParametros.jsx
 * Painel de parâmetros editáveis da Calculadora de Frete no padrão visual exato do Simulador de Frete LPC.
 */

import { useState } from 'react';
import { PRICING_DEFAULTS } from '../../constants/pricingDefaults';
import { usePricingParams } from '../../hooks/usePricingParams';

const GRUPOS_PARAMETROS = [
  {
    id: 'operacional',
    titulo: '1. Custos Operacionais & Gerenciamento de Risco',
    icone: '🛡️',
    cor: '#0369a1',
    bgBadge: '#e0f2fe',
    campos: [
      { chave: 'custoGr', label: 'Custo GR (Gerenciamento de Risco)', unidade: 'R$', casas: 2, placeholder: '80,00', tooltip: 'Custo fixo cobrado por viagem para gerenciamento e monitoramento de risco de carga.' },
      { chave: 'custoOperacaoFixo', label: 'Custo Operacional Fixo', unidade: 'R$', casas: 2, placeholder: '20,00', tooltip: 'Custo fixo administrativo/operacional rateado por emissão de frete.' },
    ],
  },
  {
    id: 'fiscal',
    titulo: '2. Premissas Fiscais & Tributárias',
    icone: '⚖️',
    cor: '#7c3aed',
    bgBadge: '#f3e8ff',
    campos: [
      { chave: 'aliquotaIpef', label: 'Alíquota IPEF', unidade: '%', casas: 4, multiplicador: 100, placeholder: '1,5000', tooltip: 'Percentual do IPEF incidente sobre o valor contratado do transportador.' },
      { chave: 'aliquotaRecuperacao', label: 'Recuperação Fiscal (PIS/COFINS)', unidade: '%', casas: 4, multiplicador: 100, placeholder: '9,2500', tooltip: 'Crédito fiscal tributário de PIS/COFINS recuperável em regimes não-cumulativos (9,25%).' },
      { chave: 'grisBase', label: 'GRIS Base (Referência)', unidade: '%', casas: 4, multiplicador: 100, placeholder: '0,0300', tooltip: 'Percentual padrão de Gerenciamento de Risco Adicional (GRIS) para ajuste de valor de carga.' },
    ],
  },
  {
    id: 'financeiro',
    titulo: '3. Custos Financeiros & Capital de Giro',
    icone: '💰',
    cor: '#d97706',
    bgBadge: '#fef3c7',
    campos: [
      { chave: 'taxaFinanceiraMensal', label: 'Taxa Financeira Mensal', unidade: '% a.m.', casas: 4, multiplicador: 100, placeholder: '1,5000', tooltip: 'Taxa mensal de custo de oportunidade de capital aplicada sobre o gap entre pagamento e recebimento.' },
    ],
  },
  {
    id: 'transagil',
    titulo: '4. Parâmetros da Plataforma TransÁgil',
    icone: '⚡',
    cor: '#15803d',
    bgBadge: '#dcfce7',
    campos: [
      { chave: 'aliquotaTransAgil', label: 'Alíquota de Recuperação TransÁgil', unidade: '%', casas: 4, multiplicador: 100, placeholder: '9,2500', tooltip: 'Taxa bruta de recuperação tributária viabilizada via convênio TransÁgil.' },
      { chave: 'taxaDescontoTransAgil', label: 'Taxa de Desconto TransÁgil', unidade: '%', casas: 4, multiplicador: 100, placeholder: '2,0000', tooltip: 'Percentual de comissão / taxa de intermediação da plataforma TransÁgil.' },
    ],
  },
];

const TODOS_CAMPOS = GRUPOS_PARAMETROS.flatMap((g) => g.campos);

export default function PricingParametros({ params: paramsProp, onAtualizarParam: onAtualizarProp, onResetar: onResetarProp, onFechar }) {
  const hookParams = usePricingParams();
  const params = paramsProp || hookParams.params;
  const onAtualizarParam = onAtualizarProp || hookParams.atualizarParam;
  const onResetar = onResetarProp || hookParams.resetarParams;

  const [locais, setLocais] = useState(() => {
    const obj = {};
    TODOS_CAMPOS.forEach(({ chave, multiplicador, casas }) => {
      const mult = multiplicador || 1;
      obj[chave] = (params[chave] * mult).toFixed(casas);
    });
    return obj;
  });
  const [salvo, setSalvo] = useState(false);

  function handleChange(chave, valor) {
    setLocais((prev) => ({ ...prev, [chave]: valor }));
    setSalvo(false);
  }

  function handleSalvar() {
    TODOS_CAMPOS.forEach(({ chave, multiplicador }) => {
      const mult = multiplicador || 1;
      const val = parseFloat(String(locais[chave]).replace(',', '.')) || 0;
      onAtualizarParam(chave, val / mult);
    });
    setSalvo(true);
  }

  function handleRestaurar() {
    if (!window.confirm('Deseja restaurar todos os parâmetros para os valores padrão de fábrica?')) return;
    const obj = {};
    TODOS_CAMPOS.forEach(({ chave, multiplicador, casas }) => {
      const mult = multiplicador || 1;
      obj[chave] = (PRICING_DEFAULTS[chave] * mult).toFixed(casas);
    });
    setLocais(obj);
    onResetar();
    setSalvo(false);
  }

  function restaurarCampo(chave) {
    const campo = TODOS_CAMPOS.find((c) => c.chave === chave);
    const mult = campo.multiplicador || 1;
    setLocais((prev) => ({
      ...prev,
      [chave]: (PRICING_DEFAULTS[chave] * mult).toFixed(campo.casas),
    }));
    setSalvo(false);
  }

  const isModal = Boolean(onFechar);

  // Cálculos dos KPIs
  const custoFixoTotal = (parseFloat(locais.custoGr) || 0) + (parseFloat(locais.custoOperacaoFixo) || 0);
  const recFiscal = parseFloat(locais.aliquotaRecuperacao) || 0;
  const taxaFin = parseFloat(locais.taxaFinanceiraMensal) || 0;
  const transAgilLiq = (parseFloat(locais.aliquotaTransAgil) || 0) - (parseFloat(locais.taxaDescontoTransAgil) || 0);

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      {/* ── Toolbar / Cabeçalho Idêntico ao da Calculadora de Frete ─────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h2 className="lpc-section-title" style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚙️ Parâmetros Gerais da Operação
          </h2>
          <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '1px' }}>
            Configuração oficial de premissas financeiras, operacionais, fiscais e tributárias do Pricing Center
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button type="button" onClick={handleRestaurar} style={toolBtn}>
            🔄 Restaurar Padrões
          </button>
          <button
            type="button"
            onClick={handleSalvar}
            style={{ ...toolBtn, background: salvo ? '#16a34a' : '#14b8a6', color: '#fff', fontWeight: '800' }}
          >
            {salvo ? '✔ Parâmetros Salvos!' : '💾 Salvar Alterações'}
          </button>
          {isModal && (
            <button onClick={onFechar} style={{ ...toolBtn, color: '#64748b' }}>
              ✕ Fechar
            </button>
          )}
        </div>
      </div>

      {/* ── 4 KPIs no Mesmo Padrão da Calculadora de Frete ─────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
        <div style={{ ...kpiCardSt, borderLeft: '4px solid #0369a1' }}>
          <div style={kpiTitleSt}>Custos Fixos / Viagem</div>
          <div style={{ fontSize: '15px', fontWeight: '900', color: '#0369a1', margin: '3px 0' }}>
            R$ {custoFixoTotal.toFixed(2)}
          </div>
          <div style={{ fontSize: '9.5px', color: '#64748b' }}>
            GR (R$ {locais.custoGr}) + Op (R$ {locais.custoOperacaoFixo})
          </div>
        </div>

        <div style={{ ...kpiCardSt, borderLeft: '4px solid #7c3aed' }}>
          <div style={kpiTitleSt}>Recuperação PIS/COFINS</div>
          <div style={{ fontSize: '15px', fontWeight: '900', color: '#7c3aed', margin: '3px 0' }}>
            {recFiscal.toFixed(2)}%
          </div>
          <div style={{ fontSize: '9.5px', color: '#64748b' }}>Crédito Não-Cumulativo</div>
        </div>

        <div style={{ ...kpiCardSt, borderLeft: '4px solid #d97706' }}>
          <div style={kpiTitleSt}>Taxa Financeira Mensal</div>
          <div style={{ fontSize: '15px', fontWeight: '900', color: '#d97706', margin: '3px 0' }}>
            {taxaFin.toFixed(2)}% a.m.
          </div>
          <div style={{ fontSize: '9.5px', color: '#64748b' }}>Custo do Gap de Caixa</div>
        </div>

        <div style={{ ...kpiCardSt, borderLeft: '4px solid #15803d' }}>
          <div style={kpiTitleSt}>Recuperação TransÁgil Líquida</div>
          <div style={{ fontSize: '15px', fontWeight: '900', color: '#15803d', margin: '3px 0' }}>
            {transAgilLiq.toFixed(2)}%
          </div>
          <div style={{ fontSize: '9.5px', color: '#64748b' }}>
            Alíquota ({locais.aliquotaTransAgil}%) - Taxa ({locais.taxaDescontoTransAgil}%)
          </div>
        </div>
      </div>

      {/* ── Painel de Conteúdo com os 4 Grupos de Parâmetros ───────────────── */}
      <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(15,23,42,0.05)', padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {GRUPOS_PARAMETROS.map((grupo) => (
            <div key={grupo.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
              <div style={sectionTitle}>
                <span style={{ marginRight: '6px' }}>{grupo.icone}</span>
                {grupo.titulo}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {grupo.campos.map(({ chave, label, unidade, tooltip, placeholder }) => {
                  const defaultVal = ((PRICING_DEFAULTS[chave] || 0) * (grupo.campos.find(c => c.chave === chave)?.multiplicador || 1)).toFixed(grupo.campos.find(c => c.chave === chave)?.casas || 2);
                  const isModificado = String(locais[chave]) !== String(defaultVal);

                  return (
                    <div key={chave} style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <label style={{ fontSize: '10.5px', fontWeight: '800', color: '#334155' }}>
                          {label}
                          {isModificado && (
                            <span style={{ marginLeft: '6px', fontSize: '9.5px', color: '#0369a1', fontWeight: '800' }}>• Editado</span>
                          )}
                        </label>
                        <button
                          type="button"
                          onClick={() => restaurarCampo(chave)}
                          style={{
                            fontSize: '9px', fontWeight: '700', padding: '2px 6px',
                            border: 'none', borderRadius: '4px', cursor: 'pointer',
                            background: isModificado ? '#e0f2fe' : '#f1f5f9',
                            color: isModificado ? '#0369a1' : '#64748b',
                          }}
                          title={`Valor padrão: ${defaultVal} ${unidade}`}
                        >
                          Padrão ({defaultVal})
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                        <input
                          type="number"
                          step="any"
                          value={locais[chave]}
                          placeholder={placeholder}
                          onChange={(e) => handleChange(chave, e.target.value)}
                          style={{
                            ...inputSt,
                            borderColor: isModificado ? '#38bdf8' : '#cbd5e1',
                            background: isModificado ? '#f0f9ff' : '#fff',
                          }}
                        />
                        <span style={{ position: 'absolute', right: '10px', fontSize: '11px', fontWeight: '800', color: '#64748b', pointerEvents: 'none' }}>
                          {unidade}
                        </span>
                      </div>

                      <small style={{ fontSize: '9.5px', color: '#64748b', marginTop: '2px', lineHeight: '1.2' }}>{tooltip}</small>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div style={stModal.overlay} onClick={(e) => e.target === e.currentTarget && onFechar()}>
        <div style={stModal.panel}>
          {content}
        </div>
      </div>
    );
  }

  return <div style={{ maxWidth: '1200px' }}>{content}</div>;
}

// ── Estilos idênticos aos da Calculadora de Frete ─────────────────────────────
const sectionTitle = {
  fontSize: '12.5px', fontWeight: '800', color: '#052a67',
  borderBottom: '2px solid #14b8a6', paddingBottom: '4px',
  marginBottom: '10px', display: 'flex', alignItems: 'center',
};

const toolBtn = {
  padding: '8px 12px', background: '#fff', border: 'none',
  borderRadius: '8px', boxShadow: '0 2px 8px rgba(15,23,42,0.07)',
  fontWeight: '700', color: '#052a67', cursor: 'pointer', fontSize: '12px',
  transition: 'all 0.15s',
};

const inputSt = {
  width: '100%', padding: '6px 45px 6px 8px', border: '1px solid #cbd5e1',
  borderRadius: '5px', fontSize: '11.5px', fontWeight: '700',
  color: '#0f172a', outline: 'none', boxSizing: 'border-box',
};

const kpiCardSt = {
  background: '#fff', borderRadius: '8px', padding: '7px 10px',
  boxShadow: '0 1px 4px rgba(15,23,42,0.05)', border: '1px solid #e2e8f0',
  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
};

const kpiTitleSt = {
  fontSize: '10px', color: '#64748b', fontWeight: '700', lineHeight: 1.2,
};

const stModal = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 200,
    background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(3px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '20px',
  },
  panel: {
    background: '#f8fafc', borderRadius: '12px',
    boxShadow: '0 24px 60px rgba(15,23,42,0.3)',
    width: 'min(980px, 100%)', maxHeight: '92vh', overflow: 'auto',
    border: '1px solid #cbd5e1', padding: '16px',
  },
};
