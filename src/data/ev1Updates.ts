import {
  GitBranch,
  Flag,
  CalendarClock,
  Receipt,
  ScrollText,
  ShieldCheck,
  BarChart2,
  Zap,
  Layers,
  Play,
} from 'lucide-react';
import type { ElementType } from 'react';

export interface EV1Highlight {
  title: string;
  detail: string;
}

export interface EV1Feature {
  id: string;
  icon: ElementType;
  iconColor: string;
  iconBg: string;
  badge: string;
  badgeColor: string;
  title: string;
  summary: string;
  description: string;
  highlights: EV1Highlight[];
  videoUrl?: string;
}

export const ev1Features: EV1Feature[] = [
  {
    id: 'status',
    icon: GitBranch,
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-500/10',
    badge: 'Automático',
    badgeColor: 'text-blue-600 border-blue-200 bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:bg-blue-950',
    title: 'Status da OS',
    summary: 'Status calculado e propagado automaticamente pelo sistema.',
    description:
      'O sistema agora gerencia o status de cada Ordem de Serviço de forma totalmente automática, eliminando a necessidade de atualização manual. O status é calculado em cascata: as tarefas alimentam os serviços, e os serviços alimentam a OS, refletindo sempre a realidade da execução operacional.',
    highlights: [
      {
        title: 'Propagação em cascata',
        detail: 'Tarefa → Serviço → Ordem de Serviço. Cada camada atualiza a superior automaticamente.',
      },
      {
        title: '4 estados operacionais',
        detail: 'Aberta, Em Andamento, Concluída e Cancelada — com transições controladas por regras de negócio.',
      },
      {
        title: 'Cancelamento sempre explícito',
        detail: 'Cancelar uma tarefa ou serviço não cancela a OS. O cancelamento exige ação direta de um usuário autorizado.',
      },
      {
        title: 'Compatibilidade com legado',
        detail: 'O campo `concluida` é mantido sincronizado com o novo status, preservando integrações existentes.',
      },
    ],
  },
  {
    id: 'prioridade',
    icon: Flag,
    iconColor: 'text-orange-500',
    iconBg: 'bg-orange-500/10',
    badge: 'Novo Campo',
    badgeColor: 'text-orange-600 border-orange-200 bg-orange-50 dark:text-orange-400 dark:border-orange-800 dark:bg-orange-950',
    title: 'Prioridade da OS',
    summary: 'Campo de prioridade para organização operacional das ordens.',
    description:
      'As Ordens de Serviço agora possuem um campo de prioridade que permite ao time organizar e sinalizar a urgência de cada demanda. Diferente dos campos automáticos, a prioridade é uma decisão humana — ela representa o julgamento do time sobre o que precisa de atenção imediata.',
    highlights: [
      {
        title: '3 níveis de prioridade',
        detail: 'Baixa, Média e Alta — cobrindo as situações mais comuns de triagem operacional.',
      },
      {
        title: 'Padrão Baixa para novas OS',
        detail: 'Toda OS criada sem indicação de prioridade nasce como Baixa, mantendo consistência nos dados.',
      },
      {
        title: 'Migração automática do legado',
        detail: 'Todas as OS existentes foram migradas com prioridade Baixa, sem impacto na operação.',
      },
      {
        title: 'Editável pelo usuário',
        detail: 'A prioridade pode ser ajustada a qualquer momento por quem tiver permissão, sem restrições de status da OS.',
      },
    ],
  },
  {
    id: 'datas',
    icon: CalendarClock,
    iconColor: 'text-emerald-500',
    iconBg: 'bg-emerald-500/10',
    badge: 'Rastreabilidade',
    badgeColor: 'text-emerald-600 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:bg-emerald-950',
    title: 'Rastreabilidade de Datas',
    summary: 'Datas operacionais registradas automaticamente em toda a cadeia.',
    description:
      'Todos os registros do sistema — OS, Serviços, Tarefas e OS Operacionais — agora possuem datas de criação, atualização, início e término gerenciadas automaticamente. Isso elimina lacunas no histórico e garante que o sistema sempre saiba quando cada coisa aconteceu, sem depender de preenchimento manual.',
    highlights: [
      {
        title: 'Criação e atualização automáticas',
        detail: 'Os campos `criada_em` e `atualizado_em` são preenchidos e mantidos pelo sistema em todos os modelos.',
      },
      {
        title: 'Início e término automáticos',
        detail: 'As tarefas registram `data_inicio` ao entrar em andamento e `data_termino` ao serem concluídas, sem intervenção do usuário.',
      },
      {
        title: 'Datas de serviço derivadas das tarefas',
        detail: 'O início do serviço vem da menor data de início das tarefas; o término vem da última tarefa concluída.',
      },
      {
        title: 'Histórico migrado do legado',
        detail: 'Todos os registros existentes receberam datas estimadas a partir dos dados disponíveis na migração inicial.',
      },
    ],
  },
  {
    id: 'cobranca',
    icon: Receipt,
    iconColor: 'text-violet-500',
    iconBg: 'bg-violet-500/10',
    badge: 'Cobrança',
    badgeColor: 'text-violet-600 border-violet-200 bg-violet-50 dark:text-violet-400 dark:border-violet-800 dark:bg-violet-950',
    title: 'Rastreabilidade de Cobrança',
    summary: 'O sistema registra quando e por quem cada OS foi liberada para faturamento.',
    description:
      'O ciclo financeiro de cada Ordem de Serviço agora possui rastreabilidade completa. O sistema registra automaticamente o momento e o responsável pela liberação para faturamento, além de manter o histórico de quem faturou a OS. O marco de liberação é imutável, garantindo integridade para fins de auditoria e BI financeiro.',
    highlights: [
      {
        title: 'Cobrança imediata',
        detail: 'OS com cobrança imediata são liberadas automaticamente no momento da criação, pelo usuário criador.',
      },
      {
        title: 'Cobrança padrão (não imediata)',
        detail: 'A liberação ocorre automaticamente ao atingir status Concluída — usando a data e o responsável da última tarefa concluída.',
      },
      {
        title: 'Marco de liberação imutável',
        detail: 'Uma vez liberada para faturamento, os campos de liberação não são sobrescritos. Qualquer alteração exige fluxo explícito.',
      },
      {
        title: 'OS Operacional com cobrança',
        detail: 'A OS Operacional também registra liberação de cobrança via `gera_cobranca`, derivado automaticamente de `revisao_cliente`.',
      },
    ],
  },
  {
    id: 'contratos',
    icon: ScrollText,
    iconColor: 'text-teal-500',
    iconBg: 'bg-teal-500/10',
    badge: 'Notificação',
    badgeColor: 'text-teal-600 border-teal-200 bg-teal-50 dark:text-teal-400 dark:border-teal-800 dark:bg-teal-950',
    title: 'Contratos e Notificações',
    summary: 'Uma OS agora pode representar um contrato, com notificação automática ao time.',
    description:
      'Quando uma Ordem de Serviço representa um contrato formal, o sistema agora suporta o registro completo dos dados contratuais — incluindo objeto, vigência e informações do gestor responsável. Ao criar uma OS contrato, todos os usuários ativos do sistema são notificados automaticamente por e-mail.',
    highlights: [
      {
        title: 'Dados de contrato na OS',
        detail: 'Campos: objeto do contrato, data de início, data de fim, nome, e-mail e telefone do gestor. Datas são obrigatórias quando `contrato = true`.',
      },
      {
        title: 'Notificação automática por e-mail',
        detail: 'Ao criar uma OS como contrato, todos os usuários ativos recebem um e-mail informando a criação.',
      },
      {
        title: 'Dados do gestor opcionais',
        detail: 'As informações de contato do gestor do contrato são opcionais, dando flexibilidade para registros parciais.',
      },
    ],
  },
  {
    id: 'auditoria',
    icon: ShieldCheck,
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-500/10',
    badge: 'Auditoria',
    badgeColor: 'text-amber-600 border-amber-200 bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:bg-amber-950',
    title: 'Auditoria Operacional',
    summary: 'Todos os eventos críticos são registrados em log completo de auditoria.',
    description:
      'O sistema agora mantém um registro detalhado de todos os eventos críticos de OS, Serviços, Tarefas e OS Operacionais. Cada evento captura quem fez o quê, quando, de onde e qual foi o estado antes e depois da alteração — criando uma linha do tempo operacional rastreável e confiável para fins de conformidade e análise.',
    highlights: [
      {
        title: 'Cobertura completa',
        detail: 'Criação, atualização, mudança de status, liberação para faturamento, faturamento, dados de contrato e exclusão — tudo registrado.',
      },
      {
        title: 'Estado antes e depois',
        detail: 'Cada evento de auditoria armazena um snapshot JSON do estado anterior e posterior do objeto, além dos dados da requisição.',
      },
      {
        title: 'Origem identificada',
        detail: 'O sistema distingue ações humanas diretas de efeitos automáticos propagados, garantindo clareza no histórico.',
      },
      {
        title: 'Linha base histórica criada',
        detail: 'Uma migração inicial criou registros de auditoria inferidos a partir do estado atual, estabelecendo uma base útil para consulta e BI.',
      },
    ],
  },
  {
    id: 'analytics',
    icon: BarChart2,
    iconColor: 'text-indigo-500',
    iconBg: 'bg-indigo-500/10',
    badge: 'Analytics',
    badgeColor: 'text-indigo-600 border-indigo-200 bg-indigo-50 dark:text-indigo-400 dark:border-indigo-800 dark:bg-indigo-950',
    title: 'Analytics Operacional',
    summary: 'Novo módulo de indicadores com 3 painéis dedicados à operação e produtividade.',
    description:
      'Foi criado um módulo completo de análise operacional com indicadores em tempo real sobre OS, Serviços, Tarefas, OS Operacionais e dados financeiros. Os dados são organizados em três painéis com acesso controlado por perfil de usuário, permitindo que cada colaborador visualize apenas as informações relevantes ao seu papel.',
    highlights: [
      {
        title: 'Painel Operacional',
        detail: 'Fluxo mensal de OS, distribuição por prazo de encerramento, principais serviços executados, status de tarefas e mini-OS.',
      },
      {
        title: 'Painel Financeiro',
        detail: 'Total faturado, a faturar e sem liberação; ranking de clientes por valor. Restrito a perfis autorizados.',
      },
      {
        title: 'Painel de Produtividade',
        detail: 'Tempos médios por técnico, taxas de cancelamento, evolução mensal individual por técnico.',
      },
      {
        title: 'Acesso controlado por perfil',
        detail: 'Técnicos visualizam apenas os próprios dados. Dados financeiros ficam ocultos para perfis operacionais.',
      },
    ],
  },
  {
    id: 'os-operacional',
    icon: Zap,
    iconColor: 'text-cyan-500',
    iconBg: 'bg-cyan-500/10',
    badge: 'Nomenclatura',
    badgeColor: 'text-cyan-600 border-cyan-200 bg-cyan-50 dark:text-cyan-400 dark:border-cyan-800 dark:bg-cyan-950',
    title: 'OS Operacional',
    summary: 'MiniOS e OS Rápida passam a ser chamadas de OS Operacional na interface.',
    description:
      'A funcionalidade conhecida internamente como MiniOS ou OS Rápida foi renomeada para OS Operacional em toda a interface do sistema. O novo nome reflete melhor o propósito da ferramenta: ordens rápidas para demandas operacionais do dia a dia, sem a burocracia de uma OS completa.',
    highlights: [
      {
        title: 'Nomenclatura atualizada',
        detail: 'Todos os textos, menus, títulos e rótulos da interface agora usam "OS Operacional" consistentemente.',
      },
      {
        title: 'Compatibilidade técnica mantida',
        detail: 'Models, endpoints e banco de dados continuam usando a nomenclatura técnica anterior — sem risco para integrações.',
      },
      {
        title: 'Sem impacto operacional',
        detail: 'Nenhum dado foi alterado. A mudança é exclusivamente na camada de apresentação para o usuário final.',
      },
    ],
  },
  {
    id: 'pagina-consolidada',
    icon: Layers,
    iconColor: 'text-rose-500',
    iconBg: 'bg-rose-500/10',
    badge: 'Interface',
    badgeColor: 'text-rose-600 border-rose-200 bg-rose-50 dark:text-rose-400 dark:border-rose-800 dark:bg-rose-950',
    title: 'Página Consolidada de OS',
    summary: 'OS, Serviços e Tarefas reunidos em uma única página operacional.',
    description:
      'A visualização de uma Ordem de Serviço foi unificada em uma página completa que reúne todos os dados relevantes em um só lugar: informações da OS, seus serviços, as tarefas de cada serviço, status propagado, datas de rastreabilidade e informações de cobrança. O acesso a cada bloco de informação é controlado pelo perfil do usuário.',
    highlights: [
      {
        title: 'Visão completa em uma tela',
        detail: 'Todos os dados operacionais — OS, Serviços e Tarefas — exibidos de forma organizada e sequencial, sem navegação entre páginas.',
      },
      {
        title: 'Status e datas em tempo real',
        detail: 'O status propagado e as datas de rastreabilidade são exibidos diretamente na página, refletindo o estado atual da execução.',
      },
      {
        title: 'Restrições por perfil de acesso',
        detail: 'Técnicos visualizam e atualizam apenas as próprias tarefas. Usuários sem permissão não criam tarefas nem visualizam dados financeiros.',
      },
    ],
  },
  {
    id: 'demo-video',
    icon: Play,
    iconColor: 'text-red-500',
    iconBg: 'bg-red-500/10',
    badge: 'Vídeo',
    badgeColor: 'text-red-600 border-red-200 bg-red-50 dark:text-red-400 dark:border-red-800 dark:bg-red-950',
    title: 'Demonstração em Vídeo',
    summary: 'Veja na prática a nova página consolidada de OS em funcionamento.',
    description:
      'Assista ao vídeo abaixo para ver como a nova página consolidada reúne Ordem de Serviço, Serviços e Tarefas em uma única visão operacional.',
    highlights: [],
    videoUrl: 'https://www.youtube.com/embed/yt_ffT2mxP0',
  },
];
