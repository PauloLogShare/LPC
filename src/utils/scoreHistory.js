import {
  calcularScore,
} from "./scoreEngine";

// ==========================================
// HISTÓRICO MENSAL DO SCORE
// ==========================================

export function calcularHistoricoScore(
  dados
) {

  if (
    !dados ||
    dados.length === 0
  ) {
    return [];
  }

  // ========================================
  // AGRUPAR POR MÊS
  // ========================================

  const meses = {};

  dados.forEach((item) => {

    if (!item.mesReferencia) {
      return;
    }

    if (!meses[item.mesReferencia]) {
      meses[item.mesReferencia] = [];
    }

    meses[item.mesReferencia].push(
      item
    );

  });

  // ========================================
  // ORDENAR MESES
  // ========================================

  const referencias =
    Object.keys(meses).sort();

  // ========================================
  // CALCULAR SCORE DE CADA MÊS
  // ========================================

  const historico =
    referencias.map(
      (mesReferencia, indice) => {

        const registros =
          meses[mesReferencia];

        // ------------------------------------
        // Último registro do mês
        // ------------------------------------

        const ordenados =
          [...registros].sort(
            (a, b) =>
              a.mes - b.mes
          );

        const ultimo =
          ordenados[
            ordenados.length - 1
          ];

        // ------------------------------------
        // MÊS ANTERIOR
        // ------------------------------------

        let registroAnterior = null;

        if (indice > 0) {

          const referenciaAnterior =
            referencias[
              indice - 1
            ];

          const registrosAnterior =
            meses[
              referenciaAnterior
            ];

          const ordenadosAnterior =
            [...registrosAnterior].sort(
              (a, b) =>
                a.mes - b.mes
            );

          registroAnterior =
            ordenadosAnterior[
              ordenadosAnterior.length - 1
            ];
        }

        // ====================================
        // INDICADORES DO MÊS
        // ====================================

        const rotasTotais =
          Number(
            ultimo.rotasTotais || 0
          );

        const rotasDisponibilizadas =
          Number(
            ultimo.rotasDisponibilizadas || 0
          );

        const rotasSinergia =
          Number(
            ultimo.rotasSinergia || 0
          );

        const oportunidades =
          Number(
            ultimo.oportunidades || 0
          );

        const usuariosAtivos =
          Number(
            ultimo.usuariosAtivos || 0
          );

        const diasAtraso =
          Number(
            ultimo.diasAtraso || 0
          );

        const rotasExecutadas =
          Number(
            ultimo.rotasExecutadas || 0
          );

        // ====================================
        // EMBARQUES
        // ====================================

        const embarquesPlanejados =
          ordenados.reduce(
            (total, item) =>
              total +
              Number(
                item.embarquesPlanejados || 0
              ),
            0
          );

        const embarquesRealizados =
          ordenados.reduce(
            (total, item) =>
              total +
              Number(
                item.embarquesRealizados || 0
              ),
            0
          );

        const embarquesOnTime =
          ordenados.reduce(
            (total, item) =>
              total +
              Number(
                item.embarquesOnTime || 0
              ),
            0
          );

        const embarquesTotal =
          ordenados.reduce(
            (total, item) =>
              total +
              Number(
                item.embarquesTotal || 0
              ),
            0
          );

        // ====================================
        // FINANCEIRO
        // ====================================

        const baseline =
          ordenados.reduce(
            (total, item) =>
              total +
              Number(
                item.baseline || 0
              ),
            0
          );

        const realizado =
          ordenados.reduce(
            (total, item) =>
              total +
              Number(
                item.realizado || 0
              ),
            0
          );

        const saving =
          baseline -
          realizado;

        const investimento =
          Number(
            ultimo.saas || 0
          );

        // ====================================
        // KPIs
        // ====================================

        const cobertura =
          rotasTotais > 0
            ? (
                rotasDisponibilizadas /
                rotasTotais
              ) *
              100
            : 0;

        const oportunidade =
          rotasDisponibilizadas > 0
            ? (
                rotasSinergia /
                rotasDisponibilizadas
              ) *
              100
            : 0;

        const conversao =
          oportunidades > 0
            ? (
                rotasExecutadas /
                oportunidades
              ) *
              100
            : 0;

        const aderencia =
          embarquesPlanejados > 0
            ? (
                embarquesRealizados /
                embarquesPlanejados
              ) *
              100
            : 0;

        const onTime =
          embarquesTotal > 0
            ? (
                embarquesOnTime /
                embarquesTotal
              ) *
              100
            : 0;

        // ====================================
        // ROI
        //
        // Se investimento = 0,
        // ROI permanece N/A.
        // ====================================

        let roi = null;

        if (
          investimento > 0
        ) {

          roi =
            (
              saving /
              investimento
            ) *
            100;

        }

        // ====================================
        // VOLUME
        //
        // Crescimento deste mês
        // em relação ao mês anterior.
        // ====================================

        let volume = null;

        if (
          indice > 0 &&
          registroAnterior
        ) {

          const embarquesAnterior =
            Number(
              registroAnterior
                .embarquesRealizados ||
              0
            );

          const embarquesAtual =
            Number(
              ultimo
                .embarquesRealizados ||
              0
            );

          if (
            embarquesAnterior > 0
          ) {

            volume =
              (
                (
                  embarquesAtual -
                  embarquesAnterior
                ) /
                embarquesAnterior
              ) *
              100;

          }

        }

        // ====================================
        // SCORE
        // ====================================

        const resultado =
          calcularScore({

            diasAtraso,

            usuariosAtivos,

            cobertura,

            oportunidade,

            conversao,

            aderencia,

            volume,

            saving,

            investimento,

            onTime,

          });

        // ====================================
        // RETORNO
        // ====================================

        return {

          mesReferencia,

          mes:
            ultimo.mes,

          score:
            resultado.score,

          status:
            resultado.status,

          indicadores:
            resultado.indicadores,

          // ==================================
          // VALORES DOS KPIs
          // ==================================

          valores: {

            cronograma:
              diasAtraso,

            utilizacao:
              usuariosAtivos,

            cobertura,

            oportunidade,

            conversao,

            aderencia,

            volume,

            roi,

            onTime,

          },

          // ==================================
          // VALORES DO MÊS ANTERIOR
          // ==================================

          valoresAnteriores: {

            cronograma:
              registroAnterior
                ? Number(
                    registroAnterior
                      .diasAtraso || 0
                  )
                : null,

            utilizacao:
              registroAnterior
                ? Number(
                    registroAnterior
                      .usuariosAtivos || 0
                  )
                : null,

            cobertura:
              registroAnterior
                ? calcularCoberturaAnterior(
                    registroAnterior
                  )
                : null,

            oportunidade:
              registroAnterior
                ? calcularOportunidadeAnterior(
                    registroAnterior
                  )
                : null,

            conversao:
              registroAnterior
                ? calcularConversaoAnterior(
                    registroAnterior
                  )
                : null,

            aderencia:
              registroAnterior
                ? calcularAderenciaAnterior(
                    registroAnterior
                  )
                : null,

            volume:
              calcularVolumeAnterior(
                referencias,
                indice,
                meses
              ),

            roi:
              registroAnterior
                ? calcularROIAnterior(
                    registroAnterior
                  )
                : null,

            onTime:
              registroAnterior
                ? calcularOnTimeAnterior(
                    registroAnterior
                  )
                : null,

          },

        };

      }
    );


  // ========================================
  // CALCULAR TENDÊNCIAS
  // ========================================

  return historico.map(
    (item) => {

      const tendencias = {};

      const nomes = [
        "cronograma",
        "utilizacao",
        "cobertura",
        "oportunidade",
        "conversao",
        "aderencia",
        "volume",
        "roi",
        "onTime",
      ];

      nomes.forEach(
        (nome) => {

          const atual =
            item.valores[
              nome
            ];

          const anterior =
            item.valoresAnteriores[
              nome
            ];

          tendencias[nome] =
            calcularTendencia(
              atual,
              anterior,
              nome
            );

        }
      );

      return {
        ...item,
        tendencias,
      };

    }
  );
}


