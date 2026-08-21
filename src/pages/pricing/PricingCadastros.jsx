/**
 * PricingCadastros.jsx
 * Central de Cadastros e Gestão de Custos Operacionais do Transporte:
 * 1. Embarcadores & Parceiros (CRUD)
 * 2. Veículos & Custos Fixos/Variáveis (Módulos 1, 2 e 3)
 * 3. Mão de Obra, Motoristas, Encargos & Diárias (Módulo 4)
 * 4. Apuração Consolidada do Custo por KM ($R$/km$) & Formação de Preço (Módulos 5 e 6)
 */

import { useState } from 'react';
import { useCadastros } from '../../hooks/useCadastros';
import { useCustosOperacionais } from '../../hooks/useCustosOperacionais';

const TIPOS = [
  { value: 'embarcador', label: 'Embarcador' },
  { value: 'parceiro',   label: 'Parceiro (Transportador)' },
  { value: 'ambos',      label: 'Ambos' },
];

const TIPO_LABEL = { embarcador: '🏭 Embarcador', parceiro: '🚚 Parceiro', ambos: '🔄 Ambos' };
const TIPO_COR   = { embarcador: '#0369a1', parceiro: '#15803d', ambos: '#7c3aed' };
const TIPO_BG    = { embarcador: '#e0f2fe', parceiro: '#dcfce7', ambos: '#ede9fe' };

const FORM_VAZIO = { nome: '', tipo: 'embarcador', cnpj: '' };

