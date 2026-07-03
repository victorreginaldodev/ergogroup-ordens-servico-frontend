# UI/UX Brief — Hub Operacional de Ordem de Serviço

> Documento para geração de UI com ferramenta de design assistida por IA.
> Contexto: sistema web interno de gestão de Ordens de Serviço — Ergogroup OS.

---

## 1. Contexto do produto

**Ergogroup OS** é um sistema interno de gestão de ordens de serviço para uma empresa de tecnologia. O sistema é acessado no navegador, por times técnicos e administrativos, majoritariamente em desktop.

A página em questão é o **hub operacional de uma Ordem de Serviço (OS)** — é onde o trabalho técnico acontece no dia a dia. Técnicos abrem essa página pela manhã, acompanham suas tarefas e atualizam o status ao longo do dia. Líderes técnicos a usam para distribuir trabalho e monitorar progresso.

---

## 2. Hierarquia de entidades

```
Ordem de Serviço (OS)
  └── Serviço 1  (ex: "Módulo de Pagamentos")
        └── Tarefa 1.1  (ex: "Implementar endpoint de checkout")
        └── Tarefa 1.2  (ex: "Testar integração com gateway")
  └── Serviço 2  (ex: "Painel Administrativo")
        └── Tarefa 2.1
```

Uma OS pode ter de 1 a ~10 serviços. Cada serviço pode ter de 1 a ~20 tarefas.

---

## 3. Perfis de usuário

### Técnico
- Acessa a página para ver **suas próprias tarefas**
- Só pode **alterar o status** das tarefas (Aberta → Em andamento → Concluída)
- Não cria, edita nem exclui tarefas
- Precisa de clareza máxima: o que ele deve fazer e qual o estado atual

### Líder Técnico
- Cria tarefas e as atribui a técnicos
- Pode editar descrição, responsável e status de qualquer tarefa
- Pode excluir tarefas
- Monitora o progresso de todos os serviços da OS

---

## 4. Problema atual

A página atual foi construída de forma incremental e acumula problemas:

- **Excesso de informação visível ao mesmo tempo** — dados administrativos da OS (contrato, NF, forma de pagamento) convivem com o trabalho técnico diário
- **Nenhuma hierarquia visual clara** entre OS → Serviço → Tarefa
- **O técnico não sabe de imediato quais são suas tarefas** — precisa varrer a página inteira
- **Ações de gestão (criar/editar/excluir)** ficam misturadas com ações operacionais (mudar status)
- **A lista de tarefas parece um formulário**, não um quadro de trabalho

---

## 5. Objetivos de design

1. **Clareza imediata**: ao abrir a página, o técnico identifica suas tarefas em segundos
2. **Hierarquia visual forte**: OS > Serviço > Tarefa, cada nível com peso tipográfico e espaçamento distintos
3. **Ações contextuais**: mostrar apenas o que o usuário pode fazer com base no seu perfil
4. **Densidade balanceada**: informação suficiente sem poluição visual — o nome da tarefa e o status são os dados primários; responsável e datas são secundários
5. **Sensação operacional**: parece um quadro de trabalho, não um relatório administrativo

---

## 6. Estrutura de informação da página

### Nível 1 — Cabeçalho da OS (compacto, colapsável ou fixo no topo)
Dados de contexto, não operacionais. Pode ser minimizado.
- Nome do cliente
- Número da OS
- Status da OS
- Prioridade

### Nível 2 — Cards de serviço
Cada serviço é um bloco independente com identidade visual própria.
- Nome do serviço (catálogo)
- Status do serviço
- Descrição (colapsável se longa)
- Metadados: Início, Término, Responsável pela conclusão

### Nível 3 — Lista de tarefas dentro do serviço
Lista densa e escaneável, otimizada para leitura rápida.
- Por linha: Responsável · Datas · Status (interativo) · Ações
- Abaixo: Descrição da tarefa em texto secundário
- Estado visual distinto por status (ícone + cor)

---

## 7. Comportamentos esperados

| Ação | Quem | Como |
|------|------|------|
| Ver tarefas | Todos | Sempre visível, sem clique |
| Mudar status de tarefa | Técnico + Líder | Dropdown inline na linha da tarefa |
| Criar tarefa | Líder | Botão "+ Nova tarefa" por serviço, abre modal |
| Editar tarefa | Líder | Ícone de edição inline, expande a linha |
| Excluir tarefa | Líder | Ícone de lixeira inline com confirmação |

---

## 8. Design tokens do projeto

### Tipografia
- **Família**: Plus Jakarta Sans (Google Fonts)
- **Pesos em uso**: 400 (body), 500 (label), 600 (semibold), 700 (bold), 800 (display)
- **Escala de tamanhos**: 10px (label uppercase), 12px (meta), 14px (body), 16px (título de serviço), 24px (título de OS)
- **Tracking**: headings com `tracking-tight`, labels com `tracking-wider uppercase`

