import React, { useState } from "react";

// ==========================================
// PRICING INTELLIGENCE (CALCULADORA V2.0)
// ==========================================
export default function PricingIntelligence() {
  const [calculado, setCalculado] = useState(false);

  const valoresMock = {
    custoTransportador: 3850,
    antt: 4080,
    nossaProposta: 4250,
    mercado: 4420,
    faixaCompetitiva: "R$ 4.150 - R$ 4.350",
    margemEstimada: "8,5%",
  };

  const simularCalculo = (e) => {
    e.preventDefault();
    setCalculado(true);
  };

  // Funções e estilos exclusivos deste componente
  const pricingLabelStyle = { display: "block", fontSize: "12px", fontWeight: "700", color: "#4b5563", marginBottom: "6px" };
  const pricingInputStyle = { width: "100%", padding: "10px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "8px", outline: "none", backgroundColor: "#f9fafb", color: "#111827", fontWeight: "600", boxSizing: "border-box" };

  const formatarValorPricing = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  // Componente do Marcador da Régua do Radar
  const PricingPinValor = ({ left, cor, label, valor, grande = false }) => (
    <div style={{ position: "absolute", left: left, top: "-4px", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ position: "absolute", bottom: "24px", whiteSpace: "nowrap", textAlign: "center" }}>
        <div style={{ fontSize: "11px", fontWeight: "800", color: cor, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
        <div style={{ fontSize: grande ? "18px" : "14px", fontWeight: "900", color: "#111827" }}>{formatarValorPricing(valor)}</div>
      </div>
      <div style={{ width: grande ? "16px" : "12px", height: grande ? "16px" : "12px", backgroundColor: cor, borderRadius: "50%", border: "2px solid #ffffff", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }} />
    </div>
  );

  // Componente dos cards de referência inferiores
  const PricingCardReferencia = ({ bloco, titulo, sub, valor, cor }) => (
    <div style={{ backgroundColor: "#ffffff", padding: "20px", borderRadius: "16px", border: "1px solid #f3f4f6", borderTop: `4px solid ${cor}`, boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
      <div style={{ fontSize: "10px", color: "#9ca3af", fontWeight: "800", marginBottom: "4px" }}>BLOCO {bloco}</div>
      <div style={{ fontSize: "13px", color: "#374151", fontWeight: "800", textTransform: "uppercase" }}>{titulo}</div>
      <div style={{ fontSize: "11px", color: "#6b7280", fontWeight: "500", marginBottom: "16px", height: "28px" }}>{sub}</div>
      <div style={{ fontSize: "24px", fontWeight: "900", color: cor }}>{formatarValorPricing(valor)}</div>
    </div>
  );

  return (
    <div style={{ display: "flex", gap: "24px", alignItems: "flex-start", width: "100%" }}>
      {/* LADO ESQUERDO: INPUTS */}
      <div style={{ flex: "0 0 380px", backgroundColor: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #f3f4f6", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
        <h2 style={{ fontSize: "16px", fontWeight: "800", color: "#111827", marginBottom: "20px", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "2px solid #f3f4f6", paddingBottom: "12px" }}>
          01. Dados da Rota
        </h2>
        <form onSubmit={simularCalculo} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div><label style={pricingLabelStyle}>Origem</label><input type="text" placeholder="Ex: Campinas / SP" style={pricingInputStyle} /></div>
          <div><label style={pricingLabelStyle}>Destino</label><input type="text" placeholder="Ex: Curitiba / PR" style={pricingInputStyle} /></div>
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ flex: 1 }}><label style={pricingLabelStyle}>Dist. (km)</label><input type="number" placeholder="Ex: 408" style={pricingInputStyle} /></div>
            <div style={{ flex: 1 }}><label style={pricingLabelStyle}>Eixos Pedágio</label><input type="number" placeholder="Ex: 6" style={pricingInputStyle} /></div>
          </div>
          <div style={{ height: "1px", backgroundColor: "#e5e7eb", margin: "8px 0" }} />
          <div>
            <label style={pricingLabelStyle}>Perfil de Veículo</label>
            <select style={pricingInputStyle}><option>Carreta 3 Eixos</option><option>Bitrem</option><option>Truck</option></select>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ flex: 1 }}><label style={pricingLabelStyle}>Carga (R$)</label><input type="text" placeholder="R$ 0,00" style={pricingInputStyle} /></div>
            <div style={{ flex: 1 }}><label style={pricingLabelStyle}>Peso (ton)</label><input type="number" placeholder="Ex: 27" style={pricingInputStyle} /></div>
          </div>
          <button type="submit" style={{ marginTop: "16px", backgroundColor: "#123B5D", color: "#ffffff", padding: "14px", borderRadius: "10px", fontSize: "15px", fontWeight: "800", border: "none", cursor: "pointer", transition: "all 0.2s" }}>
            Processar Inteligência de Preço
          </button>
        </form>
      </div>

      {/* LADO DIREITO: COCKPIT DE DECISÃO */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "24px" }}>
        {!calculado ? (
          <div style={{ backgroundColor: "#ffffff", padding: "60px", borderRadius: "16px", border: "1px dashed #e5e7eb", textAlign: "center", color: "#6b7280", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <span style={{ fontSize: "48px", marginBottom: "16px" }}>🧭</span>
            <h3 style={{ margin: 0, fontSize: "18px", color: "#374151" }}>Aguardando Parâmetros</h3>
            <p style={{ marginTop: "8px", fontSize: "14px" }}>Preencha os dados da rota à esquerda para gerar o cenário de precificação.</p>
          </div>
        ) : (
          <>
            <div style={{ backgroundColor: "#f0fdf4", padding: "24px", borderRadius: "16px", border: "2px solid #bbf7d0", boxShadow: "0 4px 20px rgba(22, 163, 74, 0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "12px", color: "#166534", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>🟢 Oportunidade de Compra</div>
                <div style={{ fontSize: "36px", fontWeight: "900", color: "#16a34a", lineHeight: "1" }}>{formatarValorPricing(valoresMock.nossaProposta)}</div>
                <div style={{ fontSize: "13px", color: "#15803d", fontWeight: "600", marginTop: "8px" }}>Faixa competitiva: {valoresMock.faixaCompetitiva}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "12px", color: "#166534", fontWeight: "700", marginBottom: "4px" }}>Margem LogShare Estimada</div>
                <div style={{ fontSize: "28px", fontWeight: "900", color: "#15803d" }}>{valoresMock.margemEstimada}</div>
                <div style={{ fontSize: "12px", color: "#166534", fontWeight: "600", marginTop: "4px" }}>Posicionamento: Competitivo</div>
              </div>
            </div>

            <div style={{ backgroundColor: "#ffffff", padding: "32px 24px", borderRadius: "16px", border: "1px solid #f3f4f6", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
              <h3 style={{ margin: "0 0 24px 0", fontSize: "15px", fontWeight: "800", color: "#111827", textTransform: "uppercase" }}>Radar de Mercado</h3>
              <div style={{ position: "relative", height: "8px", backgroundColor: "#e5e7eb", borderRadius: "4px", margin: "40px 0" }}>
                <div style={{ position: "absolute", left: "45%", width: "30%", height: "100%", backgroundColor: "#dcfce7", borderRadius: "4px" }} />
                <PricingPinValor left="15%" cor="#6b7280" label="Custo Transp." valor={valoresMock.custoTransportador} />
                <PricingPinValor left="35%" cor="#3b82f6" label="Piso ANTT" valor={valoresMock.antt} />
                <PricingPinValor left="55%" cor="#16a34a" label="Nossa Proposta" valor={valoresMock.nossaProposta} grande={true} />
                <PricingPinValor left="85%" cor="#dc2626" label="Média Mercado" valor={valoresMock.mercado} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
              <PricingCardReferencia bloco="02" titulo="Referência de Custo" sub="Quanto custa para o caminhão rodar" valor={valoresMock.custoTransportador} cor="#4b5563" />
              <PricingCardReferencia bloco="03" titulo="Referência de Mercado" sub="Média de transações no trecho" valor={valoresMock.mercado} cor="#dc2626" />
              <PricingCardReferencia bloco="04" titulo="Cálculo LogShare" sub="Sugestão baseada em risco e ANTT" valor={valoresMock.nossaProposta} cor="#16a34a" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

