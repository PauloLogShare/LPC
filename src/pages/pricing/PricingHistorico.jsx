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

  function extrairNumero(v) {
    if (!v) return 0;
    if (typeof v === 'number') return v;
    const limpo = String(v).replace(/[^\d,-]/g, '').replace(',', '.');
    return parseFloat(limpo) || 0;
  }

  const totalReceber = listafiltrada.reduce((acc, f) => acc + extrairNumero(f.valorReceber), 0);
  const totalPagar = listafiltrada.reduce((acc, f) => acc + extrairNumero(f.valorPagar), 0);
  const margens = listafiltrada.map(f => extrairNumero(f.margemBruta)).filter(v => !isNaN(v));
  const margemMedia = margens.length > 0 ? (margens.reduce((a, b) => a + b, 0) / margens.length) : 0;

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      {/* ── Toolbar / Cabeçalho Idêntico a Parâmetros Gerais & Calculadora ─────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h2 className="lpc-section-title" style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📤 Histórico de Fretes Enviados para Aprovação
          </h2>
          <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '1px' }}>
            Registro de propostas de frete, margens comerciais, status de aprovação e exportação de dados
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" onClick={handleExportarExcel} style={{ ...toolBtn, background: '#16a34a', color: '#fff', fontWeight: '800' }}>
            📊 Exportar Excel (.xlsx)
          </button>
          <button type="button" onClick={handleExportarJSON} style={toolBtn}>
            📤 Backup JSON
          </button>
          <button type="button" onClick={handleImportarJSON} style={toolBtn}>
            📥 Importar JSON
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
          <div style={kpiTitleSt}>Propostas Registradas</div>
          <div style={{ fontSize: '15px', fontWeight: '900', color: '#0369a1', margin: '3px 0' }}>
            {listafiltrada.length} <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>de {lista.length}</span>
          </div>
          <div style={{ fontSize: '9.5px', color: '#64748b' }}>
            {listafiltrada.filter(f => f.statusAprovacao === 'aprovado').length} Aprovadas | {listafiltrada.filter(f => !f.statusAprovacao || f.statusAprovacao === 'pendente').length} Pendentes
          </div>
        </div>

        <div style={{ ...kpiCardSt, borderLeft: '4px solid #15803d' }}>
          <div style={kpiTitleSt}>Receita Total (Receber)</div>
          <div style={{ fontSize: '15px', fontWeight: '900', color: '#15803d', margin: '3px 0' }}>
            R$ {totalReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '9.5px', color: '#64748b' }}>Valor bruto a receber das propostas</div>
        </div>

        <div style={{ ...kpiCardSt, borderLeft: '4px solid #dc2626' }}>
          <div style={kpiTitleSt}>Custo Total (Pagar)</div>
          <div style={{ fontSize: '15px', fontWeight: '900', color: '#dc2626', margin: '3px 0' }}>
            R$ {totalPagar.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '9.5px', color: '#64748b' }}>Valor pago aos parceiros transportadores</div>
        </div>

        <div style={{ ...kpiCardSt, borderLeft: '4px solid #d97706' }}>
          <div style={kpiTitleSt}>Margem Bruta Média</div>
          <div style={{ fontSize: '15px', fontWeight: '900', color: '#d97706', margin: '3px 0' }}>
            {margemMedia.toFixed(1)}%
          </div>
          <div style={{ fontSize: '9.5px', color: '#64748b' }}>Média ponderada do histórico filtrado</div>
        </div>
      </div>

      {/* ── Painel de Conteúdo: Filtros & Tabela ─────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(15,23,42,0.05)', padding: '16px' }}>
        {/* Barra de Filtros */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', marginBottom: '14px', background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          <input style={filterInputSt} placeholder="🔍 ID Proposta" value={filtros.id} onChange={(e) => handleFiltro('id', e.target.value)} />
          <input style={filterInputSt} type="date" value={filtros.data} onChange={(e) => handleFiltro('data', e.target.value)} />
          <input style={filterInputSt} placeholder="Embarcador" value={filtros.embarcador} onChange={(e) => handleFiltro('embarcador', e.target.value)} />
          <input style={filterInputSt} placeholder="Parceiro" value={filtros.parceiro} onChange={(e) => handleFiltro('parceiro', e.target.value)} />
          <input style={filterInputSt} placeholder="Origem" value={filtros.origem} onChange={(e) => handleFiltro('origem', e.target.value)} />
          <input style={filterInputSt} placeholder="Destino" value={filtros.destino} onChange={(e) => handleFiltro('destino', e.target.value)} />
        </div>

        {/* Tabela de Histórico */}
        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={thSt}>Ações</th>
                <th style={thSt}>ID</th>
                <th style={thSt}>Data/Hora</th>
                <th style={thSt}>Embarcador</th>
                <th style={thSt}>Parceiro</th>
                <th style={thSt}>Origem</th>
                <th style={thSt}>Destino</th>
                <th style={thSt}>Receber</th>
                <th style={thSt}>Pagar</th>
                <th style={thSt}>M. Bruta</th>
                <th style={thSt}>Sem Rec.</th>
                <th style={thSt}>Com Rec.</th>
                <th style={thSt}>TransÁgil</th>
                <th style={thSt}>Status</th>
              </tr>
            </thead>
            <tbody>
              {listafiltrada.length === 0 ? (
                <tr>
                  <td colSpan={14} style={{ textAlign: 'center', color: '#94a3b8', padding: '32px', fontSize: '12px' }}>
                    Nenhum frete encontrado no histórico.
                  </td>
                </tr>
              ) : listafiltrada.map((f) => (
                <tr
                  key={f.id}
                  style={{ background: '#fff', borderBottom: '1px solid #f1f5f9' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                >
                  <td style={tdSt}>
                    {onRestaurar && (
                      <button
                        type="button"
                        onClick={() => handleRestaurarClick(f)}
                        style={{ padding: '4px 8px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', background: '#e0f2fe', marginRight: '4px', fontWeight: '700', color: '#0369a1' }}
                        title="Restaurar proposta no Simulador"
                      >
                        🔄 Restaurar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeletar(f.id)}
                      style={{ padding: '4px 8px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', background: '#fee2e2', color: '#dc2626' }}
                      title="Excluir do Histórico"
                    >
                      🗑️
                    </button>
                  </td>
                  <td style={{ ...tdSt, fontWeight: '800', color: '#052a67' }}>#{f.id}</td>
                  <td style={{ ...tdSt, color: '#64748b' }}>{f.dataHora}</td>
                  <td style={{ ...tdSt, fontWeight: '700', color: '#1e293b' }}>{f.embarcador}</td>
                  <td style={tdSt}>{f.parceiro}</td>
                  <td style={tdSt}>{f.origem}</td>
                  <td style={tdSt}>{f.destino}</td>
                  <td style={{ ...tdSt, fontWeight: '700', color: '#16a34a' }}>{f.valorReceber}</td>
                  <td style={{ ...tdSt, fontWeight: '700', color: '#dc2626' }}>{f.valorPagar}</td>
                  <td style={{ ...tdSt, fontWeight: '800', color: margemCor(parseFloat(f.margemBruta)) }}>{f.margemBruta}</td>
                  <td style={tdSt}>{f.resultadoSemRecuperacao}</td>
                  <td style={tdSt}>{f.resultadoComRecuperacao}</td>
                  <td style={tdSt}>{f.resultadoTransAgil}</td>
                  <td style={tdSt}>
                    <span style={{
                      padding: '2px 8px', borderRadius: '4px', fontSize: '10.5px', fontWeight: '800',
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

const filterInputSt = {
  padding: '6px 10px',
  border: '1px solid #cbd5e1',
  borderRadius: '6px',
  fontSize: '11.5px',
  background: '#fff',
  fontWeight: '600',
  color: '#334155',
  outline: 'none',
};

const thSt = {
  padding: '9px 12px',
  fontWeight: '800',
  color: '#475569',
  textAlign: 'left',
  whiteSpace: 'nowrap',
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.03em',
};

const tdSt = {
  padding: '8px 12px',
  whiteSpace: 'nowrap',
  verticalAlign: 'middle',
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