### Paleta de cores — Light mode

| Token | HSL | Uso |
|-------|-----|-----|
| `--background` | `0 0% 100%` | Fundo da página |
| `--card` | `0 0% 100%` | Fundo de cards |
| `--foreground` | `222 47% 11%` | Texto principal (azul-escuro quase preto) |
| `--muted` | `210 40% 96%` | Fundo cinza-claro (cabeçalhos de card) |
| `--muted-foreground` | `215 20% 47%` | Texto secundário |
| `--border` | `214 32% 91%` | Bordas e divisores |
| `--primary` | `173 50% 38%` | Teal escuro — cor de ação principal |
| `--ring` | `173 50% 38%` | Focus ring |
| `--destructive` | `0 84% 60%` | Vermelho para exclusão/erro |

### Paleta de cores — Dark mode

| Token | HSL | Uso |
|-------|-----|-----|
| `--background` | `222 47% 6%` | Azul-marinho muito escuro |
| `--card` | `222 47% 8%` | Cards levemente mais claros |
| `--foreground` | `210 40% 98%` | Texto quase branco |
| `--muted` | `222 30% 18%` | Fundo muted em dark |
| `--border` | `222 30% 18%` | Bordas sutis |

### Status das tarefas

| Status | Cor | Token sugerido |
|--------|-----|----------------|
| Aberta | Vermelho | `bg-red-50 text-red-700` |
| Em andamento | Amarelo | `bg-yellow-50 text-yellow-700` |
| Concluída | Verde | `bg-green-50 text-green-700` |
| Cancelada | Cinza | `bg-gray-100 text-gray-500` |

### Status dos serviços

| Status | Cor |
|--------|-----|
| Aberto | Vermelho |
| Em andamento | Amarelo |
| Concluído | Verde |
| Cancelado | Cinza |

### Border radius
- Cards grandes: `0.75rem` (12px)
- Badges/pills: `9999px` (full)
- Inputs: `calc(0.75rem - 2px)` (~10px)

### Sombras
- Card padrão: `0 4px 20px rgba(0,0,0,0.08)`
- Glow primário: `0 0 60px hsl(173 50% 38% / 0.12)`

---

## 9. Diretrizes de UX

### Hierarquia visual
- **OS**: identificador compacto no topo, não competir com o conteúdo operacional
- **Serviço**: card com peso visual médio — nome em `font-bold text-base`, fundo `bg-muted/40`
- **Tarefa**: linha densa, sem card próprio — usa separador (`divide-y`) dentro do serviço

### Densidade
- Cabeçalho de serviço: `py-4`
- Linha de tarefa: `py-3` — compacto, escaneável
- Não usar cards individuais por tarefa — overhead visual desnecessário

### Status como linguagem visual principal
- O status badge é o elemento mais importante de uma tarefa
- Deve ser imediatamente legível sem ler o texto
- Ícone + cor + label (não apenas cor)

### Ações progressivas
- No **modo leitura**: apenas o status interativo (dropdown) visível
- Ações de edição/exclusão: ícones discretos que aparecem no hover da linha
- Modal de criação: limpo, com apenas dois campos (responsável + descrição)

### Responsividade
- Layout primário: desktop (1280px+)
- Deve funcionar em tablet (768px) — meta strip colapsa de 4 para 2 colunas
- Mobile: não é prioridade, mas não pode quebrar

---

## 10. Componentes-chave a projetar

1. **OS Summary Bar** — faixa compacta no topo com cliente, número, status e prioridade
2. **Serviço Card** — bloco completo com cabeçalho, descrição e lista de tarefas
3. **Tarefa Row** — linha de tarefa com responsável, datas, status e ações
4. **Status Badge** — pill colorido com dot + label
5. **Nova Tarefa Modal** — modal simples: select de responsável + textarea de descrição
6. **Empty State** — quando não há tarefas num serviço
7. **Search/Filter Bar** — filtro por serviço (para OS com muitos serviços)

---

## 11. Referências de estilo

- Estética: **Linear.app**, **Notion**, **Height** — denso mas limpo, dark mode polido
- Não usar: cores vibrantes fora dos status, gradientes decorativos em áreas operacionais
- Preferir: espaço em branco estratégico, tipografia como hierarquia, bordas sutis

---

## 12. Entregáveis esperados da ferramenta de design

- [ ] Layout completo da página em light mode
- [ ] Layout completo em dark mode
- [ ] Estado com OS de 3 serviços, cada um com 3-5 tarefas
- [ ] Estado vazio (OS sem tarefas)
- [ ] Estado de loading (skeleton)
- [ ] Modal de criação de tarefa
- [ ] Variante de tarefa em modo de edição inline
- [ ] Detalhe do badge de status em todos os 4 estados