const fmt = {
  moeda: (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(v || 0),
  km:    (v) => `${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(v || 0)} /km`,
  num:   (v) => new Intl.NumberFormat('pt-BR').format(v || 0),
  perc:  (v) => `${Number(v || 0).toFixed(1).replace('.', ',')}%`,
};

export default function PricingCadastros({
  cadastros: cadastrosProp,
  onAdicionar: onAdicionarProp,
  onAtualizar: onAtualizarProp,
  onRemover: onRemoverProp,
  onFechar,
}) {
  const hookCadastros = useCadastros();
  const cadastros   = cadastrosProp   || hookCadastros.cadastros;
  const onAdicionar = onAdicionarProp || hookCadastros.adicionar;
  const onAtualizar = onAtualizarProp || hookCadastros.atualizar;
  const onRemover   = onRemoverProp   || hookCadastros.remover;

  const { config, apuracao, atualizarModulo, resetarParaPadrao } = useCustosOperacionais();

  const [abaAtiva, setAbaAtiva] = useState('embarcadores'); // 'embarcadores' | 'veiculo' | 'motorista' | 'consolidado'
  const [form, setForm] = useState(FORM_VAZIO);
  const [editando, setEditando] = useState(null);
  const [filtro, setFiltro] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [msgSalvo, setMsgSalvo] = useState('');

  const notificarSalvo = () => {
    setMsgSalvo('Parâmetros salvos e recalculados com sucesso!');
    setTimeout(() => setMsgSalvo(''), 3000);
  };

  const lista = cadastros.filter((c) => {
    const matchNome = (c.nome || '').toLowerCase().includes(filtro.toLowerCase());
    const matchTipo = filtroTipo === 'todos' || c.tipo === filtroTipo;
    return matchNome && matchTipo;
  });

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.nome.trim()) return;
    if (editando !== null) {
      onAtualizar(editando, form);
      setEditando(null);
    } else {
      onAdicionar(form);
    }
    setForm(FORM_VAZIO);
  }

  function iniciarEdicao(c) {
    setEditando(c.id);
    setForm({ nome: c.nome, tipo: c.tipo, cnpj: c.cnpj || '' });
  }

  function cancelarEdicao() {
    setEditando(null);
    setForm(FORM_VAZIO);
  }

  function handleRemover(id, nome) {
    if (!window.confirm(`Deseja remover "${nome}" dos cadastros?`)) return;
    onRemover(id);
  }

  const isModal = Boolean(onFechar);

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      {/* ── Toolbar / Cabeçalho Idêntico ao de Parâmetros Gerais & Calculadora ─────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h2 className="lpc-section-title" style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🏢 Cadastro de Parceiros & Gestão Operacional
          </h2>
          <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '1px' }}>
            Gerencie Embarcadores, Parceiros de Transporte, Custos de Veículos, Motoristas e Matriz de Custo por KM
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          {msgSalvo && (
            <span style={{ background: '#16a34a', color: '#fff', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800' }}>
              ✔ {msgSalvo}
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Restaurar todos os parâmetros de custos operacionais para os padrões de fábrica?')) {
                resetarParaPadrao();
                notificarSalvo();
              }
            }}
            style={toolBtn}
          >
            🔄 Restaurar Padrões
          </button>
          {isModal && (
            <button onClick={onFechar} style={{ ...toolBtn, color: '#64748b' }}>
              ✕ Fechar
            </button>
          )}
        </div>
      </div>

      {/* ── 4 KPIs no Mesmo Padrão de Parâmetros Gerais ─────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
        <div style={{ ...kpiCardSt, borderLeft: '4px solid #0369a1' }}>
          <div style={kpiTitleSt}>Embarcadores & Parceiros</div>
          <div style={{ fontSize: '15px', fontWeight: '900', color: '#0369a1', margin: '3px 0' }}>
            {cadastros.length} cadastrados
          </div>
          <div style={{ fontSize: '9.5px', color: '#64748b' }}>
            {cadastros.filter(c => c.tipo === 'embarcador').length} Emb. | {cadastros.filter(c => c.tipo === 'parceiro').length} Transp.
          </div>
        </div>

        <div style={{ ...kpiCardSt, borderLeft: '4px solid #7c3aed' }}>
          <div style={kpiTitleSt}>Custo Veicular / KM</div>
          <div style={{ fontSize: '15px', fontWeight: '900', color: '#7c3aed', margin: '3px 0' }}>
            R$ {(apuracao.totalFixoPorKm + apuracao.totalVariavelPorKm || 0).toFixed(2)}/km
          </div>
          <div style={{ fontSize: '9.5px', color: '#64748b' }}>
            Fixo R$ {apuracao.totalFixoPorKm.toFixed(2)} + Var R$ {apuracao.totalVariavelPorKm.toFixed(2)}
          </div>
        </div>

        <div style={{ ...kpiCardSt, borderLeft: '4px solid #d97706' }}>
          <div style={kpiTitleSt}>Custo Motorista / KM</div>
          <div style={{ fontSize: '15px', fontWeight: '900', color: '#d97706', margin: '3px 0' }}>
            R$ {(apuracao.totalPessoalPorKm || 0).toFixed(2)}/km
          </div>
          <div style={{ fontSize: '9.5px', color: '#64748b' }}>Salário, Encargos e Diárias</div>
        </div>

        <div style={{ ...kpiCardSt, borderLeft: '4px solid #15803d' }}>
          <div style={kpiTitleSt}>Custo Total Operacional</div>
          <div style={{ fontSize: '15px', fontWeight: '900', color: '#15803d', margin: '3px 0' }}>
            R$ {(apuracao.custoOperacionalTotalPorKm || 0).toFixed(2)}/km
          </div>
          <div style={{ fontSize: '9.5px', color: '#64748b' }}>
            Matriz Consolidada R$/km
          </div>
        </div>
      </div>

      {/* ── Submenu de Abas Estilizado ───────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '8px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
        {[
          { id: 'embarcadores', label: '🏢 Embarcadores & Parceiros', badge: `${cadastros.length}` },
          { id: 'veiculo',      label: '🚛 Veículo & Custos do Equipamento', badge: `R$ ${(apuracao.totalFixoPorKm + apuracao.totalVariavelPorKm).toFixed(2)}/km` },
          { id: 'motorista',    label: '👨‍✈️ Custos de Motorista & Diárias', badge: `R$ ${apuracao.totalPessoalPorKm.toFixed(2)}/km` },
          { id: 'consolidado',  label: '📊 Apuração Custo/KM & Formação', badge: `R$ ${apuracao.custoOperacionalTotalPorKm.toFixed(2)}/km` },
        ].map((aba) => (
          <button
            key={aba.id}
            type="button"
            onClick={() => setAbaAtiva(aba.id)}
            style={{
              flex: 1,
              minWidth: '180px',
              padding: '7px 12px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
              background: abaAtiva === aba.id ? '#052a67' : 'transparent',
              color: abaAtiva === aba.id ? '#ffffff' : '#475569',
              boxShadow: abaAtiva === aba.id ? '0 1px 3px rgba(5,42,103,0.3)' : 'none',
            }}
          >
            <span>{aba.label}</span>
            <span style={{
              fontSize: '9.5px',
              padding: '1px 6px',
              borderRadius: '10px',
              background: abaAtiva === aba.id ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
              color: abaAtiva === aba.id ? '#fff' : '#475569',
              fontWeight: '800',
            }}>
              {aba.badge}
            </span>
          </button>
        ))}
      </div>

      {/* ── Painel de Conteúdo com as Abas ──────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(15,23,42,0.05)', padding: '16px' }}>
        {/* ═══════════════════════════════════════════════════════════════════
            ABA 1: EMBARCADORES & PARCEIROS
           ═══════════════════════════════════════════════════════════════════ */}
        {abaAtiva === 'embarcadores' && (
          <div style={st.gridCadastros}>
            {/* Formulário */}
            <div style={st.formCard}>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#052a67', marginBottom: '14px' }}>
                {editando !== null ? '✏️ Editar Cadastro' : '+ Cadastrar Novo Parceiro / Embarcador'}
              </div>
              <form onSubmit={handleSubmit}>
                <div style={st.formGroup}>
                  <label style={st.label}>Razão Social / Nome Fantasia *</label>
                  <input
                    type="text"
                    style={st.input}
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    placeholder="Ex: Ambev, Transportadora Ramos..."
                    required
                  />
                </div>

                <div style={st.formGroup}>
                  <label style={st.label}>Tipo de Entidade</label>
                  <select
                    style={st.input}
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  >
                    {TIPOS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div style={st.formGroup}>
                  <label style={st.label}>CNPJ (Opcional)</label>
                  <input
                    type="text"
                    style={st.input}
                    value={form.cnpj}
                    onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                    placeholder="00.000.000/0001-00"
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                  <button type="submit" style={st.btnSalvar}>
                    {editando !== null ? 'Salvar Alterações' : 'Adicionar Cadastro'}
                  </button>
                  {editando !== null && (
                    <button type="button" onClick={cancelarEdicao} style={st.btnCancelar}>
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Listagem */}
            <div style={st.listaCard}>
              <div style={st.filtrosRow}>
                <input
                  type="text"
                  placeholder="🔍 Buscar por nome..."
                  style={{ ...st.input, flex: 1, minWidth: '160px' }}
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                />
                <select
                  style={{ ...st.input, width: '150px' }}
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                >
                  <option value="todos">Todos os tipos</option>
                  <option value="embarcador">🏭 Embarcadores</option>
                  <option value="parceiro">🚚 Parceiros</option>
                  <option value="ambos">🔄 Ambos</option>
                </select>
              </div>

              <div style={{ overflowY: 'auto', flex: 1, border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <table style={st.tabela}>
                  <thead>
                    <tr style={st.thRow}>
                      <th style={st.th}>Nome</th>
                      <th style={st.th}>Tipo</th>
                      <th style={st.th}>CNPJ</th>
                      <th style={{ ...st.th, textAlign: 'right' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lista.map((c) => (
                      <tr key={c.id} style={st.tr}>
                        <td style={{ ...st.td, fontWeight: '700', color: '#0f172a' }}>{c.nome}</td>
                        <td style={st.td}>
                          <span style={{
                            padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '800',
                            background: TIPO_BG[c.tipo] || '#f1f5f9', color: TIPO_COR[c.tipo] || '#475569',
                          }}>
                            {TIPO_LABEL[c.tipo] || c.tipo}
                          </span>
                        </td>
                        <td style={{ ...st.td, color: '#64748b', fontSize: '12px' }}>{c.cnpj || '—'}</td>
                        <td style={{ ...st.td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button onClick={() => iniciarEdicao(c)} style={st.btnIcon} title="Editar">✏️</button>
                          <button onClick={() => handleRemover(c.id, c.nome)} style={{ ...st.btnIcon, color: '#ef4444' }} title="Remover">🗑️</button>
                        </td>
                      </tr>
                    ))}
                    {lista.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                          Nenhum cadastro encontrado para os filtros informados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            ABA 2: VEÍCULO & CUSTOS DO EQUIPAMENTO (MÓDULOS 1, 2 e 3)
           ═══════════════════════════════════════════════════════════════════ */}
        {abaAtiva === 'veiculo' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={st.sectionCard}>
              <div style={st.sectionTitle}>Módulo 1: Premissas do Veículo e Operação da Frota</div>
              <div style={st.grid3}>
                <div>
                  <label style={st.label}>Identificação / Modelo do Veículo</label>
                  <input
                    type="text" style={st.input}
                    value={config.veiculo.identificacao}
                    onChange={(e) => { atualizarModulo('veiculo', { identificacao: e.target.value }); notificarSalvo(); }}
                  />
                </div>
                <div>
                  <label style={st.label}>Placa / Referência</label>
                  <input
                    type="text" style={st.input}
                    value={config.veiculo.placa}
                    onChange={(e) => { atualizarModulo('veiculo', { placa: e.target.value }); notificarSalvo(); }}
                  />
                </div>
                <div>
                  <label style={st.label}>Tipo de Carroceria / Composição</label>
                  <input
                    type="text" style={st.input}
                    value={config.veiculo.tipoCarroceria}
                    onChange={(e) => { atualizarModulo('veiculo', { tipoCarroceria: e.target.value }); notificarSalvo(); }}
                  />
                </div>
                <div>
                  <label style={st.label}>Valor de Aquisição ($V_a$ em R$)</label>
                  <input
                    type="number" style={st.input}
                    value={config.veiculo.valorAquisicao}
                    onChange={(e) => { atualizarModulo('veiculo', { valorAquisicao: Number(e.target.value) }); notificarSalvo(); }}
                  />
                </div>
                <div>
                  <label style={st.label}>% Valor Residual ($V_r$ ex: 0.40 para 40%)</label>
                  <input
                    type="number" step="0.05" style={st.input}
                    value={config.veiculo.percentualResidual}
                    onChange={(e) => { atualizarModulo('veiculo', { percentualResidual: Number(e.target.value) }); notificarSalvo(); }}
                  />
                  <small style={st.hint}>Valor Residual: {fmt.moeda(config.veiculo.valorAquisicao * config.veiculo.percentualResidual)}</small>
                </div>
                <div>
                  <label style={st.label}>Vida Útil Estimada ($N$ em Anos)</label>
                  <input
                    type="number" style={st.input}
                    value={config.veiculo.vidaUtilAnos}
                    onChange={(e) => { atualizarModulo('veiculo', { vidaUtilAnos: Number(e.target.value) }); notificarSalvo(); }}
                  />
                  <small style={st.hint}>Meses: {(config.veiculo.vidaUtilAnos || 5) * 12} meses</small>
                </div>
                <div>
                  <label style={st.label}>KM Média Mensal ($KM_m$)</label>
                  <input
                    type="number" style={st.input}
                    value={config.veiculo.kmMediaMensal}
                    onChange={(e) => { atualizarModulo('veiculo', { kmMediaMensal: Number(e.target.value) }); notificarSalvo(); }}
                  />
                  <small style={st.hint}>KM Anual: {fmt.num(config.veiculo.kmMediaMensal * 12)} km/ano</small>
                </div>
                <div>
                  <label style={st.label}>Dias Trabalhados no Mês</label>
                  <input
                    type="number" style={st.input}
                    value={config.veiculo.diasTrabalhadosMes}
                    onChange={(e) => { atualizarModulo('veiculo', { diasTrabalhadosMes: Number(e.target.value) }); notificarSalvo(); }}
                  />
                </div>
              </div>
            </div>

            {/* Módulo 2 e 3 em 2 colunas */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Módulo 2: Custos Fixos */}
              <div style={st.sectionCard}>
                <div style={st.sectionTitle}>Módulo 2: Custos Fixos do Equipamento</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={st.label}>Depreciação Linear (Mensal Calculada)</label>
                    <div style={st.readOnlyBox}>
                      <strong>{fmt.moeda(apuracao.depreciacaoMensal)} /mês</strong> ({fmt.km(apuracao.depreciacaoPorKm)})
                    </div>
                  </div>
                  <div>
                    <label style={st.label}>Remuneração de Capital / Financiamento (R$/mês)</label>
                    <input
                      type="number" style={st.input}
                      value={config.custosFixos.remuneracaoCapitalMensal}
                      onChange={(e) => { atualizarModulo('custosFixos', { remuneracaoCapitalMensal: Number(e.target.value) }); notificarSalvo(); }}
                    />
                  </div>
                  <div>
                    <label style={st.label}>IPVA + Licenciamento + Tacógrafo (R$/ano)</label>
                    <input
                      type="number" style={st.input}
                      value={config.custosFixos.ipvaLicenciamentoTacografoAnual}
                      onChange={(e) => { atualizarModulo('custosFixos', { ipvaLicenciamentoTacografoAnual: Number(e.target.value) }); notificarSalvo(); }}
                    />
                    <small style={st.hint}>Mensal: {fmt.moeda(config.custosFixos.ipvaLicenciamentoTacografoAnual / 12)}</small>
                  </div>
                  <div>
                    <label style={st.label}>Seguro Total do Equipamento (R$/ano)</label>
                    <input
                      type="number" style={st.input}
                      value={config.custosFixos.seguroTotalAnual}
                      onChange={(e) => { atualizarModulo('custosFixos', { seguroTotalAnual: Number(e.target.value) }); notificarSalvo(); }}
                    />
                    <small style={st.hint}>Mensal: {fmt.moeda(config.custosFixos.seguroTotalAnual / 12)}</small>
                  </div>
                  <div>
                    <label style={st.label}>Rastreador, Telemetria e GR (R$/mês)</label>
                    <input
                      type="number" style={st.input}
                      value={config.custosFixos.rastreadorTelemetriaMensal}
                      onChange={(e) => { atualizarModulo('custosFixos', { rastreadorTelemetriaMensal: Number(e.target.value) }); notificarSalvo(); }}
                    />
                  </div>
                  <div style={{ ...st.highlightBox, background: '#eff6ff', borderLeft: '4px solid #3b82f6' }}>
                    <div style={{ fontSize: '11px', color: '#1e40af', fontWeight: '700' }}>TOTAL FIXO EQUIPAMENTO</div>
                    <div style={{ fontSize: '16px', fontWeight: '900', color: '#1e3a8a' }}>
                      {fmt.moeda(apuracao.totalFixoMensal)} /mês · {fmt.km(apuracao.totalFixoPorKm)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Módulo 3: Custos Variáveis */}
              <div style={st.sectionCard}>
                <div style={st.sectionTitle}>Módulo 3: Custos Variáveis do Equipamento</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={st.label}>Preço Diesel (R$/l)</label>
                      <input
                        type="number" step="0.01" style={st.input}
                        value={config.custosVariaveis.precoDieselLitro}
                        onChange={(e) => { atualizarModulo('custosVariaveis', { precoDieselLitro: Number(e.target.value) }); notificarSalvo(); }}
                      />
                    </div>
                    <div>
                      <label style={st.label}>Consumo Médio (km/l)</label>
                      <input
                        type="number" step="0.1" style={st.input}
                        value={config.custosVariaveis.consumoDieselKmL}
                        onChange={(e) => { atualizarModulo('custosVariaveis', { consumoDieselKmL: Number(e.target.value) }); notificarSalvo(); }}
                      />
                    </div>
                  </div>
                  <small style={st.hint}>Custo Diesel: {fmt.km(apuracao.dieselPorKm)} | ARLA 32: {fmt.km(apuracao.arlaPorKm)}</small>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                    <div>
                      <label style={st.label}>Qtd Pneus</label>
                      <input
                        type="number" style={st.input}
                        value={config.custosVariaveis.qtdPneus}
                        onChange={(e) => { atualizarModulo('custosVariaveis', { qtdPneus: Number(e.target.value) }); notificarSalvo(); }}
                      />
                    </div>
                    <div>
                      <label style={st.label}>Preço Novo (R$)</label>
                      <input
                        type="number" style={st.input}
                        value={config.custosVariaveis.precoPneuNovo}
                        onChange={(e) => { atualizarModulo('custosVariaveis', { precoPneuNovo: Number(e.target.value) }); notificarSalvo(); }}
                      />
                    </div>
                    <div>
                      <label style={st.label}>Vida Útil KM</label>
                      <input
                        type="number" style={st.input}
                        value={config.custosVariaveis.vidaUtilTotalPneuKm}
                        onChange={(e) => { atualizarModulo('custosVariaveis', { vidaUtilTotalPneuKm: Number(e.target.value) }); notificarSalvo(); }}
                      />
                    </div>
                  </div>
                  <small style={st.hint}>Custo Pneus: {fmt.km(apuracao.pneusPorKm)} (com {config.custosVariaveis.qtdRecapagens} recapagens)</small>

                  <div>
                    <label style={st.label}>Manutenção Preventiva + Corretiva (R$/km)</label>
                    <input
                      type="number" step="0.01" style={st.input}
                      value={config.custosVariaveis.manutencaoPorKm}
                      onChange={(e) => { atualizarModulo('custosVariaveis', { manutencaoPorKm: Number(e.target.value) }); notificarSalvo(); }}
                    />
                  </div>
                  <div>
                    <label style={st.label}>Lavagens, Graxas e Fluidos (R$/km)</label>
                    <input
                      type="number" step="0.01" style={st.input}
                      value={config.custosVariaveis.lavagensGraxasPorKm}
                      onChange={(e) => { atualizarModulo('custosVariaveis', { lavagensGraxasPorKm: Number(e.target.value) }); notificarSalvo(); }}
                    />
                  </div>
                  <div style={{ ...st.highlightBox, background: '#f0fdf4', borderLeft: '4px solid #16a34a' }}>
                    <div style={{ fontSize: '11px', color: '#166534', fontWeight: '700' }}>TOTAL VARIÁVEL EQUIPAMENTO</div>
                    <div style={{ fontSize: '16px', fontWeight: '900', color: '#14532d' }}>
                      {fmt.moeda(apuracao.totalVariavelMensal)} /mês · {fmt.km(apuracao.totalVariavelPorKm)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            ABA 3: MOTORISTAS, ENCARGOS & DIÁRIAS (MÓDULO 4)
           ═══════════════════════════════════════════════════════════════════ */}
        {abaAtiva === 'motorista' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={st.sectionCard}>
              <div style={st.sectionTitle}>Módulo 4: Custos com Pessoal, Mão de Obra, Encargos e Diárias</div>
              <div style={st.grid3}>
                <div>
                  <label style={st.label}>Perfil do Motorista / Função</label>
                  <input
                    type="text" style={st.input}
                    value={config.motorista.nomePerfil}
                    onChange={(e) => { atualizarModulo('motorista', { nomePerfil: e.target.value }); notificarSalvo(); }}
                  />
                </div>
                <div>
                  <label style={st.label}>Salário Base (Piso CLT em R$)</label>
                  <input
                    type="number" style={st.input}
                    value={config.motorista.salarioBase}
                    onChange={(e) => { atualizarModulo('motorista', { salarioBase: Number(e.target.value) }); notificarSalvo(); }}
                  />
                </div>
                <div>
                  <label style={st.label}>Adicionais (Periculosidade 30% + HE Fixas R$)</label>
                  <input
                    type="number" style={st.input}
                    value={config.motorista.adicionalPericulosidadeHE}
                    onChange={(e) => { atualizarModulo('motorista', { adicionalPericulosidadeHE: Number(e.target.value) }); notificarSalvo(); }}
                  />
                </div>
                <div>
                  <label style={st.label}>Fator de Encargos Sociais (ex: 0.65 para 65%)</label>
                  <input
                    type="number" step="0.01" style={st.input}
                    value={config.motorista.fatorEncargosSociais}
                    onChange={(e) => { atualizarModulo('motorista', { fatorEncargosSociais: Number(e.target.value) }); notificarSalvo(); }}
                  />
                  <small style={st.hint}>INSS, FGTS, 13º, Férias: {fmt.moeda(apuracao.encargosSociaisMensal)} /mês</small>
                </div>
                <div>
                  <label style={st.label}>Benefícios (VR, Saúde, Seguro Vida R$/mês)</label>
                  <input
                    type="number" style={st.input}
                    value={config.motorista.beneficiosMensais}
                    onChange={(e) => { atualizarModulo('motorista', { beneficiosMensais: Number(e.target.value) }); notificarSalvo(); }}
                  />
                </div>
                <div>
                  <label style={st.label}>Diária Padrão por Dia de Viagem (R$/dia)</label>
                  <input
                    type="number" style={st.input}
                    value={config.motorista.diariaValorDia !== undefined ? config.motorista.diariaValorDia : 0}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : Number(e.target.value);
                      atualizarModulo('motorista', { diariaValorDia: val });
                      notificarSalvo();
                    }}
                  />
                </div>
                <div>
                  <label style={st.label}>Estimativa de Dias em Viagem / Mês</label>
                  <input
                    type="number" style={st.input}
                    value={config.motorista.diasViagemMes !== undefined ? config.motorista.diasViagemMes : 0}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : Number(e.target.value);
                      atualizarModulo('motorista', { diasViagemMes: val });
                      notificarSalvo();
                    }}
                  />
                  <small style={st.hint}>Total Diárias: {fmt.moeda(apuracao.diariasMensal)} /mês</small>
                </div>
                <div>
                  <label style={st.label}>Despesas de Estiva / Chapa / Ajudante (R$/mês)</label>
                  <input
                    type="number" style={st.input}
                    value={config.motorista.despesasEstivaAjudanteMes !== undefined ? config.motorista.despesasEstivaAjudanteMes : 0}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : Number(e.target.value);
                      atualizarModulo('motorista', { despesasEstivaAjudanteMes: val });
                      notificarSalvo();
                    }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '20px', padding: '16px', background: '#faf5ff', borderRadius: '8px', border: '1px solid #e9d5ff' }}>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#6d28d9', marginBottom: '10px' }}>
                  Resumo do Custo com Mão de Obra e Diárias (Base {fmt.num(config.veiculo.kmMediaMensal)} km/mês)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                  <div>
                    <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '700' }}>Salário Base</div>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b' }}>{fmt.moeda(apuracao.salarioBase)}</div>
                    <small style={{ fontSize: '10px', color: '#64748b' }}>{fmt.km(apuracao.salarioBasePorKm)}</small>
                  </div>
                  <div>
                    <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '700' }}>Adicionais & HE</div>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b' }}>{fmt.moeda(apuracao.adicionaisHE)}</div>
                    <small style={{ fontSize: '10px', color: '#64748b' }}>{fmt.km(apuracao.adicionaisHEPorKm)}</small>
                  </div>
                  <div>
                    <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '700' }}>Encargos Sociais</div>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b' }}>{fmt.moeda(apuracao.encargosSociaisMensal)}</div>
                    <small style={{ fontSize: '10px', color: '#64748b' }}>{fmt.km(apuracao.encargosSociaisPorKm)}</small>
                  </div>
                  <div>
                    <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '700' }}>Benefícios</div>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b' }}>{fmt.moeda(apuracao.beneficiosMensal)}</div>
                    <small style={{ fontSize: '10px', color: '#64748b' }}>{fmt.km(apuracao.beneficiosPorKm)}</small>
                  </div>
                  <div>
                    <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '700' }}>Diárias de Viagem</div>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b' }}>{fmt.moeda(apuracao.diariasMensal)}</div>
                    <small style={{ fontSize: '10px', color: '#64748b' }}>{fmt.km(apuracao.diariasPorKm)}</small>
                  </div>
                </div>
                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #e9d5ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#5b21b6' }}>TOTAL MÃO DE OBRA + DIÁRIAS:</span>
                  <span style={{ fontSize: '18px', fontWeight: '900', color: '#6d28d9' }}>
                    {fmt.moeda(apuracao.totalPessoalMensal)} /mês · {fmt.km(apuracao.totalPessoalPorKm)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            ABA 4: APURAÇÃO CONSOLIDADA DO CUSTO POR KM & MARKUP (MÓDULOS 5 e 6)
           ═══════════════════════════════════════════════════════════════════ */}
        {abaAtiva === 'consolidado' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Tabela de Consolidação Módulo 5 */}
            <div style={st.sectionCard}>
              <div style={st.sectionTitle}>Módulo 5: Consolidação dos Custos Operacionais (Base: {fmt.num(config.veiculo.kmMediaMensal)} km/mês)</div>
              
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', color: '#475569' }}>Grupo de Custos</th>
                    <th style={{ padding: '10px', textAlign: 'right', fontSize: '12px', color: '#475569' }}>Valor Mensal (R$)</th>
                    <th style={{ padding: '10px', textAlign: 'right', fontSize: '12px', color: '#475569' }}>Participação (%)</th>
                    <th style={{ padding: '10px', textAlign: 'right', fontSize: '12px', color: '#475569' }}>Custo por KM ($R$/km$)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px', fontSize: '13px', fontWeight: '700', color: '#1e40af' }}>1. Custos Fixos do Equipamento</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontSize: '13px', fontWeight: '700' }}>{fmt.moeda(apuracao.totalFixoMensal)}</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontSize: '13px', fontWeight: '700' }}>{fmt.perc(apuracao.partFixo)}</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontSize: '13px', fontWeight: '900', color: '#1e3a8a' }}>{fmt.km(apuracao.totalFixoPorKm)}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px', fontSize: '13px', fontWeight: '700', color: '#166534' }}>2. Custos Variáveis do Equipamento (Diesel, Pneus, Manutenção)</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontSize: '13px', fontWeight: '700' }}>{fmt.moeda(apuracao.totalVariavelMensal)}</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontSize: '13px', fontWeight: '700' }}>{fmt.perc(apuracao.partVariavel)}</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontSize: '13px', fontWeight: '900', color: '#14532d' }}>{fmt.km(apuracao.totalVariavelPorKm)}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px', fontSize: '13px', fontWeight: '700', color: '#6d28d9' }}>3. Pessoal, Motorista, Encargos e Diárias</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontSize: '13px', fontWeight: '700' }}>{fmt.moeda(apuracao.totalPessoalMensal)}</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontSize: '13px', fontWeight: '700' }}>{fmt.perc(apuracao.partPessoal)}</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontSize: '13px', fontWeight: '900', color: '#5b21b6' }}>{fmt.km(apuracao.totalPessoalPorKm)}</td>
                  </tr>
                  <tr style={{ background: '#052a67', color: '#fff' }}>
                    <td style={{ padding: '12px 10px', fontSize: '14px', fontWeight: '900' }}>CUSTO OPERACIONAL TOTAL (BREAK-EVEN)</td>
                    <td style={{ padding: '12px 10px', textAlign: 'right', fontSize: '14px', fontWeight: '900' }}>{fmt.moeda(apuracao.custoOperacionalTotalMensal)}</td>
                    <td style={{ padding: '12px 10px', textAlign: 'right', fontSize: '14px', fontWeight: '900' }}>100,0%</td>
                    <td style={{ padding: '12px 10px', textAlign: 'right', fontSize: '17px', fontWeight: '900', color: '#4ade80' }}>{fmt.km(apuracao.custoOperacionalTotalPorKm)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Formação de Preço e Markup Módulo 6 */}
            <div style={st.sectionCard}>
              <div style={st.sectionTitle}>Módulo 6: Formação do Preço do Frete (Markup e Margem Alvo)</div>
              <div style={st.grid3}>
                <div>
                  <label style={st.label}>Despesas Administrativas (%)</label>
                  <input
                    type="number" step="0.01" style={st.input}
                    value={config.markup.despesasAdministrativasPerc}
                    onChange={(e) => { atualizarModulo('markup', { despesasAdministrativasPerc: Number(e.target.value) }); notificarSalvo(); }}
                  />
                  <small style={st.hint}>Ex: 0.05 para 5%</small>
                </div>
                <div>
                  <label style={st.label}>Impostos (% ICMS / PIS / COFINS)</label>
                  <input
                    type="number" step="0.01" style={st.input}
                    value={config.markup.impostosPerc}
                    onChange={(e) => { atualizarModulo('markup', { impostosPerc: Number(e.target.value) }); notificarSalvo(); }}
                  />
                  <small style={st.hint}>Ex: 0.12 para 12%</small>
                </div>
                <div>
                  <label style={st.label}>Margem de Lucro Desejada (EBITDA %)</label>
                  <input
                    type="number" step="0.01" style={st.input}
                    value={config.markup.margemLucroDesejadaPerc}
                    onChange={(e) => { atualizarModulo('markup', { margemLucroDesejadaPerc: Number(e.target.value) }); notificarSalvo(); }}
                  />
                  <small style={st.hint}>Ex: 0.15 para 15%</small>
                </div>
              </div>

              <div style={{ marginTop: '16px', padding: '16px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#166534' }}>PREÇO SUGERIDO DO FRETE POR KM:</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    Custo Operacional Total ({fmt.km(apuracao.custoOperacionalTotalPorKm)}) + Pedágio Médio (R$ 0,50/km) ÷ [1 - {fmt.perc(apuracao.somaDeducoes * 100)}]
                  </div>
                </div>
                <div style={{ fontSize: '24px', fontWeight: '900', color: '#15803d' }}>
                  {fmt.km(apuracao.precoFreteSugeridoPorKm)}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Deseja restaurar todas as premissas de custo operacional para os valores de referência padrão?')) {
                      resetarParaPadrao();
                      notificarSalvo();
                    }
                  }}
                  style={{ background: 'transparent', border: '1px solid #cbd5e1', color: '#64748b', borderRadius: '6px', padding: '6px 12px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Restaurar Padrões da Metodologia
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div style={st.modalOverlay}>
        <div style={st.modalContent}>
          {content}
        </div>
      </div>
    );
  }

  return content;
}

