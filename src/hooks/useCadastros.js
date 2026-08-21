/**
 * useCadastros.js
 * Hook para gerenciar o cadastro de Embarcadores e Parceiros.
 * Persiste em localStorage. Estrutura extensível para campos futuros.
 */

import { useState, useCallback } from 'react';

const STORAGE_KEY = 'logshare_cadastros';

// Lista inicial baseada nos nomes do HTML v18.3
const CADASTROS_INICIAIS = [
  { id: 1, nome: 'AMBEV',               tipo: 'ambos',       cnpj: '', ativo: true },
  { id: 2, nome: 'Americanas',          tipo: 'embarcador',  cnpj: '', ativo: true },
  { id: 3, nome: 'AmPm',               tipo: 'embarcador',  cnpj: '', ativo: true },
  { id: 4, nome: 'Arcelor Mittal',     tipo: 'embarcador',  cnpj: '', ativo: true },
  { id: 5, nome: 'Arcor',              tipo: 'embarcador',  cnpj: '', ativo: true },
  { id: 6, nome: 'Ardagh',             tipo: 'embarcador',  cnpj: '', ativo: true },
  { id: 7, nome: 'BAT',               tipo: 'embarcador',  cnpj: '', ativo: true },
  { id: 8, nome: 'Bayer',             tipo: 'embarcador',  cnpj: '', ativo: true },
  { id: 9, nome: 'Bimbo',             tipo: 'embarcador',  cnpj: '', ativo: true },
  { id: 10, nome: 'Boticário',        tipo: 'embarcador',  cnpj: '', ativo: true },
  { id: 11, nome: 'BRF',              tipo: 'embarcador',  cnpj: '', ativo: true },
  { id: 12, nome: 'Brinks',           tipo: 'embarcador',  cnpj: '', ativo: true },
  { id: 13, nome: 'Camil',            tipo: 'embarcador',  cnpj: '', ativo: true },
  { id: 14, nome: 'Carrefour',        tipo: 'embarcador',  cnpj: '', ativo: true },
  { id: 15, nome: 'Citrosuco',        tipo: 'embarcador',  cnpj: '', ativo: true },
  { id: 16, nome: 'ETC',             tipo: 'parceiro',    cnpj: '', ativo: true },
  { id: 17, nome: 'FEMSA',            tipo: 'embarcador',  cnpj: '', ativo: true },
  { id: 18, nome: 'GM',              tipo: 'embarcador',  cnpj: '', ativo: true },
  { id: 19, nome: 'GPA',             tipo: 'embarcador',  cnpj: '', ativo: true },
  { id: 20, nome: 'Greco',           tipo: 'embarcador',  cnpj: '', ativo: true },
  { id: 21, nome: 'JSL',             tipo: 'ambos',       cnpj: '', ativo: true },
  { id: 22, nome: 'Kraft',           tipo: 'embarcador',  cnpj: '', ativo: true },
  { id: 23, nome: "L'oreal",         tipo: 'embarcador',  cnpj: '', ativo: true },
  { id: 24, nome: 'Leroy Merlyn',    tipo: 'embarcador',  cnpj: '', ativo: true },
  { id: 25, nome: 'Manetoni',        tipo: 'embarcador',  cnpj: '', ativo: true },
  { id: 26, nome: 'Mondelez',        tipo: 'embarcador',  cnpj: '', ativo: true },
  { id: 27, nome: 'Natura',          tipo: 'embarcador',  cnpj: '', ativo: true },
  { id: 28, nome: 'Nivea',           tipo: 'embarcador',  cnpj: '', ativo: true },
  { id: 29, nome: 'Nude',            tipo: 'embarcador',  cnpj: '', ativo: true },
  { id: 30, nome: 'Pepsico',         tipo: 'embarcador',  cnpj: '', ativo: true },
  { id: 31, nome: 'Princesa dos Campos', tipo: 'parceiro', cnpj: '', ativo: true },
  { id: 32, nome: 'Razzo',           tipo: 'embarcador',  cnpj: '', ativo: true },
  { id: 33, nome: 'Santher',         tipo: 'embarcador',  cnpj: '', ativo: true },
  { id: 34, nome: 'Softys',          tipo: 'embarcador',  cnpj: '', ativo: true },
  { id: 35, nome: 'Solar',           tipo: 'embarcador',  cnpj: '', ativo: true },
  { id: 36, nome: 'StellLog',        tipo: 'parceiro',    cnpj: '', ativo: true },
  { id: 37, nome: 'Suzano',          tipo: 'embarcador',  cnpj: '', ativo: true },
  { id: 38, nome: 'TAC',             tipo: 'parceiro',    cnpj: '', ativo: true },
  { id: 39, nome: 'Tigre',           tipo: 'embarcador',  cnpj: '', ativo: true },
  { id: 40, nome: 'Uau',             tipo: 'ambos',       cnpj: '', ativo: true },
  { id: 41, nome: 'Unilever',        tipo: 'embarcador',  cnpj: '', ativo: true },
  { id: 42, nome: 'Vibra',           tipo: 'embarcador',  cnpj: '', ativo: true },
];

function carregarCadastros() {
  try {
    const salvo = localStorage.getItem(STORAGE_KEY);
    if (salvo) return JSON.parse(salvo);
  } catch (e) { /* ignora */ }
  return CADASTROS_INICIAIS;
}

function salvarCadastros(lista) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
}

export function useCadastros() {
  const [cadastros, setCadastros] = useState(carregarCadastros);

  const adicionar = useCallback((dados) => {
    setCadastros((prev) => {
      const maxId = prev.reduce((m, c) => Math.max(m, c.id), 0);
      const novo = { id: maxId + 1, ativo: true, cnpj: '', ...dados };
      const lista = [...prev, novo];
      salvarCadastros(lista);
      return lista;
    });
  }, []);

  const atualizar = useCallback((id, dados) => {
    setCadastros((prev) => {
      const lista = prev.map((c) => (c.id === id ? { ...c, ...dados } : c));
      salvarCadastros(lista);
      return lista;
    });
  }, []);

  const remover = useCallback((id) => {
    setCadastros((prev) => {
      const lista = prev.filter((c) => c.id !== id);
      salvarCadastros(lista);
      return lista;
    });
  }, []);

  const embarcadores = cadastros.filter(
    (c) => c.ativo && (c.tipo === 'embarcador' || c.tipo === 'ambos')
  );
  const parceiros = cadastros.filter(
    (c) => c.ativo && (c.tipo === 'parceiro' || c.tipo === 'ambos')
  );

  return { cadastros, embarcadores, parceiros, adicionar, atualizar, remover };
}
