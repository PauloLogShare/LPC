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

  const [clienteSelecionado, setClienteSelecionado] =
    useState("Todos");

  const [dataInicio, setDataInicio] =
    useState("");

  const [dataFim, setDataFim] =
    useState("");

  const [mensagem, setMensagem] =
    useState("");

  // ==========================================
  // IMPORTAR EXCEL
  // ==========================================

  const handleFile = (event) => {
    const file =
      event.target.files[0];

    if (!file) {
      return;
    }

    readExcel(
      file,
      (dadosLidos) => {

        const dadosProcessados =
          processarDados(
            dadosLidos
          );

        setDados(
          dadosProcessados
        );

        if (
          dadosProcessados.length === 0
        ) {

          setDashboard(null);
          setPortfolio(null);

          setMensagem(
            "Nenhum dado encontrado no arquivo."
          );

          return;
        }

        const datas =
          dadosProcessados
            .map(
              (item) =>
                item.mes
            )
            .filter(Boolean)
            .sort(
              (a, b) =>
                a - b
            );

        const inicio =
          formatarDataInput(
            datas[0]
          );

        const fim =
          formatarDataInput(
            datas[
              datas.length - 1
            ]
          );

        setClienteSelecionado(
          "Todos"
        );

        setDataInicio(
          inicio
        );

        setDataFim(
          fim
        );

        setMenuAtivo("clientes");

        atualizarDashboard(
          dadosProcessados,
          "Todos",
          inicio,
          fim
        );

        atualizarPortfolio(
          dadosProcessados,
          inicio,
          fim
        );

      }
    );
  };

  // ==========================================
  // DATA
  // ==========================================

  const formatarDataInput = (
    data
  ) => {

    if (!data) {
      return "";
    }

    const ano =
      data.getFullYear();

    const mes =
      String(
        data.getMonth() + 1
      ).padStart(
        2,
        "0"
      );

    const dia =
      String(
        data.getDate()
      ).padStart(
        2,
        "0"
      );

    return `${ano}-${mes}-${dia}`;
  };

  const converterInputData = (
    valor
  ) => {

    if (!valor) {
      return null;
    }

    const partes =
      valor.split("-");

    if (
      partes.length !== 3
    ) {
      return null;
    }

    return new Date(
      Number(partes[0]),
      Number(partes[1]) - 1,
      Number(partes[2])
    );
  };

  // ==========================================
  // DASHBOARD INDIVIDUAL
  // ==========================================

  const atualizarDashboard = (
    dadosOriginais,
    cliente,
    inicio,
    fim
  ) => {

    if (
      !dadosOriginais ||
      dadosOriginais.length === 0
    ) {

      setDashboard(null);
      return;
    }

    let dadosFiltrados =
      [...dadosOriginais];

    if (
      cliente !== "Todos"
    ) {

      dadosFiltrados =
        dadosFiltrados.filter(
          (item) =>
            item.cliente ===
            cliente
        );

    }

    const inicioData =
      converterInputData(
        inicio
      );

    const fimData =
      converterInputData(
        fim
      );

    if (
      inicioData &&
      fimData &&
      inicioData > fimData
    ) {

      setDashboard(null);

      setMensagem(
        "A data inicial não pode ser maior que a data final."
      );

      return;
    }

    let dadosPeriodo =
      [...dadosFiltrados];

    if (inicioData) {

      const mesInicio =
        obterMesReferencia(
          inicioData
        );

      dadosPeriodo =
        dadosPeriodo.filter(
          (item) =>
            item.mesReferencia >=
            mesInicio
        );

    }

    if (fimData) {

      const mesFim =
        obterMesReferencia(
          fimData
        );

      dadosPeriodo =
        dadosPeriodo.filter(
          (item) =>
            item.mesReferencia <=
            mesFim
        );

    }

    if (
      dadosPeriodo.length === 0
    ) {

      setDashboard(null);

      setMensagem(
        "Não existem dados para o cliente e período selecionados."
      );

      return;
    }

    const resultado =
      calcularDashboard(
        dadosFiltrados,
        inicioData,
        fimData
      );

    if (!resultado) {

      setDashboard(null);

      setMensagem(
        "Não foi possível calcular os indicadores."
      );

      return;
    }

    setMensagem("");

    setDashboard(
      resultado
    );
  };

  // ==========================================
  // PORTFOLIO
  // ==========================================

  const atualizarPortfolio = (
    dadosOriginais,
    inicio,
    fim
  ) => {

    if (
      !dadosOriginais ||
      dadosOriginais.length === 0
    ) {

      setPortfolio(null);
      return;
    }

    const inicioData =
      converterInputData(
        inicio
      );

    const fimData =
      converterInputData(
        fim
      );

    let dadosPeriodo =
      [...dadosOriginais];

    if (inicioData) {

      const mesInicio =
        obterMesReferencia(
          inicioData
        );

      dadosPeriodo =
        dadosPeriodo.filter(
          (item) =>
            item.mesReferencia >=
            mesInicio
        );

    }

    if (fimData) {

      const mesFim =
        obterMesReferencia(
          fimData
        );

      dadosPeriodo =
        dadosPeriodo.filter(
          (item) =>
            item.mesReferencia <=
            mesFim
        );

    }

    if (
      dadosPeriodo.length === 0
    ) {

      setPortfolio(null);
      return;
    }

    const resultado =
      calcularPortfolio(
        dadosPeriodo
      );

    setPortfolio(
      resultado
    );
  };

  // ==========================================
  // FILTROS
  // ==========================================

  const handleClienteChange = (
    event
  ) => {

    const cliente =
      event.target.value;

    setClienteSelecionado(
      cliente
    );

    atualizarDashboard(
      dados,
      cliente,
      dataInicio,
      dataFim
    );
  };

  const handleDataInicio = (
    event
  ) => {

    const valor =
      event.target.value;

    setDataInicio(
      valor
    );

    atualizarDashboard(
      dados,
      clienteSelecionado,
      valor,
      dataFim
    );

    atualizarPortfolio(
      dados,
      valor,
      dataFim
    );
  };

  const handleDataFim = (
    event
  ) => {

    const valor =
      event.target.value;

    setDataFim(
      valor
    );

    atualizarDashboard(
      dados,
      clienteSelecionado,
      dataInicio,
      valor
    );

    atualizarPortfolio(
      dados,
      dataInicio,
      valor
    );
  };

  // ==========================================
  // ABRIR CLIENTE
  // ==========================================

  const abrirCliente =
    (cliente) => {

      setClienteSelecionado(
        cliente
      );

      setVisao(
        "poc"
      );

      atualizarDashboard(
        dados,
        cliente,
        dataInicio,
        dataFim
      );
    };

  // ==========================================
  // CLIENTES
  // ==========================================

  const clientes = [
    "Todos",

    ...new Set(
      dados
        .map(
          (item) =>
            item.cliente
        )
        .filter(Boolean)
    ),
  ];

  // ==========================================
  // FORMATAÇÕES
  // ==========================================

  const formatarMoeda = (
    valor
  ) => {

    return new Intl.NumberFormat(
      "pt-BR",
      {
        style:
          "currency",

        currency:
          "BRL",
      }
    ).format(
      valor || 0
    );
  };

  const formatarNumero = (
    valor
  ) => {

    return new Intl.NumberFormat(
      "pt-BR"
    ).format(
      valor || 0
    );
  };

  const formatarPercentual = (
    valor
  ) => {

    if (
      valor === null ||
      valor === undefined
    ) {

      return "N/A";
    }

    return `${Number(
      valor
    ).toFixed(1)}%`;
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
  // RENDER
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

          <button
            className="lpc-apps-button"
            aria-label="Aplicativos"
            title="Aplicativos"
          >
            <span /><span /><span />
            <span /><span /><span />
            <span /><span /><span />
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

        <div className="lpc-platform-right">
          <div className="lpc-period">
            <span>Período selecionado</span>
            <strong>
              {dataInicio && dataFim
                ? `${dataInicio.split("-").reverse().join("/")} a ${dataFim.split("-").reverse().join("/")}`
                : "Aguardando dados"}
            </strong>
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

          {menuAtivo !== "importacao" && dados.length > 0 && (
            <Section title="Filtros">
              <div
                style={{
                  display: "flex",
                  gap: "30px",
                  flexWrap: "wrap",
                  alignItems: "flex-end",
                }}
              >
                {visao === "poc" && (
                  <Filter label="Cliente">
                    <select
                      value={clienteSelecionado}
                      onChange={handleClienteChange}
                      style={inputStyle}
                    >
                      {clientes.map((cliente) => (
                        <option key={cliente} value={cliente}>
                          {cliente}
                        </option>
                      ))}
                    </select>
                  </Filter>
                )}

                <Filter label="De">
                  <input
                    type="date"
                    value={dataInicio}
                    onChange={handleDataInicio}
                    style={inputStyle}
                  />
                </Filter>

                <Filter label="Até">
                  <input
                    type="date"
                    value={dataFim}
                    onChange={handleDataFim}
                    style={inputStyle}
                  />
                </Filter>
              </div>
            </Section>
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

function SidebarItem({
  icon,
  label,
  collapsed,
  active = false,
  expandable = false,
}) {
  return (
    <button
      className={`lpc-sidebar-item ${active ? "active" : ""}`}
      title={collapsed ? label : ""}
      type="button"
    >
      <span className="lpc-sidebar-icon">{icon}</span>

      {!collapsed && (
        <span className="lpc-sidebar-label">{label}</span>
      )}

      {!collapsed && expandable && (
        <span className="lpc-sidebar-arrow">⌄</span>
      )}
    </button>
  );
}


// ==========================================
// VISÃO DA POC
// ==========================================

function VisaoPoc({
  dashboard,
  formatarMoeda,
  formatarNumero,
  formatarPercentual,
}) {

  return (

    <>

      <Section
        title="Avaliação Executiva da POC"
      >

        <ResumoExecutivo
          dashboard={
            dashboard
          }
        />

      </Section>

      <Section
        title="KPIs Estratégicos da POC | GO ≥80% | ACOMPANHAR 60–79% | NO-GO <60%"
      >

        <div className="lpc-strategic-kpi-grid">

          <StrategicScorePanel
            score={dashboard.score}
            status={dashboard.statusScore}
          />

          {Object.values(
            dashboard.indicadoresScore || {}
          ).map((item) => (

            <StrategicKpiCard
              key={item.nome}
              item={item}
            />

          ))}

        </div>

      </Section>

      <Section
        title="Evolução do Score"
      >

        <HistoricoScore
          historico={
            dashboard
              .historicoScore ||
            []
          }
        />

      </Section>

      <Section
        title="Indicadores da Malha"
      >

        <Grid>

          <KpiCard
            titulo="Rotas Totais"
            valor={
              formatarNumero(
                dashboard
                  .rotasTotais
              )
            }
          />

          <KpiCard
            titulo="Rotas Disponibilizadas"
            valor={
              formatarNumero(
                dashboard
                  .rotasDisponibilizadas
              )
            }
          />

          <KpiCard
            titulo="Rotas com Sinergia"
            valor={
              formatarNumero(
                dashboard
                  .rotasSinergia
              )
            }
          />

          <KpiCard
            titulo="Oportunidades"
            valor={
              formatarNumero(
                dashboard
                  .oportunidades
              )
            }
          />

        </Grid>

      </Section>

      <Section
        title="Operação"
      >

        <Grid>

          <KpiCard
            titulo="Rotas Executadas"
            valor={
              formatarNumero(
                dashboard
                  .rotasExecutadas
              )
            }
          />

          <KpiCard
            titulo="Embarques Planejados"
            valor={
              formatarNumero(
                dashboard
                  .embarquesPlanejados
              )
            }
          />

          <KpiCard
            titulo="Embarques Realizados"
            valor={
              formatarNumero(
                dashboard
                  .embarquesRealizados
              )
            }
          />

          <KpiCard
            titulo="Usuários Ativos"
            valor={
              formatarNumero(
                dashboard
                  .usuariosAtivos
              )
            }
          />

        </Grid>

      </Section>

      <Section
        title="Financeiro"
      >

        <Grid>

          <KpiCard
            titulo="Baseline"
            valor={
              formatarMoeda(
                dashboard
                  .baseline
              )
            }
          />

          <KpiCard
            titulo="Custo LogShare"
            valor={
              formatarMoeda(
                dashboard
                  .realizado
              )
            }
          />

          <KpiCard
            titulo="Saving"
            valor={
              formatarMoeda(
                dashboard
                  .saving
              )
            }
          />

          <KpiCard
            titulo="ROI"
            valor={
              dashboard.roi ===
              null
                ? "N/A"
                : formatarPercentual(
                    dashboard.roi
                  )
            }
          />

        </Grid>

      </Section>

      <Section
        title="Sustentabilidade"
      >

        <Grid>

          <KpiCard
            titulo="CO₂ Evitado"
            valor={`${formatarNumero(
              dashboard.co2
            )} kg`}
          />

          <KpiCard
            titulo="Árvores"
            valor={
              formatarNumero(
                dashboard
                  .arvores
              )
            }
          />

          <KpiCard
            titulo="Campos de Futebol"
            valor={
              formatarNumero(
                dashboard
                  .camposFutebol
              )
            }
          />

        </Grid>

      </Section>

    </>

  );
}


// ==========================================
// VISÃO C-LEVEL
// ==========================================

function VisaoCLevel({
  portfolio,
  formatarMoeda,
  formatarNumero,
  formatarPercentual,
  abrirCliente,
}) {

  return (

    <>

      {/* ===================================
          CARDS RESUMO
      ==================================== */}

      <div
        className="lpc-summary-grid"
        style={{
          display:
            "grid",

          gridTemplateColumns:
            "repeat(5, 1fr)",

          gap:
            "14px",

          marginBottom:
            "24px",
        }}
      >

        <ExecutiveSummaryCard
          icone="users"
          titulo="POCs Ativas"
          valor={
            portfolio.totalPocs
          }
          detalhe="Em andamento"
          cor="#159ca6"
          fundo="#eaf8f9"
        />

        <ExecutiveSummaryCard
          icone="target"
          titulo="Score Médio"
          valor={
            Number(
              portfolio.scoreMedio
            ).toFixed(1)
          }
          detalhe="Performance geral"
          cor="#1557b0"
          fundo="#edf3ff"
        />

        <ExecutiveSummaryCard
          icone="arrow-up"
          titulo="Em Evolução"
          valor={
            portfolio.emEvolucao
          }
          detalhe="Melhorando"
          cor="#16a34a"
          fundo="#eef9f0"
        />

        <ExecutiveSummaryCard
          icone="arrow-down"
          titulo="Em Queda"
          valor={
            portfolio.emQueda
          }
          detalhe="Piorando"
          cor="#dc2626"
          fundo="#fff0f1"
        />

        <ExecutiveSummaryCard
          icone="alert"
          titulo="Em Acompanhamento"
          valor={
            portfolio
              .acompanhamento
          }
          detalhe="Atenção necessária"
          cor="#d97706"
          fundo="#fff8e8"
        />

      </div>

      {/* ===================================
          CARDS DOS CLIENTES
      ==================================== */}

      <Section
        title="Acompanhamento das POCs"
      >

        <div className="lpc-client-grid">

          {portfolio.pocs.map(
            (poc) => (

              <PocExecutiveCard
                key={
                  poc.cliente
                }
                poc={
                  poc
                }
                formatarPercentual={
                  formatarPercentual
                }
                abrirCliente={
                  abrirCliente
                }
              />

            )
          )}

        </div>

      </Section>

      {/* ===================================
          FINANCEIRO
      ==================================== */}

      <Section
        title="Consolidado Financeiro"
      >

        <Grid>

          <KpiCard
            titulo="Baseline"
            valor={
              formatarMoeda(
                portfolio
                  .baselineTotal
              )
            }
          />

          <KpiCard
            titulo="Custo Realizado"
            valor={
              formatarMoeda(
                portfolio
                  .realizadoTotal
              )
            }
          />

          <KpiCard
            titulo="Saving Total"
            valor={
              formatarMoeda(
                portfolio
                  .savingTotal
              )
            }
          />

          <KpiCard
            titulo="ROI Consolidado"
            valor={
              portfolio.roiMedio ===
              null
                ? "N/A"
                : formatarPercentual(
                    portfolio.roiMedio
                  )
            }
          />

        </Grid>

      </Section>

      {/* ===================================
          SUSTENTABILIDADE
      ==================================== */}

      <Section
        title="Consolidado de Sustentabilidade"
      >

        <Grid>

          <KpiCard
            titulo="CO₂ Evitado"
            valor={`${formatarNumero(
              portfolio.co2Total
            )} kg`}
          />

          <KpiCard
            titulo="Árvores"
            valor={
              formatarNumero(
                portfolio
                  .arvoresTotal
              )
            }
          />

          <KpiCard
            titulo="Campos de Futebol"
            valor={
              formatarNumero(
                portfolio
                  .camposFutebolTotal
              )
            }
          />

        </Grid>

      </Section>

    </>

  );
}


// ==========================================
// CARD EXECUTIVO DA POC
// ==========================================

function PocExecutiveCard({
  poc,
  formatarPercentual,
  abrirCliente,
}) {

  const score =
    Number(
      poc.score || 0
    );

  const scoreAnterior =
    poc.scoreAnterior;

  const variacao =
    poc.variacaoScore;

  // ========================================
  // COR DO SCORE
  // ========================================

  let corScore =
    "#dc2626";

  if (
    score >= 80
  ) {

    corScore =
      "#16a34a";

  } else if (
    score >= 60
  ) {

    corScore =
      "#d97706";

  }

  // ========================================
  // TENDÊNCIA
  // ========================================

  let tendenciaTexto =
    "Sem histórico";

  let tendenciaCor =
    "#6b7280";

  let tendenciaIcone =
    "→";

  if (
    poc.tendencia ===
    "melhorando"
  ) {

    tendenciaTexto =
      "Em evolução";

    tendenciaCor =
      "#16a34a";

    tendenciaIcone =
      "↗";

  } else if (
    poc.tendencia ===
    "piorando"
  ) {

    tendenciaTexto =
      "Em queda";

    tendenciaCor =
      "#dc2626";

    tendenciaIcone =
      "↘";

  } else if (
    poc.tendencia ===
    "estavel"
  ) {

    tendenciaTexto =
      "Estável";

    tendenciaCor =
      "#d97706";

    tendenciaIcone =
      "→";
  }

  // ========================================
  // RECOMENDAÇÃO
  // ========================================

  let recomendacaoCor =
    "#dc2626";

  if (
    poc.recomendacao ===
    "GO"
  ) {

    recomendacaoCor =
      "#16a34a";

  } else if (
    poc.recomendacao ===
    "GO COM ACOMPANHAMENTO"
  ) {

    recomendacaoCor =
      "#d97706";
  }

  // ========================================
  // PRINCIPAL ATENÇÃO
  // ========================================

  const atencao =
    poc.principalAtencao;

  // ========================================
  // CARD
  // ========================================

  return (

    <div className="lpc-poc-card" onClick={() => abrirCliente(poc.cliente)} style={{ borderTop: `3px solid ${corScore}` }}>

      {/* =================================
          CABEÇALHO
      ================================== */}

      <div
        className="lpc-poc-head"
        style={{
          display:
            "flex",

          justifyContent:
            "space-between",

          alignItems:
            "center",

          marginBottom:
            "18px",
        }}
      >

        <div>

          <div
            style={{
              fontSize:
                "20px",

              fontWeight:
                "bold",

              color:
                "#123B5D",
            }}
          >
            {poc.cliente}
          </div>

        </div>


        <div
          style={{
            textAlign:
              "right",
          }}
        >

          <div
            style={{
              fontSize:
                "11px",

              color:
                "#6b7280",
            }}
          >
            SCORE
          </div>

          <div
            style={{
              fontSize:
                "34px",

              fontWeight:
                "bold",

              color:
                corScore,
            }}
          >

            {score.toFixed(
              1
            )}

          </div>

        </div>

      </div>

      {/* =================================
          TENDÊNCIA
      ================================== */}

      <div
        className="lpc-poc-trend"
        style={{
          display:
            "flex",

          alignItems:
            "center",

          gap:
            "14px",

          marginBottom:
            "18px",

          padding:
            "12px",

          backgroundColor:
            "#f9fafb",

          borderRadius:
            "8px",
        }}
      >

        <span className="lpc-poc-icon-badge" style={{ color: tendenciaCor }} aria-hidden="true">
          <PocIcon tipo={poc.tendencia === "piorando" ? "trend-down" : poc.tendencia === "estavel" ? "trend-flat" : "trend-up"} />
        </span>


        <div>

          <div
            style={{
              fontWeight:
                "bold",

              color:
                tendenciaCor,
            }}
          >

            {variacao ===
              null
              ? "N/A"
              : `${variacao >= 0 ? "+" : ""}${variacao.toFixed(
                  1
                )} pts`}

          </div>


          <div
            style={{
              fontSize:
                "12px",

              color:
                "#6b7280",
            }}
          >

            {scoreAnterior ===
            null
              ? "Sem mês anterior"
              : `vs. score anterior ${scoreAnterior.toFixed(
                  1
                )}`}

          </div>

        </div>


        <div
          style={{
            marginLeft:
              "auto",

            fontWeight:
              "bold",

            color:
              tendenciaCor,
          }}
        >

          {tendenciaTexto}

        </div>

      </div>

      {/* =================================
          RECOMENDAÇÃO
      ================================== */}

      <div
        className="lpc-poc-recommendation"
        style={{
          marginBottom:
            "18px",

          padding:
            "12px",

          backgroundColor:
            "#fbfcfd",

          border:
            "1px solid #edf0f3",

          borderRadius:
            "8px",
        }}
      >

        <div
          style={{
            fontSize:
              "11px",

            color:
              "#6b7280",

            marginBottom:
              "4px",
          }}
        >
          RECOMENDAÇÃO
        </div>


        <div
          className="lpc-poc-recommendation-value"
          style={{
            fontWeight:
              "bold",

            color:
              recomendacaoCor,

            display:
              "flex",

            alignItems:
              "center",

            gap:
              "7px",
          }}
        >
          <span className="lpc-poc-icon-mini" style={{ color: recomendacaoCor }} aria-hidden="true">
            <PocIcon tipo={poc.recomendacao === "GO" ? "check" : poc.recomendacao === "GO COM ACOMPANHAMENTO" ? "warning" : "review"} />
          </span>
          {poc.recomendacao}
        </div>

      </div>

      {/* =================================
          STATUS INDICADORES
      ================================== */}

      <div
        className="lpc-poc-status-grid"
        style={{
          display:
            "grid",

          gridTemplateColumns:
            "repeat(3, 1fr)",

          gap:
            "8px",

          marginBottom:
            "20px",
        }}
      >

        <IndicatorCount
          numero={
            poc.indicadoresDentro
          }
          label="Dentro"
          cor="#16a34a"
          fundo="#fbfcfd"
          icone="check"
        />

        <IndicatorCount
          numero={
            poc.indicadoresAtencao
          }
          label="Atenção"
          cor="#d97706"
          fundo="#fbfcfd"
          icone="warning"
        />

        <IndicatorCount
          numero={
            poc.indicadoresFora
          }
          label="Fora"
          cor="#dc2626"
          fundo="#fbfcfd"
          icone="close"
        />

      </div>

      {/* =================================
          PRINCIPAL ATENÇÃO
      ================================== */}

      <div
        className="lpc-poc-attention"
        style={{
          borderTop:
            "1px solid #e5e7eb",

          paddingTop:
            "16px",
        }}
      >

        <div
          style={{
            fontSize:
              "11px",

            color:
              "#6b7280",

            marginBottom:
              "6px",
          }}
        >
          PRINCIPAL PONTO DE ATENÇÃO
        </div>


        {atencao ? (

          <>

            <div
              style={{
                fontSize:
                  "16px",

                fontWeight:
                  "bold",

                color:
                  "#dc2626",
              }}
            >

              <span className="lpc-poc-attention-icon" aria-hidden="true"><PocIcon tipo="attention" /></span>
              {atencao.nome}

            </div>


            <div
              style={{
                fontSize:
                  "13px",

                color:
                  "#6b7280",

                marginTop:
                  "4px",
              }}
            >

              {formatarResultado(
                atencao
              )}

              {" | "}

              Meta:{" "}

              {formatarMeta(
                atencao
              )}

            </div>

          </>

        ) : (

          <div
            style={{
              color:
                "#16a34a",

              fontWeight:
                "bold",
            }}
          >
            ✓ Nenhum ponto crítico
          </div>

        )}

      </div>

      {/* =================================
          CLIQUE
      ================================== */}

      <div
        className="lpc-poc-click"
        style={{
          marginTop:
            "16px",

          fontSize:
            "11px",

          color:
            "#9ca3af",

          textAlign:
            "right",
        }}
      >
        Ver detalhes da POC →
      </div>

    </div>

  );
}


// ==========================================
// ÍCONES DOS CARDS INTERNOS DA POC
// SVG inline para manter a interface leve
// ==========================================

function PocIcon({ tipo }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  if (tipo === "check") {
    return <svg {...common}><path d="m5 12 4 4L19 6" /></svg>;
  }

  if (tipo === "warning" || tipo === "attention") {
    return <svg {...common}><path d="M10.3 3.9 2.5 17.5A1.8 1.8 0 0 0 4 20.2h16a1.8 1.8 0 0 0 1.5-2.7L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>;
  }

  if (tipo === "close") {
    return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6" /><path d="m15 9-6 6" /></svg>;
  }

  if (tipo === "trend-down") {
    return <svg {...common}><path d="M3 6v15h15" /><path d="m7 10 4 4 4-4 5 5" /><path d="M16 19h4v-4" /></svg>;
  }

  if (tipo === "trend-flat") {
    return <svg {...common}><path d="M4 12h16" /><path d="m16 8 4 4-4 4" /></svg>;
  }

  if (tipo === "trend-up") {
    return <svg {...common}><path d="M4 16 9 11l4 3 7-8" /><path d="M15 6h5v5" /></svg>;
  }

  if (tipo === "review") {
    return <svg {...common}><path d="M4 5h16v12H7l-3 3V5Z" /><path d="M8 9h8" /><path d="M8 13h5" /></svg>;
  }

  return <svg {...common}><circle cx="12" cy="12" r="9" /></svg>;
}

// ==========================================
// INDICADOR COUNT
// ==========================================

function IndicatorCount({
  numero,
  label,
  cor,
  fundo,
  icone,
}) {

  return (

    <div className="lpc-indicator-count" style={{ backgroundColor: "#fbfcfd" }}>
      <div className="lpc-indicator-icon" style={{ color: cor }} aria-hidden="true">
        <PocIcon tipo={icone} />
      </div>

      <div
        className="lpc-indicator-number"
        style={{
          fontWeight:
            "bold",

          color:
            cor,
        }}
      >
        {numero}
      </div>

      <div
        className="lpc-indicator-label"
        style={{
          color:
            "#667085",
        }}
      >
        {label}
      </div>

    </div>

  );
}


// ==========================================
// RESUMO EXECUTIVO
// ==========================================

function ResumoExecutivo({
  dashboard,
}) {

  const historico =
    dashboard
      .historicoScore ||
    [];

  const scoreAtual =
    Number(
      dashboard.score || 0
    );

  let scoreAnterior =
    null;

  if (
    historico.length >= 2
  ) {

    scoreAnterior =
      Number(
        historico[
          historico.length - 2
        ].score || 0
      );

  }

  const variacao =
    scoreAnterior === null
      ? null
      : scoreAtual -
        scoreAnterior;

  let tendencia =
    "→ Estável";

  let corTendencia =
    "#6b7280";

  if (
    variacao !== null
  ) {

    if (
      variacao > 1
    ) {

      tendencia =
        "↗ Em evolução";

      corTendencia =
        "#16a34a";

    } else if (
      variacao < -1
    ) {

      tendencia =
        "↘ Em queda";

      corTendencia =
        "#dc2626";

    }

  }

  const indicadores =
    Object.values(
      dashboard
        .indicadoresScore ||
        {}
    );

  const verdes =
    indicadores.filter(
      (item) =>
        item.status ===
        "verde"
    ).length;

  const amarelos =
    indicadores.filter(
      (item) =>
        item.status ===
        "amarelo"
    ).length;

  const vermelhos =
    indicadores.filter(
      (item) =>
        item.status ===
        "vermelho"
    ).length;

  const indicadoresValidos =
    indicadores.filter(
      (item) =>
        item.atingimento !==
          null &&
        item.status !==
          "na"
    );

  let melhorIndicador =
    null;

  if (
    indicadoresValidos.length > 0
  ) {

    melhorIndicador =
      [...indicadoresValidos]
        .sort(
          (a, b) =>
            b.atingimento -
            a.atingimento
        )[0];

  }

  let pontoAtencao =
    null;

  if (
    dashboard
      .pontosAtencao
      ?.length > 0
  ) {

    pontoAtencao =
      dashboard
        .pontosAtencao[0];

  }

  let recomendacao =
    "REVISAR";

  let corRecomendacao =
    "#dc2626";

  if (
    scoreAtual >= 80 &&
    vermelhos === 0
  ) {

    recomendacao =
      "GO";

    corRecomendacao =
      "#16a34a";

  } else if (
    scoreAtual >= 60
  ) {

    recomendacao =
      "GO COM ACOMPANHAMENTO";

    corRecomendacao =
      "#d97706";

  }

  return (

    <div>

      <div
        style={{
          display:
            "grid",

          gridTemplateColumns:
            "280px repeat(4, 1fr)",

          gap:
            "16px",

          marginBottom:
            "20px",
        }}
      >

        <div
          style={{
            backgroundColor:
              "#ffffff",

            borderRadius:
              "12px",

            padding:
              "24px",

            textAlign:
              "center",

            borderTop:
              `6px solid ${corRecomendacao}`,

            boxShadow:
              "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >

          <div
            style={{
              fontSize:
                "13px",

              color:
                "#6b7280",
            }}
          >
            SCORE DA POC
          </div>

          <div
            style={{
              fontSize:
                "48px",

              fontWeight:
                "bold",

              color:
                corRecomendacao,

              margin:
                "8px 0",
            }}
          >

            {scoreAtual.toFixed(
              1
            )}

          </div>

          <div
            style={{
              fontWeight:
                "bold",

              color:
                corRecomendacao,

              fontSize:
                "13px",
            }}
          >
            {dashboard.statusScore?.status}
          </div>

        </div>

        <ExecutiveCard
          titulo="Variação"
          valor={
            variacao ===
            null
              ? "N/A"
              : `${variacao >= 0 ? "+" : ""}${variacao.toFixed(
                  1
                )} pts`
          }
          detalhe={
            scoreAnterior ===
            null
              ? "Sem mês anterior"
              : `Anterior: ${scoreAnterior.toFixed(
                  1
                )}`
          }
          cor={
            corTendencia
          }
        />

        <ExecutiveCard
          titulo="Tendência"
          valor={
            tendencia
          }
          detalhe={
            "Comparação com o mês anterior"
          }
          cor={
            corTendencia
          }
        />

        <ExecutiveCard
          titulo="Melhor indicador"
          valor={
            melhorIndicador
              ?.nome ||
            "N/A"
          }
          detalhe={
            melhorIndicador
              ? `Atingimento: ${Number(
                  melhorIndicador.atingimento
                ).toFixed(
                  1
                )}%`
              : ""
          }
          cor="#16a34a"
        />

        <ExecutiveCard
          titulo="Recomendação"
          valor={
            recomendacao
          }
          detalhe={
            `${verdes} dentro • ${amarelos} atenção • ${vermelhos} abaixo`
          }
          cor={
            corRecomendacao
          }
        />

      </div>

      <div
        style={{
          display:
            "grid",

          gridTemplateColumns:
            "1fr 1fr",

          gap:
            "16px",
        }}
      >

        <div
          style={{
            padding:
              "20px",

            backgroundColor:
              "#f0fdf4",

            borderRadius:
              "10px",

            borderLeft:
              "5px solid #16a34a",
          }}
        >

          <div
            style={{
              fontSize:
                "12px",

              fontWeight:
                "bold",

              color:
                "#166534",

              marginBottom:
                "8px",
            }}
          >
            DESTAQUE POSITIVO
          </div>

          <div
            style={{
              fontSize:
                "18px",

              fontWeight:
                "bold",

              color:
                "#14532d",
            }}
          >

            {melhorIndicador
              ?.nome ||
              "N/A"}

          </div>

          <div
            style={{
              marginTop:
                "5px",

              color:
                "#166534",
            }}
          >

            {melhorIndicador
              ? `Atingimento de ${Number(
                  melhorIndicador.atingimento
                ).toFixed(
                  1
                )}%`
              : "Sem dados"}

          </div>

        </div>

        <div
          style={{
            padding:
              "20px",

            backgroundColor:
              "#fef2f2",

            borderRadius:
              "10px",

            borderLeft:
              "5px solid #dc2626",
          }}
        >

          <div
            style={{
              fontSize:
                "12px",

              fontWeight:
                "bold",

              color:
                "#991b1b",

              marginBottom:
                "8px",
            }}
          >
            PRINCIPAL PONTO DE ATENÇÃO
          </div>

          <div
            style={{
              fontSize:
                "18px",

              fontWeight:
                "bold",

              color:
                "#7f1d1d",
            }}
          >

            {pontoAtencao
              ?.nome ||
              "Nenhum indicador crítico"}

          </div>

          {pontoAtencao && (

            <div
              style={{
                marginTop:
                  "5px",

                color:
                  "#991b1b",
              }}
            >

              Resultado:{" "}

              <strong>
                {formatarResultado(
                  pontoAtencao
                )}
              </strong>

              {" | "}

              Meta:{" "}

              <strong>
                {formatarMeta(
                  pontoAtencao
                )}
              </strong>

            </div>

          )}

        </div>

      </div>

      <div
        style={{
          marginTop:
            "20px",

          padding:
            "20px",

          backgroundColor:
            corRecomendacao ===
            "#16a34a"
              ? "#f0fdf4"
              : corRecomendacao ===
                "#d97706"
              ? "#fffbeb"
              : "#fef2f2",

          border:
            `1px solid ${corRecomendacao}`,

          borderRadius:
            "10px",
        }}
      >

        <div
          style={{
            fontSize:
              "12px",

            fontWeight:
              "bold",

            marginBottom:
              "6px",

            color:
              corRecomendacao,
          }}
        >
          RECOMENDAÇÃO DA POC
        </div>

        <div
          style={{
            fontSize:
              "22px",

            fontWeight:
              "bold",

            color:
              corRecomendacao,
          }}
        >

          {recomendacao}

        </div>

      </div>

    </div>

  );
}


// ==========================================
// HISTÓRICO SCORE
// ==========================================

function HistoricoScore({
  historico,
}) {

  if (
    !historico ||
    historico.length === 0
  ) {

    return (
      <div
        style={{
          padding:
            "30px",

          textAlign:
            "center",

          color:
            "#6b7280",

          backgroundColor:
            "#f9fafb",

          borderRadius:
            "10px",
        }}
      >
        Não existem dados históricos.
      </div>
    );
  }

  const maiorScore =
    Math.max(
      100,

      ...historico.map(
        (item) =>
          Number(
            item.score || 0
          )
      )
    );

  return (

    <div className="lpc-history">

      <div className="lpc-history-chart">

        <div
          style={{
            display:
              "flex",

            alignItems:
              "flex-end",

            justifyContent:
              "space-around",

            height:
              "260px",

            gap:
              "20px",
          }}
        >

          {historico.map(
            (item) => {

              const score =
                Number(
                  item.score || 0
                );

              const altura =
                Math.max(
                  8,

                  (
                    score /
                    maiorScore
                  ) *
                  200
                );

              const cor =
                score >= 80
                  ? "#16a34a"
                  : score >= 60
                  ? "#d97706"
                  : "#dc2626";

              return (

                <div
                  className="lpc-history-bar-wrap"
                  key={item.mesReferencia}
                >
                  <div
                    className="lpc-history-score"
                    style={{ color: cor }}
                  >
                    {score.toFixed(1)}
                  </div>

                  <div
                    className="lpc-history-bar"
                    style={{
                      height: `${altura}px`,
                      backgroundColor: cor,
                    }}
                  />

                  <div className="lpc-history-month">
                    {formatarMes(item.mesReferencia)}
                  </div>
                </div>

              );

            }
          )}

        </div>

      </div>

    </div>

  );
}


// ==========================================
// PAINEL ESTRATÉGICO DOS KPIs DA POC
// ==========================================

function StrategicScorePanel({
  score,
  status,
}) {

  const valor = Number(score || 0);

  let cor = "#d9232e";
  let leitura = "NO-GO";
  let faixa = "< 60%";

  if (valor >= 80) {
    cor = "#22963a";
    leitura = "GO";
    faixa = "≥ 80%";
  } else if (valor >= 60) {
    cor = "#ee9f00";
    leitura = "ACOMPANHAR";
    faixa = "60% – 79%";
  }

  const raio = 42;
  const circunferencia = 2 * Math.PI * raio;
  const progresso = Math.min(Math.max(valor, 0), 100);
  const dash = (progresso / 100) * circunferencia;

  return (
    <div
      className={`lpc-strategic-score-panel ${valor >= 80 ? "score-go" : valor >= 60 ? "score-warning" : "score-danger"}`}
      style={{ "--score-color": cor }}
    >
      <div className="lpc-strategic-score-title">
        SCORE POC
      </div>

      <div className="lpc-score-ring">
        <svg viewBox="0 0 110 110" aria-hidden="true">
          <circle
            cx="55"
            cy="55"
            r={raio}
            className="lpc-score-ring-track"
          />
          <circle
            cx="55"
            cy="55"
            r={raio}
            className="lpc-score-ring-progress"
            strokeDasharray={`${dash} ${circunferencia}`}
          />
        </svg>
        <strong>{valor.toFixed(0)}%</strong>
      </div>

      <div className="lpc-score-performance">
        Desempenho Geral
      </div>


      <div className="lpc-score-current-status" style={{ color: cor }}>
        <strong>{leitura}</strong>
        <small>{faixa}</small>
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

  return (
    <div className="lpc-strategic-kpi-icon" aria-hidden="true">
      {simbolo}
    </div>
  );
}

function StrategicKpiCard({ item }) {

  let cor = "#d9232e";
  let statusLabel = "Abaixo da meta";

  if (item.status === "verde") {
    cor = "#22963a";
    statusLabel = "Atingiu meta";
  } else if (item.status === "amarelo") {
    cor = "#ee9f00";
    statusLabel = "Atenção";
  } else if (item.status === "na") {
    cor = "#98a2b3";
    statusLabel = "N/A";
  }

  const atingimento =
    item.atingimento === null || item.atingimento === undefined
      ? "N/A"
      : `${Number(item.atingimento).toFixed(1)}%`;

  const contribuicao =
    item.contribuicao === null || item.contribuicao === undefined
      ? "N/A"
      : `${Number(item.contribuicao).toFixed(2)} pts`;

  return (
    <div
      className="lpc-strategic-kpi-card"
      style={{ "--kpi-status": cor }}
    >
      <div className="lpc-strategic-kpi-head">
        <StrategicKpiIcon nome={item.nome} />
        <div className="lpc-strategic-kpi-name">
          <strong>{item.nome}</strong>
          <span>{item.descricao || "Indicador estratégico da POC"}</span>
        </div>
      </div>

      <div className="lpc-strategic-weight">
        Peso {Number(item.pesoEfetivo || 0).toFixed(0)}%
      </div>

      <div className="lpc-strategic-result">
        {formatarResultado(item)}
      </div>

      <div className="lpc-strategic-meta">
        <span>Meta: {formatarMeta(item)}</span>
        <span
          className="lpc-strategic-status-icon"
          style={{ color: cor }}
          title={statusLabel}
        >
          {item.status === "verde" ? "✓" : item.status === "amarelo" ? "!" : item.status === "na" ? "–" : "×"}
        </span>
      </div>

      <div className="lpc-strategic-detail">
        <div>
          <span>Atingimento</span>
          <strong style={{ color: cor }}>{atingimento}</strong>
        </div>
        <div>
          <span>Contribuição</span>
          <strong style={{ color: cor }}>{contribuicao}</strong>
        </div>
      </div>

      <div className="lpc-strategic-status-label" style={{ color: cor }}>
        <span className="lpc-status-dot" style={{ background: cor }} />
        {statusLabel}
      </div>
    </div>
  );
}

// ==========================================
// SCORE KPI
// ==========================================

function ScoreKpi({
  item,
}) {

  let cor =
    "#dc2626";

  if (
    item.status ===
    "verde"
  ) {

    cor =
      "#16a34a";

  } else if (
    item.status ===
    "amarelo"
  ) {

    cor =
      "#d97706";

  } else if (
    item.status ===
    "na"
  ) {

    cor =
      "#6b7280";
  }

  return (

    <div className="lpc-score-kpi" style={{ borderTop: `4px solid ${cor}` }}>

      <div className="lpc-score-kpi-title">
        {item.nome}
      </div>

      <div
        style={
          scoreLine
        }
      >

        <span
          style={
            scoreLabel
          }
        >
          Resultado
        </span>

        <strong>
          {
            formatarResultado(
              item
            )
          }
        </strong>

      </div>

      <div
        style={
          scoreLine
        }>

        <span
          style={
            scoreLabel
          }
        >
          Meta
        </span>

        <strong>
          {
            formatarMeta(
              item
            )
          }
        </strong>

      </div>

      <div
        style={
          scoreLine
        }>

        <span
          style={
            scoreLabel
          }
        >
          Atingimento
        </span>

        <strong
          style={{
            color:
              cor,
          }}
        >

          {
            item.atingimento ===
            null
              ? "N/A"
              : `${Number(
                  item.atingimento
                ).toFixed(
                  1
                )}%`
          }

        </strong>

      </div>

      <div
        style={
          scoreLine
        }>

        <span
          style={
            scoreLabel
          }
        >
          Peso
        </span>

        <strong>
          {
            Number(
              item.pesoEfetivo
            ).toFixed(
              2
            )
          }
          %
        </strong>

      </div>

      <div
        style={{
          ...scoreLine,

          paddingTop:
            "12px",

          marginTop:
            "8px",

          borderTop:
            "1px solid #e5e7eb",
        }}
      >

        <span
          style={{
            color:
              "#123B5D",

            fontWeight:
              "bold",
          }}
        >
          Contribuição
        </span>

        <strong
          style={{
            fontSize:
              "18px",

            color:
              cor,
          }}
        >

          {
            item.contribuicao ===
            null
              ? "N/A"
              : `+${Number(
                  item.contribuicao
                ).toFixed(
                  2
                )} pts`
          }

        </strong>

      </div>

      <div
        style={{
          marginTop:
            "12px",

          fontSize:
            "12px",

          fontWeight:
            "bold",

          color:
            cor,
        }}
      >

        {
          item.status ===
          "verde"
            ? "✓ Dentro da meta"
            : item.status ===
              "amarelo"
            ? "⚠ Atenção"
            : item.status ===
              "na"
            ? "— Não aplicável"
            : "✕ Abaixo da meta"
        }

      </div>

    </div>

  );
}


// ==========================================
// EXECUTIVE CARD
// ==========================================

function ExecutiveCard({
  titulo,
  valor,
  detalhe,
  cor,
}) {

  return (

    <div className="lpc-executive-card" style={{ borderLeft: `4px solid ${cor}` }}>

      <div className="lpc-executive-label">
        {titulo}
      </div>

      <div className="lpc-executive-value" style={{ color: cor }}>
        {valor}
      </div>

      <div className="lpc-executive-detail">
        {detalhe}
      </div>

    </div>

  );
}


// ==========================================
// RESUMO C-LEVEL
// ==========================================

function ExecutiveSummaryCard({
  icone,
  titulo,
  valor,
  detalhe,
  cor = "#123B5D",
  fundo = "#edf3f8",
}) {

  return (

    <div className="lpc-summary-card">

      <div
        className="lpc-summary-icon"
        style={{
          color: cor,
          backgroundColor: fundo,
        }}
      >
        <SummaryIcon tipo={icone} />
      </div>

      <div className="lpc-summary-content">
        <div className="lpc-summary-label">
          {titulo}
        </div>

        <div
          className="lpc-summary-value"
          style={{ color: cor }}
        >
          {valor}
        </div>

        <div className="lpc-summary-detail">
          {detalhe}
        </div>
      </div>

    </div>

  );
}

// ==========================================
// ÍCONES DOS CARDS RESUMO
// SVG inline para não adicionar dependências
// ==========================================

function SummaryIcon({ tipo }) {

  const common = {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  if (tipo === "users") {
    return (
      <svg {...common}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }

  if (tipo === "target") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (tipo === "arrow-up") {
    return (
      <svg {...common}>
        <path d="M12 19V5" />
        <path d="m6 11 6-6 6 6" />
      </svg>
    );
  }

  if (tipo === "arrow-down") {
    return (
      <svg {...common}>
        <path d="M12 5v14" />
        <path d="m18 13-6 6-6-6" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M10.3 3.2 2.8 16.1a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.2a2 2 0 0 0-3.4 0Z" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}


// ==========================================
// SECTION
// ==========================================

function Section({
  title,
  children,
}) {

  return (

    <section className="lpc-section">

      <h2 className="lpc-section-title">
        {title}
      </h2>

      {children}

    </section>

  );
}


// ==========================================
// FILTER
// ==========================================

function Filter({
  label,
  children,
}) {

  return (

    <div className="lpc-filter">

      <label className="lpc-filter-label">
        {label}
      </label>

      {children}

    </div>

  );
}


// ==========================================
// GRID
// ==========================================

function Grid({
  children,
}) {

  return (

    <div className="lpc-grid">
      {children}
    </div>

  );
}


// ==========================================
// KPI CARD
// ==========================================

function KpiCard({
  titulo,
  valor,
}) {

  return (

    <div className="lpc-kpi-card">

      <div className="lpc-kpi-label">
        {titulo}
      </div>

      <div className="lpc-kpi-value">
        {valor}
      </div>

    </div>

  );
}


// ==========================================
// FORMATAR RESULTADO
// ==========================================

function formatarResultado(
  item
) {

  if (
    item?.resultado ===
      null ||
    item?.resultado ===
      undefined
  ) {

    return "N/A";
  }

  if (
    item.unidade ===
    "%"
  ) {

    return `${Number(
      item.resultado
    ).toFixed(
      1
    )}%`;
  }

  if (
    item.unidade ===
    "dias"
  ) {

    return `${Number(
      item.resultado
    ).toFixed(
      0
    )} dias`;
  }

  return `${Number(
    item.resultado
  ).toFixed(
    0
  )} ${
    item.unidade || ""
  }`;
}


// ==========================================
// FORMATAR META
// ==========================================

function formatarMeta(
  item
) {

  if (
    item?.meta ===
      null ||
    item?.meta ===
      undefined
  ) {

    return "N/A";
  }

  if (
    item.tipo ===
    "menor"
  ) {

    if (
      item.unidade ===
      "dias"
    ) {

      return `≤ ${item.meta} dias`;
    }

    return `≤ ${item.meta}${item.unidade || ""}`;
  }

  return `≥ ${item.meta}${item.unidade || ""}`;
}


// ==========================================
// FORMATAR MÊS
// ==========================================

function formatarMes(
  referencia
) {

  if (
    !referencia
  ) {

    return "";
  }

  const partes =
    referencia.split("-");

  if (
    partes.length !== 2
  ) {

    return referencia;
  }

  const ano =
    partes[0];

  const mes =
    Number(
      partes[1]
    );

  const nomes = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];

  return `${nomes[
    mes - 1
  ]}/${ano.slice(-2)}`;
}


// ==========================================
// REFERÊNCIA MENSAL
// ==========================================

function obterMesReferencia(
  data
) {

  const ano =
    data.getFullYear();

  const mes =
    String(
      data.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  return `${ano}-${mes}`;
}


// ==========================================
// ESTILOS
// ==========================================

const inputStyle = {
  padding:
    "10px 12px",

  border:
    "1px solid #d1d5db",

  borderRadius:
    "6px",

  fontSize:
    "14px",

  backgroundColor:
    "#ffffff",
};

const buttonActive = {
  padding:
    "11px 20px",

  border:
    "none",

  borderRadius:
    "7px",

  backgroundColor:
    "#123B5D",

  color:
    "#ffffff",

  fontWeight:
    "bold",

  cursor:
    "pointer",
};

const buttonInactive = {
  padding:
    "11px 20px",

  border:
    "1px solid #d1d5db",

  borderRadius:
    "7px",

  backgroundColor:
    "#ffffff",

  color:
    "#374151",

  fontWeight:
    "bold",

  cursor:
    "pointer",
};

const scoreLine = {
  display:
    "flex",

  justifyContent:
    "space-between",

  marginBottom:
    "8px",
};

const scoreLabel = {
  color:
    "#6b7280",

  fontSize:
    "13px",
};


// ==========================================
// EXPORT
// ==========================================

export default App;