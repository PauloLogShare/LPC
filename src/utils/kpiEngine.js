export function calcularCobertura(rotasDisponibilizadas, rotasTotais) {
  if (!rotasTotais) return 0;

  return (rotasDisponibilizadas / rotasTotais) * 100;
}

export function calcularOportunidade(
  rotasSinergia,
  rotasDisponibilizadas
) {
  if (!rotasDisponibilizadas) return 0;

  return (rotasSinergia / rotasDisponibilizadas) * 100;
}

export function calcularConversao(
  rotasExecutadas,
  oportunidades
) {
  if (!oportunidades) return 0;

  return (rotasExecutadas / oportunidades) * 100;
}

export function calcularAderencia(
  embarquesRealizados,
  embarquesPlanejados
) {
  const planejados = Number(embarquesPlanejados || 0);
  const realizados = Number(embarquesRealizados || 0);

  if (planejados <= 0 || realizados <= 0) return 0;

  return (realizados / planejados) * 100;
}

export function calcularOnTime(
  embarquesOnTime,
  embarquesTotal
) {
  if (!embarquesTotal) return 0;

  return (embarquesOnTime / embarquesTotal) * 100;
}

export function calcularSaving(
  baseline,
  realizado
) {
  return baseline - realizado;
}

export function calcularReducaoCusto(
  baseline,
  realizado
) {
  if (!baseline) return 0;

  return ((baseline - realizado) / baseline) * 100;
}