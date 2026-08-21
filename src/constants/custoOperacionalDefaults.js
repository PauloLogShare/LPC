/**
 * custoOperacionalDefaults.js
 * Premissas e parâmetros padrão da metodologia de Custos Operacionais de Transporte (LPC).
 */

export const CUSTO_OPERACIONAL_DEFAULTS = {
  // Módulo 1: Premissas do Veículo
  veiculo: {
    identificacao: 'Volvo FH 460 (Cavalo 6x2)',
    placa: 'LOG-2026',
    tipoCarroceria: 'Cavalo + Carreta Baú 3 Eixos',
    anoModelo: 2023,
    valorAquisicao: 650000,      // Va: R$ 650.000,00
    percentualResidual: 0.40,     // 40%
    vidaUtilAnos: 5,             // N: 5 anos (60 meses)
    kmMediaMensal: 10000,        // 10.000 km/mês
    diasTrabalhadosMes: 24,      // 24 dias/mês
  },

  // Módulo 2: Custos Fixos do Equipamento (Mensais)
  custosFixos: {
    remuneracaoCapitalMensal: 3000, // Custo Oportunidade / Financiamento R$/mês
    ipvaLicenciamentoTacografoAnual: 9600, // R$ 9.600/ano -> R$ 800/mês
    seguroTotalAnual: 18000,        // R$ 18.000/ano -> R$ 1.500/mês
    rastreadorTelemetriaMensal: 300, // R$ 300/mês
    outrosFixosMensais: 0,
  },

  // Módulo 3: Custos Variáveis do Equipamento (por KM)
  custosVariaveis: {
    consumoDieselKmL: 2.5,        // 2,5 km/litro
    precoDieselLitro: 6.00,       // R$ 6,00/litro
    percentualArlaSobreDiesel: 0.05, // 5%
    precoArlaLitro: 3.50,         // R$ 3,50/litro
    qtdPneus: 22,                 // 22 pneus
    precoPneuNovo: 2800,          // R$ 2.800 cada
    qtdRecapagens: 2,             // 2 recapagens
    precoRecapagem: 700,          // R$ 700 cada
    vidaUtilTotalPneuKm: 180000,  // 180.000 km
    manutencaoPorKm: 0.45,        // R$ 0,45/km (preventiva + corretiva)
    lavagensGraxasPorKm: 0.05,    // R$ 0,05/km
  },

  // Módulo 4: Custos com Pessoal / Motorista e Diárias
  motorista: {
    nomePerfil: 'Motorista Carreta Interestadual',
    salarioBase: 3200,            // R$ 3.200,00
    adicionalPericulosidadeHE: 1200, // R$ 1.200,00 (periculosidade + HE fixas)
    fatorEncargosSociais: 0.65,   // 65% (INSS, FGTS, 13º, Férias, Rescisão)
    beneficiosMensais: 900,       // R$ 900,00 (VR, Saúde, Seguro Vida)
    diariaValorDia: 150,          // R$ 150,00/dia
    diasViagemMes: 20,            // 20 dias em viagem
    despesasEstivaAjudanteMes: 0, // Eventual
  },

  // Módulo 6: Parâmetros de Formação de Preço (Markup)
  markup: {
    despesasAdministrativasPerc: 0.05, // 5%
    impostosPerc: 0.12,                // 12% (PIS/COFINS/ICMS ou Simples)
    margemLucroDesejadaPerc: 0.15,     // 15% (EBITDA alvo)
  }
};
