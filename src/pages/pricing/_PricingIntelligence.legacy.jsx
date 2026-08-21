import React, { useState, useEffect } from "react";
import { calcularReferenciasDePreco } from './utils/pricingEngine';

export default function PricingIntelligence() {
  // Estado para controlar as Abas
  const [abaAtiva, setAbaAtiva] = useState("simulador");
  
  // ----------------------------------------------------
  // ESTADOS DO SIMULADOR E PARÂMETROS
  // ----------------------------------------------------
  const [calculado, setCalculado] = useState(false);
  const [resultado, setResultado] = useState(null);

  const parametrosPadrao = { custoGR: 150, custoOperacaoFixo: 342, aliquotaIPEF: 0.00035, taxaFinanceiraMensal: 0.025, grisBase: 0.0003 };
  const [parametros, setParametros] = useState(() => {
    const salvos = localStorage.getItem("lpc_pricing_parametros");
    return salvos ? JSON.parse(salvos) : parametrosPadrao;
  });

  const [form, setForm] = useState({
    origem: '', destino: '', distancia: '', eixos: 6, valorCarga: 0, peso: 0, valorPagar: 0, prazoPagamento: 0, prazoRecebimento: 0, percentualGris: 0, pedagio: 0, custosExtras: 0,
  });

  const salvarParametros = (e) => { e.preventDefault(); localStorage.setItem("lpc_pricing_parametros", JSON.stringify(parametros)); alert("Parâmetros atualizados!"); };
  const handleParamChange = (e) => { const { name, value } = e.target; setParametros(prev => ({ ...prev, [name]: parseFloat(value) || 0 })); };
  const handleChange = (e) => { const { name, value } = e.target; const valorNumerico = e.target.type === 'number' ? parseFloat(value) || 0 : value; setForm(prev => ({ ...prev, [name]: valorNumerico })); };
  const handleCalcular = (e) => { e.preventDefault(); setResultado(calcularReferenciasDePreco(form, parametros)); setCalculado(true); };

  // ----------------------------------------------------
  // ESTILOS GERAIS
  // ----------------------------------------------------
  const pricingLabelStyle = { display: "block", fontSize: "12px", fontWeight: "700", color: "#4b5563", marginBottom: "6px" };
  const pricingInputStyle = { width: "100%", padding: "10px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "8px", outline: "none", backgroundColor: "#f9fafb", color: "#111827", fontWeight: "600", boxSizing: "border-box" };
  const formatarValorPricing = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  // ----------------------------------------------------
  // BOTÕES DAS ABAS
  // ----------------------------------------------------
  const TabButton = ({ id, icon, label }) => (
    <button 
      onClick={() => setAbaAtiva(id)}
      style={{ background: "none", border: "none", fontSize: "15px", fontWeight: "800", cursor: "pointer", color: abaAtiva === id ? "#123B5D" : "#9ca3af", borderBottom: abaAtiva === id ? "3px solid #123B5D" : "none", paddingBottom: "10px", marginBottom: "-14px", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s" }}
    >
      <span>{icon}</span> {label}
    </button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%" }}>
      
      {/* NAVEGAÇÃO EM ABAS */}
      <div style={{ display: "flex", gap: "24px", borderBottom: "2px solid #e5e7eb", paddingBottom: "12px", overflowX: "auto" }}>
        <TabButton id="simulador" icon="🧭" label="Simulador" />
        <TabButton id="parametros" icon="⚙️" label="Parâmetros Gerais" />
        <TabButton id="cadastro" icon="🚛" label="Cadastro de Custos" />
        <TabButton id="antt" icon="📋" label="Tabela ANTT" />
        <TabButton id="manual" icon="📖" label="Manual do Módulo" />
      </div>

      {/* ======================================================== */}
      {/* TELA 1: SIMULADOR DE FRETE */}
      {/* ======================================================== */}
      {abaAtiva === "simulador" && (
        <div style={{ display: "flex", gap: "24px", alignItems: "flex-start", width: "100%" }}>
          <div style={{ flex: "0 0 380px", backgroundColor: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #f3f4f6", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "800", color: "#111827", marginBottom: "20px", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "2px solid #f3f4f6", paddingBottom: "12px" }}>01. Dados da Rota</h2>
            <form onSubmit={handleCalcular} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div><label style={pricingLabelStyle}>Origem</label><input type="text" name="origem" value={form.origem} onChange={handleChange} placeholder="Ex: Campinas / SP" style={pricingInputStyle} /></div>
              <div><label style={pricingLabelStyle}>Destino</label><input type="text" name="destino" value={form.destino} onChange={handleChange} placeholder="Ex: Curitiba / PR" style={pricingInputStyle} /></div>
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}><label style={pricingLabelStyle}>Dist. (km)</label><input type="number" name="distancia" value={form.distancia} onChange={handleChange} placeholder="Ex: 408" style={pricingInputStyle} /></div>
                <div style={{ flex: 1 }}><label style={pricingLabelStyle}>Eixos Pedágio</label><input type="number" name="eixos" value={form.eixos} onChange={handleChange} placeholder="Ex: 6" style={pricingInputStyle} /></div>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}><label style={pricingLabelStyle}>Pedágio</label><input type="number" name="pedagio" value={form.pedagio} onChange={handleChange} placeholder="R$ 0,00" style={pricingInputStyle} /></div>
                <div style={{ flex: 1 }}><label style={pricingLabelStyle}>Custos Extras</label><input type="number" name="custosExtras" value={form.custosExtras} onChange={handleChange} placeholder="R$ 0,00" style={pricingInputStyle} /></div>
              </div>
              <div style={{ height: "1px", backgroundColor: "#e5e7eb", margin: "8px 0" }} />
              <div><label style={pricingLabelStyle}>Valor a Pagar (Transportador)</label><input type="number" name="valorPagar" value={form.valorPagar} onChange={handleChange} placeholder="R$ 0,00" style={pricingInputStyle} /></div>
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}><label style={pricingLabelStyle}>Valor da Carga</label><input type="number" name="valorCarga" value={form.valorCarga} onChange={handleChange} placeholder="R$ 0,00" style={pricingInputStyle} /></div>
                <div style={{ flex: 1 }}><label style={pricingLabelStyle}>GRIS (%)</label><input type="number" name="percentualGris" value={form.percentualGris} onChange={handleChange} step="0.0001" placeholder="0.0350" style={pricingInputStyle} /></div>
              </div>
              <button type="submit" style={{ marginTop: "16px", backgroundColor: "#123B5D", color: "#ffffff", padding: "14px", borderRadius: "10px", fontSize: "15px", fontWeight: "800", border: "none", cursor: "pointer", transition: "all 0.2s" }}>Processar Inteligência de Preço</button>
            </form>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "24px" }}>
            {!resultado ? (
              <div style={{ backgroundColor: "#ffffff", padding: "60px", borderRadius: "16px", border: "1px dashed #e5e7eb", textAlign: "center", color: "#6b7280", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <span style={{ fontSize: "48px", marginBottom: "16px" }}>🧭</span>
                <h3 style={{ margin: 0, fontSize: "18px", color: "#374151" }}>Aguardando Parâmetros</h3>
                <p style={{ marginTop: "8px", fontSize: "14px" }}>Preencha os dados da rota à esquerda para gerar o cenário.</p>
              </div>
            ) : (
              <>
                <div style={{ backgroundColor: "#f0fdf4", padding: "24px", borderRadius: "16px", border: "2px solid #bbf7d0", boxShadow: "0 4px 20px rgba(22, 163, 74, 0.08)", textAlign: "center" }}>
                  <div style={{ fontSize: "12px", color: "#166534", fontWeight: "800", letterSpacing: "1px" }}>CÁLCULO DE CUSTO BÁSICO REALIZADO COM SUCESSO</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                  <div style={{ backgroundColor: "#ffffff", padding: "20px", borderRadius: "16px", border: "1px solid #f3f4f6", borderTop: `4px solid #4b5563`, boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
                    <div style={{ fontSize: "10px", color: "#9ca3af", fontWeight: "800", marginBottom: "4px" }}>BLOCO 02</div>
                    <div style={{ fontSize: "13px", color: "#374151", fontWeight: "800", textTransform: "uppercase" }}>Referência de Custo</div>
                    <div style={{ fontSize: "11px", color: "#6b7280", fontWeight: "500", marginBottom: "16px", height: "28px" }}>Custo Base Transportador</div>
                    <div style={{ fontSize: "24px", fontWeight: "900", color: "#4b5563" }}>{formatarValorPricing(resultado.custoTransportador)}</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TELA 2: BASE DE PARÂMETROS GERAIS */}
      {/* ======================================================== */}
      {abaAtiva === "parametros" && (
        <div style={{ backgroundColor: "#ffffff", padding: "32px", borderRadius: "16px", border: "1px solid #f3f4f6", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", maxWidth: "800px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#111827", marginBottom: "8px" }}>Variáveis do Sistema</h2>
          <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "24px" }}>Altere as taxas padrão aplicadas em todos os cálculos da operação.</p>
          <form onSubmit={salvarParametros} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            <div><label style={pricingLabelStyle}>Custo de Gerenciamento de Risco (R$ Fixo)</label><input type="number" step="0.01" name="custoGR" value={parametros.custoGR} onChange={handleParamChange} style={pricingInputStyle} /></div>
            <div><label style={pricingLabelStyle}>Custo Operacional Fixo (R$ Fixo)</label><input type="number" step="0.01" name="custoOperacaoFixo" value={parametros.custoOperacaoFixo} onChange={handleParamChange} style={pricingInputStyle} /></div>
            <div><label style={pricingLabelStyle}>Alíquota IPEF (Decimal)</label><input type="number" step="0.00001" name="aliquotaIPEF" value={parametros.aliquotaIPEF} onChange={handleParamChange} style={pricingInputStyle} /></div>
            <div><label style={pricingLabelStyle}>Taxa Financeira Mensal (Decimal)</label><input type="number" step="0.0001" name="taxaFinanceiraMensal" value={parametros.taxaFinanceiraMensal} onChange={handleParamChange} style={pricingInputStyle} /></div>
            <div style={{ gridColumn: "span 2", display: "flex", justifyContent: "flex-end", marginTop: "16px" }}><button type="submit" style={{ backgroundColor: "#16a34a", color: "#ffffff", padding: "12px 24px", borderRadius: "8px", fontSize: "14px", fontWeight: "800", border: "none", cursor: "pointer" }}>Salvar Parâmetros</button></div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* TELA 3: CADASTRO DE CUSTOS (VEÍCULOS E MOTORISTAS) */}
      {/* ======================================================== */}
      {abaAtiva === "cadastro" && (
        <div style={{ display: "flex", gap: "24px" }}>
          <div style={{ flex: 1, backgroundColor: "#ffffff", padding: "32px", borderRadius: "16px", border: "1px solid #f3f4f6", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#111827", margin: 0 }}>Equipamentos (Cavalos e Carretas)</h2>
              <button style={{ backgroundColor: "#123B5D", color: "#ffffff", padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: "700", border: "none", cursor: "pointer" }}>+ Novo Equipamento</button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left", color: "#6b7280" }}>
                  <th style={{ padding: "12px 8px" }}>Tipo</th>
                  <th style={{ padding: "12px 8px" }}>Descrição</th>
                  <th style={{ padding: "12px 8px" }}>Custo/km Médio</th>
                  <th style={{ padding: "12px 8px" }}>Depreciação</th>
                  <th style={{ padding: "12px 8px", textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "12px 8px", fontWeight: "600" }}>Cavalo</td>
                  <td style={{ padding: "12px 8px" }}>Cavalo Mecânico 6x2</td>
                  <td style={{ padding: "12px 8px" }}>R$ 1,85</td>
                  <td style={{ padding: "12px 8px" }}>R$ 0,45</td>
                  <td style={{ padding: "12px 8px", textAlign: "right", color: "#2563eb", cursor: "pointer", fontWeight: "600" }}>Editar</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "12px 8px", fontWeight: "600" }}>Carreta</td>
                  <td style={{ padding: "12px 8px" }}>Carreta Baú 3 Eixos</td>
                  <td style={{ padding: "12px 8px" }}>R$ 0,65</td>
                  <td style={{ padding: "12px 8px" }}>R$ 0,15</td>
                  <td style={{ padding: "12px 8px", textAlign: "right", color: "#2563eb", cursor: "pointer", fontWeight: "600" }}>Editar</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ flex: 1, backgroundColor: "#ffffff", padding: "32px", borderRadius: "16px", border: "1px solid #f3f4f6", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#111827", margin: 0 }}>Custos de Motorista</h2>
              <button style={{ backgroundColor: "#123B5D", color: "#ffffff", padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: "700", border: "none", cursor: "pointer" }}>+ Novo Perfil</button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left", color: "#6b7280" }}>
                  <th style={{ padding: "12px 8px" }}>Perfil / Categoria</th>
                  <th style={{ padding: "12px 8px" }}>Diária (Média)</th>
                  <th style={{ padding: "12px 8px" }}>Encargos (%)</th>
                  <th style={{ padding: "12px 8px", textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "12px 8px", fontWeight: "600" }}>Motorista Carreta E</td>
                  <td style={{ padding: "12px 8px" }}>R$ 180,00</td>
                  <td style={{ padding: "12px 8px" }}>45%</td>
                  <td style={{ padding: "12px 8px", textAlign: "right", color: "#2563eb", cursor: "pointer", fontWeight: "600" }}>Editar</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TELA 4: TABELA ANTT */}
      {/* ======================================================== */}
      {abaAtiva === "antt" && (
        <div style={{ backgroundColor: "#ffffff", padding: "32px", borderRadius: "16px", border: "1px solid #f3f4f6", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#111827", margin: 0 }}>Gerenciador da Tabela ANTT</h2>
            <div style={{ display: "flex", gap: "12px" }}>
              <button style={{ backgroundColor: "#f3f4f6", color: "#374151", padding: "10px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: "800", border: "1px solid #d1d5db", cursor: "pointer" }}>📤 Importar Tabela CSV</button>
              <button style={{ backgroundColor: "#16a34a", color: "#ffffff", padding: "10px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: "800", border: "none", cursor: "pointer" }}>+ Adicionar Linha Manual</button>
            </div>
          </div>
          <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "24px" }}>Mantenha os pisos mínimos atualizados. O Simulador utilizará sempre a versão mais recente salva aqui para traçar a Régua de Mercado.</p>
          
          <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead style={{ backgroundColor: "#f9fafb" }}>
                <tr style={{ borderBottom: "1px solid #e5e7eb", textAlign: "left", color: "#4b5563" }}>
                  <th style={{ padding: "14px" }}>Tipo de Carga</th>
                  <th style={{ padding: "14px" }}>Nº de Eixos</th>
                  <th style={{ padding: "14px" }}>Valor Deslocamento (R$/km)</th>
                  <th style={{ padding: "14px" }}>Carga/Descarga (R$)</th>
                  <th style={{ padding: "14px", textAlign: "center" }}>Vigência</th>
                  <th style={{ padding: "14px", textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "14px", fontWeight: "600", color: "#111827" }}>Carga Geral</td>
                  <td style={{ padding: "14px" }}>6</td>
                  <td style={{ padding: "14px" }}>R$ 4,1285</td>
                  <td style={{ padding: "14px" }}>R$ 180,50</td>
                  <td style={{ padding: "14px", textAlign: "center" }}>
                    <span style={{ backgroundColor: "#dcfce7", color: "#166534", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "700" }}>Ativa</span>
                  </td>
                  <td style={{ padding: "14px", textAlign: "right", color: "#2563eb", cursor: "pointer", fontWeight: "600" }}>Editar</td>
                </tr>
                {/* Outras linhas mockadas poderiam vir aqui */}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TELA 5: MANUAL DO MÓDULO */}
      {/* ======================================================== */}
      {abaAtiva === "manual" && (
        <div style={{ backgroundColor: "#ffffff", padding: "40px", borderRadius: "16px", border: "1px solid #f3f4f6", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", maxWidth: "800px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: "900", color: "#111827", marginBottom: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
            📖 Manual: Pricing Intelligence LogShare
          </h2>
          <div style={{ fontSize: "15px", color: "#4b5563", lineHeight: "1.7" }}>
            <p>Bem-vindo ao módulo de inteligência de precificação. Este módulo foi desenhado para eliminar o "achismo" na formação de preços de frete, oferecendo dados transparentes para a tomada de decisão.</p>
            
            <h3 style={{ color: "#123B5D", marginTop: "32px", fontSize: "18px", fontWeight: "800" }}>1. Como funciona o Simulador?</h3>
            <p>Preencha os dados da rota na aba <strong>Simulador</strong>. O sistema cruza as suas informações com a Tabela ANTT, o Custo Base do Transportador e o Histórico de Mercado da LogShare para gerar um Radar de Competitividade.</p>

            <h3 style={{ color: "#123B5D", marginTop: "24px", fontSize: "18px", fontWeight: "800" }}>2. Atualizando a Tabela ANTT</h3>
            <p>Na aba <strong>Tabela ANTT</strong>, você pode fazer o upload de uma planilha CSV contendo a resolução atualizada do Governo, ou editar os pisos manualmente. O Simulador bloqueará automaticamente propostas que firam o piso configurado.</p>

            <h3 style={{ color: "#123B5D", marginTop: "24px", fontSize: "18px", fontWeight: "800" }}>3. Gestão de Custos do Transportador</h3>
            <p>A aba de <strong>Cadastro de Custos</strong> permite mapear a realidade do parceiro. Cadastre o consumo de diesel médio dos cavalos, a depreciação das carretas e as diárias dos motoristas. Isso permite que a LogShare saiba exatamente onde o calo do transportador aperta antes de negociar!</p>

            <div style={{ marginTop: "40px", padding: "16px", backgroundColor: "#f0fdf4", borderLeft: "4px solid #16a34a", borderRadius: "0 8px 8px 0", color: "#166534", fontWeight: "500" }}>
              <strong>Dica de Operação:</strong> Sempre garanta que a aba "Parâmetros Gerais" esteja refletindo as taxas exatas de Juros e IPEF do mês vigente para que a Margem LogShare estimada seja precisa.
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