// ==========================================
// TENDÊNCIA
// ==========================================
//
// Para a maioria dos indicadores:
//
// maior = melhor
//
// Exceção:
//
// Cronograma
// menor = melhor
//
// ==========================================

function calcularTendencia(
  atual,
  anterior,
  indicador
) {

  if (
    atual === null ||
    atual === undefined ||
    anterior === null ||
    anterior === undefined
  ) {

    return {

      variacao:
        null,

      direcao:
        "na",

      status:
        "na",

      texto:
        "Sem histórico",

    };

  }


  const variacao =
    atual -
    anterior;


  // ========================================
  // ESTABILIDADE
  // ========================================

  if (
    Math.abs(
      variacao
    ) < 0.01
  ) {

    return {

      variacao:
        0,

      direcao:
        "estavel",

      status:
        "amarelo",

      texto:
        "Estável",

    };

  }


  // ========================================
  // CRONOGRAMA
  //
  // Menos dias = melhor
  // ========================================

  if (
    indicador ===
    "cronograma"
  ) {

    if (
      variacao < 0
    ) {

      return {

        variacao,

        direcao:
          "melhorando",

        status:
          "verde",

        texto:
          "Melhorando",

      };

    }


    return {

      variacao,

      direcao:
        "piorando",

      status:
        "vermelho",

      texto:
        "Piorando",

    };

  }


  // ========================================
  // DEMAIS INDICADORES
  //
  // Maior = melhor
  // ========================================

  if (
    variacao > 0
  ) {

    return {

      variacao,

      direcao:
        "melhorando",

      status:
        "verde",

      texto:
        "Melhorando",

    };

  }


  return {

    variacao,

    direcao:
      "piorando",

    status:
      "vermelho",

    texto:
      "Piorando",

  };

}


