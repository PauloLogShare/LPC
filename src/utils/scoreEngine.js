// ==========================================
// LPC - SCORE ENGINE
// ==========================================

export const SCORE_CONFIG = {
  cronograma: {
    nome: "Cronograma",
    peso: 5,
    meta: 7,
    unidade: "dias",
    tipo: "menor",
  },

  utilizacao: {
    nome: "Utilização",
    peso: 5,
    meta: 1,
    unidade: "usuários",
    tipo: "maior",
  },

  cobertura: {
    nome: "Cobertura",
    peso: 10,
    meta: 80,
    unidade: "%",
    tipo: "maior",
  },

  oportunidade: {
    nome: "Oportunidade",
    peso: 15,
    meta: 20,
    unidade: "%",
    tipo: "maior",
  },

  conversao: {
    nome: "Conversão",
    peso: 10,
    meta: 25,
    unidade: "%",
    tipo: "maior",
  },

  aderencia: {
    nome: "Aderência",
    peso: 20,
    meta: 90,
    unidade: "%",
    tipo: "maior",
  },

  volume: {
    nome: "Volume",
    peso: 5,
    meta: 50,
    unidade: "%",
    tipo: "maior",
  },

  roi: {
    nome: "ROI",
    peso: 25,
    meta: 200,
    unidade: "%",
    tipo: "maior",
  },

  onTime: {
    nome: "On Time",
    peso: 5,
    meta: 92,
    unidade: "%",
    tipo: "maior",
  },
};


// ==========================================
// CALCULAR ATINGIMENTO
// ==========================================

function calcularAtingimento(
  valor,
  meta,
  tipo
) {
  if (
    valor === null ||
    valor === undefined ||
    meta === null ||
    meta === undefined
  ) {
    return null;
  }

  let atingimento = 0;

  // MAIOR É MELHOR
  if (tipo === "maior") {
    atingimento =
      (valor / meta) * 100;
  }

  // MENOR É MELHOR
  if (tipo === "menor") {

    if (valor <= meta) {
      atingimento = 100;
    } else {
      atingimento =
        (meta / valor) * 100;
    }
  }

  // Limita a 100%
  atingimento = Math.max(
    0,
    Math.min(
      100,
      atingimento
    )
  );

  return Number(
    atingimento.toFixed(1)
  );
}


// ==========================================
// STATUS
// ==========================================

function obterStatus(
  atingimento
) {
  if (
    atingimento === null ||
    atingimento === undefined
  ) {
    return "na";
  }

  if (atingimento >= 100) {
    return "verde";
  }

  if (atingimento >= 70) {
    return "amarelo";
  }

  return "vermelho";
}


// ==========================================
// ROI
// ==========================================

function calcularROI(
  saving,
  investimento
) {
  if (
    !investimento ||
    investimento <= 0
  ) {
    return null;
  }

  return (
    (saving / investimento) *
    100
  );
}


// ==========================================
// SCORE
// ==========================================

