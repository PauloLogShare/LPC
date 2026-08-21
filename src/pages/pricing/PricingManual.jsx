/**
 * PricingManual.jsx
 * Manual completo do módulo Pricing Intelligence / Calculadora de Frete LogShare.
 */

export default function PricingManual() {
  return (
    <div style={st.container}>
      <div style={st.header}>
        <h2 style={st.title}>📖 Manual: Pricing Intelligence LogShare</h2>
        <p style={st.subtitle}>
          Guia completo de funcionamento, regras de negócio, fórmulas matemáticas e diretrizes operacionais.
        </p>
      </div>

      <div style={st.card}>
        <h3 style={st.cardTitle}>🎯 1. Objetivo do Módulo</h3>
        <p style={st.text}>
          A Calculadora de Frete LogShare foi desenvolvida para eliminar o "achismo" na formação de preços e no fechamento de propostas de transporte.
          Ela calcula em tempo real o resultado financeiro da operação comparando a receita do embarcador, o custo pago ao transportador, impostos, custos operacionais, taxas de risco e recuperação tributária.
        </p>
      </div>

      <div style={st.card}>
        <h3 style={st.cardTitle}>📊 2. Indicadores Principais (KPIs)</h3>
        <div style={st.grid}>
          <div style={st.kpiBox('#0369a1', '#e0f2fe')}>
            <div style={st.kpiName}>Margem Bruta</div>
            <div style={st.kpiFormula}>((Valor a Receber / Valor a Pagar) - 1) × 100</div>
            <div style={st.kpiDesc}>Mede o markup direto entre a receita bruta e o valor pago à transportadora parceira.</div>
          </div>
          <div style={st.kpiBox('#059669', '#d1fae5')}>
            <div style={st.kpiName}>Margem Sem Recuperação</div>
            <div style={st.kpiFormula}>Resultado Sem Recuperação / Base Sem Recuperação</div>
            <div style={st.kpiDesc}>Cenário conservador deduzindo 9,25% de PIS/COFINS direto sobre a receita bruta sem crédito tributário na ponta de compra.</div>
          </div>
          <div style={st.kpiBox('#7c3aed', '#ede9fe')}>
            <div style={st.kpiName}>Margem com Recuperação Fiscal</div>
            <div style={st.kpiFormula}>Resultado com Recuperação / Valor a Receber</div>
            <div style={st.kpiDesc}>Aplicável para empresas no regime de Lucro Real / Presumido (Exceto Simples Nacional), onde há crédito de PIS/COFINS sobre o frete contratado.</div>
          </div>
          <div style={st.kpiBox('#d97706', '#fef3c7')}>
            <div style={st.kpiName}>Margem TransÁgil</div>
            <div style={st.kpiFormula}>Resultado TransÁgil / Valor a Receber</div>
            <div style={st.kpiDesc}>Regra de precificação específica para operações intermediadas via plataforma TransÁgil.</div>
          </div>
        </div>
      </div>

      <div style={st.card}>
        <h3 style={st.cardTitle}>🧮 3. Fórmulas de Custos e Deduções</h3>
        <div style={st.formulaGrid}>
          <div style={st.formulaItem}>
            <strong>Custo IPEF</strong>
            <code>Valor a Pagar × Alíquota IPEF (padrão: 0,035%)</code>
          </div>
          <div style={st.formulaItem}>
            <strong>Custo Operacional</strong>
            <code>R$ 342,00 (fixo por operação - editável em Parâmetros)</code>
          </div>
          <div style={st.formulaItem}>
            <strong>Custo de Gerenciamento de Risco (GR)</strong>
            <code>R$ 150,00 (fixo por operação - editável em Parâmetros)</code>
          </div>
          <div style={st.formulaItem}>
            <strong>Custo Financeiro</strong>
            <code>((Prazo Recebimento - Prazo Pagamento) / 30) × Taxa Mensal × Valor a Pagar</code>
            <small style={{ color: '#64748b', display: 'block', marginTop: '4px' }}>
              * Se o prazo de recebimento for menor que o de pagamento, gera benefício financeiro (positivo).
            </small>
          </div>
          <div style={st.formulaItem}>
            <strong>Ajuste GRIS / AdValorem</strong>
            <code>Valor da Carga × (GRIS informado - GRIS Base [0,0300%])</code>
            <small style={{ color: '#64748b', display: 'block', marginTop: '4px' }}>
              * Quando o percentual negociado é superior a 0,0300%, a diferença entra como ganho de margem.
            </small>
          </div>
          <div style={st.formulaItem}>
            <strong>Pedágio + Extras</strong>
            <code>Pedágio + Custos Extras informados</code>
          </div>
        </div>
      </div>

      <div style={st.card}>
        <h3 style={st.cardTitle}>📋 4. Validação da Tabela ANTT (Piso Mínimo Legal)</h3>
        <p style={st.text}>
          O simulador cruza automaticamente a distância em KM com os coeficientes de Custo de Deslocamento (CCD) e Custo de Carga/Descarga (CC) da Tabela ANTT oficial:
        </p>
        <div style={st.formulaItem}>
          <strong>Fórmula ANTT Mínima</strong>
          <code>Piso Mínimo = (CCD × Distância em KM) + CC</code>
        </div>
        <p style={{ ...st.text, marginTop: '8px' }}>
          O sistema emite alertas visuais instantâneos:
          <br/>
          <span style={{ color: '#16a34a', fontWeight: '700' }}>✔ Verde:</span> Valor igual ou acima do piso mínimo estipulado por lei.
          <br/>
          <span style={{ color: '#dc2626', fontWeight: '700' }}>⚠ Vermelho:</span> Valor abaixo da tabela regulatória, exigindo atenção jurídica e comercial.
        </p>
      </div>

      <div style={st.card}>
        <h3 style={st.cardTitle}>📍 5. Cálculo Automático de Rota (OpenStreetMap)</h3>
        <p style={st.text}>
          Ao preencher a cidade de Origem e Destino e clicar no botão <strong>📍 Auto</strong>, a aplicação consulta a malha viária brasileira em tempo real, calculando a distância exata em KM pela rota mais curta e preenchendo automaticamente o simulador.
        </p>
      </div>

      <div style={st.card}>
        <h3 style={st.cardTitle}>📤 6. Histórico, Aprovação e Exportação</h3>
        <ul style={st.list}>
          <li><strong>Proposta em PDF:</strong> O botão "Enviar para Aprovação" gera um documento PDF oficial formatado para envio a clientes e diretoria.</li>
          <li><strong>Exportação Excel & JSON:</strong> É possível exportar relatórios completos em Excel (.xlsx) e sincronizar backups em JSON entre múltiplos operadores.</li>
          <li><strong>Restauração Rápida:</strong> Qualquer proposta salva no histórico pode ser restaurada com 1 clique de volta para a tela de cálculo.</li>
        </ul>
      </div>
    </div>
  );
}

