# components/

Componentes React reutilizáveis organizados por domínio visual.

## Estrutura

```
components/
├── layout/   → Estruturais (Section, Grid, Filter, SidebarItem)
├── cards/    → Cards de dados (KpiCard, PocExecutiveCard, StrategicKpiCard, SustainabilityCard)
├── charts/   → Gráficos Recharts (HistoricoScore, GraficoEvolucaoEmbarques, GraficoFunilOportunidades)
└── icons/    → SVG inline (PocIcon, SummaryIcon, StrategicKpiIcon)
```

## Convenção

- Um componente por arquivo.
- Arquivo com prefixo `_` = legado, não importar.
- Props sempre explicitadas (sem spread indiscriminado).
- Sem lógica de cálculo de negócio — use `utils/` para isso.

## Status de extração do App.jsx

| Componente | Destino futuro | Status |
|---|---|---|
| `Section`, `Grid`, `Filter` | `layout/` | ⏳ Pendente |
| `KpiCard`, `PocExecutiveCard` | `cards/` | ⏳ Pendente |
| `StrategicKpiCard`, `SustainabilityCard` | `cards/` | ⏳ Pendente |
| `HistoricoScore`, `GraficoEvolucaoEmbarques` | `charts/` | ⏳ Pendente |
| `GraficoFunilOportunidades` | `charts/` | ⏳ Pendente |
| `PocIcon`, `SummaryIcon`, `StrategicKpiIcon` | `icons/` | ⏳ Pendente |
