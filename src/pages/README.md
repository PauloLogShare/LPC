# pages/

Views de alto nível do LPC — cada arquivo representa uma tela completa navegável pelo menu lateral.

## Estrutura

```
pages/
├── poc/         → Visão individual de POC (dashboard de cliente)
├── clevel/      → Visão C-Level (painel consolidado de portfólio)
└── pricing/     → Módulo Pricing Intelligence (simulador de frete)
```

## Convenção

- Arquivos com prefixo `_` (ex: `_PricingIntelligence.legacy.jsx`) são **versões arquivadas** — não são importados em lugar algum.
- Cada `page/` deve importar apenas de `components/`, `utils/`, `hooks/` e `services/`.
- Páginas **não** contêm lógica de negócio — ela fica em `utils/`.

## Status de extração do App.jsx

Os componentes abaixo ainda estão inline no `src/app/App.jsx`:

| Componente | Destino futuro | Status |
|---|---|---|
| `VisaoPoc` | `pages/poc/VisaoPoc.jsx` | ⏳ Pendente |
| `VisaoCLevel` | `pages/clevel/VisaoCLevel.jsx` | ⏳ Pendente |
| `PricingSimulador` | `pages/pricing/PricingSimulador.jsx` | ⏳ Pendente |
| `PricingParametros` | `pages/pricing/PricingParametros.jsx` | ⏳ Pendente |
| `PricingCadastro` | `pages/pricing/PricingCadastro.jsx` | ⏳ Pendente |
| `PricingAntt` | `pages/pricing/PricingAntt.jsx` | ⏳ Pendente |
| `PricingManual` | `pages/pricing/PricingManual.jsx` | ⏳ Pendente |
