/**
 * PricingAnttModal.jsx
 * Tabela ANTT editável com 72 linhas × 7 colunas de eixos.
 * Suporta modo página cheia no menu lateral e modo modal.
 */

import { useState } from 'react';
import { ANTT_EIXOS, ANTT_PADRAO } from '../../constants/pricingDefaults';

const STORAGE_KEY = 'logshare_antt_tabela';

export function obterTabelaAntt() {
  try {
    const salva = localStorage.getItem(STORAGE_KEY);
    if (salva) return JSON.parse(salva);
  } catch (e) { /* ignora */ }
  return JSON.parse(JSON.stringify(ANTT_PADRAO));
}

export default function PricingAnttModal({ tabela: tabelaProp, onSave, onFechar }) {
  const [linhas, setLinhas] = useState(() => {
    const inicial = tabelaProp || obterTabelaAntt();
    return JSON.parse(JSON.stringify(inicial));
  });
  const [status, setStatus] = useState('');

  function handleCellChange(rowIdx, campo, valor) {
    setLinhas((prev) => {
      const copia = JSON.parse(JSON.stringify(prev));
      copia[rowIdx][campo] = valor;
      return copia;
    });
    setStatus('');
  }

  function handleEixoChange(rowIdx, eixoIdx, valor) {
    setLinhas((prev) => {
      const copia = JSON.parse(JSON.stringify(prev));
      copia[rowIdx].valores[eixoIdx] = valor;
      return copia;
    });
    setStatus('');
  }

  function handleSalvar() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(linhas));
    if (onSave) onSave(linhas);
    setStatus('✔ Tabela ANTT salva com sucesso!');
  }

  function handleRestaurar() {
    if (!window.confirm('Restaurar a tabela ANTT para os valores padrão oficiais?')) return;
    const padrao = JSON.parse(JSON.stringify(ANTT_PADRAO));
    setLinhas(padrao);
    localStorage.removeItem(STORAGE_KEY);
    if (onSave) onSave(padrao);
    setStatus('✔ Tabela restaurada para o padrão.');
  }

  function handleExportarBackup() {
    const blob = new Blob([JSON.stringify(linhas, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `antt-tabela-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  }

  function handleImportarBackup() {
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
          setLinhas(importado);
          setStatus('✔ Backup importado. Clique em "Salvar Tabela" para aplicar.');
        } catch {
          setStatus('⚠ Arquivo JSON inválido.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  const isModal = Boolean(onFechar);

  const content = (
    <div style={isModal ? st.panelModal : st.panelPage}>
      <div style={st.header}>
        <div>
          <div style={{ color: '#fff', fontWeight: '800', fontSize: '18px' }}>
            📋 Tabela ANTT (Piso Mínimo Regulamentado)
          </div>
          <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>
            {linhas.length} tipos de carga regulamentados · Coeficientes CCD (R$/km) e CC (R$)
          </div>
        </div>
        {isModal && (
          <button
            onClick={onFechar}
            style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', borderRadius: '8px', width: '34px', height: '34px', cursor: 'pointer', fontSize: '18px' }}
          >×</button>
        )}
      </div>

      <div style={st.actions}>
        <button style={{ ...st.btn, background: '#14b8a6', color: '#fff' }} onClick={handleSalvar}>
          💾 Salvar Tabela
        </button>
        <button style={{ ...st.btn, background: '#e2e8f0', color: '#052a67' }} onClick={handleExportarBackup}>
          📤 Exportar Backup JSON
        </button>
        <button style={{ ...st.btn, background: '#e2e8f0', color: '#052a67' }} onClick={handleImportarBackup}>
          📥 Importar Backup JSON
        </button>
        <button style={{ ...st.btn, background: '#fee2e2', color: '#991b1b' }} onClick={handleRestaurar}>
          Restaurar Padrão Oficial
        </button>
        {status && <span style={{ fontSize: '13px', fontWeight: '700', color: '#16a34a', alignSelf: 'center', marginLeft: '8px' }}>{status}</span>}
      </div>

      <div style={st.tableWrap}>
        <table style={st.table}>
          <thead>
            <tr>
              <th style={st.th}>Tipo</th>
              <th style={st.th}>Tipo de Carga</th>
              <th style={st.th}>Coef.</th>
              <th style={st.th}>Unidade</th>
              {ANTT_EIXOS.map((e) => (
                <th key={e} style={st.th}>{e} eixos</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((linha, rowIdx) => (
              <tr key={rowIdx} style={{ background: rowIdx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                <td style={st.td}>
                  <input style={{ ...st.cellInput, width: '40px' }} value={linha.tipo} onChange={(e) => handleCellChange(rowIdx, 'tipo', e.target.value)} />
                </td>
                <td style={st.td}>
                  <input style={{ ...st.cellInput, width: '220px' }} value={linha.carga} onChange={(e) => handleCellChange(rowIdx, 'carga', e.target.value)} />
                </td>
                <td style={st.td}>
                  <input style={{ ...st.cellInput, width: '50px' }} value={linha.coeficiente} onChange={(e) => handleCellChange(rowIdx, 'coeficiente', e.target.value)} />
                </td>
                <td style={st.td}>
                  <input style={{ ...st.cellInput, width: '60px' }} value={linha.unidade} onChange={(e) => handleCellChange(rowIdx, 'unidade', e.target.value)} />
                </td>
                {ANTT_EIXOS.map((_, eixoIdx) => (
                  <td key={eixoIdx} style={st.td}>
                    <input style={st.cellInput} value={linha.valores[eixoIdx] || ''} onChange={(e) => handleEixoChange(rowIdx, eixoIdx, e.target.value)} />
                  </td>
                ))}
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
    width: 'min(1100px, 98vw)', maxHeight: 'calc(100vh - 20px)',
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
  actions: {
    display: 'flex', gap: '10px', padding: '14px 20px',
    borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap', alignItems: 'center', background: '#f8fafc',
  },
  btn: { padding: '9px 16px', borderRadius: '8px', border: 'none', fontWeight: '800', cursor: 'pointer', fontSize: '12px' },
  tableWrap: { overflow: 'auto', maxHeight: 'calc(100vh - 260px)' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '12px' },
  th: { padding: '10px 12px', background: '#f1f5f9', fontWeight: '700', color: '#475569', textAlign: 'left', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap', position: 'sticky', top: 0, zIndex: 2 },
  td: { padding: '5px 8px', borderBottom: '1px solid #f1f5f9' },
  cellInput: {
    width: '85px', padding: '6px 8px', border: '1px solid #cbd5e1',
    borderRadius: '6px', fontSize: '12px', fontWeight: '600', background: '#fff',
  },
};
