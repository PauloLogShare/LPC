export function processarDados(dados) {
  if (!dados || dados.length === 0) return [];

  return dados.map((item) => {
    const mes = converterData(item["Mês"]);
    return {
      cliente: item["Cliente"] || "",
      cs: item["CS"] || "",
      mes: mes,
      // Agora o sistema vai encontrar a função abaixo e gerar "2026-08" corretamente!
      mesReferencia: mes ? obterMesReferencia(mes) : "",
      diasAtraso: numero(item["Dias de Atraso"]),
      rotasTotais: numero(item["Rotas Totais"]),
      rotasDisponibilizadas: numero(item["Rotas Disponibilizadas"]),
      rotasSinergia: numero(item["Rotas com Sinergia"] || item["Rotas com Match"]),
      oportunidades: numero(item["Oportunidades Identificadas"]),
      rotasExecutadas: numero(item["Rotas Executadas"] || item["Rotas Realizadas"] || item["Embarques Realizados"]),
      embarquesPlanejados: numero(
        item["Embarques Planejados"] ||
        item["Rotas Planejadas"] ||
        item["Viagens Planejadas"] ||
        item["Planejado"] ||
        item["Embarques Ofertados"] ||
        item["Rotas Ofertadas"] ||
        item["Quantidade Ofertada"] ||
        item["Qtd Ofertada"]
      ),
      embarquesRealizados: numero(
        item["Embarques Realizados"] ||
        item["Rotas Executadas"] ||
        item["Rotas Realizadas"] ||
        item["Viagens Realizadas"] ||
        item["Realizado"] ||
        item["Embarques Executados"] ||
        item["Quantidade Realizada"] ||
        item["Qtd Realizada"]
      ),
      usuariosAtivos: numero(item["Usuários Ativos"]),
      saas: numero(item["SAAS (R$)"]),
      baseline: numero(item["Custo Baseline Atual (R$)"]),
      realizado: numero(item["Custo Realizado LogShare(R$)"]),
      embarquesOnTime: numero(item["Embarques On Time"]),
      embarquesTotal: numero(item["Embarques Total"]),
      co2: numero(item["CO₂ Evitado (kg)"]),
      arvores: numero(item["Equivalênciaem Arvores"]),
      camposFutebol: numero(item["Equivalência Campos Futebol"]),
      observacoes: item["Observações"] || "",
    };
  });
}

function numero(valor) {
  if (valor === null || valor === undefined || valor === "") return 0;
  if (typeof valor === "number") return valor;
  let texto = String(valor).trim();
  if (texto === "") return 0;
  texto = texto.replace(/R\$/gi, "").replace(/\s/g, "");
  if (texto.includes(",")) {
    texto = texto.replace(/\./g, "").replace(",", ".");
  } else {
    const partes = texto.split(".");
    if (partes.length > 2) texto = partes.join("");
  }
  const resultado = Number(texto);
  return isNaN(resultado) ? 0 : resultado;
}

// ========================================
// CONVERTER DATA (BLINDADA)
// ========================================
function converterData(valor) {
  if (!valor) return null;

  // 1. Agora que o excelService usa cellDates, a data chega pura aqui!
  if (valor instanceof Date) {
    // Usamos getUTC para ignorar o fuso horário brasileiro (-3h) e impedir que o mês caia para o anterior
    return new Date(valor.getUTCFullYear(), valor.getUTCMonth(), valor.getUTCDate());
  }

  // 2. Proteção caso a célula do Excel esteja em formato de "Texto" como "01/08/26"
  const texto = String(valor).trim();
  
  if (texto.includes("/")) {
    const partes = texto.split("/");
    let dia = Number(partes.shift());
    let mes = Number(partes.shift()) - 1;
    let ano = Number(partes.shift());
    
    if (isNaN(ano)) { ano = mes + 1; mes = dia - 1; dia = 1; } // Trata Mês/Ano (08/2026)
    if (ano < 100) ano += 2000; // Transforma "26" em 2026 (Adeus Ano 01!)
    
    if (ano) return new Date(ano, mes, dia);
  }
  
  if (texto.includes("-")) {
    const partes = texto.split("-");
    let p1 = Number(partes.shift());
    let p2 = Number(partes.shift()) - 1;
    let p3 = partes.length > 0 ? Number(partes.shift().substring(0,2)) : null;
    
    if (p1 > 1000) return new Date(p1, p2, p3 || 1); // YYYY-MM-DD
    if (p3 !== null) return new Date(p3 < 100 ? p3 + 2000 : p3, p2, p1); // DD-MM-YY
    return new Date(p2 < 100 ? p2 + 2000 : p2, p1, 1); // MM-YYYY
  }

  // 3. Fallback
  const d = new Date(texto);
  if (!isNaN(d.getTime())) return new Date(d.getFullYear(), d.getMonth(), d.getDate());

  return null;
}

// ========================================
// REFERÊNCIA MENSAL (A FUNÇÃO QUE FALTAVA!)
// ========================================
function obterMesReferencia(data) {
  if (!data) return "";
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  return `${ano}-${mes}`;
}
