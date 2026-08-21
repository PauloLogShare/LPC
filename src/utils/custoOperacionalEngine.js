/**
 * custoOperacionalEngine.js
 * Motor de apuração de Custos Operacionais de Transporte (R$/km) e Formação de Preço.
 * Suporta valores zerados (0) sem reverter para defaults.
 */

function numOu(valor, padrao) {
  if (valor === undefined || valor === null || valor === '') return padrao;
  const n = Number(valor);
  return isNaN(n) ? padrao : n;
}

export function calcularCustoOperacional(config = {}) {
  const v   = config.veiculo || {};
  const cf  = config.custosFixos || {};
  const cv  = config.custosVariaveis || {};
  const mot = config.motorista || {};
  const mk  = config.markup || {};

  const kmMes = numOu(v.kmMediaMensal, 10000);
  const kmAno = kmMes * 12;

  // ───────────────────────────────────────────────────────────────────────────
  // Módulo 2: Custos Fixos do Equipamento
  // ───────────────────────────────────────────────────────────────────────────
  const valAquisicao = numOu(v.valorAquisicao, 650000);
  const percResidual = numOu(v.percentualResidual, 0.40);
  const valResidual  = valAquisicao * percResidual;
  const vidaUtilMeses = numOu(v.vidaUtilAnos, 5) * 12;
  const depreciacaoMensal = vidaUtilMeses > 0 ? (valAquisicao - valResidual) / vidaUtilMeses : 0;
  const depreciacaoPorKm  = kmMes > 0 ? depreciacaoMensal / kmMes : 0;

  const remunCapitalMensal = numOu(cf.remuneracaoCapitalMensal, 0);
  const remunCapitalPorKm  = kmMes > 0 ? remunCapitalMensal / kmMes : 0;

  const ipvaAnual  = numOu(cf.ipvaLicenciamentoTacografoAnual, 0);
  const ipvaMensal = ipvaAnual / 12;
  const ipvaPorKm  = kmMes > 0 ? ipvaMensal / kmMes : 0;

  const seguroAnual  = numOu(cf.seguroTotalAnual, 0);
  const seguroMensal = seguroAnual / 12;
  const seguroPorKm  = kmMes > 0 ? seguroMensal / kmMes : 0;

  const rastreadorMensal = numOu(cf.rastreadorTelemetriaMensal, 0);
  const rastreadorPorKm  = kmMes > 0 ? rastreadorMensal / kmMes : 0;

  const outrosFixosMensal = numOu(cf.outrosFixosMensais, 0);
  const outrosFixosPorKm  = kmMes > 0 ? outrosFixosMensal / kmMes : 0;

  const totalFixoMensal = depreciacaoMensal + remunCapitalMensal + ipvaMensal + seguroMensal + rastreadorMensal + outrosFixosMensal;
  const totalFixoAnual  = totalFixoMensal * 12;
  const totalFixoPorKm  = kmMes > 0 ? totalFixoMensal / kmMes : 0;

  // ───────────────────────────────────────────────────────────────────────────
  // Módulo 3: Custos Variáveis do Equipamento (R$/km)
  // ───────────────────────────────────────────────────────────────────────────
  const precoDiesel = numOu(cv.precoDieselLitro, 6.00);
  const consumoKmL  = numOu(cv.consumoDieselKmL, 2.5);
  const dieselPorKm = consumoKmL > 0 ? precoDiesel / consumoKmL : 0;
  const dieselMensal = dieselPorKm * kmMes;

  const percArla   = numOu(cv.percentualArlaSobreDiesel, 0.05);
  const precoArla  = numOu(cv.precoArlaLitro, 3.50);
  const arlaPorKm  = consumoKmL > 0 ? (percArla * precoArla) / consumoKmL : 0;
  const arlaMensal = arlaPorKm * kmMes;

  const qtdPneus       = numOu(cv.qtdPneus, 22);
  const precoPneuNovo  = numOu(cv.precoPneuNovo, 2800);
  const qtdRecapagens  = numOu(cv.qtdRecapagens, 2);
  const precoRecapagem = numOu(cv.precoRecapagem, 700);
  const vidaUtilPneuKm = numOu(cv.vidaUtilTotalPneuKm, 180000);

  const custoTotalCicloPneu = precoPneuNovo + (qtdRecapagens * precoRecapagem);
  const pneusPorKm = vidaUtilPneuKm > 0 ? (qtdPneus * custoTotalCicloPneu) / vidaUtilPneuKm : 0;
  const pneusMensal = pneusPorKm * kmMes;

  const manutencaoPorKm = numOu(cv.manutencaoPorKm, 0.45);
  const manutencaoMensal = manutencaoPorKm * kmMes;

  const lavagensPorKm = numOu(cv.lavagensGraxasPorKm, 0.05);
  const lavagensMensal = lavagensPorKm * kmMes;

  const totalVariavelPorKm = dieselPorKm + arlaPorKm + pneusPorKm + manutencaoPorKm + lavagensPorKm;
  const totalVariavelMensal = totalVariavelPorKm * kmMes;

  // ───────────────────────────────────────────────────────────────────────────
  // Módulo 4: Custos com Pessoal / Motorista e Diárias
  // ───────────────────────────────────────────────────────────────────────────
  const salarioBase = numOu(mot.salarioBase, 3200);
  const adicionaisHE = numOu(mot.adicionalPericulosidadeHE, 1200);
  const remuneracaoBruta = salarioBase + adicionaisHE;

  const fatorEncargos = numOu(mot.fatorEncargosSociais, 0.65);
  const encargosSociaisMensal = remuneracaoBruta * fatorEncargos;

  const beneficiosMensal = numOu(mot.beneficiosMensais, 900);

  // Diárias de Viagem: se valor ou dias for 0, resultado deve ser 0!
  const valorDiaria = numOu(mot.diariaValorDia, 0);
  const diasViagem  = numOu(mot.diasViagemMes, 0);
  const diariasMensal = valorDiaria * diasViagem;

  const estivaMensal = numOu(mot.despesasEstivaAjudanteMes, 0);

  const totalPessoalMensal = salarioBase + adicionaisHE + encargosSociaisMensal + beneficiosMensal + diariasMensal + estivaMensal;
  const totalPessoalPorKm  = kmMes > 0 ? totalPessoalMensal / kmMes : 0;

  // ───────────────────────────────────────────────────────────────────────────
  // Módulo 5: Resumo Consolidado e Custo Total por KM
  // ───────────────────────────────────────────────────────────────────────────
  const custoOperacionalTotalPorKm = totalFixoPorKm + totalVariavelPorKm + totalPessoalPorKm;
  const custoOperacionalTotalMensal = totalFixoMensal + totalVariavelMensal + totalPessoalMensal;

  const partFixo     = custoOperacionalTotalMensal > 0 ? (totalFixoMensal / custoOperacionalTotalMensal) * 100 : 0;
  const partVariavel = custoOperacionalTotalMensal > 0 ? (totalVariavelMensal / custoOperacionalTotalMensal) * 100 : 0;
  const partPessoal  = custoOperacionalTotalMensal > 0 ? (totalPessoalMensal / custoOperacionalTotalMensal) * 100 : 0;

  // ───────────────────────────────────────────────────────────────────────────
  // Módulo 6: Formação de Preço do Frete (Markup)
  // ───────────────────────────────────────────────────────────────────────────
  const despAdm  = numOu(mk.despesasAdministrativasPerc, 0.05);
  const impostos = numOu(mk.impostosPerc, 0.12);
  const margem   = numOu(mk.margemLucroDesejadaPerc, 0.15);
  const somaDeducoes = despAdm + impostos + margem;
  const divisorMarkup = Math.max(0.01, 1 - somaDeducoes);

  const pedagioMedioKm = 0.50;
  const precoFreteSugeridoPorKm = (custoOperacionalTotalPorKm + pedagioMedioKm) / divisorMarkup;

  return {
    kmMes,
    kmAno,

    // Fixos
    depreciacaoMensal,
    depreciacaoPorKm,
    remunCapitalMensal,
    remunCapitalPorKm,
    ipvaMensal,
    ipvaPorKm,
    seguroMensal,
    seguroPorKm,
    rastreadorMensal,
    rastreadorPorKm,
    totalFixoMensal,
    totalFixoAnual,
    totalFixoPorKm,
    partFixo,

    // Variáveis
    dieselPorKm,
    dieselMensal,
    arlaPorKm,
    arlaMensal,
    pneusPorKm,
    pneusMensal,
    manutencaoPorKm,
    manutencaoMensal,
    lavagensPorKm,
    lavagensMensal,
    totalVariavelPorKm,
    totalVariavelMensal,
    partVariavel,

    // Pessoal
    salarioBase,
    salarioBasePorKm: kmMes > 0 ? salarioBase / kmMes : 0,
    adicionaisHE,
    adicionaisHEPorKm: kmMes > 0 ? adicionaisHE / kmMes : 0,
    encargosSociaisMensal,
    encargosSociaisPorKm: kmMes > 0 ? encargosSociaisMensal / kmMes : 0,
    beneficiosMensal,
    beneficiosPorKm: kmMes > 0 ? beneficiosMensal / kmMes : 0,
    diariasMensal,
    diariasPorKm: kmMes > 0 ? diariasMensal / kmMes : 0,
    totalPessoalMensal,
    totalPessoalPorKm,
    partPessoal,

    // Consolidado
    custoOperacionalTotalPorKm,
    custoOperacionalTotalMensal,

    // Formação de Preço
    precoFreteSugeridoPorKm,
    somaDeducoes,
    divisorMarkup,
  };
}
