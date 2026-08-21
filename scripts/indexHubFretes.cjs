const fs = require('fs');
const path = require('path');

function parseCSVLine(text) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

function mapearEixos(tipo, cat) {
  const t = (tipo || '').toUpperCase().trim();
  const c = (cat || '').toUpperCase().trim();
  const full = `${t} ${c}`;

  if (full.includes('RODOTREM') || full.includes('9_EIXO') || full.includes('9 EIXO')) return '9';
  if (full.includes('BI-TREM') || full.includes('BITREM') || full.includes('SETE_EIXO') || full.includes('7 EIXO') || full.includes('7_EIXO')) return '7';
  if (full.includes('CARRETA_LS') || full.includes('CARRETA LS') || full.includes('VANDERLEIA') || full.includes('VANDERLEIRA') || full.includes('6_EIXO') || full.includes('6 EIXO')) return '6';
  if (full.includes('CARRETA') || full.includes('5_EIXO') || full.includes('5 EIXO')) return '5';
  if (full.includes('TRUCK') || full.includes('3_EIXO') || full.includes('3 EIXO')) return '3';
  if (full.includes('TOCO') || full.includes('TRES_QUARTOS') || full.includes('3/4') || full.includes('VUC') || full.includes('UTILITARIO') || full.includes('2_EIXO') || full.includes('2 EIXO')) return '2';
  return '6'; // Default Carreta LS
}

const csvPath = path.join(__dirname, '../src/data/hub_logshare_fretes_finalizados.csv');
const content = fs.readFileSync(csvPath, 'utf-8');
const lines = content.split('\n');
const header = parseCSVLine(lines[0]);

const getCol = (name) => header.findIndex(h => h.replace(/^\uFEFF/, '').trim() === name);

const idx = {
  frete_id: getCol('frete_id'),
  criado_em: getCol('criado_em'),
  embarcador_comprador: getCol('embarcador_comprador'),
  embarcador_vendedor: getCol('embarcador_vendedor'),
  cidade_origem: getCol('cidade_origem'),
  uf_origem: getCol('uf_origem'),
  cidade_destino: getCol('cidade_destino'),
  uf_destino: getCol('uf_destino'),
  rota_frete: getCol('rota_frete'),
  transportadora: getCol('transportadora'),
  tipo_veiculo: getCol('tipo_veiculo'),
  cat_veiculo: getCol('cat_veiculo'),
  distancia_km: getCol('distancia_km'),
  rec_valor_frete: getCol('rec_valor_frete'),
  des_valor_frete: getCol('des_valor_frete')
};

console.log('Column mapping:', idx);

const rotasAgg = {};
const todasViagensValidas = [];
const embarcadoresSet = new Set();
const transportadorasSet = new Set();
let totalRegistrosValidos = 0;
let totalRecGeral = 0, totalDesGeral = 0, countRecGeral = 0, countDesGeral = 0, totalKmGeral = 0, countKmGeral = 0;

for (let i = 1; i < lines.length; i++) {
  if (!lines[i].trim()) continue;
  const cols = parseCSVLine(lines[i]);
  
  const freteId = cols[idx.frete_id] || String(i);
  const dataCriacao = cols[idx.criado_em] || '';
  const orig = (cols[idx.cidade_origem] || '').toUpperCase();
  const ufOrig = (cols[idx.uf_origem] || '').toUpperCase();
  const dest = (cols[idx.cidade_destino] || '').toUpperCase();
  const ufDest = (cols[idx.uf_destino] || '').toUpperCase();
  const transp = cols[idx.transportadora] || '';
  const emb = cols[idx.embarcador_comprador] || cols[idx.embarcador_vendedor] || '';
  const tipoVeiculo = cols[idx.tipo_veiculo] || '';
  const catVeiculo = cols[idx.cat_veiculo] || '';
  const eixos = mapearEixos(tipoVeiculo, catVeiculo);
  const dist = parseFloat((cols[idx.distancia_km] || '0').replace(',', '.'));
  
  const recStr = cols[idx.rec_valor_frete];
  const desStr = cols[idx.des_valor_frete];
  const rec = recStr && recStr !== '-' ? parseFloat(recStr.replace(',', '.')) : null;
  const des = desStr && desStr !== '-' ? parseFloat(desStr.replace(',', '.')) : null;

  if (emb && emb.length > 2 && emb !== '-') embarcadoresSet.add(emb);
  if (transp && transp.length > 2 && transp !== '-') transportadorasSet.add(transp);

  if (rec !== null && !isNaN(rec) && rec > 0) {
    countRecGeral++;
    totalRecGeral += rec;
  }
  if (des !== null && !isNaN(des) && des > 0) {
    countDesGeral++;
    totalDesGeral += des;
  }
  if (dist > 0) {
    countKmGeral++;
    totalKmGeral += dist;
  }

  if (orig && dest && (rec > 0 || des > 0)) {
    totalRegistrosValidos++;
    const rotaKey = `${orig}/${ufOrig} x ${dest}/${ufDest}`;
    
    const viagemObj = {
      id: freteId,
      data: dataCriacao,
      origem: `${orig}/${ufOrig}`,
      destino: `${dest}/${ufDest}`,
      distanciaKm: dist || 0,
      tipoVeiculo: tipoVeiculo || 'CARRETA_LS',
      catVeiculo: catVeiculo || 'BAU_SECO',
      eixos,
      recValorFrete: rec || 0,
      desValorFrete: des || 0,
      margemBruta: (rec && des) ? Number((rec - des).toFixed(2)) : 0,
      margemPerc: (rec && des && des > 0) ? Number((((rec - des) / des) * 100).toFixed(1)) : 0,
      embarcador: emb || '—',
      transportadora: transp || '—'
    };

    todasViagensValidas.push(viagemObj);

    if (!rotasAgg[rotaKey]) {
      rotasAgg[rotaKey] = {
        origem: `${orig}/${ufOrig}`,
        destino: `${dest}/${ufDest}`,
        distancias: [],
        recs: [],
        deses: [],
        porEixos: { '2': [], '3': [], '5': [], '6': [], '7': [], '9': [] },
        transportadoras: new Set(),
        embarcadores: new Set(),
        viagens: []
      };
    }
    const r = rotasAgg[rotaKey];
    if (dist > 0) r.distancias.push(dist);
    if (rec > 0) r.recs.push(rec);
    if (des > 0) r.deses.push(des);
    if (r.porEixos[eixos]) {
      r.porEixos[eixos].push({ rec: rec || 0, des: des || 0, dist: dist || 0 });
    }
    if (transp) r.transportadoras.add(transp);
    if (emb) r.embarcadores.add(emb);
    r.viagens.push(viagemObj);
  }
}

