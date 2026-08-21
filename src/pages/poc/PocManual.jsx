/**
 * PocManual.jsx
 * Manual completo de instrução, regras de negócio e metodologia do módulo Indicadores de POC.
 * Padrão visual LPC com navegação por abas temáticas.
 */

import { useState } from 'react';

const SECOES = [
  { id: 'visao_geral',      label: 'Visão Geral',           icone: '🌟' },
  { id: 'clientes_poc',     label: 'Clientes em POC',       icone: '📋' },
  { id: 'painel_poc',       label: 'Painel de POC',         icone: '🏢' },
  { id: 'kpis_calculos',    label: 'Metodologia & KPIs',    icone: '📐' },
  { id: 'importacao_dados', label: 'Importação de Dados',   icone: '📥' },
];

export default function PocManual() {
  const [secaoAtiva, setSecaoAtiva] = useState('visao_geral');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', maxWidth: '1280px', margin: '0 auto' }}>
      
      {/* ── Header no Padrão LPC ─────────────────────────────────────────── */}
      <div style={st.header}>
        <div>
          <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', letterSpacing: '-0.01em' }}>
            📖 Manual do Módulo — Indicadores de POC
          </h2>
          <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px', lineHeight: '1.4' }}>
            Guia oficial de metodologia, regras de negócio, premissas de pontuação e acompanhamento de Provas de Conceito (POC)
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={st.badgeVersao}>v2.5 · Atualizado 2026</span>
        </div>
      </div>

      {/* ── Barra de Navegação por Abas ──────────────────────────────────── */}
      <div style={st.navTabs}>
        {SECOES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSecaoAtiva(s.id)}
            style={{
              ...st.tabBtn,
              ...(secaoAtiva === s.id ? st.tabBtnAtivo : {}),
            }}
          >
            <span style={{ fontSize: '14px', lineHeight: 1 }}>{s.icone}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      {/* ── Conteúdo da Aba Selecionada ──────────────────────────────────── */}
      <div style={st.conteudoWrapper}>
        {secaoAtiva === 'visao_geral'      && <SecaoVisaoGeral />}
        {secaoAtiva === 'clientes_poc'     && <SecaoClientesPoc />}
        {secaoAtiva === 'painel_poc'       && <SecaoPainelPoc />}
        {secaoAtiva === 'kpis_calculos'    && <SecaoKpisCalculos />}
        {secaoAtiva === 'importacao_dados' && <SecaoImportacaoDados />}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ABA 1: VISÃO GERAL
// ─────────────────────────────────────────────────────────────────────────────
function SecaoVisaoGeral() {
  return (
    <div style={st.secaoCard}>
      <h3 style={st.secaoTitulo}>🌟 Visão Geral do Módulo de Indicadores de POC</h3>
      <p style={st.texto}>
        O módulo <strong style={st.strong}>Indicadores de POC</strong> é a central analítica e de inteligência da LogShare dedicada à validação, 
        governança e tomada de decisão sobre <strong style={st.strong}>Provas de Conceito (POCs)</strong> realizadas com clientes embarcadores.
      </p>

      <div style={st.gridCards}>
        <div style={st.cardInfo}>
          <div style={st.cardInfoIcone}>🎯</div>
          <div style={st.cardInfoTitulo}>Objetivo Principal</div>
          <div style={st.cardInfoDesc}>
            Monitorar em tempo real se a operação do cliente está atingindo as metas operacionais, financeiras e de nível de serviço (SLA) 
            acordadas para homologação do contrato definitivo.
          </div>
        </div>

        <div style={st.cardInfo}>
          <div style={st.cardInfoIcone}>⚖️</div>
          <div style={st.cardInfoTitulo}>Score de Maturidade (0 a 100)</div>
          <div style={st.cardInfoDesc}>
            Algoritmo proprietário que pondera múltiplos KPIs estratégicos para gerar uma nota única de maturidade, classificando o risco da POC em 
            <strong style={st.strong}> Risco Baixo</strong>, <strong style={st.strong}>Risco Moderado</strong> ou <strong style={st.strong}>Alto Risco</strong>.
          </div>
        </div>

        <div style={st.cardInfo}>
          <div style={st.cardInfoIcone}>💼</div>
          <div style={st.cardInfoTitulo}>Decisão Executiva (GO / NO GO)</div>
          <div style={st.cardInfoDesc}>
            Recomendação automatizada fundamentada em dados para a diretoria comercial e operacional:
            <em> GO (Aprovação Plena)</em>, <em>GO com Acompanhamento</em> ou <em>Repactuação / No-Go</em>.
          </div>
        </div>

        <div style={st.cardInfo}>
          <div style={st.cardInfoIcone}>🌱</div>
          <div style={st.cardInfoTitulo}>Impacto ESG & Sustentabilidade</div>
          <div style={st.cardInfoDesc}>
            Contabilização precisa de redução de CO₂ (toneladas evitadas pela eliminação de viagens vazias na malha LogShare) e equivalência 
            em árvores preservadas.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ABA 2: CLIENTES EM POC
// ─────────────────────────────────────────────────────────────────────────────
function SecaoClientesPoc() {
  return (
    <div style={st.secaoCard}>
      <h3 style={st.secaoTitulo}>📋 Tela: Clientes em POC (Visão Individual & Operacional)</h3>
      <p style={st.texto}>
        A tela <strong style={st.strong}>Clientes em POC</strong> permite um mergulho profundo (<em>deep dive</em>) na operação de um cliente específico ou de toda a carteira consolidada, 
        apresentando o scorecard de desempenho, gráficos de evolução temporal e funil de conversão.
      </p>

      <div style={st.subSecao}>
        <h4 style={st.subTitulo}>1. Painel de Desempenho Geral (Score Circular de Risco)</h4>
        <p style={st.texto}>
          No topo da tela, o card circular de desempenho resume a nota ponderada da POC no período selecionado:
        </p>
        <div style={st.gridPequeno}>
          <div style={{ ...st.faixaRisco, borderLeft: '4px solid #16a34a', background: '#f0fdf4' }}>
            <strong style={{ color: '#16a34a', fontSize: '12px' }}>🟢 Risco Baixo — Score ≥ 81%</strong>
            <div style={{ fontSize: '11.5px', color: '#374151', marginTop: '4px', lineHeight: '1.5' }}>
              Operação madura e saudável. Atingiu a maioria das metas contratuais e de SLA. Recomendação: <span style={{ fontWeight: '800', color: '#15803d' }}>GO</span>.
            </div>
          </div>
          <div style={{ ...st.faixaRisco, borderLeft: '4px solid #d97706', background: '#fffbeb' }}>
            <strong style={{ color: '#b45309', fontSize: '12px' }}>🟡 Risco Moderado — Score entre 60% e 80%</strong>
            <div style={{ fontSize: '11.5px', color: '#374151', marginTop: '4px', lineHeight: '1.5' }}>
              Operação funcional mas com pontos de alerta. Recomendação: <span style={{ fontWeight: '800', color: '#b45309' }}>GO COM ACOMPANHAMENTO</span>.
            </div>
          </div>
          <div style={{ ...st.faixaRisco, borderLeft: '4px solid #dc2626', background: '#fef2f2' }}>
            <strong style={{ color: '#b91c1c', fontSize: '12px' }}>🔴 Alto Risco — Score &lt; 60%</strong>
            <div style={{ fontSize: '11.5px', color: '#374151', marginTop: '4px', lineHeight: '1.5' }}>
              Operação crítica com baixo engajamento ou gargalos operacionais graves. Recomendação: <span style={{ fontWeight: '800', color: '#b91c1c' }}>NO GO / REPACTUAÇÃO</span>.
            </div>
          </div>
        </div>
      </div>

      <div style={st.subSecao}>
        <h4 style={st.subTitulo}>2. Grid de KPIs Estratégicos Ponderados</h4>
        <p style={st.texto}>
          Cada card de KPI exibe o <strong style={st.strong}>Resultado Realizado</strong>, a <strong style={st.strong}>Meta Contratual</strong>, o percentual de <strong style={st.strong}>Atingimento</strong>, 
          o <strong style={st.strong}>Peso do KPI</strong> no Score Geral e a <strong style={st.strong}>Contribuição em Pontos</strong> para a nota final.
        </p>
      </div>

      <div style={st.subSecao}>
        <h4 style={st.subTitulo}>3. Evolução Histórica do Score</h4>
        <p style={st.texto}>
          Gráfico interativo de linha que plota a evolução mensal da nota do cliente versus a <strong style={st.strong}>Linha de Meta de 80 pontos</strong>. 
          Permite identificar se o cliente está em evolução contínua, estagnação ou deterioração operacional.
        </p>
      </div>

      <div style={st.subSecao}>
        <h4 style={st.subTitulo}>4. Funil de Conversão Logística</h4>
        <p style={st.texto}>
          Mapeamento das etapas da jornada de validação de rotas do cliente:<br/>
          <strong style={st.strong}>Rotas Mapeadas</strong> → <strong style={st.strong}>Rotas Validadas</strong> → <strong style={st.strong}>Viagens Realizadas</strong> → <strong style={st.strong}>Rotas Recorrentes</strong>.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ABA 3: PAINEL DE POC (C-LEVEL)
// ─────────────────────────────────────────────────────────────────────────────
function SecaoPainelPoc() {
  return (
    <div style={st.secaoCard}>
      <h3 style={st.secaoTitulo}>🏢 Tela: Painel de POC (Visão Consolidada C-Level)</h3>
      <p style={st.texto}>
        A tela <strong style={st.strong}>Painel de POC</strong> consolida a carteira global de clientes em teste em um painel executivo focado em tomada de decisão estratégica, 
        priorização de comitê comercial e mensuração de impacto financeiro total.
      </p>

      <div style={st.gridCards}>
        <div style={st.cardDestaque}>
          <div style={st.cardDestaqueLabel}>Total de Clientes em POC</div>
          <div style={st.cardDestaqueValor}>Contagem de Clientes</div>
          <div style={st.cardDestaqueSub}>Volume de contas simultâneas em fase de teste e homologação.</div>
        </div>

        <div style={st.cardDestaque}>
          <div style={st.cardDestaqueLabel}>Economia Total Gerada (Savings)</div>
          <div style={st.cardDestaqueValor}>R$ Total & % Médio</div>
          <div style={st.cardDestaqueSub}>Economia financeira real apurada contra fretes de tabela/spot.</div>
        </div>

        <div style={st.cardDestaque}>
          <div style={st.cardDestaqueLabel}>Volume de Frete Movimentado</div>
          <div style={st.cardDestaqueValor}>R$ Faturamento POC</div>
          <div style={st.cardDestaqueSub}>Total transacionado através da malha LogShare durante as POCs.</div>
        </div>

        <div style={st.cardDestaque}>
          <div style={st.cardDestaqueLabel}>Sustentabilidade ESG</div>
          <div style={st.cardDestaqueValor}>Ton CO₂ Evitadas</div>
          <div style={st.cardDestaqueSub}>Equivalente a árvores preservadas e campos de futebol reflorestados.</div>
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h4 style={st.subTitulo}>Cards Individuais de POC da Carteira</h4>
        <p style={st.texto}>
          Cada cliente possui um card executivo no portfólio contendo:
        </p>
        <ul style={st.lista}>
          <li><strong style={st.strong}>Score Geral de Desempenho</strong> com indicador visual de risco.</li>
          <li><strong style={st.strong}>Tendência Temporal:</strong> <em>Em evolução (Verde)</em>, <em>Estável (Laranja)</em> ou <em>Em queda (Vermelho)</em>.</li>
          <li><strong style={st.strong}>Recomendação Oficial:</strong> <em>GO</em>, <em>GO COM ACOMPANHAMENTO</em> ou <em>NO GO</em>.</li>
          <li><strong style={st.strong}>Principal Ponto de Atenção:</strong> Indicação automática do gargalo prioritário.</li>
          <li><strong style={st.strong}>Clique Direto:</strong> Ao clicar no card, o sistema redireciona para a visão detalhada do cliente.</li>
        </ul>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ABA 4: METODOLOGIA & KPIS
// ─────────────────────────────────────────────────────────────────────────────
function SecaoKpisCalculos() {
  return (
    <div style={st.secaoCard}>
      <h3 style={st.secaoTitulo}>📐 Metodologia de Cálculo dos KPIs e Ponderações</h3>
      <p style={st.texto}>
        O motor analítico calcula o atingimento de cada indicador com base na relação entre o valor apurado e a meta contratada, limitando o atingimento individual a 120% (para evitar distorções por superávit de um único indicador):
      </p>

      <div style={st.formulaBox}>
        <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#0369a1', marginBottom: '8px' }}>📐 Fórmulas de Cálculo</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={st.formulaLinha}>
            <span style={st.formulaLabel}>Atingimento (%)</span>
            <span style={st.formulaValor}>= Min( (Resultado Realizado / Meta Contratual) × 100 , 120% )</span>
          </div>
          <div style={st.formulaLinha}>
            <span style={st.formulaLabel}>Contribuição (pts)</span>
            <span style={st.formulaValor}>= (Atingimento × Peso Efetivo) / 100</span>
          </div>
          <div style={st.formulaLinha}>
            <span style={st.formulaLabel}>Score Geral</span>
            <span style={st.formulaValor}>= Σ Contribuições de todos os KPIs ativos</span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '18px' }}>
        <h4 style={st.subTitulo}>Tabela de KPIs Estratégicos Padrão</h4>
        <div style={st.tableWrapper}>
          <table style={st.table}>
            <thead>
              <tr style={st.thRow}>
                <th style={st.th}>KPI Estratégico</th>
                <th style={st.th}>Unidade</th>
                <th style={st.th}>Meta Padrão</th>
                <th style={st.th}>Peso</th>
                <th style={st.th}>Descrição & Impacto Operacional</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Utilização LogShare',        '%',        '80%',          '20%', 'Mede o engajamento da equipe do cliente em ofertar cargas na malha LogShare.'],
                ['Cobertura de Rotas',         '%',        '70%',          '15%', 'Percentual de rotas da malha total do cliente operadas com sucesso.'],
                ['Aderência Operacional',      '%',        '90%',          '15%', 'Cumprimento de janelas de carregamento, agendamentos e regras de pátio.'],
                ['Volume de Carga',            'Ton/mês',  'Conforme POC', '15%', 'Tonelagem real movimentada no período versus o compromisso inicial.'],
                ['On-Time Delivery (SLA)',     '%',        '95%',          '15%', 'Entregas efetuadas estritamente dentro do prazo prometido.'],
                ['Economia Financeira (Savings)', '%',    '10%',          '10%', 'Redução percentual de custo em comparação com a tabela base do cliente.'],
                ['Redução de CO₂ (ESG)',       'Ton',      'Conforme rota','10%', 'Emissões evitadas pelo compartilhamento de rotas e reaproveitamento de retorno.'],
              ].map(([kpi, und, meta, peso, desc], i) => (
                <tr key={i} style={{ ...st.tr, background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                  <td style={{ ...st.td, fontWeight: '700', color: '#052a67' }}>{kpi}</td>
                  <td style={st.tdCentro}>{und}</td>
                  <td style={st.tdCentro}>{meta}</td>
                  <td style={{ ...st.tdCentro, fontWeight: '800', color: '#0891b2' }}>{peso}</td>
                  <td style={st.td}>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ABA 5: IMPORTAÇÃO DE DADOS
// ─────────────────────────────────────────────────────────────────────────────
function SecaoImportacaoDados() {
  return (
    <div style={st.secaoCard}>
      <h3 style={st.secaoTitulo}>📥 Módulo de Importação de Dados da POC</h3>
      <p style={st.texto}>
        O sistema permite carregar planilhas do Excel (
        <span style={st.tag}>.xlsx</span> ou <span style={st.tag}>.xls</span>
        ) contendo os dados brutos de viagens e medições de POC.
      </p>

      <div style={st.subSecao}>
        <h4 style={st.subTitulo}>Estrutura Recomendada da Planilha Excel:</h4>
        <div style={st.gridCards}>
          <div style={st.cardInfo}>
            <div style={st.cardInfoIcone}>🏷️</div>
            <div style={st.cardInfoTitulo}>Colunas de Identificação</div>
            <div style={st.cardInfoDesc}>
              <ColTag label="Cliente" desc="Nome da empresa embarcadora" />
              <ColTag label="Data / Mês Referência" desc="ex: 2026-08" />
              <ColTag label="Origem" desc="Cidade/UF de origem" />
              <ColTag label="Destino" desc="Cidade/UF de destino" />
            </div>
          </div>

          <div style={st.cardInfo}>
            <div style={st.cardInfoIcone}>⚙️</div>
            <div style={st.cardInfoTitulo}>Colunas Operacionais</div>
            <div style={st.cardInfoDesc}>
              <ColTag label="Volume_Ton" desc="Peso transportado" />
              <ColTag label="Status_Entrega" desc="No Prazo / Atrasado" />
              <ColTag label="Tipo_Veiculo" desc="Carreta, Bi-trem, Truck" />
            </div>
          </div>

          <div style={st.cardInfo}>
            <div style={st.cardInfoIcone}>💰</div>
            <div style={st.cardInfoTitulo}>Colunas Financeiras</div>
            <div style={st.cardInfoDesc}>
              <ColTag label="Valor_Frete_Spot" desc="Valor de tabela padrão" />
              <ColTag label="Valor_Frete_LogShare" desc="Valor contratado" />
              <ColTag label="Savings_Reais" desc="Economia apurada" />
            </div>
          </div>

          <div style={st.cardInfo}>
            <div style={st.cardInfoIcone}>🔄</div>
            <div style={st.cardInfoTitulo}>Sincronização Temporal Automática</div>
            <div style={st.cardInfoDesc}>
              Ao carregar o arquivo, o sistema detecta automaticamente o range de datas das viagens e atualiza os filtros do painel sem intervenção manual.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE AUXILIAR: ColTag
// ─────────────────────────────────────────────────────────────────────────────
function ColTag({ label, desc }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', marginBottom: '5px', flexWrap: 'wrap' }}>
      <span style={st.colTagLabel}>{label}</span>
      <span style={{ fontSize: '10.5px', color: '#64748b' }}>{desc}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS VISUAIS LPC
// ─────────────────────────────────────────────────────────────────────────────
const st = {
  header: {
    background: 'linear-gradient(135deg, #052a67, #031d47)',
    padding: '14px 20px', borderRadius: '8px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    boxShadow: '0 2px 6px rgba(5,42,103,0.15)',
  },
  badgeVersao: {
    background: 'rgba(255,255,255,0.15)', color: '#fff',
    padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '800',
  },
  navTabs: {
    display: 'flex', gap: '6px', flexWrap: 'wrap',
    background: '#f1f5f9', padding: '6px', borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  tabBtn: {
    padding: '8px 14px', border: 'none', borderRadius: '6px',
    background: 'transparent', color: '#475569', fontWeight: '700',
    fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center',
    gap: '6px', transition: 'all 0.15s ease',
  },
  tabBtnAtivo: {
    background: '#052a67', color: '#fff', boxShadow: '0 2px 6px rgba(5,42,103,0.2)',
  },
  conteudoWrapper: {
    background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0',
    boxShadow: '0 1px 4px rgba(15,23,42,0.05)', padding: '20px',
  },
  secaoCard: {
    display: 'flex', flexDirection: 'column', gap: '14px',
  },
  secaoTitulo: {
    margin: '0 0 4px 0', fontSize: '15px', fontWeight: '900', color: '#052a67',
    borderBottom: '2px solid #14b8a6', paddingBottom: '6px', display: 'inline-block',
  },
  subSecao: {
    marginTop: '10px',
  },
  subTitulo: {
    margin: '0 0 8px 0', fontSize: '13px', fontWeight: '800', color: '#1e40af',
    paddingLeft: '8px', borderLeft: '3px solid #14b8a6',
  },
  texto: {
    fontSize: '12.5px', color: '#374151', lineHeight: '1.7', margin: '0 0 10px 0',
  },
  strong: {
    color: '#052a67', fontWeight: '800',
  },
  gridCards: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px',
    marginTop: '10px',
  },
  gridPequeno: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px',
    marginTop: '8px',
  },
  cardInfo: {
    background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px',
    padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px',
  },
  cardInfoIcone: { fontSize: '20px' },
  cardInfoTitulo: { fontSize: '12.5px', fontWeight: '800', color: '#052a67' },
  cardInfoDesc: { fontSize: '11.5px', color: '#4b5563', lineHeight: '1.6' },
  faixaRisco: {
    padding: '10px 14px', borderRadius: '6px',
  },
  cardDestaque: {
    background: 'linear-gradient(180deg, #f8fafc, #f1f5f9)',
    border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px',
  },
  cardDestaqueLabel: { fontSize: '10.5px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' },
  cardDestaqueValor: { fontSize: '15px', fontWeight: '900', color: '#052a67', margin: '4px 0' },
  cardDestaqueSub: { fontSize: '11px', color: '#64748b', lineHeight: '1.4' },
  lista: {
    fontSize: '12.5px', color: '#374151', lineHeight: '1.8', margin: '6px 0 0 18px', padding: 0,
  },
  formulaBox: {
    background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px',
    padding: '14px 18px',
  },
  formulaLinha: {
    display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap',
  },
  formulaLabel: {
    fontSize: '11.5px', fontWeight: '800', color: '#0369a1',
    background: '#e0f2fe', padding: '2px 8px', borderRadius: '4px', whiteSpace: 'nowrap',
  },
  formulaValor: {
    fontFamily: 'monospace', fontSize: '12px', color: '#0c4a6e',
  },
  tableWrapper: {
    overflowX: 'auto', borderRadius: '6px', border: '1px solid #e2e8f0', marginTop: '8px',
  },
  table: {
    width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', textAlign: 'left',
  },
  thRow: { background: '#052a67' },
  th: { padding: '10px 12px', fontWeight: '800', color: '#fff', fontSize: '11px' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '8px 12px', color: '#374151' },
  tdCentro: { padding: '8px 12px', color: '#374151', textAlign: 'center' },
  // Tag de coluna de planilha
  colTagLabel: {
    background: '#e0f2fe', color: '#0369a1',
    fontSize: '10.5px', fontWeight: '800', fontFamily: 'monospace',
    padding: '1px 7px', borderRadius: '4px', border: '1px solid #bae6fd',
    whiteSpace: 'nowrap',
  },
  tag: {
    background: '#e0f2fe', color: '#0369a1',
    fontSize: '11px', fontWeight: '800', fontFamily: 'monospace',
    padding: '1px 7px', borderRadius: '4px', border: '1px solid #bae6fd',
  },
};
