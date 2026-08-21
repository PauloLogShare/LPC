/**
 * useCustosOperacionais.js
 * Hook de gerenciamento de estado e persistência dos Custos Operacionais de Veículos e Motoristas.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { CUSTO_OPERACIONAL_DEFAULTS } from '../constants/custoOperacionalDefaults';
import { calcularCustoOperacional } from '../utils/custoOperacionalEngine';

const STORAGE_KEY = 'logshare_custos_operacionais';

export function obterCustosOperacionaisSalvos() {
  try {
    const salvo = localStorage.getItem(STORAGE_KEY);
    if (salvo) return JSON.parse(salvo);
  } catch (e) { /* ignora */ }
  return JSON.parse(JSON.stringify(CUSTO_OPERACIONAL_DEFAULTS));
}

export function useCustosOperacionais() {
  const [config, setConfig] = useState(obterCustosOperacionaisSalvos);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) { /* ignora */ }
  }, [config]);

  const atualizarModulo = useCallback((modulo, novosDados) => {
    setConfig((prev) => ({
      ...prev,
      [modulo]: {
        ...(prev[modulo] || {}),
        ...novosDados,
      },
    }));
  }, []);

  const resetarParaPadrao = useCallback(() => {
    const padrao = JSON.parse(JSON.stringify(CUSTO_OPERACIONAL_DEFAULTS));
    setConfig(padrao);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Resultado do motor de cálculo em tempo real
  const apuracao = useMemo(() => calcularCustoOperacional(config), [config]);

  return {
    config,
    apuracao,
    atualizarModulo,
    resetarParaPadrao,
  };
}
