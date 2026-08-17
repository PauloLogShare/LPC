import { useState } from "react";
import logoLogShare from "./assets/logshare-logo.png";
import "./App.css";

import { readExcel } from "./services/excelService";
import { processarDados } from "./utils/dataProcessor";
import { calcularDashboard } from "./utils/dashboardEngine";
import { calcularPortfolio } from "./utils/portfolioEngine";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Bar, FunnelChart, Funnel, LabelList, Cell, Legend } from "recharts";

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
  // IMPORTAÇÃO E CÁLCULO DE PERÍODO (CORRIGIDO)
  // ==========================================
  const handleFile = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    readExcel(file, (dadosLidos) => {
      const dadosProcessados = processarDados(dadosLidos);
      setDados(dadosProcessados);
      
      if (dadosProcessados.length === 0) {
        setDashboard(null);
        setPortfolio(null);
        setMensagem("Nenhum dado válido encontrado no arquivo.");
        return;
      }
      
      // Mapeia todas as referências (ex: "2025-08") e as ordena
      const mesesReferencia = dadosProcessados.map(item => item.mesReferencia).filter(Boolean).sort();
      let inicio = "";
      let fim = "";

      if (mesesReferencia.length > 0) {
        const primeiroMes = mesesReferencia[0];
        const ultimoMes = mesesReferencia[mesesReferencia.length - 1];

        inicio = `${primeiroMes}-01`;
        const anoFim = Number(ultimoMes.substring(0, 4));
        const mesFimNumero = Number(ultimoMes.substring(5, 7));
        const ultimoDia = new Date(anoFim, mesFimNumero, 0).getDate();
        fim = `${ultimoMes}-${String(ultimoDia).padStart(2, '0')}`;
      }

      setClienteSelecionado("Todos");
      setDataInicio(inicio);
      setDataFim(fim);
      setMenuAtivo("clientes");
      
      atualizarDashboard(dadosProcessados, "Todos", inicio, fim);
      atualizarPortfolio(dadosProcessados, inicio, fim);
    });
  };

  const converterInputData = (valor) => {
    if (!valor) return null;
    const ano = valor.substring(0, 4);
    const mes = valor.substring(5, 7);
    const dia = valor.substring(8, 10);
    return new Date(Number(ano), Number(mes) - 1, Number(dia));
  };

  const atualizarDashboard = (dadosOriginais, cliente, inicio, fim) => {
    if (!dadosOriginais || dadosOriginais.length === 0) { setDashboard(null); return; }
    let dadosFiltrados = [...dadosOriginais];
    if (cliente !== "Todos") dadosFiltrados = dadosFiltrados.filter(i => i.cliente === cliente);
    
    const inicioData = converterInputData(inicio);
    const fimData = converterInputData(fim);
    if (inicioData && fimData && inicioData > fimData) { setDashboard(null); setMensagem("A data inicial não pode ser maior que a final."); return; }
    
    let dadosPeriodo = [...dadosFiltrados];
    if (inicioData) dadosPeriodo = dadosPeriodo.filter(i => i.mesReferencia >= obterMesReferencia(inicioData));
    if (fimData) dadosPeriodo = dadosPeriodo.filter(i => i.mesReferencia <= obterMesReferencia(fimData));
    
    if (dadosPeriodo.length === 0) { setDashboard(null); setMensagem("Não existem dados para o cliente e período selecionados."); return; }
    
    const resultado = calcularDashboard(dadosFiltrados, inicioData, fimData);
    if (!resultado) { setDashboard(null); setMensagem("Não foi possível calcular os indicadores."); return; }
    
    setMensagem("");
    setDashboard(resultado);
  };

  const atualizarPortfolio = (dadosOriginais, inicio, fim) => {
    if (!dadosOriginais || dadosOriginais.length === 0) { setPortfolio(null); return; }
    const inicioData = converterInputData(inicio);
    const fimData = converterInputData(fim);
    let dadosPeriodo = [...dadosOriginais];
    if (inicioData) dadosPeriodo = dadosPeriodo.filter(i => i.mesReferencia >= obterMesReferencia(inicioData));
    if (fimData) dadosPeriodo = dadosPeriodo.filter(i => i.mesReferencia <= obterMesReferencia(fimData));
    if (dadosPeriodo.length === 0) { setPortfolio(null); return; }
    setPortfolio(calcularPortfolio(dadosPeriodo));
  };

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

  const clientes = ["Todos", ...new Set(dados.map((item) => item.cliente).filter(Boolean))];
  const formatarMoeda = (valor) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor || 0);
  const formatarNumero = (valor) => new Intl.NumberFormat("pt-BR").format(valor || 0);
  const formatarPercentual = (valor) => (valor === null || valor === undefined) ? "N/A" : `${Number(valor).toFixed(1)}%`;

  const irParaImportacao = () => { setMenuAtivo("importacao"); document.getElementById("lpc-importacao")?.scrollIntoView({ behavior: "smooth", block: "start" }); };
  const abrirClientesPoc = () => { setMenuAtivo("clientes"); setVisao("poc"); document.getElementById("lpc-visoes")?.scrollIntoView({ behavior: "smooth", block: "start" }); };
  const abrirPainelPoc = () => { setMenuAtivo("painel"); setVisao("clevel"); document.getElementById("lpc-visoes")?.scrollIntoView({ behavior: "smooth", block: "start" }); };
  const alternarIndicadores = () => { if (menuRecolhido) { setMenuRecolhido(false); setIndicadoresAbertos(true); return; } setIndicadoresAbertos((valor) => !valor); };

  // ==========================================
  // RENDER PRINCIPAL
  // ==========================================
  return (
    <div className={`lpc-app-shell ${menuRecolhido ? "sidebar-collapsed" : ""}`}>
      <header className="lpc-platform-header">
        <div className="lpc-platform-left">
          <button className="lpc-menu-toggle" onClick={() => setMenuRecolhido((valor) => !valor)} aria-label="Abrir ou recolher menu">☰</button>
          <img src={logoLogShare} alt="LogShare" className="lpc-platform-logo" />
        </div>
        <div className="lpc-platform-center">
          <span className="lpc-breadcrumb">Dashboard</span><span className="lpc-breadcrumb-separator">/</span><strong>LPC</strong>
        </div>

        <div className="lpc-platform-right" style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          {visao === "poc" && dados.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "center", borderRight: "1px solid #e5e7eb", paddingRight: "24px", height: "40px" }}>
              <span style={{ fontSize: "11px", color: "#9ca3af", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px", lineHeight: "1" }}>Cliente</span>
              <select value={clienteSelecionado} onChange={handleClienteChange} style={{ appearance: "none", backgroundColor: "transparent", border: "none", fontWeight: "950", fontSize: "14px", color: "#123B5D", cursor: "pointer", outline: "none", padding: "0 16px 0 0", margin: 0, lineHeight: "1.2", height: "20px", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='%23123B5D'%3E%3Cpath d='M0 0l5 5 5-5z'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right center", textAlign: "right" }}>
                {clientes.map((cliente) => <option key={cliente} value={cliente}>{cliente}</option>)}
              </select>
            </div>
          )}

          <div className="lpc-period" style={{ position: "relative", height: "40px", display: "flex", alignItems: "center" }}>
            <div onClick={() => setMostrarCalendario(!mostrarCalendario)} style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "center", height: "100%" }}>
              <span style={{ fontSize: "11px", color: "#9ca3af", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px", lineHeight: "1" }}>Período ▾</span>
              <strong style={{ color: "#111827", fontSize: "14px", margin: 0, padding: 0, lineHeight: "1.2", height: "20px", display: "block" }}>
                {dataInicio && dataFim ? `${dataInicio.substring(8,10)}/${dataInicio.substring(5,7)}/${dataInicio.substring(0,4)} a ${dataFim.substring(8,10)}/${dataFim.substring(5,7)}/${dataFim.substring(0,4)}` : "Aguardando dados"}
              </strong>
            </div>

            {mostrarCalendario && (
              <div style={{ position: "absolute", top: "100%", right: 0, marginTop: "12px", backgroundColor: "#ffffff", padding: "20px", borderRadius: "12px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", border: "1px solid #f3f4f6", zIndex: 1000, display: "flex", flexDirection: "column", gap: "16px", minWidth: "240px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}><label style={{ fontSize: "12px", fontWeight: "bold", color: "#374151" }}>Data de Início</label><input type="date" value={dataInicio} onChange={handleDataInicio} style={{ padding: "10px", border: "1px solid #e5e7eb", borderRadius: "8px", outline: "none" }} /></div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}><label style={{ fontSize: "12px", fontWeight: "bold", color: "#374151" }}>Data Final</label><input type="date" value={dataFim} onChange={handleDataFim} style={{ padding: "10px", border: "1px solid #e5e7eb", borderRadius: "8px", outline: "none" }} /></div>
                <button onClick={() => setMostrarCalendario(false)} style={{ marginTop: "4px", padding: "10px", backgroundColor: "#123B5D", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>Aplicar Filtro</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="lpc-platform-body">
        <aside className="lpc-sidebar">
          <nav className="lpc-sidebar-nav">
            <button className={`lpc-sidebar-item ${menuAtivo === "importacao" ? "active" : ""}`} onClick={irParaImportacao}><span className="lpc-sidebar-icon">⇧</span>{!menuRecolhido && <span className="lpc-sidebar-label">Importação</span>}</button>
            <button className={`lpc-sidebar-item ${["clientes", "painel"].includes(menuAtivo) ? "active" : ""}`} onClick={alternarIndicadores}><span className="lpc-sidebar-icon">▦</span>{!menuRecolhido && <span className="lpc-sidebar-label">Indicadores</span>}{!menuRecolhido && <span className="lpc-sidebar-arrow">{indicadoresAbertos ? "⌃" : "⌄"}</span>}</button>
            {!menuRecolhido && indicadoresAbertos && (
              <div className="lpc-sidebar-submenu">
                <button className={`lpc-sidebar-subitem ${menuAtivo === "clientes" ? "active" : ""}`} onClick={abrirClientesPoc}><span className="lpc-subitem-icon">●</span><span>Clientes em POC</span></button>
                <button className={`lpc-sidebar-subitem ${menuAtivo === "painel" ? "active" : ""}`} onClick={abrirPainelPoc}><span className="lpc-subitem-icon">▥</span><span>Painel de POC</span></button>
              </div>
            )}
          </nav>
        </aside>
        <main className="lpc-main">
          {menuAtivo === "importacao" && (
            <div id="lpc-importacao">
              <Section title="Importar dados da POC">
                <p style={{ color: "#6b7280", marginTop: 0 }}>Selecione a planilha Excel utilizada para acompanhamento das POCs.</p>
                <input type="file" accept=".xlsx,.xls" onChange={handleFile} />
              </Section>
            </div>
          )}
          {mensagem && (
            <div style={{ backgroundColor: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "10px", padding: "18px", marginBottom: "24px", color: "#9a3412" }}>
              <strong>Atenção:</strong><div style={{ marginTop: "6px" }}>{mensagem}</div>
            </div>
          )}
          {visao === "poc" && dashboard && (
            <VisaoPoc dashboard={dashboard} dadosBrutos={dados} clienteSelecionado={clienteSelecionado} dataInicio={dataInicio} dataFim={dataFim} formatarMoeda={formatarMoeda} formatarNumero={formatarNumero} formatarPercentual={formatarPercentual} />
          )}
          {visao === "clevel" && portfolio && (
            <VisaoCLevel portfolio={portfolio} formatarMoeda={formatarMoeda} formatarNumero={formatarNumero} formatarPercentual={formatarPercentual} abrirCliente={abrirCliente} />
          )}
        </main>
      </div>
    </div>
  );
}

// ==========================================
// VISÃO DA POC (CLIENTE INDIVIDUAL) E GRÁFICOS
// ==========================================
function VisaoPoc({ dashboard, dadosBrutos, clienteSelecionado, dataInicio, dataFim, formatarMoeda, formatarNumero, formatarPercentual }) {
  return (
    <>
      <Section title="Avaliação Executiva da POC"><ResumoExecutivo dashboard={dashboard} /></Section>
      <Section title="Análise de Performance Operacional">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
          <GraficoEvolucaoEmbarques dashboard={dashboard} dadosBrutos={dadosBrutos} cliente={clienteSelecionado} dataInicio={dataInicio} dataFim={dataFim} />
          <GraficoFunilOportunidades dashboard={dashboard} />
        </div>
      </Section>
      <Section title="KPIs Estratégicos da POC">
        <div className="lpc-strategic-kpi-grid">
          <StrategicScorePanel score={dashboard.score} status={dashboard.statusScore} />
          {Object.values(dashboard.indicadoresScore || {}).map((item) => <StrategicKpiCard key={item.nome} item={item} />)}
        </div>
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
    </>
  );
}

function GraficoEvolucaoEmbarques({ dashboard, dadosBrutos, cliente, dataInicio, dataFim }) {
  const historico = dashboard?.historicoScore || dashboard?.historico || [];

  let dadosFiltrados = [...(dadosBrutos || [])];
  if (cliente && cliente !== "Todos") dadosFiltrados = dadosFiltrados.filter(item => item.cliente === cliente);
  const mesInicio = dataInicio ? dataInicio.substring(0, 7) : null;
  const mesFim = dataFim ? dataFim.substring(0, 7) : null;

  let historicoFiltrado = [...historico];
  if (mesInicio) historicoFiltrado = historicoFiltrado.filter(item => (item.mesReferencia || item.mes) >= mesInicio);
  if (mesFim) historicoFiltrado = historicoFiltrado.filter(item => (item.mesReferencia || item.mes) <= mesFim);

  const dados = historicoFiltrado.map(item => {
    const mesRef = item.mesReferencia || item.mes;
    const reg = dadosFiltrados.filter(d => d.mesReferencia === mesRef);
    const ultimo = reg.length > 0 ? reg[reg.length - 1] : {};

    const planejados = Math.max(0, Number(ultimo.embarquesPlanejados || 0));
    const realizados = Math.max(0, Number(ultimo.embarquesRealizados || 0));
    const aderencia = Math.max(0, Math.round(Number(item?.valores?.aderencia ?? item.score ?? 0)));

    return { mes: formatarMes(mesRef), planejados, realizados, aderencia };
  });

  return (
    <div style={{ width: "100%", height: "420px", backgroundColor: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #f3f4f6", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column" }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '800', color: '#111827' }}>Evolução de Embarques e Aderência</h3>
      {dados.length === 0 ? (
        <div style={{ display: "flex", flex: 1, flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}><span style={{ fontSize: "14px", fontWeight: "600" }}>Sem dados no período.</span></div>
      ) : (
        <ResponsiveContainer width="99%" height="100%">
          <ComposedChart data={dados} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 12, fontWeight: 600 }} dy={10} />
            <YAxis yAxisId="left" domain={[0, 'auto']} allowDataOverflow={false} axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 12, fontWeight: 600 }} />
            <YAxis yAxisId="right" orientation="right" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 12, fontWeight: 600 }} tickFormatter={(val) => `${val}%`} />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', fontWeight: "bold", color: "#1f2937" }} />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: "13px", fontWeight: "700", color: "#374151", paddingTop: "24px" }} />
            <Bar yAxisId="left" dataKey="planejados" name="Planejados" fill="#38bdf8" maxBarSize={35} />
            <Bar yAxisId="left" dataKey="realizados" name="Realizados" fill="#0369a1" maxBarSize={35} />
            <Line yAxisId="right" type="monotone" dataKey="aderencia" name="Aderência" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function GraficoFunilOportunidades({ dashboard }) {
  if (!dashboard) return null;
  const totais = Number(dashboard.rotasTotais || 0);
  const disponiveis = Number(dashboard.rotasDisponibilizadas || 0);
  const match = Number(dashboard.rotasSinergia || 0);
  const oportunidades = Number(dashboard.oportunidades || 0);
  const executadas = Number(dashboard.rotasExecutadas || 0);

  const dados = [
    { name: 'Rotas Totais', value: totais, conversao: '100%' },
    { name: 'Rotas Disponibilizadas', value: disponiveis, conversao: totais ? Math.round((disponiveis/totais)*100)+'%' : '0%' },
    { name: 'Rotas com Match', value: match, conversao: disponiveis ? Math.round((match/disponiveis)*100)+'%' : '0%' },
    { name: 'Oportunidades Identif.', value: oportunidades, conversao: match ? Math.round((oportunidades/match)*100)+'%' : '0%' },
    { name: 'Rotas Executadas', value: executadas, conversao: oportunidades ? Math.round((executadas/oportunidades)*100)+'%' : '0%' },
  ];
  const cores = ['#0891b2', '#0e7490', '#155e75', '#164e63', '#083344'];

  return (
    <div style={{ width: "100%", height: "420px", backgroundColor: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #f3f4f6", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}><h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#111827' }}>Funil de Oportunidades</h3><span style={{ fontSize: "11px", color: "#6b7280", fontWeight: "bold", backgroundColor: "#f3f4f6", padding: "4px 8px", borderRadius: "6px" }}>ÚLTIMO MÊS FILTRADO</span></div>
      <ResponsiveContainer width="99%" height="100%">
        <FunnelChart margin={{ top: 20, right: 160, left: 20, bottom: 20 }}>
          <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', fontWeight: "bold" }} />
          <Funnel dataKey="value" data={dados} isAnimationActive>
            {dados.map((entry, index) => <Cell key={`cell-${index}`} fill={cores[index % cores.length]} />)}
            <LabelList position="right" fill="#374151" stroke="none" dataKey="name" fontSize={12} fontWeight="800" />
            <LabelList position="center" fill="#ffffff" stroke="none" dataKey="value" fontSize={15} fontWeight="900" />
          </Funnel>
        </FunnelChart>
      </ResponsiveContainer>
    </div>
  );
}

// ==========================================
// COMPONENTES C-LEVEL E MENORES
// ==========================================
function VisaoCLevel({ portfolio, formatarMoeda, formatarNumero, formatarPercentual, abrirCliente }) {
  return (
    <>
      <div className="lpc-summary-grid">
        <ExecutiveSummaryCard icone="users" titulo="POCs Ativas" valor={portfolio.totalPocs} detalhe="Em andamento" cor="#159ca6" fundo="#eaf8f9" />
        <ExecutiveSummaryCard icone="target" titulo="Score Médio" valor={Number(portfolio.scoreMedio).toFixed(1)} detalhe="Performance geral" cor="#1557b0" fundo="#edf3ff" />
        <ExecutiveSummaryCard icone="arrow-up" titulo="Em Evolução" valor={portfolio.emEvolucao} detalhe="Melhorando" cor="#16a34a" fundo="#eef9f0" />
        <ExecutiveSummaryCard icone="arrow-down" titulo="Em Queda" valor={portfolio.emQueda} detalhe="Piorando" cor="#dc2626" fundo="#fff0f1" />
        <ExecutiveSummaryCard icone="alert" titulo="Acompanhamento" valor={portfolio.acompanhamento} detalhe="Atenção necessária" cor="#d97706" fundo="#fff8e8" />
      </div>
      <Section title="Acompanhamento das POCs"><div className="lpc-client-grid">{portfolio.pocs.map((poc) => <PocExecutiveCard key={poc.cliente} poc={poc} formatarPercentual={formatarPercentual} abrirCliente={abrirCliente} />)}</div></Section>
      <Section title="Consolidado Financeiro"><Grid><KpiCard titulo="Baseline" valor={formatarMoeda(portfolio.baselineTotal)} /><KpiCard titulo="Custo Realizado" valor={formatarMoeda(portfolio.realizadoTotal)} /><KpiCard titulo="Saving Total" valor={formatarMoeda(portfolio.savingTotal)} /><KpiCard titulo="ROI Consolidado" valor={portfolio.roiMedio === null ? "N/A" : formatarPercentual(portfolio.roiMedio)} /></Grid></Section>
    </>
  );
}

function PocExecutiveCard({ poc, abrirCliente }) {
  const score = Number(poc.score || 0);
  const variacao = poc.variacaoScore;
  let corScore = score >= 80 ? "#16a34a" : score >= 60 ? "#d97706" : "#dc2626";
  let tendenciaTexto = "Sem histórico"; let tendenciaCor = "#6b7280";
  if (poc.tendencia === "melhorando") { tendenciaTexto = "Em evolução"; tendenciaCor = "#16a34a"; }
  else if (poc.tendencia === "piorando") { tendenciaTexto = "Em queda"; tendenciaCor = "#dc2626"; }
  else if (poc.tendencia === "estavel") { tendenciaTexto = "Estável"; tendenciaCor = "#d97706"; }
  let recomendacaoCor = "#dc2626"; let bgRecomendacao = "#fef2f2";
  if (poc.recomendacao === "GO") { recomendacaoCor = "#16a34a"; bgRecomendacao = "#f0fdf4"; }
  else if (poc.recomendacao === "GO COM ACOMPANHAMENTO") { recomendacaoCor = "#d97706"; bgRecomendacao = "#fffbeb"; }
  const atencao = poc.principalAtencao;

  return (
    <div className="lpc-poc-card" onClick={() => abrirCliente(poc.cliente)} style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #f3f4f6", borderBottom: `6px solid ${corScore}`, boxShadow: "0 4px 12px rgba(0,0,0,0.03)", cursor: "pointer", display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div style={{ fontSize: "18px", fontWeight: "bold", color: "#111827" }}>{poc.cliente}</div>
        <div style={{ textAlign: "right" }}><div style={{ fontSize: "11px", color: "#6b7280", fontWeight: "bold" }}>SCORE</div><div style={{ fontSize: "28px", fontWeight: "900", color: corScore, lineHeight: "1" }}>{score.toFixed(1)}</div></div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px", padding: "12px 16px", backgroundColor: "#f9fafb", borderRadius: "12px" }}>
        <div style={{ fontWeight: "bold", color: tendenciaCor, fontSize: "14px" }}>{variacao === null ? "N/A" : `${variacao >= 0 ? "+" : ""}${variacao.toFixed(1)} pts`}</div>
        <div style={{ marginLeft: "auto", fontWeight: "600", color: tendenciaCor, fontSize: "13px" }}>{tendenciaTexto}</div>
      </div>
      <div style={{ marginBottom: "20px", padding: "16px", backgroundColor: bgRecomendacao, borderRadius: "12px" }}>
        <div style={{ fontSize: "11px", color: recomendacaoCor, marginBottom: "4px", fontWeight: "bold" }}>RECOMENDAÇÃO</div>
        <div style={{ fontWeight: "900", color: recomendacaoCor, fontSize: "14px" }}>{poc.recomendacao}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "20px" }}>
        <IndicatorCount numero={poc.indicadoresDentro} label="Dentro" cor="#16a34a" />
        <IndicatorCount numero={poc.indicadoresAtencao} label="Atenção" cor="#d97706" />
        <IndicatorCount numero={poc.indicadoresFora} label="Fora" cor="#dc2626" />
      </div>
      <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "16px", marginBottom: "16px" }}>
        <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "8px", fontWeight: "bold" }}>PRINCIPAL PONTO DE ATENÇÃO</div>
        {atencao ? (
          <><div style={{ fontSize: "14px", fontWeight: "800", color: "#dc2626", marginBottom: "4px" }}>{atencao.nome}</div><div style={{ fontSize: "12px", color: "#6b7280" }}><strong style={{ color: "#dc2626" }}>{formatarResultado(atencao)}</strong> | Meta: {formatarMeta(atencao)}</div></>
        ) : (<div style={{ color: "#16a34a", fontWeight: "bold", fontSize: "13px" }}>✓ Nenhum ponto crítico</div>)}
      </div>
      <div style={{ marginTop: "auto", fontSize: "13px", color: "#2563eb", textAlign: "right", fontWeight: "600" }}>Ver detalhes da POC →</div>
    </div>
  );
}

function IndicatorCount({ numero, label, cor }) {
  return (
    <div className="lpc-indicator-count" style={{ backgroundColor: "#fbfcfd" }}>
      <div className="lpc-indicator-number" style={{ fontWeight: "bold", color: cor }}>{numero}</div>
      <div className="lpc-indicator-label" style={{ color: "#667085" }}>{label}</div>
    </div>
  );
}

function ResumoExecutivo({ dashboard }) {
  const scoreAtual = Number(dashboard.score || 0);
  let corRecomendacao = scoreAtual >= 80 ? "#16a34a" : scoreAtual >= 60 ? "#d97706" : "#dc2626";
  let recomendacao = scoreAtual >= 80 ? "GO" : scoreAtual >= 60 ? "ACOMPANHAMENTO" : "REVISAR";
  return (
    <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", border: "1px solid #f3f4f6", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "6px", backgroundColor: corRecomendacao }} />
      <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: "700", marginTop: "8px" }}>SCORE DA POC</div>
      <div style={{ fontSize: "56px", fontWeight: "900", color: corRecomendacao, margin: "8px 0", lineHeight: "1" }}>{scoreAtual.toFixed(1)}</div>
      <div style={{ color: corRecomendacao, fontSize: "12px", fontWeight: "bold" }}>{recomendacao}</div>
    </div>
  );
}

function StrategicScorePanel({ score }) {
  const valor = Number(score || 0);
  let cor = valor >= 80 ? "#16a34a" : valor >= 60 ? "#d97706" : "#dc2626";
  return (
    <div style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #f3f4f6", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: "700" }}>DESEMPENHO GERAL</div>
      <div style={{ fontSize: "32px", fontWeight: "900", color: "#111827", margin: "20px 0" }}>{valor.toFixed(0)}%</div>
      <div style={{ fontWeight: "900", color: cor, fontSize: "18px" }}>{valor >= 80 ? 'GO' : valor >= 60 ? 'ACOMPANHAR' : 'NO-GO'}</div>
    </div>
  );
}

function StrategicKpiCard({ item }) {
  let cor = item.status === "verde" ? "#16a34a" : item.status === "amarelo" ? "#d97706" : item.status === "na" ? "#6b7280" : "#dc2626";
  return (
    <div style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #f3f4f6", borderBottom: `6px solid ${cor}`, boxShadow: "0 4px 12px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div><div style={{ fontSize: "15px", fontWeight: "800", color: "#111827", marginBottom: "4px" }}>{item.nome}</div><div style={{ fontSize: "12px", color: "#6b7280", fontWeight: "500", marginBottom: "16px" }}>Peso do KPI: {Number(item.pesoEfetivo || 0).toFixed(0)}%</div></div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "16px", paddingBottom: "16px", borderBottom: "1px solid #f3f4f6" }}>
        <div><div style={{ fontSize: "11px", color: "#9ca3af", fontWeight: "bold" }}>Resultado</div><div style={{ fontSize: "20px", fontWeight: "900", color: "#111827" }}>{formatarResultado(item)}</div></div>
        <div style={{ textAlign: "right" }}><div style={{ fontSize: "11px", color: "#9ca3af", fontWeight: "bold" }}>Meta</div><div style={{ fontSize: "16px", fontWeight: "700", color: "#4b5563" }}>{formatarMeta(item)}</div></div>
      </div>
    </div>
  );
}

function ExecutiveSummaryCard({ titulo, valor, detalhe, cor = "#123B5D" }) {
  return (
    <div style={{ backgroundColor: "#ffffff", padding: "20px", borderRadius: "16px", border: "1px solid #f3f4f6", borderBottom: `4px solid ${cor}`, boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
      <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600", textTransform: "uppercase" }}>{titulo}</div>
      <div style={{ fontSize: "24px", fontWeight: "900", color: "#111827", margin: "2px 0" }}>{valor}</div>
      <div style={{ fontSize: "13px", color: "#9ca3af", fontWeight: "500" }}>{detalhe}</div>
    </div>
  );
}

function Section({ title, children }) { return (<section className="lpc-section"><h2 className="lpc-section-title">{title}</h2>{children}</section>); }
function Grid({ children }) { return <div className="lpc-grid">{children}</div>; }
function KpiCard({ titulo, valor }) { return (<div style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #f3f4f6", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}><div style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600", textTransform: "uppercase", marginBottom: "8px" }}>{titulo}</div><div style={{ fontSize: "28px", fontWeight: "900", color: "#111827" }}>{valor}</div></div>); }
function formatarResultado(item) { if (item?.resultado === null || item?.resultado === undefined) return "N/A"; if (item.unidade === "%") return `${Number(item.resultado).toFixed(1)}%`; if (item.unidade === "dias") return `${Number(item.resultado).toFixed(0)} dias`; return `${Number(item.resultado).toFixed(0)} ${item.unidade || ""}`; }
function formatarMeta(item) { if (item?.meta === null || item?.meta === undefined) return "N/A"; if (item.tipo === "menor") return item.unidade === "dias" ? `≤ ${item.meta} dias` : `≤ ${item.meta}${item.unidade || ""}`; return `≥ ${item.meta}${item.unidade || ""}`; }
function formatarMes(ref) { if (!ref) return ""; const a = ref.substring(0, 4); const m = Number(ref.substring(5, 7)); const n = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]; return `${n[m - 1]}/${a.substring(2, 4)}`; }
function obterMesReferencia(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; }

export default App;