export function calcularScore(
  indicadores
) {

  const roi =
    calcularROI(
      indicadores.saving || 0,
      indicadores.investimento || 0
    );


  // ========================================
  // VALORES
  // ========================================

  const valores = {
    cronograma:
      indicadores.diasAtraso,

    utilizacao:
      indicadores.usuariosAtivos,

    cobertura:
      indicadores.cobertura,

    oportunidade:
      indicadores.oportunidade,

    conversao:
      indicadores.conversao,

    aderencia:
      indicadores.aderencia,

    volume:
      indicadores.volume,

    roi,

    onTime:
      indicadores.onTime,
  };


  // ========================================
  // CRIAR ESTRUTURA
  // ========================================

  const indicadoresScore = {};


  Object.keys(
    SCORE_CONFIG
  ).forEach(
    (chave) => {

      const config =
        SCORE_CONFIG[chave];

      const valor =
        valores[chave];

      const atingimento =
        calcularAtingimento(
          valor,
          config.meta,
          config.tipo
        );

      indicadoresScore[chave] = {

        nome:
          config.nome,

        resultado:
          valor,

        meta:
          config.meta,

        unidade:
          config.unidade,

        tipo:
          config.tipo,

        pesoOriginal:
          config.peso,

        pesoEfetivo:
          config.peso,

        atingimento,

        status:
          obterStatus(
            atingimento
          ),

        contribuicao:
          null,
      };
    }
  );


  // ========================================
  // KPIs APLICÁVEIS
  // ========================================

  const aplicaveis =
    Object.values(
      indicadoresScore
    ).filter(
      (item) =>
        item.atingimento !== null
    );


  // ========================================
  // PESO DISPONÍVEL
  // ========================================

  const pesoDisponivel =
    aplicaveis.reduce(
      (total, item) =>
        total +
        item.pesoOriginal,
      0
    );


  // ========================================
  // REDISTRIBUIR PESOS
  // ========================================

  aplicaveis.forEach(
    (item) => {

      item.pesoEfetivo =
        (
          item.pesoOriginal /
          pesoDisponivel
        ) *
        100;

      item.pesoEfetivo =
        Number(
          item.pesoEfetivo.toFixed(2)
        );
    }
  );


  // ========================================
  // CONTRIBUIÇÃO
  // ========================================

  aplicaveis.forEach(
    (item) => {

      item.contribuicao =
        (
          item.atingimento *
          item.pesoEfetivo
        ) /
        100;

      item.contribuicao =
        Number(
          item.contribuicao.toFixed(2)
        );
    }
  );


  // ========================================
  // SCORE FINAL
  // ========================================

  const score =
    aplicaveis.reduce(
      (total, item) =>
        total +
        item.contribuicao,
      0
    );


  const scoreFinal =
    Number(
      score.toFixed(2)
    );


  // ========================================
  // RESUMO
  // ========================================

  const verdes =
    aplicaveis.filter(
      (item) =>
        item.status === "verde"
    ).length;


  const amarelos =
    aplicaveis.filter(
      (item) =>
        item.status === "amarelo"
    ).length;


  const vermelhos =
    aplicaveis.filter(
      (item) =>
        item.status === "vermelho"
    ).length;


  const naoAplicaveis =
    Object.values(
      indicadoresScore
    ).filter(
      (item) =>
        item.status === "na"
    ).length;


  // ========================================
  // STATUS GERAL
  // ========================================

  let status;

  if (scoreFinal >= 80) {

    status = {
      status: "Excelente",
      nivel: "verde",
    };

  } else if (scoreFinal >= 60) {

    status = {
      status: "Acompanhar",
      nivel: "amarelo",
    };

  } else {

    status = {
      status: "Atenção",
      nivel: "vermelho",
    };
  }


  // ========================================
  // PONTOS DE ATENÇÃO
  // ========================================

  const pontosAtencao =
    aplicaveis
      .filter(
        (item) =>
          item.status ===
          "vermelho"
      )
      .sort(
        (a, b) =>
          a.atingimento -
          b.atingimento
      );


  return {

    score:
      scoreFinal,

    roi,

    status,

    indicadores:
      indicadoresScore,

    resumo: {

      verdes,

      amarelos,

      vermelhos,

      naoAplicaveis,

      totalValidos:
        aplicaveis.length,
    },

    pontosAtencao,

    pesoDisponivel,

    pontuacoes:
      Object.fromEntries(
        Object.entries(
          indicadoresScore
        ).map(
          ([chave, item]) => [
            chave,
            item.atingimento,
          ]
        )
      ),
  };
}


// ==========================================
// STATUS EXTERNO
// ==========================================

export function obterStatusScore(
  score
) {

  if (score >= 80) {

    return {
      status: "Excelente",
      nivel: "verde",
    };

  }

  if (score >= 60) {

    return {
      status: "Acompanhar",
      nivel: "amarelo",
    };

  }

  return {
    status: "Atenção",
    nivel: "vermelho",
  };
}