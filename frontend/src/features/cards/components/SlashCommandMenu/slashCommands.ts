/**
 * Comandos slash estilo Notion para formatação Markdown.
 * prefix + suffix é inserido no lugar do "/comando";
 * cursorAfterPrefix = true coloca o cursor entre prefix e suffix (para editar).
 */

export interface SlashCommand {
  id: string
  label: string
  keywords: string[]
  icon: string
  prefix: string
  suffix: string
  cursorAfterPrefix: boolean
}

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    id: 'h1',
    label: 'Título 1',
    keywords: ['título', 'heading', 'h1', 'titulo'],
    icon: 'H1',
    prefix: '# ',
    suffix: '',
    cursorAfterPrefix: true,
  },
  {
    id: 'h2',
    label: 'Título 2',
    keywords: ['título', 'heading', 'h2', 'titulo', 'subtítulo', 'subtitulo'],
    icon: 'H2',
    prefix: '## ',
    suffix: '',
    cursorAfterPrefix: true,
  },
  {
    id: 'h3',
    label: 'Título 3',
    keywords: ['título', 'heading', 'h3', 'titulo'],
    icon: 'H3',
    prefix: '### ',
    suffix: '',
    cursorAfterPrefix: true,
  },
  {
    id: 'bold',
    label: 'Negrito',
    keywords: ['negrito', 'bold', 'b'],
    icon: 'B',
    prefix: '**',
    suffix: '**',
    cursorAfterPrefix: true,
  },
  {
    id: 'italic',
    label: 'Itálico',
    keywords: ['itálico', 'italic', 'i', 'italico'],
    icon: 'I',
    prefix: '*',
    suffix: '*',
    cursorAfterPrefix: true,
  },
  {
    id: 'strikethrough',
    label: 'Riscado',
    keywords: ['riscado', 'strikethrough', 'tachado', 's'],
    icon: 'S',
    prefix: '~~',
    suffix: '~~',
    cursorAfterPrefix: true,
  },
  {
    id: 'inlinecode',
    label: 'Código inline',
    keywords: ['código', 'code', 'inline', 'codigo'],
    icon: '</>',
    prefix: '`',
    suffix: '`',
    cursorAfterPrefix: true,
  },
  {
    id: 'codeblock',
    label: 'Bloco de código',
    keywords: ['bloco', 'code', 'código', 'codigo', 'pre'],
    icon: '{}',
    prefix: '```\n',
    suffix: '\n```',
    cursorAfterPrefix: true,
  },
  {
    id: 'bullet',
    label: 'Lista com marcadores',
    keywords: ['lista', 'bullet', 'marcadores', 'ul', '-'],
    icon: '•',
    prefix: '- ',
    suffix: '',
    cursorAfterPrefix: true,
  },
  {
    id: 'numbered',
    label: 'Lista numerada',
    keywords: ['lista', 'numerada', 'numbered', 'ol', '1.'],
    icon: '1.',
    prefix: '1. ',
    suffix: '',
    cursorAfterPrefix: true,
  },
  {
    id: 'todo',
    label: 'Lista de tarefas',
    keywords: ['tarefa', 'todo', 'checkbox', 'task', '[]'],
    icon: '☐',
    prefix: '- [ ] ',
    suffix: '',
    cursorAfterPrefix: true,
  },
  {
    id: 'quote',
    label: 'Quote / Citação',
    keywords: ['citação', 'quote', 'quotes', 'citacao', 'blockquote', 'aspas'],
    icon: '”',
    prefix: '> ',
    suffix: '',
    cursorAfterPrefix: true,
  },
  {
    id: 'callout',
    label: 'Callout (destaque)',
    keywords: ['callout', 'destaque', 'aviso', 'info', 'dica', 'nota'],
    icon: '💡',
    prefix: '> 💡 ',
    suffix: '',
    cursorAfterPrefix: true,
  },
  {
    id: 'divider',
    label: 'Divisor',
    keywords: ['divisor', 'divider', 'linha', 'separador', '---'],
    icon: '—',
    prefix: '\n---\n',
    suffix: '',
    cursorAfterPrefix: false,
  },
  {
    id: 'link',
    label: 'Link',
    keywords: ['link', 'url', 'hiperlink'],
    icon: '🔗',
    prefix: '[',
    suffix: '](url)',
    cursorAfterPrefix: true,
  },
]

export function filterSlashCommands(commands: SlashCommand[], filter: string): SlashCommand[] {
  const f = filter.trim().toLowerCase()
  if (!f) return commands
  return commands.filter(
    (c) =>
      c.keywords.some((k) => k.includes(f) || f.includes(k)) ||
      c.label.toLowerCase().includes(f)
  )
}
