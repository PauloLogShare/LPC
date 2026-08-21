/**
 * PricingHistorico.jsx
 * Histórico de fretes com filtros, exportação JSON/Excel e importação JSON.
 * Suporta visualização como página completa no menu lateral ou como modal.
 */

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'logshare_fretes_historico';

export function obterHistorico() {
  try {
    const salvo = localStorage.getItem(STORAGE_KEY);
    return salvo ? JSON.parse(salvo) : [];
  } catch { return []; }
}

export function salvarHistorico(lista) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
}

export function registrarFrete(dados) {
  const historico = obterHistorico();
  historico.unshift(dados);
  salvarHistorico(historico);
  return historico;
}

function margemCor(v) {
  if (v > 8) return '#16a34a';
  if (v > 0) return '#d97706';
  return '#dc2626';
}

export default function PricingHistorico({ onFechar, onRestaurar }) {
  const [lista, setLista] = useState(obterHistorico);
  const [filtros, setFiltros] = useState({ id: '', data: '', embarcador: '', parceiro: '', origem: '', destino: '' });

  useEffect(() => { setLista(obterHistorico()); }, []);

  const listafiltrada = lista.filter((f) => {
    const dataFrete = f.dataHora
      ? (() => {
          const partes = f.dataHora.split(',')[0]?.trim().split('/');
          return partes?.length === 3 ? `${partes[2]}-${partes[1].padStart(2,'0')}-${partes[0].padStart(2,'0')}` : '';
        })()
      : '';
    return (
      (!filtros.id         || String(f.id).toLowerCase().includes(filtros.id.toLowerCase())) &&
      (!filtros.data       || dataFrete === filtros.data) &&
      (!filtros.embarcador || (f.embarcador||'').toLowerCase().includes(filtros.embarcador.toLowerCase())) &&
      (!filtros.parceiro   || (f.parceiro||'').toLowerCase().includes(filtros.parceiro.toLowerCase())) &&
      (!filtros.origem     || (f.origem||'').toLowerCase().includes(filtros.origem.toLowerCase())) &&
      (!filtros.destino    || (f.destino||'').toLowerCase().includes(filtros.destino.toLowerCase()))
    );
  });

  function handleFiltro(campo, valor) {
    setFiltros((p) => ({ ...p, [campo]: valor }));
  }

  function handleDeletar(id) {
    if (!window.confirm('Remover este registro permanentemente do histórico?')) return;
    const nova = lista.filter((f) => f.id !== id);
    salvarHistorico(nova);
    setLista(nova);
  }

  function handleRestaurarClick(frete) {
    if (onRestaurar) {
      onRestaurar(frete);
    }
    if (onFechar) {
      onFechar();
    }
  }

  function handleExportarJSON() {
    const blob = new Blob([JSON.stringify(listafiltrada, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Historico_Fretes_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  }

  function handleImportarJSON() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const importado = JSON.parse(ev.target.result);
          if (!Array.isArray(importado)) throw new Error();
          const merged = [...importado, ...lista].filter(
            (f, i, arr) => arr.findIndex((x) => x.id === f.id) === i
          );
          salvarHistorico(merged);
          setLista(merged);
          alert(`✔ ${importado.length} propostas importadas com sucesso!`);
        } catch {
          alert('Arquivo JSON inválido.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  function handleExportarExcel() {
    if (listafiltrada.length === 0) { alert('Nenhum registro para exportar.'); return; }
    import('xlsx').then(({ utils, writeFile }) => {
      const dados = listafiltrada.map((f) => ({
        'ID Proposta': f.id, 'Data/Hora': f.dataHora, 'Embarcador': f.embarcador,
        'Parceiro': f.parceiro, 'Origem': f.origem, 'Destino': f.destino,
        'Receber': f.valorReceber, 'Pagar': f.valorPagar,
        'Potencial': f.potencialViagens, 'Distância': f.distancia,
        'Pedágio': f.pedagio, 'Extras': f.custosExtras, 'GRIS': f.gris,
        'Tipo Carga': f.tipoCarga, 'Eixos': f.eixos, 'TransÁgil': f.transAgil,
        'Margem Bruta': f.margemBruta, 'Sem Rec.': f.resultadoSemRecuperacao,
        'Com Rec.': f.resultadoComRecuperacao, 'TransÁgil Res.': f.resultadoTransAgil,
        'Status ANTT': f.statusAntt, 'Observações': f.observacoes,
        'Status Aprovação': f.statusAprovacao || 'pendente',
      }));
      const ws = utils.json_to_sheet(dados);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'Fretes_Enviados');
      writeFile(wb, `Historico_Fretes_${new Date().toISOString().slice(0,10)}.xlsx`);
    }).catch(() => alert('Biblioteca xlsx não disponível.'));
  }

  const isModal = Boolean(onFechar);

  const content = (
    <div style={isModal ? st.panelModal : st.panelPage}>
      <div style={st.header}>
        <div>
          <div style={{ color: '#fff', fontWeight: '800', fontSize: '18px' }}>
            📤 Histórico de Fretes Enviados para Aprovação
          </div>
          <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>
            {listafiltrada.length} de {lista.length} registros exibidos · Exportação Excel e sincronização JSON multi-usuário
          </div>
        </div>
        {isModal && (
          <button onClick={onFechar} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', borderRadius: '8px', width: '34px', height: '34px', cursor: 'pointer', fontSize: '18px' }}>×</button>
        )}
      </div>

      <div style={st.actions}>
        <button style={st.btn('green')} onClick={handleExportarExcel}>📊 Exportar Excel (.xlsx)</button>
        <button style={st.btn('blue')}  onClick={handleExportarJSON}>📤 Exportar Backup JSON</button>
        <button style={st.btn('')}      onClick={handleImportarJSON}>📥 Importar Backup JSON</button>
      </div>

      <div style={st.filters}>
        <input style={st.filterInput} placeholder="🔍 Filtrar ID" value={filtros.id} onChange={(e) => handleFiltro('id', e.target.value)} />
        <input style={st.filterInput} type="date" value={filtros.data} onChange={(e) => handleFiltro('data', e.target.value)} />
        <input style={st.filterInput} placeholder="Embarcador" value={filtros.embarcador} onChange={(e) => handleFiltro('embarcador', e.target.value)} />
        <input style={st.filterInput} placeholder="Parceiro" value={filtros.parceiro} onChange={(e) => handleFiltro('parceiro', e.target.value)} />
        <input style={st.filterInput} placeholder="Origem" value={filtros.origem} onChange={(e) => handleFiltro('origem', e.target.value)} />
        <input style={st.filterInput} placeholder="Destino" value={filtros.destino} onChange={(e) => handleFiltro('destino', e.target.value)} />
      </div>

      <div style={st.tableWrap}>
        <table style={st.table}>
          <thead>
            <tr>
              <th style={st.th}>Ações</th>
              <th style={st.th}>ID</th>
              <th style={st.th}>Data/Hora</th>
              <th style={st.th}>Embarcador</th>
              <th style={st.th}>Parceiro</th>
              <th style={st.th}>Origem</th>
              <th style={st.th}>Destino</th>
              <th style={st.th}>Receber</th>
              <th style={st.th}>Pagar</th>
              <th style={st.th}>M. Bruta</th>
              <th style={st.th}>Sem Rec.</th>
              <th style={st.th}>Com Rec.</th>
              <th style={st.th}>TransÁgil</th>
              <th style={st.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {listafiltrada.length === 0 ? (
              <tr>
                <td colSpan={14} style={{ ...st.td, textAlign: 'center', color: '#94a3b8', padding: '32px' }}>
                  Nenhum frete encontrado no histórico.
                </td>
              </tr>
            ) : listafiltrada.map((f) => (
              <tr key={f.id} style={{ background: '#fff' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
              >
                <td style={st.td}>
                  {onRestaurar && (
                    <button onClick={() => handleRestaurarClick(f)}
                      style={{ padding: '5px 9px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', background: '#e0f2fe', marginRight: '6px', fontWeight: '700', color: '#0369a1' }}
                      title="Restaurar proposta no Simulador">🔄 Restaurar</button>
                  )}
                  <button onClick={() => handleDeletar(f.id)}
                    style={{ padding: '5px 9px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', background: '#fee2e2', color: '#dc2626' }}
                    title="Excluir do Histórico">🗑️</button>
                </td>
                <td style={{ ...st.td, fontWeight: '800', color: '#052a67' }}>#{f.id}</td>
                <td style={{ ...st.td, color: '#64748b' }}>{f.dataHora}</td>
                <td style={{ ...st.td, fontWeight: '700' }}>{f.embarcador}</td>
                <td style={st.td}>{f.parceiro}</td>
                <td style={st.td}>{f.origem}</td>
                <td style={st.td}>{f.destino}</td>
                <td style={{ ...st.td, fontWeight: '700', color: '#16a34a' }}>{f.valorReceber}</td>
                <td style={{ ...st.td, fontWeight: '700', color: '#dc2626' }}>{f.valorPagar}</td>
                <td style={{ ...st.td, fontWeight: '800', color: margemCor(parseFloat(f.margemBruta)) }}>{f.margemBruta}</td>
                <td style={st.td}>{f.resultadoSemRecuperacao}</td>
                <td style={st.td}>{f.resultadoComRecuperacao}</td>
                <td style={st.td}>{f.resultadoTransAgil}</td>
                <td style={st.td}>
                  <span style={{
                    padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '800',
                    background: f.statusAprovacao === 'aprovado' ? '#dcfce7' : '#fef3c7',
                    color: f.statusAprovacao === 'aprovado' ? '#166534' : '#92400e',
                  }}>
                    {f.statusAprovacao || 'pendente'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div style={st.overlay} onClick={(e) => e.target === e.currentTarget && onFechar()}>
        {content}
      </div>
    );
  }

  return <div style={{ padding: '8px' }}>{content}</div>;
}

const st = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 200,
    background: 'rgba(15,23,42,0.55)',
    display: 'flex', alignItems: 'stretch', justifyContent: 'flex-end',
    padding: '10px',
  },
  panelModal: {
    width: 'min(1200px, 98vw)', maxHeight: 'calc(100vh - 20px)',
    overflow: 'auto', background: '#fff', borderRadius: '12px',
    boxShadow: '0 24px 60px rgba(15,23,42,0.22)', display: 'flex', flexDirection: 'column',
  },
  panelPage: {
    background: '#fff', borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(15,23,42,0.06)',
    border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    background: 'linear-gradient(135deg, #052a67, #031d47)',
    padding: '18px 24px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  actions: { display: 'flex', gap: '10px', padding: '14px 20px', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap', alignItems: 'center', background: '#f8fafc' },
  filters: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', padding: '12px 20px', borderBottom: '1px solid #e2e8f0', background: '#fff' },
  filterInput: { padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '12px', background: '#f8fafc', fontWeight: '600' },
  tableWrap: { overflow: 'auto', maxHeight: 'calc(100vh - 280px)' },
  table: { width: 'max-content', minWidth: '100%', borderCollapse: 'collapse', fontSize: '12px' },
  th: { padding: '10px 14px', background: '#f1f5f9', fontWeight: '800', color: '#475569', textAlign: 'left', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap', position: 'sticky', top: 0, zIndex: 2 },
  td: { padding: '10px 14px', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap', verticalAlign: 'middle' },
  btn: (cor) => ({
    padding: '9px 16px', border: 'none', borderRadius: '8px',
    fontWeight: '800', cursor: 'pointer', fontSize: '12px',
    background: cor === 'green' ? '#16a34a' : cor === 'blue' ? '#0369a1' : cor === 'red' ? '#dc2626' : '#e2e8f0',
    color: ['green','blue','red'].includes(cor) ? '#fff' : '#052a67',
  }),
};
