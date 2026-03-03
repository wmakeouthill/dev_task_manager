import './NotesShowcase.css';

interface MockNote {
  id: string;
  title: string;
  color: 'yellow' | 'green' | 'pink' | 'blue' | 'purple' | 'orange';
  minimized?: boolean;
  content?: string;
  tag?: string;
}

const NOTE_COLORS = {
  yellow: { bg: '#2d2a00', header: '#3d3800' },
  green:  { bg: '#002d1a', header: '#003d22' },
  pink:   { bg: '#2d001a', header: '#3d0022' },
  blue:   { bg: '#00132d', header: '#001a3d' },
  purple: { bg: '#1a002d', header: '#22003d' },
  orange: { bg: '#2d1200', header: '#3d1800' },
};

const MOCK_NOTES: MockNote[] = [
  {
    id: '1',
    title: 'Ideias para o projeto',
    color: 'yellow',
    tag: 'Markdown',
    content: `## Próximas features\n- [ ] Dark mode toggle\n- [ ] Export to PDF\n- [x] Sticky Notes\n\n**Prioridade alta!**`,
  },
  {
    id: '2',
    title: 'API Endpoints',
    color: 'green',
    tag: 'IA',
    content: `\`GET /boards\`\n\`POST /notes\`\n\`PATCH /notes/:id\`\n\nUsar **/ia fix** para revisar docs automaticamente.`,
  },
  {
    id: '3',
    title: 'Bug crítico #47',
    color: 'pink',
    minimized: true,
  },
  {
    id: '4',
    title: 'Stand-up hoje',
    color: 'blue',
    tag: 'Drag & Drop',
    content: `**Feito ontem:**\n- Fix login redirect\n\n**Hoje:**\n- Revisar PR #23\n- Deploy staging`,
  },
  {
    id: '5',
    title: 'Referências úteis',
    color: 'purple',
    minimized: true,
  },
  {
    id: '6',
    title: 'Release v1.4',
    color: 'orange',
    tag: 'Redimensionar',
    content: `### Changelog\n- Sticky Notes ✅\n- Grid layout ✅\n- Resize handle ✅\n- IA em notas ✅`,
  },
];

function MockStickyNote({ note }: { note: MockNote }) {
  const colors = NOTE_COLORS[note.color];
  return (
    <div
      className={`mock-note${note.minimized ? ' mock-note--minimized' : ''}`}
      style={{ '--mock-bg': colors.bg, '--mock-header': colors.header } as React.CSSProperties}
    >
      <div className="mock-note-header">
        <span className="mock-drag-icon" aria-hidden>⠿</span>
        <span className="mock-note-title">{note.title}</span>
        <div className="mock-toolbar">
          {!note.minimized && <span className="mock-btn" aria-hidden title="Minimizar">▲</span>}
          {note.minimized  && <span className="mock-btn" aria-hidden title="Expandir">▼</span>}
          <span className="mock-btn" aria-hidden>🎨</span>
          <span className="mock-btn" aria-hidden>⧉</span>
          <span className="mock-btn" aria-hidden>🗑</span>
        </div>
      </div>

      {!note.minimized && (
        <div className="mock-note-body">
          {note.content && (
            <div className="mock-note-content">
              {note.content.split('\n').map((line, i) => (
                <div key={i} className={`mock-line ${getLineClass(line)}`}>
                  {formatLine(line)}
                </div>
              ))}
            </div>
          )}
          {note.tag && (
            <span className="mock-note-tag">{note.tag}</span>
          )}
          <div className="mock-resize-handle" aria-hidden />
        </div>
      )}
    </div>
  );
}

function getLineClass(line: string) {
  if (line.startsWith('## ') || line.startsWith('### ')) return 'line-heading';
  if (line.startsWith('- [x]')) return 'line-done';
  if (line.startsWith('- [ ]') || line.startsWith('- ')) return 'line-item';
  if (line.startsWith('**') && line.endsWith('**')) return 'line-bold';
  if (line.startsWith('`') && line.endsWith('`')) return 'line-code';
  return 'line-text';
}

function formatLine(line: string) {
  const trimmed = line
    .replace(/^#{2,3} /, '')
    .replace(/^- \[x\] /, '✅ ')
    .replace(/^- \[ \] /, '☐ ')
    .replace(/^- /, '• ')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1');
  return trimmed || null;
}

export function NotesShowcase() {
  return (
    <section id="notes" className="notes-showcase section" aria-labelledby="notes-showcase-title">
      <div className="container">
        <div className="section-header">
          <h2 id="notes-showcase-title" className="section-title">
            📌 Sticky <span className="text-gradient">Notes</span>
          </h2>
          <p className="section-subtitle">
            Capture ideias, referências e lembretes em notas coloridas diretamente no app —
            com Markdown, IA e arrastar para reordenar.
          </p>
        </div>

        <div className="notes-showcase-layout">
          {/* Mock grid of notes */}
          <div className="notes-mock-grid" aria-hidden>
            {MOCK_NOTES.map(note => (
              <MockStickyNote key={note.id} note={note} />
            ))}
          </div>

          {/* Feature highlights */}
          <div className="notes-highlights">
            <h3 className="notes-highlights-title">O que você pode fazer</h3>
            <ul className="notes-highlight-list">
              <li className="notes-highlight-item">
                <span className="notes-highlight-icon">🎨</span>
                <div>
                  <strong>7 cores temáticas</strong>
                  <p>Categorize visualmente suas notas com cores distintas.</p>
                </div>
              </li>
              <li className="notes-highlight-item">
                <span className="notes-highlight-icon">⠿</span>
                <div>
                  <strong>Drag & Drop para reordenar</strong>
                  <p>Arraste o ícone ⠿ para mudar a ordem das notas na grade.</p>
                </div>
              </li>
              <li className="notes-highlight-item">
                <span className="notes-highlight-icon">↔</span>
                <div>
                  <strong>Redimensionamento livre</strong>
                  <p>Arraste o canto inferior direito para ajustar largura e altura.</p>
                </div>
              </li>
              <li className="notes-highlight-item">
                <span className="notes-highlight-icon">▲</span>
                <div>
                  <strong>Minimizar / expandir</strong>
                  <p>Collapse notas que não precisam de atenção no momento.</p>
                </div>
              </li>
              <li className="notes-highlight-item">
                <span className="notes-highlight-icon">✍</span>
                <div>
                  <strong>Markdown nativo</strong>
                  <p>Títulos, listas, checkboxes, código e negrito — use <code>/</code> para formatar.</p>
                </div>
              </li>
              <li className="notes-highlight-item">
                <span className="notes-highlight-icon">🤖</span>
                <div>
                  <strong>IA direto na nota</strong>
                  <p>Digite <code>/ia</code> para corrigir, expandir ou organizar o conteúdo com IA.</p>
                </div>
              </li>
              <li className="notes-highlight-item">
                <span className="notes-highlight-icon">⧉</span>
                <div>
                  <strong>Janela flutuante</strong>
                  <p>Abra qualquer nota em uma janela independente com preview Markdown ao vivo.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
