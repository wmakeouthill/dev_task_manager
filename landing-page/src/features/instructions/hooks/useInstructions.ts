import type { InstructionStep } from '../types';

/** Para exibir imagens reais, defina imageSrc como `${import.meta.env.BASE_URL || '/'}prints/nome.png` e coloque os arquivos em public/prints/ */
const INSTRUCTION_STEPS: InstructionStep[] = [
  {
    id: '1',
    step: 1,
    title: 'Acesse o aplicativo',
    description:
      'Abra o Dev Task Manager. Na tela inicial você verá o dashboard com seus boards. Crie um novo board ou selecione um existente para começar.',
    imageAlt: 'Screenshot: Tela inicial / dashboard com lista de boards',
    imageSrc: undefined, // Coloque dashboard.png em public/prints/ para exibir
    mediaType: 'image',
  },
  {
    id: '2',
    step: 2,
    title: 'Crie um board e colunas',
    description:
      'Crie um board para seu projeto ou sprint. Adicione colunas como "A fazer", "Em progresso" e "Concluído". Arraste e solte para reorganizar.',
    imageAlt: 'Screenshot: Board com colunas Kanban',
    imageSrc: undefined, // board-colunas.png
    mediaType: 'image',
  },
  {
    id: '3',
    step: 3,
    title: 'Adicione cards',
    description:
      'Crie cards em cada coluna. Clique em um card para abrir os detalhes: título, descrição e subtarefas. Preencha conforme necessário.',
    imageAlt: 'Screenshot: Cards no board e modal de detalhes do card',
    imageSrc: undefined, // cards-detalhes.png
    mediaType: 'image',
  },
  {
    id: '4',
    step: 4,
    title: 'Gerencie subtarefas',
    description:
      'Dentro do card, adicione subtarefas e marque como concluídas. O progresso é exibido visualmente. Use drag-and-drop para reordenar.',
    imageAlt: 'Screenshot: Lista de subtarefas dentro de um card',
    imageSrc: undefined, // subtarefas.png
    mediaType: 'image',
  },
  {
    id: '5',
    step: 5,
    title: 'Use sugestões de IA',
    description:
      'Na descrição do card ou ao criar subtarefas, use o botão de IA para obter sugestões. Configure Ollama (local) ou uma API para habilitar.',
    imageAlt: 'Screenshot: Painel de sugestão de IA no card',
    imageSrc: undefined, // ia-sugestoes.png
    mediaType: 'image',
  },
];

export function useInstructions() {
  return {
    steps: INSTRUCTION_STEPS,
  };
}
