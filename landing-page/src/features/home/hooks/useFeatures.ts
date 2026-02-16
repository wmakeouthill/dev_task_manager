import type { Feature } from '../types';

const FEATURES: Feature[] = [
  {
    id: '1',
    icon: '📊',
    title: 'Boards Kanban',
    description: 'Colunas personalizáveis com drag-and-drop. Organize tarefas por status, sprint ou projeto.',
  },
  {
    id: '2',
    icon: '📝',
    title: 'Subtarefas',
    description: 'Quebre cards em subtarefas com progresso visual. Marque como concluído e acompanhe o andamento.',
  },
  {
    id: '3',
    icon: '🤖',
    title: 'IA Integrada',
    description: 'Sugestões de descrição e subtarefas com Ollama (local) ou APIs. Melhore seus cards em um clique.',
  },
  {
    id: '4',
    icon: '🔍',
    title: 'Detalhes do Card',
    description: 'Descrição rica, datas e informações organizadas. Tudo em um único lugar por tarefa.',
  },
  {
    id: '5',
    icon: '📱',
    title: 'Interface Moderna',
    description: 'React 19 e design responsivo. Rápido, acessível e fácil de usar no dia a dia.',
  },
  {
    id: '6',
    icon: '💾',
    title: 'Dados Locais',
    description: 'SQLite no backend .NET. Seus dados ficam no seu controle, sem dependência de nuvem.',
  },
];

export function useFeatures() {
  return {
    features: FEATURES,
  };
}
