/**
 * hubHistoricoService.js
 * Serviço de inteligência de Benchmark de Mercado baseado na base oficial
 * "HUB de Dados LogShare_Fretes Finalizados_Tabela.csv" (28.630 linhas).
 *
 * Mapeamento:
 * - rec_valor_frete: Valor de frete recebido do Embarcador (Valor de Mercado / Venda)
 * - des_valor_frete: Valor de frete pago ao Transportador (Custo Real de Mercado do Parceiro)
 * - eixos: Mapeado de acordo com a regra (Carreta=5, LS/Vanderleia=6, Bi-trem=7, Rodotrem=9, Truck=3, Toco=2)
 */

import hubData from '../data/hubHistoricoFretes.json';

function normalizar(texto) {
  if (!texto) return '';
  return texto
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Consulta o benchmark histórico de mercado para uma rota, considerando opcionalmente a quantidade de eixos.
 * @param {Object} params - { origem, destino, distancia, eixos }
 * @returns {Object} Resultado do benchmark com recValorFrete, desValorFrete, viagens, etc.
 */
function rotasProximadasMedia(rotas, campo) {
  const valores = rotas.map(r => r[campo] || 0).filter(v => v > 0);
  if (!valores.length) return 0;
  return valores.reduce((a, b) => a + b, 0) / valores.length;
}

/**
 * Consulta o benchmark histórico de mercado para uma rota, considerando opcionalmente a quantidade de eixos.
 * Restringe buscas aproximadas estritamente ao raio de 60 km da rota/cidade pesquisada.
 * @param {Object} params - { origem, destino, distancia, eixos }
 * @returns {Object} Resultado do benchmark com recValorFrete, desValorFrete, viagens, alertaDivergencia, etc.
 */
export function consultarBenchmarkHub({ origem, destino, distancia, eixos }) {
  if (!origem && !destino && (!distancia || distancia <= 0)) {
    return {
      encontrado: false,
      recValorFrete: 0,
      desValorFrete: 0,
      totalViagens: 0,
      tipoMatch: 'nenhum',
      alertaDivergencia: false,
      motivoAlerta: '',
      viagens: [],
      fonte: 'HUB LogShare Fretes Finalizados',
    };
  }

  const origNorm = normalizar(origem);
  const destNorm = normalizar(destino);
  const distNum  = Number(distancia) || 0;
  const eixosStr = eixos ? String(eixos).trim() : '';

  // 1. Busca correspondência exata de rota (Origem x Destino)
  if (origNorm && destNorm) {
    const rotaExata = hubData.rotas.find((r) => {
      const rOrig = normalizar(r.origem);
      const rDest = normalizar(r.destino);
      return (
        (rOrig.includes(origNorm) || origNorm.includes(rOrig)) &&
        (rDest.includes(destNorm) || destNorm.includes(rDest))
      );
    });

    if (rotaExata && rotaExata.recValorFrete > 0) {
      // Se houver estatística específica para a quantidade de eixos selecionada
      let recVal = rotaExata.recValorFrete;
      let desVal = rotaExata.desValorFrete;
      let eixosLabel = '';

      if (eixosStr && rotaExata.statsPorEixo && rotaExata.statsPorEixo[eixosStr]) {
        recVal = rotaExata.statsPorEixo[eixosStr].recMedia || recVal;
        desVal = rotaExata.statsPorEixo[eixosStr].desMedia || desVal;
        eixosLabel = ` (Filtrado para ${eixosStr} Eixos)`;
      }

      // Viagens filtradas ou completas
      const viagensFiltradas = (eixosStr && rotaExata.viagens)
        ? rotaExata.viagens.filter(v => String(v.eixos) === eixosStr)
        : (rotaExata.viagens || []);

      return {
        encontrado: true,
        tipoMatch: 'rota_exata',
        alertaDivergencia: false,
        motivoAlerta: '',
        rota: rotaExata.rota,
        distanciaKm: rotaExata.distanciaKm || distNum,
        recValorFrete: recVal,
        recMin: rotaExata.recMin,
        recMax: rotaExata.recMax,
        desValorFrete: desVal,
        desMin: rotaExata.desMin,
        desMax: rotaExata.desMax,
        valorKmRec: rotaExata.valorKmRec,
        valorKmDes: rotaExata.valorKmDes,
        totalViagens: rotaExata.totalViagens,
        viagens: (viagensFiltradas.length > 0 ? viagensFiltradas : rotaExata.viagens) || [],
        todasViagensRota: rotaExata.viagens || [],
        transportadoras: rotaExata.transportadoras || [],
        embarcadores: rotaExata.embarcadores || [],
        fonte: `HUB LogShare (${rotaExata.totalViagens} viagens finalizadas na rota exata${eixosLabel})`,
      };
    }
  }

  // 2. Busca por outras rotas com distância aproximada (desvio máximo de 60 km)
  if (distNum > 0) {
    const desvioMaxKm = 60;
    const rotasPorDistancia = hubData.rotas.filter((r) => {
      if (!r.distanciaKm || r.distanciaKm <= 0) return false;
      return Math.abs(r.distanciaKm - distNum) <= desvioMaxKm;
    });

    if (rotasPorDistancia.length > 0) {
      const todasViagensTotal = rotasPorDistancia.flatMap(r => r.viagens || []);
      
      // Se houver filtro de eixos, seleciona as viagens desse eixo se existirem
      let viagensEfetivas = todasViagensTotal;
      let eixosLabel = '';
      if (eixosStr) {
        const vEixos = todasViagensTotal.filter(v => String(v.eixos) === eixosStr);
        if (vEixos.length > 0) {
          viagensEfetivas = vEixos;
          eixosLabel = ` · ${eixosStr} Eixos`;
        }
      }

      const recs = viagensEfetivas.map(v => v.rec ?? v.recValorFrete).filter(v => v > 0);
      const deses = viagensEfetivas.map(v => v.des ?? v.desValorFrete).filter(v => v > 0);

      const recMedia = recs.length > 0
        ? Math.round(recs.reduce((a, b) => a + b, 0) / recs.length)
        : Math.round(rotasPorDistancia.reduce((a, b) => a + (b.recValorFrete || 0), 0) / rotasPorDistancia.length);

      const desMedia = deses.length > 0
        ? Math.round(deses.reduce((a, b) => a + b, 0) / deses.length)
        : Math.round(rotasPorDistancia.reduce((a, b) => a + (b.desValorFrete || 0), 0) / rotasPorDistancia.length);

      return {
        encontrado: true,
        tipoMatch: 'distancia_aproximada',
        alertaDivergencia: true,
        motivoAlerta: `Rota exata não encontrada no histórico. Benchmark apurado a partir de ${viagensEfetivas.length} viagens em rotas com distância equivalente (${distNum} km ± ${desvioMaxKm} km), podendo causar divergência em relação a uma negociação pontual nesta rota.`,
        distanciaKm: distNum,
        recValorFrete: recMedia,
        desValorFrete: desMedia,
        recMin: recs.length ? Math.min(...recs) : 0,
        recMax: recs.length ? Math.max(...recs) : 0,
        desMin: deses.length ? Math.min(...deses) : 0,
        desMax: deses.length ? Math.max(...deses) : 0,
        valorKmRec: Number((recMedia / distNum).toFixed(2)),
        valorKmDes: Number((desMedia / distNum).toFixed(2)),
        totalViagens: viagensEfetivas.length,
        viagens: viagensEfetivas.slice(0, 1000),
        todasViagensRota: todasViagensTotal.slice(0, 1000),
        transportadoras: rotasPorDistancia[0]?.transportadoras || [],
        embarcadores: rotasPorDistancia[0]?.embarcadores || [],
        fonte: `HUB LogShare (${viagensEfetivas.length} viagens em rotas de ${distNum} km ± ${desvioMaxKm} km${eixosLabel})`,
      };
    }
  }

  return {
    encontrado: false,
    recValorFrete: 0,
    desValorFrete: 0,
    totalViagens: 0,
    tipoMatch: 'nenhum',
    alertaDivergencia: false,
    motivoAlerta: '',
    viagens: [],
    fonte: 'HUB LogShare Fretes Finalizados',
  };
}

export function obterTodasViagensHub() {
  return hubData.rotas.flatMap(r => r.viagens || []);
}

export function obterResumoHubLogShare() {
  return hubData.resumoGlobal;
}

export function obterListaEmbarcadoresHub() {
  return hubData.principaisEmbarcadores || [];
}

export function obterListaTransportadorasHub() {
  return hubData.principaisTransportadoras || [];
}
