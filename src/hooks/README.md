# hooks/

Custom React hooks — encapsulam lógica de estado e efeitos colaterais do App.jsx.

## Convenção

- Nome sempre começa com `use` (ex: `useDashboard`, `usePortfolio`).
- Hooks isolam a lógica de state do componente, tornando-a testável.
- Não devem renderizar JSX — retornam dados e handlers.

## Hooks planejados

| Hook | Responsabilidade | Extrai de |
|---|---|---|
| `useDashboard(dados, cliente, inicio, fim)` | Gerencia state e cálculo do dashboard | `App.jsx` — `atualizarDashboard` |
| `usePortfolio(dados, inicio, fim)` | Gerencia state e cálculo do portfólio | `App.jsx` — `atualizarPortfolio` |
| `useFiltros(dados)` | Gerencia filtros de cliente e período | `App.jsx` — handlers de filtro |

**Status**: ⏳ Pendente de extração