const toolBtn = {
  fontSize: '11px',
  fontWeight: '700',
  padding: '6px 12px',
  borderRadius: '6px',
  border: '1px solid #e2e8f0',
  cursor: 'pointer',
  background: '#fff',
  color: '#334155',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
};

const kpiCardSt = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '8px 12px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
};

const kpiTitleSt = {
  fontSize: '10px',
  fontWeight: '800',
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const st = {
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '16px',
  },
  modalContent: {
    background: '#f8fafc',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    maxWidth: '1200px',
    width: '100%',
    maxHeight: '92vh',
    overflowY: 'auto',
    padding: '16px',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
  },
  tabsBar: {
    display: 'flex',
    gap: '2px',
    background: '#fff',
    borderBottom: '1px solid #e2e8f0',
    padding: '4px 16px 0 16px',
    overflowX: 'auto',
  },
  tabBtn: {
    padding: '10px 14px',
    borderRadius: '8px 8px 0 0',
    border: '1px solid transparent',
    fontSize: '12px',
    fontWeight: '800',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    whiteSpace: 'nowrap',
  },
  body: {
    padding: '16px',
    overflowY: 'auto',
    flex: 1,
  },
  gridCadastros: {
    display: 'grid',
    gridTemplateColumns: '320px 1fr',
    gap: '16px',
  },
  formCard: {
    background: '#fff',
    borderRadius: '10px',
    padding: '16px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 4px rgba(15,23,42,0.05)',
  },
  listaCard: {
    background: '#fff',
    borderRadius: '10px',
    padding: '16px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 4px rgba(15,23,42,0.05)',
    display: 'flex',
    flexDirection: 'column',
  },
  sectionCard: {
    background: '#fff',
    borderRadius: '10px',
    padding: '16px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 4px rgba(15,23,42,0.05)',
  },
  sectionTitle: {
    fontSize: '13.5px',
    fontWeight: '900',
    color: '#052a67',
    marginBottom: '12px',
    borderBottom: '1px solid #f1f5f9',
    paddingBottom: '6px',
  },
  grid3: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '12px',
  },
  formGroup: {
    marginBottom: '12px',
  },
  label: {
    display: 'block',
    fontSize: '11px',
    fontWeight: '700',
    color: '#475569',
    marginBottom: '4px',
  },
  input: {
    width: '100%',
    padding: '7px 10px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '12px',
    fontWeight: '600',
    color: '#1e293b',
    background: '#fff',
    boxSizing: 'border-box',
    outline: 'none',
  },
  hint: {
    display: 'block',
    fontSize: '10px',
    color: '#64748b',
    marginTop: '3px',
  },
  readOnlyBox: {
    padding: '7px 10px',
    background: '#f1f5f9',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    fontSize: '12px',
    color: '#334155',
  },
  highlightBox: {
    padding: '10px 12px',
    borderRadius: '8px',
    marginTop: '6px',
  },
  filtrosRow: {
    display: 'flex',
    gap: '10px',
    marginBottom: '12px',
  },
  tabela: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  thRow: {
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
  },
  th: {
    padding: '8px 12px',
    fontSize: '11px',
    fontWeight: '800',
    color: '#475569',
    textAlign: 'left',
  },
  tr: {
    borderBottom: '1px solid #f1f5f9',
  },
  td: {
    padding: '8px 12px',
    fontSize: '12px',
  },
  btnSalvar: {
    flex: 1,
    padding: '8px 12px',
    background: '#14b8a6',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '800',
    cursor: 'pointer',
  },
  btnCancelar: {
    padding: '8px 12px',
    background: '#f1f5f9',
    color: '#475569',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  btnIcon: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '4px',
  },
};
