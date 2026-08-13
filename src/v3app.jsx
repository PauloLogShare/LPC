import { useState } from "react";
import logoLogShare from "./assets/logshare-logo.png";
import "./App.css";

import { readExcel } from "./services/excelService";
import { processarDados } from "./utils/dataProcessor";
import { calcularDashboard } from "./utils/dashboardEngine";
import { calcularPortfolio } from "./utils/portfolioEngine";

function App() {
  const [dados, setDados] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [visao, setVisao] = useState("poc");
  const [menuRecolhido, setMenuRecolhido] = useState(false);
  const [indicadoresAbertos, setIndicadoresAbertos] = useState(true);
  const [menuAtivo, setMenuAtivo] = useState("importacao");
  const [clienteSelecionado, setClienteSelecionado] = useState("Todos");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [mostrarCalendario, setMostrarCalendario] = useState(false);

  // ==========================================
  // IMPORTAR EXCEL
  // ==========================================
  const handleFile = (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }
    readExcel(file, (dadosLidos) => {
      const dadosProcessados = processarDados(dadosLidos);
      setDados(dadosProcessados);
      if (dadosProcessados.length === 0) {
        setDashboard(null);
        setPortfolio(null);
        setMensagem("Nenhum dado encontrado no arquivo.");
        return;
      }
      const datas = dadosProcessados
        .map((item) => item.mes)
        .filter(Boolean)
        .sort((a, b) => a - b);
      const inicio = formatarDataInput(datas[0]);
      const fim = formatarDataInput(datas[datas.length - 1]);
      setClienteSelecionado("Todos");
      setDataInicio(inicio);
      setDataFim(fim);
      setMenuAtivo("clientes");
      atualizarDashboard(dadosProcessados, "Todos", inicio, fim);
      atualizarPortfolio(dadosProcessados, inicio, fim);
    });
  };

  // ==========================================
  // DATA
  // ==========================================
  const formatarDataInput = (data) => {
    if (!data) {
      return "";
    }
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  };

  // Versão segura sem caracteres especiais que quebram o compilador do chat
  const converterInputData = (valor) => {
    if (!valor) return null;
    const ano = valor.substring(0, 4);
    const mes = valor.substring(5, 7);
    const dia = valor.substring(8, 10);
    return new Date(Number(ano), Number(mes) - 1, Number(dia));
  };

  // ==========================================
  // DASHBOARD INDIVIDUAL
  // ==========================================
  const atualizarDashboard = (dadosOriginais, cliente, inicio, fim) => {
    if (!dadosOriginais || dadosOriginais.length === 0) {
      setDashboard(null);
      return;
    }
    let dadosFiltrados = [...dadosOriginais];
    if (cliente !== "Todos") {
      dadosFiltrados = dadosFiltrados.filter((item) => item.cliente === cliente);
    }
    const inicioData = converterInputData(inicio);
    const fimData = converterInputData(fim);
    if (inicioData && fimData && inicioData > fimData) {
      setDashboard(null);
      setMensagem("A data inicial não pode ser maior que a data final.");
      return;
    }
    let dadosPeriodo = [...dadosFiltrados];
    if (inicioData) {
      const mesInicio = obterMesReferencia(inicioData);
      dadosPeriodo = dadosPeriodo.filter((item) => item.mesReferencia >= mesInicio);
    }
    if (fimData) {
      const mesFim = obterMesReferencia(fimData);
      dadosPeriodo = dadosPeriodo.filter((item) => item.mesReferencia <= mesFim);
    }
    if (dadosPeriodo.length === 0) {
      setDashboard(null);
      setMensagem("Não existem dados para o cliente e período selecionados.");
      return;
    }
    const resultado = calcularDashboard(dadosFiltrados, inicioData, fimData);
    if (!resultado) {
      setDashboard(null);
      setMensagem("Não foi possível calcular os indicadores.");
      return;
    }
    setMensagem("");
    setDashboard(resultado);
  };

  // ==========================================
  // PORTFOLIO
  // ==========================================
  const atualizarPortfolio = (dadosOriginais, inicio, fim) => {
    if (!dadosOriginais || dadosOriginais.length === 0) {
      setPortfolio(null);
      return;
    }
    const inicioData = converterInputData(inicio);
    const fimData = converterInputData(fim);
    let dadosPeriodo = [...dadosOriginais];
    if (inicioData) {
      const mesInicio = obterMesReferencia(inicioData);
      dadosPeriodo = dadosPeriodo.filter((item) => item.mesReferencia >= mesInicio);
    }
    if (fimData) {
      const mesFim = obterMesReferencia(fimData);
      dadosPeriodo = dadosPeriodo.filter((item) => item.mesReferencia <= mesFim);
    }
    if (dadosPeriodo.length === 0) {
      setPortfolio(null);
      return;
    }
    const resultado = calcularPortfolio(dadosPeriodo);
    setPortfolio(resultado);
  };

  // ==========================================
  // FILTROS
  // ==========================================
  const handleClienteChange = (event) => {
    const cliente = event.target.value;
    setClienteSelecionado(cliente);
    atualizarDashboard(dados, cliente, dataInicio, dataFim);
  };

  const handleDataInicio = (event) => {
    const valor = event.target.value;
    setDataInicio(valor);
    atualizarDashboard(dados, clienteSelecionado, valor, dataFim);
    atualizarPortfolio(dados, valor, dataFim);
  };

  const handleDataFim = (event) => {
    const valor = event.target.value;
    setDataFim(valor);
    atualizarDashboard(dados, clienteSelecionado, dataInicio, valor);
    atualizarPortfolio(dados, dataInicio, valor);
  };

  const abrirCliente = (cliente) => {
    setClienteSelecionado(cliente);
    setVisao("poc");
    atualizarDashboard(dados, cliente, dataInicio, dataFim);
  };

  // ==========================================
  // CLIENTES
  // ==========================================
  const clientes = [
    "Todos",
    ...new Set(dados.map((item) => item.cliente).filter(Boolean)),
  ];

  // ==========================================
  // FORMATAÇÕES
  // ==========================================
  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor || 0);
  };

  const formatarNumero = (valor) => {
    return new Intl.NumberFormat("pt-BR").format(valor || 0);
  };

  const formatarPercentual = (valor) => {
    if (valor === null || valor === undefined) {
      return "N/A";
    }
    return `${Number(valor).toFixed(1)}%`;
  };

  // ==========================================
  // MENU LATERAL
  // ==========================================
  const irParaImportacao = () => {
    setMenuAtivo("importacao");
    const elemento = document.getElementById("lpc-importacao");
    if (elemento) {
      elemento.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const abrirClientesPoc = () => {
    setMenuAtivo("clientes");
    setVisao("poc");
    const elemento = document.getElementById("lpc-visoes");
    if (elemento) {
      elemento.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const abrirPainelPoc = () => {
    setMenuAtivo("painel");
    setVisao("clevel");
    const elemento = document.getElementById("lpc-visoes");
    if (elemento) {
      elemento.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const alternarIndicadores = () => {
    if (menuRecolhido) {
      setMenuRecolhido(false);
      setIndicadoresAbertos(true);
      return;
    }
    setIndicadoresAbertos((valor) => !valor);
  };

  // ==========================================
  // RENDER PRINCIPAL
  // ==========================================
  return (
    <div className={`lpc-app-shell ${menuRecolhido ? "sidebar-collapsed" : ""}`}>
      <header className="lpc-platform-header">
        <div className="lpc-platform-left">
          <button
            className="lpc-menu-toggle"
            onClick={() => setMenuRecolhido((valor) => !valor)}
            aria-label="Abrir ou recolher menu"
            title={menuRecolhido ? "Expandir menu" : "Recolher menu"}
          >
            ☰
          </button>
          <img
            src={logoLogShare}
            alt="LogShare"
            className="lpc-platform-logo"
          />
        </div>
        <div className="lpc-platform-center">
          <span className="lpc-breadcrumb">Dashboard</span>
          <span className="lpc-breadcrumb-separator">/</span>
          <strong>LPC</strong>
        </div>

        {/* CABEÇALHO COM OS NOVOS FILTROS SUPER ALINHADOS */}
        <div className="lpc-platform-right" style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          
          {/* FILTRO DE CLIENTE ESTILIZADO */}
          {visao === "poc" && dados.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "center", borderRight: "1px solid #e5e7eb", paddingRight: "24px", height: "40px" }}>
              <span style={{ fontSize: "11px", color: "#9ca3af", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px", lineHeight: "1" }}>
                Cliente
              </span>
              <select
                value={clienteSelecionado}
                onChange={handleClienteChange}
                style={{
                  appearance: "none",
                  backgroundColor: "transparent",
                  border: "none",
                  fontWeight: "950",
                  fontSize: "14px",
                  color: "#123B5D",
                  cursor: "pointer",
                  outline: "none",
                  padding: "0 16px 0 0",
                  margin: 0,
                  lineHeight: "1.2",
                  height: "20px",
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='%23123B5D'%3E%3Cpath d='M0 0l5 5 5-5z'/%3E%3C/svg%3E\")",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right center",
                  textAlign: "right"
                }}
              >
                {clientes.map((cliente) => (
                  <option key={cliente} value={cliente}>
                    {cliente}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* FILTRO DE PERÍODO */}
          <div className="lpc-period" style={{ position: "relative", height: "40px", display: "flex", alignItems: "center" }}>
            <div 
              onClick={() => setMostrarCalendario(!mostrarCalendario)}
              style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "center", height: "100%" }}
            >
              <span style={{ fontSize: "11px", color: "#9ca3af", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px", lineHeight: "1" }}>
                Período ▾
              </span>
              <strong style={{ color: "#111827", fontSize: "14px", margin: 0, padding: 0, lineHeight: "1.2", height: "20px", display: "block" }}>
                {dataInicio && dataFim
                  ? `${dataInicio.substring(8,10)}/${dataInicio.substring(5,7)}/${dataInicio.substring(0,4)} a ${dataFim.substring(8,10)}/${dataFim.substring(5,7)}/${dataFim.substring(0,4)}`
                  : "Aguardando dados"}
              </strong>
            </div>

            {mostrarCalendario && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: "12px",
                  backgroundColor: "#ffffff",
                  padding: "20px",
                  borderRadius: "12px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                  border: "1px solid #f3f4f6",
                  zIndex: 1000,
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  minWidth: "240px",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "bold", color: "#374151" }}>Data de Início</label>
                  <input
                    type="date"
                    value={dataInicio}
                    onChange={handleDataInicio}
                    style={{ padding: "10px", border: "1px solid #e5e7eb", borderRadius: "8px", outline: "none" }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "bold", color: "#374151" }}>Data Final</label>
                  <input
                    type="date"
                    value={dataFim}
                    onChange={handleDataFim}
                    style={{ padding: "10px", border: "1px solid #e5e7eb", borderRadius: "8px", outline: "none" }}
                  />
                </div>
                <button
                  onClick={() => setMostrarCalendario(false)}
                  style={{ marginTop: "4px", padding: "10px", backgroundColor: "#123B5D", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
                >
                  Aplicar Filtro
                </button>
              </div>
            )}
          </div>

          <button className="lpc-header-action" aria-label="Notificações">
            ◧
            <i>1</i>
          </button>
          <div className="lpc-user-placeholder" aria-hidden="true">
            ●
          </div>
        </div>
      </header>

      <div className="lpc-platform-body">
        <aside className="lpc-sidebar">
          <nav className="lpc-sidebar-nav" aria-label="Navegação LPC">
            <button
              type="button"
              className={`lpc-sidebar-item ${menuAtivo === "importacao" ? "active" : ""}`}
              onClick={irParaImportacao}
              title={menuRecolhido ? "Importar dados da POC" : ""}
            >
              <span className="lpc-sidebar-icon">⇧</span>
              {!menuRecolhido && (
                <span className="lpc-sidebar-label">Importação</span>
              )}
            </button>
            <button
              type="button"
              className={`lpc-sidebar-item ${["clientes", "painel"].includes(menuAtivo) ? "active" : ""}`}
              onClick={alternarIndicadores}
              title={menuRecolhido ? "Indicadores" : ""}
            >
              <span className="lpc-sidebar-icon">▦</span>
              {!menuRecolhido && (
                <span className="lpc-sidebar-label">Indicadores</span>
              )}
              {!menuRecolhido && (
                <span className="lpc-sidebar-arrow">{indicadoresAbertos ? "⌃" : "⌄"}</span>
              )}
            </button>
            {!menuRecolhido && indicadoresAbertos && (
              <div className="lpc-sidebar-submenu">
                <button
                  type="button"
                  className={`lpc-sidebar-subitem ${menuAtivo === "clientes" ? "active" : ""}`}
                  onClick={abrirClientesPoc}
                >
                  <span className="lpc-subitem-icon">●</span>
                  <span>Clientes em POC</span>
                </button>
                <button
                  type="button"
                  className={`lpc-sidebar-subitem ${menuAtivo === "painel" ? "active" : ""}`}
                  onClick={abrirPainelPoc}
                >
                  <span className="lpc-subitem-icon">▥</span>
                  <span>Painel de POC</span>
                </button>
              </div>
            )}
          </nav>
        </aside>
        <main className="lpc-main">
          {menuAtivo === "importacao" && (
            <div id="lpc-importacao">
              <Section title="Importar dados da POC">
                <p style={{ color: "#6b7280", marginTop: 0 }}>
                  Selecione a planilha Excel utilizada para acompanhamento das POCs.
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFile}
                />
              </Section>
            </div>
          )}

          {mensagem && (
            <div
              style={{
                backgroundColor: "#fff7ed",
                border: "1px solid #fed7aa",
                borderRadius: "10px",
                padding: "18px",
                marginBottom: "24px",
                color: "#9a3412",
              }}
            >
              <strong>Atenção:</strong>
              <div style={{ marginTop: "6px" }}>{mensagem}</div>
            </div>
          )}
          {visao === "poc" && dashboard && (
            <VisaoPoc
              dashboard={dashboard}
              formatarMoeda={formatarMoeda}
              formatarNumero={formatarNumero}
              formatarPercentual={formatarPercentual}
            />
          )}
          {visao === "clevel" && portfolio && (
            <VisaoCLevel
              portfolio={portfolio}
              formatarMoeda={formatarMoeda}
              formatarNumero={formatarNumero}
              formatarPercentual={formatarPercentual}
              abrirCliente={abrirCliente}
            />
          )}
        </main>
      </div>
      <footer className="lpc-footer">
        <div className="lpc-footer-brand">
          <img src={logoLogShare} alt="LogShare" />
        </div>
        <div>
          LogShare Performance Center — Transformando dados em performance.
        </div>
        <div className="lpc-footer-version">Versão 1.0.0</div>
      </footer>
    </div>
  );
}

// ==========================================
// ITEM DO MENU LATERAL
// ==========================================
function SidebarItem({ icon, label, collapsed, active = false, expandable = false }) {
  return (
    <button
      className={`lpc-sidebar-item ${active ? "active" : ""}`}
      title={collapsed ? label : ""}
      type="button"
    >
      <span className="lpc-sidebar-icon">{icon}</span>
      {!collapsed && <span className="lpc-sidebar-label">{label}</span>}
      {!collapsed && expandable && <span className="lpc-sidebar-arrow">⌄</span>}
    </button>
  );
}

// ==========================================
// VISÃO DA POC
// ==========================================
function VisaoPoc({ dashboard, formatarMoeda, formatarNumero, formatarPercentual }) {
  return (
    <>
      <Section title="Avaliação Executiva da POC">
        <ResumoExecutivo dashboard={dashboard} />
      </Section>
      <Section title="KPIs Estratégicos da POC | GO ≥80% | ACOMPANHAR 60–79% | NO-GO <60%">
        <div className="lpc-strategic-kpi-grid">
          <StrategicScorePanel score={dashboard.score} status={dashboard.statusScore} />
          {Object.values(dashboard.indicadoresScore || {}).map((item) => (
            <StrategicKpiCard key={item.nome} item={item} />
          ))}
        </div>
      </Section>
      <Section title="Evolução do Score">
        <HistoricoScore historico={dashboard.historicoScore || []} />
      </Section>
      <Section title="Indicadores da Malha">
        <Grid>
          <KpiCard titulo="Rotas Totais" valor={formatarNumero(dashboard.rotasTotais)} />
          <KpiCard titulo="Rotas Disponibilizadas" valor={formatarNumero(dashboard.rotasDisponibilizadas)} />
          <KpiCard titulo="Rotas com Sinergia" valor={formatarNumero(dashboard.rotasSinergia)} />
          <KpiCard titulo="Oportunidades" valor={formatarNumero(dashboard.oportunidades)} />
        </Grid>
      </Section>
      <Section title="Operação">
        <Grid>
          <KpiCard titulo="Rotas Executadas" valor={formatarNumero(dashboard.rotasExecutadas)} />
          <KpiCard titulo="Embarques Planejados" valor={formatarNumero(dashboard.embarquesPlanejados)} />
          <KpiCard titulo="Embarques Realizados" valor={formatarNumero(dashboard.embarquesRealizados)} />
          <KpiCard titulo="Usuários Ativos" valor={formatarNumero(dashboard.usuariosAtivos)} />
        </Grid>
      </Section>
      <Section title="Financeiro">
        <Grid>
          <KpiCard titulo="Baseline" valor={formatarMoeda(dashboard.baseline)} />
          <KpiCard titulo="Custo LogShare" valor={formatarMoeda(dashboard.realizado)} />
          <KpiCard titulo="Saving" valor={formatarMoeda(dashboard.saving)} />
          <KpiCard titulo="ROI" valor={dashboard.roi === null ? "N/A" : formatarPercentual(dashboard.roi)} />
        </Grid>
      </Section>
      <Section title="Sustentabilidade">
        <Grid>
          <KpiCard titulo="CO₂ Evitado" valor={`${formatarNumero(dashboard.co2)} kg`} />
          <KpiCard titulo="Árvores" valor={formatarNumero(dashboard.arvores)} />
          <KpiCard titulo="Campos de Futebol" valor={formatarNumero(dashboard.camposFutebol)} />
        </Grid>
      </Section>
    </>
  );
}

// ==========================================
// VISÃO C-LEVEL
// ==========================================
function VisaoCLevel({ portfolio, formatarMoeda, formatarNumero, formatarPercentual, abrirCliente }) {
  return (
    <>
      <div className="lpc-summary-grid">
        <ExecutiveSummaryCard icone="users" titulo="POCs Ativas" valor={portfolio.totalPocs} detalhe="Em andamento" cor="#159ca6" fundo="#eaf8f9" />
        <ExecutiveSummaryCard icone="target" titulo="Score Médio" valor={Number(portfolio.scoreMedio).toFixed(1)} detalhe="Performance geral" cor="#1557b0" fundo="#edf3ff" />
        <ExecutiveSummaryCard icone="arrow-up" titulo="Em Evolução" valor={portfolio.emEvolucao} detalhe="Melhorando" cor="#16a34a" fundo="#eef9f0" />
        <ExecutiveSummaryCard icone="arrow-down" titulo="Em Queda" valor={portfolio.emQueda} detalhe="Piorando" cor="#dc2626" fundo="#fff0f1" />
        <ExecutiveSummaryCard icone="alert" titulo="Em Acompanhamento" valor={portfolio.acompanhamento} detalhe="Atenção necessária" cor="#d97706" fundo="#fff8e8" />
      </div>
      <Section title="Acompanhamento das POCs">
        <div className="lpc-client-grid">
          {portfolio.pocs.map((poc) => (
            <PocExecutiveCard key={poc.cliente} poc={poc} formatarPercentual={formatarPercentual} abrirCliente={abrirCliente} />
          ))}
        </div>
      </Section>
      <Section title="Consolidado Financeiro">
        <Grid>
          <KpiCard titulo="Baseline" valor={formatarMoeda(portfolio.baselineTotal)} />
          <KpiCard titulo="Custo Realizado" valor={formatarMoeda(portfolio.realizadoTotal)} />
          <KpiCard titulo="Saving Total" valor={formatarMoeda(portfolio.savingTotal)} />
          <KpiCard titulo="ROI Consolidado" valor={portfolio.roiMedio === null ? "N/A" : formatarPercentual(portfolio.roiMedio)} />
        </Grid>
      </Section>
      <Section title="Consolidado de Sustentabilidade">
        <Grid>
          <KpiCard titulo="CO₂ Evitado" valor={`${formatarNumero(portfolio.co2Total)} kg`} />
          <KpiCard titulo="Árvores" valor={formatarNumero(portfolio.arvoresTotal)} />
          <KpiCard titulo="Campos de Futebol" valor={formatarNumero(portfolio.camposFutebolTotal)} />
        </Grid>
      </Section>
    </>
  );
}

// ==========================================
// CARD EXECUTIVO DA POC (PADRONIZADO)
// ==========================================
function PocExecutiveCard({ poc, formatarPercentual, abrirCliente }) {
  const score = Number(poc.score || 0);
  const variacao = poc.variacaoScore;

  let corScore = "#dc2626";
  if (score >= 80) corScore = "#16a34a";
  else if (score >= 60) corScore = "#d97706";

  let tendenciaTexto = "Sem histórico";
  let tendenciaCor = "#6b7280";
  if (poc.tendencia === "melhorando") { tendenciaTexto = "Em evolução"; tendenciaCor = "#16a34a"; }
  else if (poc.tendencia === "piorando") { tendenciaTexto = "Em queda"; tendenciaCor = "#dc2626"; }
  else if (poc.tendencia === "estavel") { tendenciaTexto = "Estável"; tendenciaCor = "#d97706"; }

  let recomendacaoCor = "#dc2626";
  let bgRecomendacao = "#fef2f2";
  if (poc.recomendacao === "GO") { recomendacaoCor = "#16a34a"; bgRecomendacao = "#f0fdf4"; }
  else if (poc.recomendacao === "GO COM ACOMPANHAMENTO") { recomendacaoCor = "#d97706"; bgRecomendacao = "#fffbeb"; }

  const atencao = poc.principalAtencao;

  return (
    <div 
      className="lpc-poc-card" 
      onClick={() => abrirCliente(poc.cliente)} 
      style={{ 
        backgroundColor: "#ffffff", 
        padding: "24px", 
        borderRadius: "16px", 
        border: "1px solid #f3f4f6",
        borderTop: `6px solid ${corScore}`, 
        boxShadow: "0 4px 12px rgba(0,0,0,0.03)", 
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: "100%"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div style={{ fontSize: "18px", fontWeight: "bold", color: "#111827" }}>{poc.cliente}</div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "11px", color: "#6b7280", fontWeight: "bold", letterSpacing: "0.5px" }}>SCORE</div>
          <div style={{ fontSize: "28px", fontWeight: "900", color: corScore, lineHeight: "1" }}>{score.toFixed(1)}</div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px", padding: "12px 16px", backgroundColor: "#f9fafb", borderRadius: "12px" }}>
        <div style={{ fontWeight: "bold", color: tendenciaCor, fontSize: "14px" }}>
          {variacao === null ? "N/A" : `${variacao >= 0 ? "+" : ""}${variacao.toFixed(1)} pts`}
        </div>
        <div style={{ marginLeft: "auto", fontWeight: "600", color: tendenciaCor, fontSize: "13px" }}>{tendenciaTexto}</div>
      </div>

      <div style={{ marginBottom: "20px", padding: "16px", backgroundColor: bgRecomendacao, borderRadius: "12px" }}>
        <div style={{ fontSize: "11px", color: recomendacaoCor, marginBottom: "4px", fontWeight: "bold", textTransform: "uppercase" }}>RECOMENDAÇÃO</div>
        <div style={{ fontWeight: "900", color: recomendacaoCor, fontSize: "14px" }}>
          {poc.recomendacao}
        </div>
      </div>
      
      <div style={{ marginTop: "auto", fontSize: "13px", color: "#2563eb", textAlign: "right", fontWeight: "600" }}>
        Ver detalhes da POC →
      </div>
    </div>
  );
}

// ==========================================
// ÍCONES DOS CARDS INTERNOS DA POC
// ==========================================
function PocIcon({ tipo }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  if (tipo === "check") return <svg {...common}><path d="m5 12 4 4L19 6" /></svg>;
  if (tipo === "warning" || tipo === "attention") return <svg {...common}><path d="M10.3 3.9 2.5 17.5A1.8 1.8 0 0 0 4 20.2h16a1.8 1.8 0 0 0 1.5-2.7L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>;
  if (tipo === "close") return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6" /><path d="m15 9-6 6" /></svg>;
  if (tipo === "trend-down") return <svg {...common}><path d="M3 6v15h15" /><path d="m7 10 4 4 4-4 5 5" /><path d="M16 19h4v-4" /></svg>;
  if (tipo === "trend-flat") return <svg {...common}><path d="M4 12h16" /><path d="m16 8 4 4-4 4" /></svg>;
  if (tipo === "trend-up") return <svg {...common}><path d="M4 16 9 11l4 3 7-8" /><path d="M15 6h5v5" /></svg>;
  if (tipo === "review") return <svg {...common}><path d="M4 5h16v12H7l-3 3V5Z" /><path d="M8 9h8" /><path d="M8 13h5" /></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="9" /></svg>;
}

// ==========================================
// INDICADOR COUNT
// ==========================================
function IndicatorCount({ numero, label, cor, fundo, icone }) {
  return (
    <div className="lpc-indicator-count" style={{ backgroundColor: "#fbfcfd" }}>
      <div className="lpc-indicator-icon" style={{ color: cor }} aria-hidden="true"><PocIcon tipo={icone} /></div>
      <div className="lpc-indicator-number" style={{ fontWeight: "bold", color: cor }}>{numero}</div>
      <div className="lpc-indicator-label" style={{ color: "#667085" }}>{label}</div>
    </div>
  );
}

// ==========================================
// RESUMO EXECUTIVO (MODERNIZADO E RESPONSIVO)
// ==========================================
function ResumoExecutivo({ dashboard }) {
  const historico = dashboard.historicoScore || [];
  const scoreAtual = Number(dashboard.score || 0);
  let scoreAnterior = null;

  if (historico.length >= 2) {
    scoreAnterior = Number(historico[historico.length - 2].score || 0);
  }

  const variacao = scoreAnterior === null ? null : scoreAtual - scoreAnterior;
  let tendencia = "Estável";
  let corTendencia = "#6b7280";

  if (variacao !== null) {
    if (variacao > 1) {
      tendencia = "Em evolução";
      corTendencia = "#16a34a";
    } else if (variacao < -1) {
      tendencia = "Em queda";
      corTendencia = "#dc2626";
    }
  }

  const indicadores = Object.values(dashboard.indicadoresScore || {});
  const verdes = indicadores.filter((item) => item.status === "verde").length;
  const amarelos = indicadores.filter((item) => item.status === "amarelo").length;
  const vermelhos = indicadores.filter((item) => item.status === "vermelho").length;
  const indicadoresValidos = indicadores.filter((item) => item.atingimento !== null && item.status !== "na");

  let melhorIndicador = null;
  if (indicadoresValidos.length > 0) {
    melhorIndicador = [...indicadoresValidos].sort((a, b) => b.atingimento - a.atingimento)[0];
  }

  let pontoAtencao = null;
  if (dashboard.pontosAtencao?.length > 0) {
    pontoAtencao = dashboard.pontosAtencao[0];
  }

  let recomendacao = "REVISAR";
  let corRecomendacao = "#dc2626";
  let bgRecomendacao = "#fef2f2";

  if (scoreAtual >= 80 && vermelhos === 0) {
    recomendacao = "GO";
    corRecomendacao = "#16a34a";
    bgRecomendacao = "#f0fdf4";
  } else if (scoreAtual >= 60) {
    recomendacao = "GO COM ACOMPANHAMENTO";
    corRecomendacao = "#d97706";
    bgRecomendacao = "#fffbeb";
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* GRID SUPERIOR: RESPONSIVO (Auto-fit) E MODERNO */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        
        {/* CARD PRINCIPAL (SCORE) */}
        <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", border: "1px solid #f3f4f6", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
          <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "6px", backgroundColor: corRecomendacao }} />
          <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: "700", letterSpacing: "1px", marginTop: "8px" }}>SCORE DA POC</div>
          <div style={{ fontSize: "56px", fontWeight: "900", color: corRecomendacao, margin: "8px 0", lineHeight: "1" }}>{scoreAtual.toFixed(1)}</div>
          <div style={{ backgroundColor: bgRecomendacao, color: corRecomendacao, padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" }}>
            {dashboard.statusScore?.status || "Em avaliação"}
          </div>
        </div>

        <ExecutiveCard titulo="Variação" valor={variacao === null ? "N/A" : `${variacao >= 0 ? "+" : ""}${variacao.toFixed(1)} pts`} detalhe={scoreAnterior === null ? "Sem mês anterior" : `Anterior: ${scoreAnterior.toFixed(1)}`} cor={corTendencia} />
        <ExecutiveCard titulo="Tendência" valor={tendencia} detalhe="Comparação com mês anterior" cor={corTendencia} />
        <ExecutiveCard titulo="Melhor indicador" valor={melhorIndicador?.nome || "N/A"} detalhe={melhorIndicador ? `Atingimento: ${Number(melhorIndicador.atingimento).toFixed(1)}%` : ""} cor="#16a34a" />
        <ExecutiveCard titulo="Recomendação" valor={recomendacao} detalhe={`${verdes} dentro • ${amarelos} atenção • ${vermelhos} abaixo`} cor={corRecomendacao} />
      </div>

      {/* GRID INFERIOR (DESTAQUES E ATENÇÃO) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
        <div style={{ padding: "24px", backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #f3f4f6", borderLeft: "6px solid #16a34a", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <div style={{ backgroundColor: "#f0fdf4", color: "#166534", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold" }}>DESTAQUE POSITIVO</div>
          </div>
          <div style={{ fontSize: "20px", fontWeight: "bold", color: "#111827", marginBottom: "6px" }}>{melhorIndicador?.nome || "N/A"}</div>
          <div style={{ color: "#4b5563", fontSize: "14px" }}>
            {melhorIndicador ? `Atingimento excepcional de ${Number(melhorIndicador.atingimento).toFixed(1)}%` : "Sem dados para exibir."}
          </div>
        </div>

        <div style={{ padding: "24px", backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #f3f4f6", borderLeft: "6px solid #dc2626", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <div style={{ backgroundColor: "#fef2f2", color: "#991b1b", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold" }}>PONTO DE ATENÇÃO</div>
          </div>
          <div style={{ fontSize: "20px", fontWeight: "bold", color: "#111827", marginBottom: "6px" }}>{pontoAtencao?.nome || "Nenhum indicador crítico"}</div>
          {pontoAtencao && (
            <div style={{ color: "#4b5563", fontSize: "14px" }}>
              Resultado atual: <strong style={{ color: "#dc2626" }}>{formatarResultado(pontoAtencao)}</strong> <br/> 
              Meta esperada: <strong>{formatarMeta(pontoAtencao)}</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// HISTÓRICO SCORE
// ==========================================
function HistoricoScore({ historico }) {
  if (!historico || historico.length === 0) {
    return (
      <div style={{ padding: "30px", textAlign: "center", color: "#6b7280", backgroundColor: "#f9fafb", borderRadius: "10px" }}>
        Não existem dados históricos.
      </div>
    );
  }
  const maiorScore = Math.max(100, ...historico.map((item) => Number(item.score || 0)));
  return (
    <div className="lpc-history">
      <div className="lpc-history-chart">
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-around", height: "260px", gap: "20px" }}>
          {historico.map((item) => {
            const score = Number(item.score || 0);
            const altura = Math.max(8, (score / maiorScore) * 200);
            const cor = score >= 80 ? "#16a34a" : score >= 60 ? "#d97706" : "#dc2626";
            return (
              <div className="lpc-history-bar-wrap" key={item.mesReferencia}>
                <div className="lpc-history-score" style={{ color: cor }}>{score.toFixed(1)}</div>
                <div className="lpc-history-bar" style={{ height: `${altura}px`, backgroundColor: cor }} />
                <div className="lpc-history-month">{formatarMes(item.mesReferencia)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// PAINEL ESTRATÉGICO DOS KPIs (Gráfico Circular)
// ==========================================
function StrategicScorePanel({ score, status }) {
  const valor = Number(score || 0);
  let cor = "#dc2626";
  let leitura = "NO-GO";
  let faixa = "< 60%";
  if (valor >= 80) { cor = "#16a34a"; leitura = "GO"; faixa = "≥ 80%"; }
  else if (valor >= 60) { cor = "#d97706"; leitura = "ACOMPANHAR"; faixa = "60% – 79%"; }
  
  return (
    <div style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #f3f4f6", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: "700", letterSpacing: "1px", marginBottom: "16px" }}>DESEMPENHO GERAL</div>
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: "120px", height: "120px", borderRadius: "50%", border: `8px solid ${cor}33`, borderTopColor: cor }}>
        <div style={{ fontSize: "32px", fontWeight: "900", color: "#111827" }}>{valor.toFixed(0)}%</div>
      </div>
      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <div style={{ fontWeight: "900", color: cor, fontSize: "18px" }}>{leitura}</div>
        <div style={{ fontSize: "13px", color: "#9ca3af", fontWeight: "500", marginTop: "4px" }}>{faixa}</div>
      </div>
    </div>
  );
}

function StrategicKpiIcon({ nome }) {
  const chave = String(nome || "").toLowerCase();
  let simbolo = "◆";
  if (chave.includes("utiliza")) simbolo = "♟";
  else if (chave.includes("cobertura")) simbolo = "⌖";
  else if (chave.includes("oportunidade")) simbolo = "◎";
  else if (chave.includes("convers")) simbolo = "▼";
  else if (chave.includes("aderência") || chave.includes("aderencia")) simbolo = "✓";
  else if (chave.includes("volume")) simbolo = "▣";
  else if (chave.includes("on time")) simbolo = "◷";
  else if (chave.includes("cronograma")) simbolo = "◫";
  else if (chave.includes("roi")) simbolo = "$";
  return <div className="lpc-strategic-kpi-icon" aria-hidden="true">{simbolo}</div>;
}

// ==========================================
// KPI ESTRATÉGICO CARD (LISTA DE INDICADORES PADRONIZADO)
// ==========================================
function StrategicKpiCard({ item }) {
  let cor = "#dc2626";
  let bgCor = "#fef2f2";
  let statusLabel = "Abaixo da meta";
  if (item.status === "verde") { cor = "#16a34a"; bgCor = "#f0fdf4"; statusLabel = "Atingiu meta"; }
  else if (item.status === "amarelo") { cor = "#d97706"; bgCor = "#fffbeb"; statusLabel = "Atenção"; }
  else if (item.status === "na") { cor = "#6b7280"; bgCor = "#f3f4f6"; statusLabel = "N/A"; }
  
  const atingimento = item.atingimento === null || item.atingimento === undefined ? "N/A" : `${Number(item.atingimento).toFixed(1)}%`;
  
  return (
    <div style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #f3f4f6", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div>
        <div style={{ fontSize: "15px", fontWeight: "800", color: "#111827", marginBottom: "4px" }}>{item.nome}</div>
        <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: "500", marginBottom: "16px" }}>Peso do KPI: {Number(item.pesoEfetivo || 0).toFixed(0)}%</div>
      </div>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "16px", paddingBottom: "16px", borderBottom: "1px solid #f3f4f6" }}>
        <div>
          <div style={{ fontSize: "11px", color: "#9ca3af", fontWeight: "bold", textTransform: "uppercase" }}>Resultado</div>
          <div style={{ fontSize: "20px", fontWeight: "900", color: "#111827" }}>{formatarResultado(item)}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "11px", color: "#9ca3af", fontWeight: "bold", textTransform: "uppercase" }}>Meta</div>
          <div style={{ fontSize: "16px", fontWeight: "700", color: "#4b5563" }}>{formatarMeta(item)}</div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ backgroundColor: bgCor, color: cor, padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold" }}>
          {statusLabel}
        </div>
        <div style={{ fontSize: "13px", fontWeight: "700", color: cor }}>
          Atingiu: {atingimento}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// SCORE KPI
// ==========================================
function ScoreKpi({ item }) {
  let cor = "#dc2626";
  if (item.status === "verde") cor = "#16a34a";
  else if (item.status === "amarelo") cor = "#d97706";
  else if (item.status === "na") cor = "#6b7280";
  return (
    <div className="lpc-score-kpi" style={{ borderTop: `4px solid ${cor}` }}>
      <div className="lpc-score-kpi-title">{item.nome}</div>
      <div style={scoreLine}><span style={scoreLabel}>Resultado</span><strong>{formatarResultado(item)}</strong></div>
      <div style={scoreLine}><span style={scoreLabel}>Meta</span><strong>{formatarMeta(item)}</strong></div>
      <div style={scoreLine}><span style={scoreLabel}>Atingimento</span><strong style={{ color: cor }}>{item.atingimento === null ? "N/A" : `${Number(item.atingimento).toFixed(1)}%`}</strong></div>
      <div style={scoreLine}><span style={scoreLabel}>Peso</span><strong>{Number(item.pesoEfetivo).toFixed(2)}%</strong></div>
      <div style={{ ...scoreLine, paddingTop: "12px", marginTop: "8px", borderTop: "1px solid #e5e7eb" }}>
        <span style={{ color: "#123B5D", fontWeight: "bold" }}>Contribuição</span>
        <strong style={{ fontSize: "18px", color: cor }}>{item.contribuicao === null ? "N/A" : `+${Number(item.contribuicao).toFixed(2)} pts`}</strong>
      </div>
      <div style={{ marginTop: "12px", fontSize: "12px", fontWeight: "bold", color: cor }}>
        {item.status === "verde" ? "✓ Dentro da meta" : item.status === "amarelo" ? "⚠ Atenção" : item.status === "na" ? "— Não aplicável" : "✕ Abaixo da meta"}
      </div>
    </div>
  );
}

// ==========================================
// EXECUTIVE CARD (MODERNIZADO)
// ==========================================
function ExecutiveCard({ titulo, valor, detalhe, cor }) {
  return (
    <div style={{ backgroundColor: "#ffffff", padding: "20px", borderRadius: "16px", border: "1px solid #f3f4f6", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
        <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: cor }} />
        <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600", textTransform: "uppercase" }}>{titulo}</div>
      </div>
      <div style={{ fontSize: "24px", fontWeight: "bold", color: "#111827", marginBottom: "6px" }}>{valor}</div>
      <div style={{ fontSize: "13px", color: "#9ca3af" }}>{detalhe}</div>
    </div>
  );
}

// ==========================================
// RESUMO C-LEVEL (Cards do Topo - Padronizado)
// ==========================================
function ExecutiveSummaryCard({ icone, titulo, valor, detalhe, cor = "#123B5D", fundo = "#edf3f8" }) {
  return (
    <div style={{ backgroundColor: "#ffffff", padding: "20px", borderRadius: "16px", border: "1px solid #f3f4f6", borderBottom: `4px solid ${cor}`, boxShadow: "0 4px 12px rgba(0,0,0,0.03)", display: "flex", alignItems: "center", gap: "16px" }}>
      <div style={{ color: cor, backgroundColor: fundo, width: "48px", height: "48px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <SummaryIcon tipo={icone} />
      </div>
      <div>
        <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>{titulo}</div>
        <div style={{ fontSize: "24px", fontWeight: "900", color: "#111827", margin: "2px 0" }}>{valor}</div>
        <div style={{ fontSize: "13px", color: "#9ca3af", fontWeight: "500" }}>{detalhe}</div>
      </div>
    </div>
  );
}

// ==========================================
// ÍCONES DOS CARDS RESUMO
// ==========================================
function SummaryIcon({ tipo }) {
  const common = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  if (tipo === "users") return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
  if (tipo === "target") return <svg {...common}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" /></svg>;
  if (tipo === "arrow-up") return <svg {...common}><path d="M12 19V5" /><path d="m6 11 6-6 6 6" /></svg>;
  if (tipo === "arrow-down") return <svg {...common}><path d="M12 5v14" /><path d="m18 13-6 6-6-6" /></svg>;
  return <svg {...common}><path d="M10.3 3.2 2.8 16.1a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.2a2 2 0 0 0-3.4 0Z" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>;
}

// ==========================================
// SECTION
// ==========================================
function Section({ title, children }) {
  return (
    <section className="lpc-section">
      <h2 className="lpc-section-title">{title}</h2>
      {children}
    </section>
  );
}

// ==========================================
// FILTER
// ==========================================
function Filter({ label, children }) {
  return (
    <div className="lpc-filter">
      <label className="lpc-filter-label">{label}</label>
      {children}
    </div>
  );
}

// ==========================================
// GRID
// ==========================================
function Grid({ children }) {
  return <div className="lpc-grid">{children}</div>;
}

// ==========================================
// KPI CARD (OPERACIONAIS E FINANCEIROS PADRONIZADOS)
// ==========================================
function KpiCard({ titulo, valor }) {
  return (
    <div style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #f3f4f6", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
      <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>{titulo}</div>
      <div style={{ fontSize: "28px", fontWeight: "900", color: "#111827" }}>{valor}</div>
    </div>
  );
}

// ==========================================
// FORMATAR RESULTADO
// ==========================================
function formatarResultado(item) {
  if (item?.resultado === null || item?.resultado === undefined) return "N/A";
  if (item.unidade === "%") return `${Number(item.resultado).toFixed(1)}%`;
  if (item.unidade === "dias") return `${Number(item.resultado).toFixed(0)} dias`;
  return `${Number(item.resultado).toFixed(0)} ${item.unidade || ""}`;
}

// ==========================================
// FORMATAR META
// ==========================================
function formatarMeta(item) {
  if (item?.meta === null || item?.meta === undefined) return "N/A";
  if (item.tipo === "menor") {
    if (item.unidade === "dias") return `≤ ${item.meta} dias`;
    return `≤ ${item.meta}${item.unidade || ""}`;
  }
  return `≥ ${item.meta}${item.unidade || ""}`;
}

// ==========================================
// FORMATAR MÊS (Versão segura sem chaves ou colchetes complexos)
// ==========================================
function formatarMes(referencia) {
  if (!referencia) {
    return "";
  }
  const ano = referencia.substring(0, 4);
  const mesNumero = Number(referencia.substring(5, 7));
  const nomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  
  const mesNome = nomes.slice(mesNumero - 1, mesNumero).join("");
  const anoFinal = ano.substring(2, 4);
  return `${mesNome}/${anoFinal}`;
}

// ==========================================
// REFERÊNCIA MENSAL
// ==========================================
function obterMesReferencia(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  return `${ano}-${mes}`;
}

// ==========================================
// ESTILOS
// ==========================================
const inputStyle = { padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", backgroundColor: "#ffffff" };
const buttonActive = { padding: "11px 20px", border: "none", borderRadius: "7px", backgroundColor: "#123B5D", color: "#ffffff", fontWeight: "bold", cursor: "pointer" };
const buttonInactive = { padding: "11px 20px", border: "1px solid #d1d5db", borderRadius: "7px", backgroundColor: "#ffffff", color: "#374151", fontWeight: "bold", cursor: "pointer" };
const scoreLine = { display: "flex", justifyContent: "space-between", marginBottom: "8px" };
const scoreLabel = { color: "#6b7280", fontSize: "13px" };

// ==========================================
// EXPORT
// ==========================================
export default App;
