export function processarDados(dados) {
  if (!dados || dados.length === 0) {
    return [];
  }

  return dados.map((item) => {
    const mes = converterData(
      item["Mês"]
    );

    return {
      cliente: item["Cliente"] || "",
      cs: item["CS"] || "",

      mes: mes,

      // Formato utilizado pelo filtro
      mesReferencia: mes
        ? obterMesReferencia(mes)
        : "",

      // ================================
      // CRONOGRAMA
      // ================================

      diasAtraso: numero(
        item["Dias de Atraso"]
      ),

      // ================================
      // MALHA
      // ================================

      rotasTotais: numero(
        item["Rotas Totais"]
      ),

      rotasDisponibilizadas: numero(
        item["Rotas Disponibilizadas"]
      ),

      rotasSinergia: numero(
        item["Rotas com Sinergia"]
      ),

      oportunidades: numero(
        item["Oportunidades Identificadas"]
      ),

      // ================================
      // OPERAÇÃO
      // ================================

      rotasExecutadas: numero(
        item["Rotas Executadas"]
      ),

      embarquesPlanejados: numero(
        item["Embarques Planejados"]
      ),

      embarquesRealizados: numero(
        item["Embarques Realizados"]
      ),

      usuariosAtivos: numero(
        item["Usuários Ativos"]
      ),

      // ================================
      // FINANCEIRO
      // ================================

      saas: numero(
        item["SAAS (R$)"]
      ),

      baseline: numero(
        item["Custo Baseline Atual (R$)"]
      ),

      realizado: numero(
        item[
          "Custo Realizado LogShare(R$)"
        ]
      ),

      // ================================
      // SLA
      // ================================

      embarquesOnTime: numero(
        item["Embarques On Time"]
      ),

      embarquesTotal: numero(
        item["Embarques Total"]
      ),

      // ================================
      // SUSTENTABILIDADE
      // ================================

      co2: numero(
        item["CO₂ Evitado (kg)"]
      ),

      arvores: numero(
        item["Equivalênciaem Arvores"]
      ),

      camposFutebol: numero(
        item[
          "Equivalência Campos Futebol"
        ]
      ),

      // ================================
      // OBSERVAÇÕES
      // ================================

      observacoes:
        item["Observações"] || "",
    };
  });
}


// ========================================
// CONVERTER NÚMERO
// ========================================

function numero(valor) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return 0;
  }

  // Se o Excel já entregou como número
  if (typeof valor === "number") {
    return valor;
  }

  let texto = String(valor)
    .trim();

  if (texto === "") {
    return 0;
  }

  // Remove R$
  texto = texto.replace(
    /R\$/gi,
    ""
  );

  // Remove espaços
  texto = texto.replace(
    /\s/g,
    ""
  );

  // ----------------------------------------
  // Número brasileiro
  //
  // 1.234,56
  // 18.000,00
  // 7
  // 92,5
  // ----------------------------------------

  if (
    texto.includes(",")
  ) {

    texto = texto.replace(
      /\./g,
      ""
    );

    texto = texto.replace(
      ",",
      "."
    );

  } else {

    // Se não possui vírgula,
    // apenas remove separadores
    // de milhar quando necessário.

    const partes =
      texto.split(".");

    if (
      partes.length > 2
    ) {

      texto =
        partes.join("");

    }
  }

  const resultado =
    Number(texto);

  return isNaN(resultado)
    ? 0
    : resultado;
}


// ========================================
// CONVERTER DATA
// ========================================

function converterData(valor) {
  if (!valor) {
    return null;
  }

  // ----------------------------------------
  // Excel entrega como Date
  // ----------------------------------------

  if (
    valor instanceof Date
  ) {

    return new Date(
      valor.getFullYear(),
      valor.getMonth(),
      valor.getDate()
    );
  }


  // ----------------------------------------
  // Excel entrega como número serial
  // ----------------------------------------

  if (
    typeof valor === "number"
  ) {

    const dataBase =
      new Date(
        1899,
        11,
        30
      );

    dataBase.setDate(
      dataBase.getDate() +
        valor
    );

    return new Date(
      dataBase.getFullYear(),
      dataBase.getMonth(),
      dataBase.getDate()
    );
  }


  // ----------------------------------------
  // Texto
  // ----------------------------------------

  const texto =
    String(valor).trim();


  // ----------------------------------------
  // Formato brasileiro:
  //
  // 01/08/2026
  // ----------------------------------------

  const partes =
    texto.split("/");


  if (
    partes.length === 3
  ) {

    const dia =
      Number(partes[0]);

    const mes =
      Number(partes[1]) - 1;

    const ano =
      Number(partes[2]);

    const data =
      new Date(
        ano,
        mes,
        dia
      );

    if (
      !isNaN(
        data.getTime()
      )
    ) {

      return data;
    }
  }


  // ----------------------------------------
  // Outros formatos reconhecidos pelo JS
  // ----------------------------------------

  const data =
    new Date(texto);

  if (
    !isNaN(
      data.getTime()
    )
  ) {

    return new Date(
      data.getFullYear(),
      data.getMonth(),
      data.getDate()
    );
  }

  return null;
}


// ========================================
// REFERÊNCIA MENSAL
//
// Exemplo:
// 2026-07
// ========================================

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