const st = {
  container: { padding: '8px', maxWidth: '1100px', display: 'flex', flexDirection: 'column', gap: '16px' },
  header: { marginBottom: '8px' },
  title: { fontSize: '22px', fontWeight: '900', color: '#052a67', margin: '0 0 6px 0' },
  subtitle: { fontSize: '13px', color: '#64748b', margin: 0 },
  card: { background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(15,23,42,0.05)', border: '1px solid #e2e8f0' },
  cardTitle: { fontSize: '16px', fontWeight: '800', color: '#052a67', margin: '0 0 14px 0', borderBottom: '2px solid #14b8a6', paddingBottom: '6px' },
  text: { fontSize: '13px', color: '#334155', lineHeight: '1.6', margin: 0 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' },
  kpiBox: (borderCor, bgCor) => ({
    background: bgCor, borderLeft: `4px solid ${borderCor}`, borderRadius: '8px', padding: '12px 14px',
  }),
  kpiName: { fontSize: '13px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' },
  kpiFormula: { fontSize: '11px', fontFamily: 'monospace', color: '#475569', fontWeight: '700', marginBottom: '6px' },
  kpiDesc: { fontSize: '11px', color: '#64748b', lineHeight: '1.4' },
  formulaGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px' },
  formulaItem: { background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '4px' },
  list: { margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#334155', lineHeight: '1.7' },
};
