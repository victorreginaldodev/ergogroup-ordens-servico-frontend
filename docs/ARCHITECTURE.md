# Arquitetura do Frontend — Ergogroup OS

## Visão geral

O projeto adota uma arquitetura **Feature Slice vertical**: cada domínio de negócio vive em um módulo isolado dentro de `src/features/`, contendo todas as camadas necessárias (API, estado, utilidades, componentes e páginas). Nenhuma feature depende de outra diretamente.

---

## Estrutura de diretórios

```
src/
├── app/
│   └── routes.tsx              — definição central de rotas (importa pages das features)
├── components/
│   ├── ui/                     — componentes base shadcn/ui (Button, Input, Sheet, etc.)
│   └── layout/                 — layout compartilhado (DashboardLayout, Sidebar, Header)
├── hooks/                      — hooks globais (useUserRole, use-toast)
├── lib/
│   └── utils.ts                — utilitário global (cn, helpers genéricos)
├── services/                   — camada legada (em migração gradual para features)
└── features/
    ├── ordens/                 — módulo de Ordens de Serviço
    └── analytics/              — módulo de Indicadores/Dashboard
```

---

## Anatomia de um módulo feature

Todo módulo segue a mesma estrutura interna:

```
features/<dominio>/
├── services.ts     — integração com a API
├── hooks.ts        — React Query (queries e mutations)
├── utils.ts        — formatação, labels, constantes de estilo
├── constants.ts    — constantes complexas (opcional, ex: analytics)
├── components/     — componentes escopados ao domínio
└── pages/          — uma página por rota
```

### Fluxo de dados

```
API REST
  ↓  funções async puras
services.ts
  ↓  encapsulado com React Query
hooks.ts
  ↓  consumido por
pages/*.tsx  ──compõe──▶  components/*.tsx
```

---

## Camadas em detalhe

### `services.ts` — Integração com a API

- Funções async puras, sem dependências React
- Normalização do DTO recebido para o tipo interno da feature
- Exporta os tipos de domínio usados pelo resto do módulo

```ts
// Tipo de domínio
export interface OrdemServicoItem { id: number; numero: string; status: string; ... }

// Normalização
const normalizeOrdemItem = (dto: any): OrdemServicoItem => ({ ... })

// Função de acesso
export const getOrdensLista = async (): Promise<OrdemServicoItem[]> => {
  const { data } = await api.get('/ordens/');
  return data.map(normalizeOrdemItem);
};
```

### `hooks.ts` — Estado assíncrono com React Query

- Um hook por operação (`useOrdensLista`, `useOrdemDetalhe`, `useCreateTarefa`, etc.)
- Centraliza `queryKey`, `staleTime` e a estratégia de invalidação de cache
- Mutations recebem contexto para saber quais queries invalidar

```ts
export const useOrdensLista = () =>
  useQuery<OrdemServicoItem[]>({
    queryKey: ['ordens-lista'],
    queryFn: getOrdensLista,
    staleTime: 1000 * 60 * 2,
  });

// Invalidação contextual: uma mutation sabe exatamente o que refrescar
const invalidarContexto = (qc, { servicoId, ordemId }) => {
  qc.invalidateQueries({ queryKey: ['ordens-tarefas-servico', servicoId] });
  qc.invalidateQueries({ queryKey: ['ordens-servicos', ordemId] });
  qc.invalidateQueries({ queryKey: ['ordens-detalhe', ordemId] });
};
```

### `utils.ts` — Formatação e constantes de apresentação

- Funções de formatação: datas, moeda, percentuais
- Mapeamento de valores de API para labels de UI (`getStatusLabel`, `getPriorityLabel`)
- Constantes de estilo por status/prioridade (`STATUS_DOT`, `PRIORITY_DOT`)
- Funções de transformação para dados de gráficos (módulo analytics)

### `components/` — Componentes escopados ao domínio

Três categorias de componentes coexistem na pasta plana:

| Categoria | Exemplos | Característica |
|-----------|----------|----------------|
| Apresentação | `StatusBadge`, `OrdemHeroCard` | Recebem dados via props, sem estado próprio |
| Interativos | `ServicoSheet`, `TarefaRow` | Consomem mutations, gerenciam UI local |
| Filtros | `OrdemServicoFiltros` | Exportam tipos de filtro e valores padrão |

### `pages/` — Composição de rota

- Um arquivo por rota do domínio
- Consomem hooks diretamente, compõem componentes da feature
- Nomeados com sufixo `Page`

---

## Convenções de nomenclatura

