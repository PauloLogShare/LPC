/**
 * usePricingParams.js
 * Hook para gerenciar os parâmetros editáveis da calculadora de frete.
 * Persiste em localStorage para sobreviver a recarregamentos.
 */

import { useState, useCallback } from 'react';
import { PRICING_DEFAULTS } from '../constants/pricingDefaults';

const STORAGE_KEY = 'logshare_pricing_params';

function carregarParams() {
  try {
    const salvo = localStorage.getItem(STORAGE_KEY);
    if (salvo) {
      const parsed = JSON.parse(salvo);
      // Mescla com defaults para garantir que novos parâmetros não faltem
      return { ...PRICING_DEFAULTS, ...parsed };
    }
  } catch (e) { /* ignora erro de parse */ }
  return { ...PRICING_DEFAULTS };
}

export function usePricingParams() {
  const [params, setParams] = useState(carregarParams);

  const atualizarParam = useCallback((chave, valor) => {
    setParams((prev) => {
      const novo = { ...prev, [chave]: Number(valor) };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(novo));
      return novo;
    });
  }, []);

  const resetarParams = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setParams({ ...PRICING_DEFAULTS });
  }, []);

  return { params, atualizarParam, resetarParams };
}
