/**
 * BenchmarkHistoricoModal.jsx
 * Modal de Auditoria e Listagem de Viagens do Benchmark de Mercado (HUB LogShare).
 * Permite visualizar todas as viagens da métrica, filtrar por eixos/veículo/embarcador e exportar em XLSX / CSV.
 */

import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';

const fmt = {
  moeda: (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0),
  perc:  (v) => `${Number(v || 0).toFixed(1).replace('.', ',')}%`,
  km:    (v) => `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(v || 0)} km`,
};

const ROTULOS_EIXOS = {
  'todos': 'Todos os Eixos',
  '2': '2 Eixos (Toco / 3/4 / VUC)',
  '3': '3 Eixos (Truck)',
  '5': '5 Eixos (Carreta Padrão)',
  '6': '6 Eixos (Carreta LS / Vanderleia)',
  '7': '7 Eixos (Bi-trem)',
  '9': '9 Eixos (Rodotrem)',
};

function parseDataBR(dataStr) {
  if (!dataStr) return null;
  const parts = String(dataStr).split('/');
  if (parts.length !== 3) return null;
  const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
  return isNaN(d.getTime()) ? null : d;
}

export default function BenchmarkHistoricoModal({
  benchmarkHub,
  origem,
  destino,
  distancia,
  eixosSelecionado,
  periodoInicial = '90',
  onFechar,
}) {
  const [busca, setBusca] = useState('');
  const [filtroEixo, setFiltroEixo] = useState(eixosSelecionado ? String(eixosSelecionado) : 'todos');
  const [filtroPeriodo, setFiltroPeriodo] = useState(periodoInicial);
  const [pagina, setPagina] = useState(1);
  const itensPorPagina = 50;

  const todasViagens = useMemo(() => {
    if (!benchmarkHub?.todasViagensRota && !benchmarkHub?.viagens) return [];
    const lista = benchmarkHub.todasViagensRota?.length > 0 ? benchmarkHub.todasViagensRota : benchmarkHub.viagens;
    return lista.map(v => ({
      id: v.id,
      data: v.data || '',
      embarcador: v.embarcador || v.emb || '—',
      transportadora: v.transportadora || v.transp || '—',
      origem: v.origem || origem || '',
      destino: v.destino || destino || '',
      distanciaKm: v.distanciaKm || v.dist || distancia || 0,
      tipoVeiculo: v.tipoVeiculo || v.tipo || '—',
      catVeiculo: v.catVeiculo || v.cat || '',
      eixos: v.eixos ? String(v.eixos) : '6',
      recValorFrete: Number(v.recValorFrete ?? v.rec) || 0,
      desValorFrete: Number(v.desValorFrete ?? v.des) || 0,
      margemBruta: ((Number(v.recValorFrete ?? v.rec) || 0) - (Number(v.desValorFrete ?? v.des) || 0)),
      margemPerc: (Number(v.desValorFrete ?? v.des) || 0) > 0
        ? (((Number(v.recValorFrete ?? v.rec) || 0) - (Number(v.desValorFrete ?? v.des) || 0)) / (Number(v.desValorFrete ?? v.des) || 1)) * 100
        : 0,
    }));
  }, [benchmarkHub, origem, destino, distancia]);

  // Filtragem (Eixos + Período + Busca)
  const viagensFiltradas = useMemo(() => {
    // 1. Filtrar primeiro por eixo para determinar a base
    const porEixo = todasViagens.filter((v) => {
      return filtroEixo === 'todos' || String(v.eixos) === String(filtroEixo);
    });

    // 2. Identificar cutoff de período com base na data atual do sistema (Hoje - N dias)
    let cutoffTs = 0;
    const nowTs = new Date().getTime();
    if (filtroPeriodo !== 'todos') {
      const dias = Number(filtroPeriodo) || 90;
      cutoffTs = nowTs - (dias * 24 * 60 * 60 * 1000);
    }

    return porEixo.filter((v) => {
      // Filtro de Período
      if (cutoffTs > 0 && v.data) {
        const dt = parseDataBR(v.data);
        if (!dt || dt.getTime() < cutoffTs || dt.getTime() > nowTs) return false;
      }

      // Busca textual
      if (!busca.trim()) return true;
      const b = busca.toLowerCase().trim();
      const txt = `${v.id} ${v.embarcador} ${v.transportadora} ${v.origem} ${v.destino} ${v.tipoVeiculo} ${v.catVeiculo}`.toLowerCase();
      return txt.includes(b);
    });
  }, [todasViagens, filtroEixo, filtroPeriodo, busca]);

  // Estatísticas das viagens filtradas
  const stats = useMemo(() => {
    if (!viagensFiltradas.length) {
      return { total: 0, recMedio: 0, desMedio: 0, margemMedia: 0, margemPerc: 0, recMin: 0, recMax: 0 };
    }
    const recs = viagensFiltradas.map(v => v.recValorFrete).filter(v => v > 0);
    const deses = viagensFiltradas.map(v => v.desValorFrete).filter(v => v > 0);

    const recMedio = recs.length ? Math.round(recs.reduce((a, b) => a + b, 0) / recs.length) : 0;
    const desMedio = deses.length ? Math.round(deses.reduce((a, b) => a + b, 0) / deses.length) : 0;
    const margemMedia = (recMedio && desMedio) ? (recMedio - desMedio) : 0;
    const margemPerc = desMedio > 0 ? ((margemMedia / desMedio) * 100) : 0;

    return {
      total: viagensFiltradas.length,
      recMedio,
      desMedio,
      margemMedia,
      margemPerc,
      recMin: recs.length ? Math.min(...recs) : 0,
      recMax: recs.length ? Math.max(...recs) : 0,
    };
  }, [viagensFiltradas]);

  // Paginação
  const totalPaginas = Math.ceil(viagensFiltradas.length / itensPorPagina) || 1;
  const viagensPaginadas = useMemo(() => {
    const start = (pagina - 1) * itensPorPagina;
    return viagensFiltradas.slice(start, start + itensPorPagina);
  }, [viagensFiltradas, pagina]);

  // Exportar para Excel (.xlsx)
  const handleExportarExcel = () => {
    if (!viagensFiltradas.length) return;

    const dataExcel = viagensFiltradas.map(v => ({
      'ID Frete': v.id,
      'Data Criação': v.data,
      'Embarcador': v.embarcador,
      'Transportadora': v.transportadora,
      'Origem': v.origem,
      'Destino': v.destino,
      'Distância (km)': v.distanciaKm,
      'Tipo de Veículo': v.tipoVeiculo,
      'Carroceria': v.catVeiculo,
      'Qtd Eixos': v.eixos,
      'Valor Receber (rec_valor_frete)': v.recValorFrete,
      'Valor Pagar (des_valor_frete)': v.desValorFrete,
      'Lucro Bruto (R$)': v.margemBruta,
      'Margem (%)': fmt.perc(v.margemPerc),
    }));

    const ws = XLSX.utils.json_to_sheet(dataExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Viagens Benchmark');
    const nomeArquivo = `LogShare_Benchmark_${(origem || 'Origem').replace(/[^a-zA-Z0-9]/g, '_')}_x_${(destino || 'Destino').replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
    XLSX.writeFile(wb, nomeArquivo);
  };

  // Exportar para CSV
  const handleExportarCSV = () => {
    if (!viagensFiltradas.length) return;

    const cabecalho = ['ID Frete', 'Data', 'Embarcador', 'Transportadora', 'Origem', 'Destino', 'KM', 'Tipo Veiculo', 'Carroceria', 'Eixos', 'Valor Receber', 'Valor Pagar', 'Lucro Bruto', 'Margem %'];
    const linhas = viagensFiltradas.map(v => [
      v.id,
      v.data,
      `"${(v.embarcador || '').replace(/"/g, '""')}"`,
      `"${(v.transportadora || '').replace(/"/g, '""')}"`,
      `"${v.origem}"`,
      `"${v.destino}"`,
      v.distanciaKm,
      v.tipoVeiculo,
      v.catVeiculo,
      v.eixos,
      v.recValorFrete,
      v.desValorFrete,
      v.margemBruta,
      v.margemPerc,
    ]);

    const csvContent = '\uFEFF' + [cabecalho.join(';'), ...linhas.map(l => l.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `LogShare_Viagens_Benchmark_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={st.overlay} onClick={onFechar}>
      <div style={st.modal} onClick={(e) => e.stopPropagation()}>
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div style={st.header}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>📊</span>
              <h2 style={st.title}>Auditoria & Histórico de Viagens da Métrica</h2>
              <span style={st.badgeFonte}>HUB LogShare Oficial</span>
            </div>
            <p style={st.subTitle}>
              Rota: <strong>{origem || '—'} ➔ {destino || '—'}</strong> ({distancia ? `${distancia} km` : '—'}) — 
              Total de <strong>{todasViagens.length}</strong> viagens finalizadas registradas nesta rota.
            </p>
          </div>
          <button style={st.closeBtn} onClick={onFechar} title="Fechar">✕</button>
        </div>

        {/* ── KPIs Consolidados da Métrica ─────────────────────────────────── */}
        <div style={st.kpiRow}>
          <div style={st.kpiBox}>
            <div style={st.kpiLbl}>Viagens Filtradas</div>
            <div style={st.kpiVal}>{stats.total}</div>
          </div>
          <div style={{ ...st.kpiBox, borderLeft: '4px solid #16a34a' }}>
            <div style={{ ...st.kpiLbl, color: '#15803d' }}>Média Receber (rec_valor_frete)</div>
            <div style={{ ...st.kpiVal, color: '#16a34a' }}>{fmt.moeda(stats.recMedio)}</div>
            <div style={st.kpiSub}>Min: {fmt.moeda(stats.recMin)} | Max: {fmt.moeda(stats.recMax)}</div>
          </div>
          <div style={{ ...st.kpiBox, borderLeft: '4px solid #0284c7' }}>
            <div style={{ ...st.kpiLbl, color: '#0369a1' }}>Média Pagar (des_valor_frete)</div>
            <div style={{ ...st.kpiVal, color: '#0284c7' }}>{fmt.moeda(stats.desMedio)}</div>
            <div style={st.kpiSub}>Custo real transportador</div>
          </div>
          <div style={{ ...st.kpiBox, borderLeft: '4px solid #7c3aed' }}>
            <div style={{ ...st.kpiLbl, color: '#6d28d9' }}>Margem Média da Rota</div>
            <div style={{ ...st.kpiVal, color: '#7c3aed' }}>{fmt.perc(stats.margemPerc)}</div>
            <div style={st.kpiSub}>Lucro médio: {fmt.moeda(stats.margemMedia)}</div>
          </div>
        </div>

        {/* ── Barra de Ferramentas & Filtros ───────────────────────────────── */}
        <div style={st.toolbar}>
          <div style={{ display: 'flex', gap: '10px', flex: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="🔍 Buscar por Embarcador, Transportadora, ID..."
              value={busca}
              onChange={(e) => { setBusca(e.target.value); setPagina(1); }}
              style={st.inputBusca}
            />

            <select
              value={filtroEixo}
              onChange={(e) => { setFiltroEixo(e.target.value); setPagina(1); }}
              style={st.selectEixo}
            >
              {Object.entries(ROTULOS_EIXOS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>

            <select
              value={filtroPeriodo}
              onChange={(e) => { setFiltroPeriodo(e.target.value); setPagina(1); }}
              style={st.selectEixo}
            >
              <option value="30">Últimos 30 dias</option>
              <option value="60">Últimos 60 dias</option>
              <option value="90">Últimos 90 dias</option>
              <option value="180">Últimos 180 dias</option>
              <option value="365">Último ano (365 dias)</option>
              <option value="todos">Todo o histórico</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={st.btnExportarXLSX} onClick={handleExportarExcel}>
              📥 Exportar Excel (XLSX)
            </button>
            <button style={st.btnExportarCSV} onClick={handleExportarCSV}>
              📄 Exportar CSV
            </button>
          </div>
        </div>

        {/* ── Tabela de Viagens ────────────────────────────────────────────── */}
        <div style={st.tableWrapper}>
          <table style={st.table}>
            <thead>
              <tr style={st.thRow}>
                <th style={st.th}>ID Frete</th>
                <th style={st.th}>Data</th>
                <th style={st.th}>Embarcador</th>
                <th style={st.th}>Transportadora</th>
                <th style={st.th}>Tipo Veículo / Carroceria</th>
                <th style={st.th}>Eixos</th>
                <th style={st.th}>KM</th>
                <th style={{ ...st.th, textAlign: 'right' }}>Recebido (rec_valor)</th>
                <th style={{ ...st.th, textAlign: 'right' }}>Pago (des_valor)</th>
                <th style={{ ...st.th, textAlign: 'right' }}>Margem</th>
              </tr>
            </thead>
            <tbody>
              {viagensPaginadas.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                      Nenhuma viagem encontrada com os filtros selecionados
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                      Não há registros no período selecionado ({filtroPeriodo === 'todos' ? 'todo o histórico' : `últimos ${filtroPeriodo} dias`}) para {filtroEixo === 'todos' ? 'todos os eixos' : `${filtroEixo} eixos`}.
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      {filtroPeriodo !== 'todos' && (
                        <button
                          type="button"
                          onClick={() => { setFiltroPeriodo('todos'); setPagina(1); }}
                          style={{ padding: '6px 14px', background: '#052a67', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer' }}
                        >
                          🌐 Ver Todo o Histórico
                        </button>
                      )}
                      {filtroEixo !== 'todos' && (
                        <button
                          type="button"
                          onClick={() => { setFiltroEixo('todos'); setPagina(1); }}
                          style={{ padding: '6px 14px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '5px', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer' }}
                        >
                          🚚 Ver Todos os Eixos
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                viagensPaginadas.map((v, i) => (
                  <tr key={v.id || i} style={{ ...st.tr, background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                    <td style={st.td}><strong>#{v.id}</strong></td>
                    <td style={st.td}>{v.data || '—'}</td>
                    <td style={st.td} title={v.embarcador}>{v.embarcador}</td>
                    <td style={st.td} title={v.transportadora}>{v.transportadora}</td>
                    <td style={st.td}>
                      <span style={st.tagVeiculo}>{v.tipoVeiculo}</span>
                      {v.catVeiculo && <span style={st.tagCat}>{v.catVeiculo}</span>}
                    </td>
                    <td style={st.td}>
                      <span style={{ ...st.tagEixo, background: v.eixos === '6' ? '#dbeafe' : v.eixos === '5' ? '#fef3c7' : '#f1f5f9' }}>
                        {v.eixos} Eixos
                      </span>
                    </td>
                    <td style={st.td}>{fmt.km(v.distanciaKm)}</td>
                    <td style={{ ...st.td, textAlign: 'right', fontWeight: '800', color: '#16a34a' }}>
                      {fmt.moeda(v.recValorFrete)}
                    </td>
                    <td style={{ ...st.td, textAlign: 'right', fontWeight: '800', color: '#0284c7' }}>
                      {fmt.moeda(v.desValorFrete)}
                    </td>
                    <td style={{ ...st.td, textAlign: 'right', fontWeight: '800', color: v.margemPerc >= 0 ? '#15803d' : '#dc2626' }}>
                      {fmt.perc(v.margemPerc)} ({fmt.moeda(v.margemBruta)})
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Paginação & Footer ───────────────────────────────────────────── */}
        <div style={st.footer}>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Mostrando {viagensPaginadas.length} de {viagensFiltradas.length} viagens registradas
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button
              disabled={pagina === 1}
              onClick={() => setPagina(p => Math.max(1, p - 1))}
              style={{ ...st.btnPag, opacity: pagina === 1 ? 0.5 : 1 }}
            >
              ◀ Anterior
            </button>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#334155', padding: '0 8px' }}>
              Página {pagina} de {totalPaginas}
            </span>
            <button
              disabled={pagina >= totalPaginas}
              onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
              style={{ ...st.btnPag, opacity: pagina >= totalPaginas ? 0.5 : 1 }}
            >
              Próxima ▶
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const st = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(15,23,42,0.65)',
    backdropFilter: 'blur(4px)',
    display: 'grid',
    placeItems: 'center',
    zIndex: 9999,
    padding: '20px',
  },
  modal: {
    background: '#fff',
    borderRadius: '12px',
    width: '95vw',
    maxWidth: '1280px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
    overflow: 'hidden',
  },
  header: {
    padding: '16px 20px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    background: '#f8fafc',
  },
  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '900',
    color: '#052a67',
  },
  badgeFonte: {
    padding: '2px 8px',
    borderRadius: '10px',
    background: '#e0f2fe',
    color: '#0369a1',
    fontSize: '10.5px',
    fontWeight: '800',
  },
  subTitle: {
    margin: '4px 0 0 0',
    fontSize: '12px',
    color: '#64748b',
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    fontSize: '18px',
    color: '#64748b',
    cursor: 'pointer',
    padding: '4px 8px',
  },
  kpiRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '10px',
    padding: '12px 20px',
    background: '#fff',
    borderBottom: '1px solid #f1f5f9',
  },
  kpiBox: {
    padding: '10px 14px',
    borderRadius: '8px',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
  },
  kpiLbl: {
    fontSize: '11px',
    fontWeight: '800',
    color: '#475569',
  },
  kpiVal: {
    fontSize: '18px',
    fontWeight: '900',
    color: '#0f172a',
    margin: '2px 0',
  },
  kpiSub: {
    fontSize: '10px',
    color: '#94a3b8',
    fontWeight: '600',
  },
  toolbar: {
    padding: '12px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    background: '#fff',
    borderBottom: '1px solid #e2e8f0',
    flexWrap: 'wrap',
  },
  inputBusca: {
    padding: '7px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '12px',
    width: '280px',
    outline: 'none',
  },
  selectEixo: {
    padding: '7px 10px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '12px',
    fontWeight: '700',
    color: '#334155',
    outline: 'none',
  },
  btnExportarXLSX: {
    padding: '7px 14px',
    borderRadius: '6px',
    background: '#16a34a',
    color: '#fff',
    fontWeight: '800',
    fontSize: '12px',
    border: 'none',
    cursor: 'pointer',
  },
  btnExportarCSV: {
    padding: '7px 14px',
    borderRadius: '6px',
    background: '#052a67',
    color: '#fff',
    fontWeight: '800',
    fontSize: '12px',
    border: 'none',
    cursor: 'pointer',
  },
  tableWrapper: {
    flex: 1,
    overflowY: 'auto',
    maxHeight: '460px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '11.5px',
  },
  thRow: {
    position: 'sticky',
    top: 0,
    background: '#f1f5f9',
    zIndex: 1,
  },
  th: {
    padding: '9px 12px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: '800',
    color: '#475569',
    borderBottom: '1px solid #cbd5e1',
    whiteSpace: 'nowrap',
  },
  tr: {
    borderBottom: '1px solid #f1f5f9',
  },
  td: {
    padding: '8px 12px',
    color: '#1e293b',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    maxWidth: '220px',
    overflow: 'hidden',
  },
  tagVeiculo: {
    display: 'inline-block',
    padding: '1px 5px',
    borderRadius: '4px',
    background: '#f1f5f9',
    color: '#334155',
    fontWeight: '700',
    fontSize: '10px',
    marginRight: '4px',
  },
  tagCat: {
    display: 'inline-block',
    padding: '1px 5px',
    borderRadius: '4px',
    background: '#e2e8f0',
    color: '#475569',
    fontSize: '10px',
  },
  tagEixo: {
    display: 'inline-block',
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: '800',
    fontSize: '10.5px',
    color: '#0f172a',
  },
  footer: {
    padding: '10px 20px',
    borderTop: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#f8fafc',
  },
  btnPag: {
    padding: '5px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    background: '#fff',
    fontSize: '11.5px',
    fontWeight: '700',
    color: '#334155',
    cursor: 'pointer',
  },
};
