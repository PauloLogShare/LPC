/**
 * pricingDefaults.js
 * Parâmetros padrão da Calculadora de Frete LogShare (v18.3)
 * Todos os valores aqui são editáveis pelo usuário via PricingParametros.jsx
 */

export const PRICING_DEFAULTS = {
  /** Custo de Gerenciamento de Risco (R$ fixo por operação) */
  custoGr: 150,
  /** Alíquota PIS/COFINS — usada na recuperação fiscal (9,25%) */
  aliquotaRecuperacao: 0.0925,
  /** Alíquota TransÁgil (8,00%) */
  aliquotaTransAgil: 0.08,
  /** Custo operacional fixo por operação (R$) */
  custoOperacaoFixo: 342,
  /** Alíquota IPEF sobre valor pago (0,035%) */
  aliquotaIpef: 0.00035,
  /** Taxa financeira mensal (2,50%) */
  taxaFinanceiraMensal: 0.025,
  /** Taxa de desconto da plataforma TransÁgil (1,50%) */
  taxaDescontoTransAgil: 0.015,
  /** GRIS base para cálculo do ajuste (0,0300%) */
  grisBase: 0.0003,
};

/** Eixos suportados pela tabela ANTT */
export const ANTT_EIXOS = ['2', '3', '4', '5', '6', '7', '9'];

/** Tipos de carga disponíveis */
export const TIPOS_CARGA = [
  'Granel sólido',
  'Granel líquido',
  'Frigorificada ou Aquecida',
  'Conteinerizada',
  'Carga Geral',
  'Neogranel',
  'Perigosa (granel sólido)',
  'Perigosa (granel líquido)',
  'Perigosa (frigorificada ou aquecida)',
  'Perigosa (conteinerizada)',
  'Perigosa (carga geral)',
  'Carga Granel Pressurizada',
];

/**
 * Tabela ANTT padrão (Resolução vigente)
 * Estrutura: { tipo, carga, coeficiente, unidade, valores[7] }
 * valores[i] corresponde ao eixo ANTT_EIXOS[i]
 */
export const ANTT_PADRAO = [
  { tipo:"1",  carga:"Granel sólido",                        coeficiente:"CCD", unidade:"R$/km", valores:["4,0144","5,1355","5,8118","6,6983","7,3841","8,0516","9,2231"] },
  { tipo:"2",  carga:"Granel sólido",                        coeficiente:"CC",  unidade:"R$",    valores:["460,59","552,24","597","664,83","680,01","820,34","908,91"] },
  { tipo:"3",  carga:"Granel líquido",                       coeficiente:"CCD", unidade:"R$/km", valores:["4,0884","5,2311","5,9661","6,8661","7,5572","8,19","9,3822"] },
  { tipo:"4",  carga:"Granel líquido",                       coeficiente:"CC",  unidade:"R$",    valores:["471,98","569,57","621,52","693,08","709,72","840,5","934,76"] },
  { tipo:"5",  carga:"Frigorificada ou Aquecida",            coeficiente:"CCD", unidade:"R$/km", valores:["4,7095","6,0159","6,8646","7,8666","8,6661","9,5884","10,887"] },
  { tipo:"6",  carga:"Frigorificada ou Aquecida",            coeficiente:"CC",  unidade:"R$",    valores:["520,07","623,27","686,63","757,98","772,35","982,76","1067,06"] },
  { tipo:"7",  carga:"Conteinerizada",                       coeficiente:"CCD", unidade:"R$/km", valores:["","5,1082","5,7396","6,6345","7,3186","8,0492","9,1399"] },
  { tipo:"8",  carga:"Conteinerizada",                       coeficiente:"CC",  unidade:"R$",    valores:["","544,75","577,15","647,29","662,01","819,69","886,05"] },
  { tipo:"9",  carga:"Carga Geral",                          coeficiente:"CCD", unidade:"R$/km", valores:["3,9826","5,0977","5,7822","6,6718","7,3547","8,0927","9,2027"] },
  { tipo:"10", carga:"Carga Geral",                          coeficiente:"CC",  unidade:"R$",    valores:["451,84","541,86","588,86","657,56","671,93","831,66","903,32"] },
  { tipo:"11", carga:"Neogranel",                            coeficiente:"CCD", unidade:"R$/km", valores:["3,6023","5,0962","5,8094","6,6718","7,3547","8,0927","9,2027"] },
  { tipo:"12", carga:"Neogranel",                            coeficiente:"CC",  unidade:"R$",    valores:["451,84","541,44","596,35","657,56","671,93","831,66","903,32"] },
  { tipo:"13", carga:"Perigosa (granel sólido)",             coeficiente:"CCD", unidade:"R$/km", valores:["4,7845","5,9154","6,6285","7,515","8,2008","8,8866","10,066"] },
  { tipo:"14", carga:"Perigosa (granel sólido)",             coeficiente:"CC",  unidade:"R$",    valores:["608,79","703,16","753,03","820,86","836,04","981,39","1072,15"] },
  { tipo:"15", carga:"Perigosa (granel líquido)",            coeficiente:"CCD", unidade:"R$/km", valores:["4,871","6,0236","6,7628","7,6628","8,3539","9,0049","10,2051"] },
  { tipo:"16", carga:"Perigosa (granel líquido)",            coeficiente:"CC",  unidade:"R$",    valores:["632,58","732,9","789,96","861,51","878,16","1013,95","1110,41"] },
  { tipo:"17", carga:"Perigosa (frigorificada ou aquecida)", coeficiente:"CCD", unidade:"R$/km", valores:["5,3176","6,6369","7,502","8,5039","9,3034","10,2495","11,5584"] },
  { tipo:"18", carga:"Perigosa (frigorificada ou aquecida)", coeficiente:"CC",  unidade:"R$",    valores:["630,88","737,63","807,63","878,98","893,35","1110,28","1197,43"] },
  { tipo:"19", carga:"Perigosa (conteinerizada)",            coeficiente:"CCD", unidade:"R$/km", valores:["","5,4926","6,1608","7,0556","7,7398","8,4886","9,5873"] },
  { tipo:"20", carga:"Perigosa (conteinerizada)",            coeficiente:"CC",  unidade:"R$",    valores:["","645,45","682,95","753,1","767,81","930,51","999,06"] },
  { tipo:"21", carga:"Perigosa (carga geral)",               coeficiente:"CCD", unidade:"R$/km", valores:["4,3571","5,4821","6,2033","7,093","7,7758","8,5321","9,6501"] },
  { tipo:"22", carga:"Perigosa (carga geral)",               coeficiente:"CC",  unidade:"R$",    valores:["549,81","642,55","694,66","763,36","777,73","942,48","1016,33"] },
  { tipo:"23", carga:"Carga Granel Pressurizada",            coeficiente:"CCD", unidade:"R$/km", valores:["","","","7,0364","7,7652","","9,7444"] },
  { tipo:"24", carga:"Carga Granel Pressurizada",            coeficiente:"CC",  unidade:"R$",    valores:["","","","757,81","784,82","","1052,26"] },
];