// ==========================================
// COBERTURA ANTERIOR
// ==========================================

function calcularCoberturaAnterior(
  item
) {

  const total =
    Number(
      item.rotasTotais || 0
    );

  const disponibilizadas =
    Number(
      item.rotasDisponibilizadas || 0
    );

  if (
    total === 0
  ) {
    return 0;
  }

  return (
    disponibilizadas /
    total
  ) * 100;
}


// ==========================================
// OPORTUNIDADE ANTERIOR
// ==========================================

function calcularOportunidadeAnterior(
  item
) {

  const disponibilizadas =
    Number(
      item.rotasDisponibilizadas || 0
    );

  const sinergia =
    Number(
      item.rotasSinergia || 0
    );

  if (
    disponibilizadas === 0
  ) {
    return 0;
  }

  return (
    sinergia /
    disponibilizadas
  ) * 100;
}


// ==========================================
// CONVERSÃO ANTERIOR
// ==========================================

function calcularConversaoAnterior(
  item
) {

  const oportunidades =
    Number(
      item.oportunidades || 0
    );

  const executadas =
    Number(
      item.rotasExecutadas || 0
    );

  if (
    oportunidades === 0
  ) {
    return 0;
  }

  return (
    executadas /
    oportunidades
  ) * 100;
}


// ==========================================
// ADERÊNCIA ANTERIOR
// ==========================================

function calcularAderenciaAnterior(
  item
) {

  const planejados =
    Number(
      item.embarquesPlanejados || 0
    );

  const realizados =
    Number(
      item.embarquesRealizados || 0
    );

  if (
    planejados === 0
  ) {
    return 0;
  }

  return (
    realizados /
    planejados
  ) * 100;
}


// ==========================================
// ON TIME ANTERIOR
// ==========================================

function calcularOnTimeAnterior(
  item
) {

  const total =
    Number(
      item.embarquesTotal || 0
    );

  const onTime =
    Number(
      item.embarquesOnTime || 0
    );

  if (
    total === 0
  ) {
    return 0;
  }

  return (
    onTime /
    total
  ) * 100;
}


// ==========================================
// ROI ANTERIOR
// ==========================================

function calcularROIAnterior(
  item
) {

  const baseline =
    Number(
      item.baseline || 0
    );

  const realizado =
    Number(
      item.realizado || 0
    );

  const investimento =
    Number(
      item.saas || 0
    );

  if (
    investimento === 0
  ) {
    return null;
  }

  const saving =
    baseline -
    realizado;

  return (
    saving /
    investimento
  ) * 100;
}


// ==========================================
// VOLUME ANTERIOR
//
// Precisamos de pelo menos 3 meses:
// Mês atual
// Mês anterior
// Mês retrasado
// ==========================================

function calcularVolumeAnterior(
  referencias,
  indice,
  meses
) {

  if (
    indice < 2
  ) {
    return null;
  }

  const referenciaAnterior =
    referencias[
      indice - 1
    ];

  const referenciaRetrasada =
    referencias[
      indice - 2
    ];

  const registrosAnterior =
    meses[
      referenciaAnterior
    ];

  const registrosRetrasado =
    meses[
      referenciaRetrasada
    ];

  if (
    !registrosAnterior ||
    !registrosRetrasado
  ) {
    return null;
  }

  const anterior =
    Number(
      registrosAnterior[
        registrosAnterior.length - 1
      ]
        .embarquesRealizados ||
      0
    );

  const retrasado =
    Number(
      registrosRetrasado[
        registrosRetrasado.length - 1
      ]
        .embarquesRealizados ||
      0
    );

  if (
    retrasado === 0
  ) {
    return null;
  }

  return (
    (
      anterior -
      retrasado
    ) /
    retrasado
  ) * 100;
}