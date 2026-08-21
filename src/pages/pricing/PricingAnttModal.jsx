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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      {/* ── Toolbar / Cabeçalho Idêntico a Parâmetros Gerais & Calculadora ─────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h2 className="lpc-section-title" style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📋 Tabela ANTT (Piso Mínimo Regulamentado)
          </h2>
          <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '1px' }}>
            Coeficientes de custo de deslocamento (CCD em R$/km) e carga/descarga (CC em R$) da tabela oficial
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          {status && (
            <span style={{ background: '#16a34a', color: '#fff', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800' }}>
              {status}
            </span>
          )}
          <button type="button" onClick={handleSalvar} style={{ ...toolBtn, background: '#14b8a6', color: '#fff', fontWeight: '800' }}>
            💾 Salvar Tabela
          </button>
          <button type="button" onClick={handleExportarBackup} style={toolBtn}>
            📤 Backup JSON
          </button>
          <button type="button" onClick={handleImportarBackup} style={toolBtn}>
            📥 Importar JSON
          </button>
          <button type="button" onClick={handleRestaurar} style={toolBtn}>
            🔄 Restaurar Padrões
          </button>
          {isModal && (
            <button onClick={onFechar} style={{ ...toolBtn, color: '#64748b' }}>
              ✕ Fechar
            </button>
          )}
        </div>
      </div>

      {/* ── 4 KPIs no Padrão do Pricing Center ─────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
        <div style={{ ...kpiCardSt, borderLeft: '4px solid #0369a1' }}>
          <div style={kpiTitleSt}>Categorias de Carga</div>
          <div style={{ fontSize: '15px', fontWeight: '900', color: '#0369a1', margin: '3px 0' }}>
            12 Categorias
          </div>
          <div style={{ fontSize: '9.5px', color: '#64748b' }}>Geral, Granel, Frigorificada, Perigosa...</div>
        </div>

        <div style={{ ...kpiCardSt, borderLeft: '4px solid #7c3aed' }}>
          <div style={kpiTitleSt}>Configuração de Eixos</div>
          <div style={{ fontSize: '15px', fontWeight: '900', color: '#7c3aed', margin: '3px 0' }}>
            7 Configurações
          </div>
          <div style={{ fontSize: '9.5px', color: '#64748b' }}>De 2 até 9 eixos (VUC a Rodotrem)</div>
        </div>

        <div style={{ ...kpiCardSt, borderLeft: '4px solid #d97706' }}>
          <div style={kpiTitleSt}>Coeficientes Cadastrados</div>
          <div style={{ fontSize: '15px', fontWeight: '900', color: '#d97706', margin: '3px 0' }}>
            {linhas.length} Coeficientes
          </div>
          <div style={{ fontSize: '9.5px', color: '#64748b' }}>CCD (Deslocamento) e CC (Carga/Descarga)</div>
        </div>

        <div style={{ ...kpiCardSt, borderLeft: '4px solid #15803d' }}>
          <div style={kpiTitleSt}>Regulamentação Oficial</div>
          <div style={{ fontSize: '15px', fontWeight: '900', color: '#15803d', margin: '3px 0' }}>
            Piso Vigente
          </div>
          <div style={{ fontSize: '9.5px', color: '#64748b' }}>Resolução ANTT Atualizada</div>
        </div>
      </div>

      {/* ── Painel de Conteúdo: Tabela Editável ──────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(15,23,42,0.05)', padding: '16px' }}>
        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px', maxHeight: 'calc(100vh - 280px)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={thSt}>Tipo</th>
                <th style={thSt}>Tipo de Carga</th>
                <th style={thSt}>Coef.</th>
                <th style={thSt}>Unidade</th>
                {ANTT_EIXOS.map((e) => (
                  <th key={e} style={{ ...thSt, textAlign: 'right' }}>{e} eixos</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhas.map((linha, rowIdx) => (
                <tr
                  key={rowIdx}
                  style={{ background: rowIdx % 2 === 0 ? '#fff' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={(e) => e.currentTarget.style.background = rowIdx % 2 === 0 ? '#fff' : '#f8fafc'}
                >
                  <td style={tdSt}>
                    <input
                      style={{ ...cellInputSt, width: '40px', textAlign: 'center' }}
                      value={linha.tipo}
                      onChange={(e) => handleCellChange(rowIdx, 'tipo', e.target.value)}
                    />
                  </td>
                  <td style={tdSt}>
                    <input
                      style={{ ...cellInputSt, width: '220px' }}
                      value={linha.carga}
                      onChange={(e) => handleCellChange(rowIdx, 'carga', e.target.value)}
                    />
                  </td>
                  <td style={tdSt}>
                    <input
                      style={{ ...cellInputSt, width: '55px', fontWeight: '800', color: '#0369a1', textAlign: 'center' }}
                      value={linha.coeficiente}
                      onChange={(e) => handleCellChange(rowIdx, 'coeficiente', e.target.value)}
                    />
                  </td>
                  <td style={tdSt}>
                    <input
                      style={{ ...cellInputSt, width: '65px', textAlign: 'center' }}
                      value={linha.unidade}
                      onChange={(e) => handleCellChange(rowIdx, 'unidade', e.target.value)}
                    />
                  </td>
                  {ANTT_EIXOS.map((_, eixoIdx) => (
                    <td key={eixoIdx} style={{ ...tdSt, textAlign: 'right' }}>
                      <input
                        style={{ ...cellInputSt, width: '75px', textAlign: 'right' }}
                        value={linha.valores[eixoIdx] || ''}
                        onChange={(e) => handleEixoChange(rowIdx, eixoIdx, e.target.value)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div style={modalOverlaySt} onClick={(e) => e.target === e.currentTarget && onFechar()}>
        <div style={modalContentSt}>
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

const thSt = {
  padding: '8px 10px',
  fontWeight: '800',
  color: '#475569',
  textAlign: 'left',
  whiteSpace: 'nowrap',
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.03em',
};

const tdSt = {
  padding: '4px 6px',
  whiteSpace: 'nowrap',
  verticalAlign: 'middle',
};

const cellInputSt = {
  padding: '5px 7px',
  border: '1px solid #cbd5e1',
  borderRadius: '4px',
  fontSize: '11.5px',
  fontWeight: '600',
  background: '#fff',
  color: '#1e293b',
  outline: 'none',
};

const modalOverlaySt = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 9999,
  background: 'rgba(15,23,42,0.65)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px',
};

const modalContentSt = {
  maxWidth: '1200px',
  width: '100%',
  maxHeight: '92vh',
  overflowY: 'auto',
  background: '#f8fafc',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
  padding: '16px',
};