console.log('Total rotas agregadas com valores:', Object.keys(rotasAgg).length);
console.log('Total registros com valores:', totalRegistrosValidos);

const sumStats = (arr) => {
  if (!arr.length) return { media: 0, min: 0, max: 0, qtd: 0 };
  const s = arr.reduce((a, b) => a + b, 0);
  return {
    media: Math.round(s / arr.length),
    min: Math.min(...arr),
    max: Math.max(...arr),
    qtd: arr.length
  };
};

const rotasArray = Object.entries(rotasAgg).map(([rota, data]) => {
  const distMed = data.distancias.length ? Math.round(data.distancias.reduce((a, b) => a + b, 0) / data.distancias.length) : 0;
  const recStats = sumStats(data.recs);
  const desStats = sumStats(data.deses);

  // Médias por eixo específico
  const statsPorEixo = {};
  for (const [eixo, list] of Object.entries(data.porEixos)) {
    if (list.length > 0) {
      const recsEixo = list.map(l => l.rec).filter(v => v > 0);
      const desesEixo = list.map(l => l.des).filter(v => v > 0);
      statsPorEixo[eixo] = {
        recMedia: recsEixo.length ? Math.round(recsEixo.reduce((a, b) => a + b, 0) / recsEixo.length) : recStats.media,
        desMedia: desesEixo.length ? Math.round(desesEixo.reduce((a, b) => a + b, 0) / desesEixo.length) : desStats.media,
        total: list.length
      };
    }
  }

  return {
    rota,
    origem: data.origem,
    destino: data.destino,
    distanciaKm: distMed,
    recValorFrete: recStats.media,
    recMin: recStats.min,
    recMax: recStats.max,
    recQtd: recStats.qtd,
    desValorFrete: desStats.media,
    desMin: desStats.min,
    desMax: desStats.max,
    desQtd: desStats.qtd,
    valorKmRec: distMed > 0 && recStats.media > 0 ? Number((recStats.media / distMed).toFixed(2)) : 0,
    valorKmDes: distMed > 0 && desStats.media > 0 ? Number((desStats.media / distMed).toFixed(2)) : 0,
    statsPorEixo,
    totalViagens: data.viagens.length,
    transportadoras: Array.from(data.transportadoras).slice(0, 8),
    embarcadores: Array.from(data.embarcadores).slice(0, 8),
    viagens: data.viagens
  };
}).sort((a, b) => b.totalViagens - a.totalViagens);

const payload = {
  resumoGlobal: {
    totalLinhas: lines.length - 1,
    totalViagensComValores: totalRegistrosValidos,
    rotasMapeadas: rotasArray.length,
    embarcadoresCadastrados: embarcadoresSet.size,
    transportadorasCadastradas: transportadorasSet.size,
    mediaGeralRecValorFrete: countRecGeral > 0 ? Math.round(totalRecGeral / countRecGeral) : 0,
    mediaGeralDesValorFrete: countDesGeral > 0 ? Math.round(totalDesGeral / countDesGeral) : 0,
    mediaGeralDistanciaKm: countKmGeral > 0 ? Math.round(totalKmGeral / countKmGeral) : 0,
    mediaGeralValorKmRec: (countKmGeral > 0 && totalRecGeral > 0) ? Number((totalRecGeral / totalKmGeral).toFixed(2)) : 13.50,
    mediaGeralValorKmDes: (countKmGeral > 0 && totalDesGeral > 0) ? Number((totalDesGeral / totalKmGeral).toFixed(2)) : 11.20
  },
  rotas: rotasArray,
  principaisEmbarcadores: Array.from(embarcadoresSet).sort(),
  principaisTransportadoras: Array.from(transportadorasSet).sort()
};

const outputPath = path.join(__dirname, '../src/data/hubHistoricoFretes.json');
fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2));
console.log(`Indexação completa e estruturada salva com sucesso em: ${outputPath}`);
console.log(`Tamanho do arquivo JSON: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);
