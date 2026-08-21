# formatters/

Funções puras de formatação de dados para exibição na UI.

## Convenção

- Funções **puras** — sem side effects, sem dependência de state React.
- Recebem valores brutos (number, string, object) e retornam strings formatadas.
- Não devem ser usadas dentro dos `utils/` (camada de negócio) — somente na UI.

## Funções a extrair do App.jsx

| Função | Descrição |
|---|---|
| `formatarMoeda(valor)` | Formata número como R$ (BRL) |
| `formatarNumero(valor)` | Formata número com separador de milhar PT-BR |
| `formatarPercentual(valor)` | Formata número como `XX.X%` com tratamento de null |
| `formatarMes(referencia)` | Converte `"2026-08"` em `"Ago/26"` |
| `formatarResultado(item)` | Formata resultado de um indicador com unidade |
| `formatarMeta(item)` | Formata meta de indicador com sinal `≥` ou `≤` |

**Status**: ⏳ Pendente de extração do `src/app/App.jsx`