| Categoria | Padrão | Exemplos |
|-----------|--------|---------|
| Arquivos TS puro | `camelCase.ts` | `services.ts`, `hooks.ts`, `utils.ts` |
| Componentes / Páginas | `PascalCase.tsx` | `OrdemHeroCard.tsx`, `ServicoSheet.tsx` |
| Páginas | sufixo `Page` | `OrdemDetalhePage`, `OperacionalPage` |
| Hooks de query | `use` + domínio + ação | `useOrdensLista`, `useOrdemDetalhe` |
| Hooks de mutation | `use` + verbo + entidade | `useCreateTarefa`, `useUpdateTarefa`, `useDeleteTarefa` |
| Tipos de domínio | `PascalCase` descritivo | `OrdemServicoItem`, `ServicoDetalhe`, `TarefaDetalhe` |
| Constantes de estilo | `UPPER_SNAKE_CASE` | `STATUS_DOT`, `PRIORITY_DOT` |
| Diretórios | `lowercase` | `ordens`, `analytics`, `components`, `pages` |

---

## Cache keys (React Query)

As query keys seguem o padrão `['<dominio>-<recurso>', <id?>]`:

| Query | Key |
|-------|-----|
| Lista de ordens | `['ordens-lista']` |
| Detalhe de ordem | `['ordens-detalhe', id]` |
| Serviços de uma ordem | `['ordens-servicos', ordemId]` |
| Detalhe de serviço | `['ordens-servico-detalhe', id]` |
| Tarefas de um serviço | `['ordens-tarefas-servico', servicoId]` |
| Auditoria de ordem | `['ordens-auditoria', ordemId]` |
| Analytics operacional | `['analytics-dashboard']` |
| KPIs financeiros | `['analytics-financeiro-kpis']` |
| Produtividade | `['analytics-produtividade']` |

Stale time padrão: **2 minutos** (ordens), **5 minutos** (analytics).

---

## Integração com rotas

As páginas das features são registradas em `src/app/routes.tsx`:

```ts
import OrdemServicoListPage from '@/features/ordens/pages/OrdemServicoListPage';
import OrdemDetalhePage      from '@/features/ordens/pages/OrdemDetalhePage';
import OperacionalPage       from '@/features/analytics/pages/OperacionalPage';

<Route path="/dashboard/orders"      element={<OrdemServicoListPage />} />
<Route path="/dashboard/orders/:id"  element={<OrdemDetalhePage />} />
<Route path="/dashboard/analise/operacional" element={<OperacionalPage />} />
```

---

## Módulos existentes

### `features/ordens/`

Gerencia o ciclo completo de Ordens de Serviço.

**Páginas:** `OrdemServicoListPage`, `OrdemServicoFormPage`, `OrdemDetalhePage`, `ServicoDetalhePage`

**Componentes principais:**

| Componente | Função |
|------------|--------|
| `StatusBadge` | Badge colorido para status e prioridade |
| `OrdemHeroCard` | Card de cabeçalho da OS com dados principais |
| `OrdemInfoCards` | Grade de cards com contrato, cobrança, datas |
| `OrdemServicoFiltros` | Painel de filtros da listagem |
| `OrdemServicoFiltrosAtivos` | Chips de filtros ativos com remoção individual |
| `OrdemAuditoriaTimeline` | Timeline de eventos de auditoria |
| `ServicoRow` | Linha expandível de serviço na listagem |
| `ServicoSheet` | Sheet lateral com detalhe do serviço e tarefas |
| `TarefaRow` | Linha de tarefa com ações inline (editar/excluir) |

### `features/analytics/`

Indicadores operacionais e financeiros em gráficos.

**Páginas:** `OperacionalPage`, `FinanceiroPage`

**Componentes:** `KpiCard`, `MonthlyBarChart`, `DonutTableCard`, `DualBarChart`, `StatusPieChart`, `HorizontalBarChart`

---

## Adicionando uma nova feature

1. Criar `src/features/<dominio>/`
2. Adicionar `services.ts` com tipos e funções async
3. Adicionar `hooks.ts` com wrappers React Query
4. Adicionar `utils.ts` com funções de formatação e constantes
5. Criar `components/` com componentes escopados
6. Criar `pages/` com uma página por rota
7. Registrar as páginas em `src/app/routes.tsx`
8. Documentar as query keys neste arquivo

---

## Migração em andamento

O projeto está migrando de uma arquitetura centralizada por tipo para feature slices:

| Aspecto | Legado (`src/services/`, `src/pages/`) | Novo (`src/features/`) |
|---------|----------------------------------------|------------------------|
| Organização | Por tipo de arquivo | Por domínio de negócio |
| Estado | Em migração gradual | Desenvolvimento ativo |
| Imports | `@/services/orders`, `@/pages/dashboard/*` | `@/features/ordens/*` |

Todo código novo deve ser criado dentro de `src/features/`.
