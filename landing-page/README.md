# Landing Page — Dev Task Manager

Landing page em **React 19 + Vite**, separada do frontend principal da aplicação. Contém:

- **Início**: hero, recursos (features) e seção de download
- **Como Usar**: passos com espaços para screenshots e dicas rápidas

Seguindo as regras em `regras-desenvolvimento-.net-react/regras-frontend.md` (feature-based, TypeScript strict, a11y).

## Comandos

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run preview  # preview do build
```

## Configuração

1. **Link de download**  
   Substitua `#download` (ou `DOWNLOAD_URL`) pela URL real nos arquivos:
   - `src/shared/components/layout/Header/Header.tsx`
   - `src/features/home/components/Hero/Hero.tsx`
   - `src/features/home/components/Download/Download.tsx`
   - `src/features/instructions/pages/InstructionsPage.tsx`

2. **Screenshots (Como Usar)**  
   Coloque as imagens em `public/prints/` e defina `imageSrc` em `src/features/instructions/hooks/useInstructions.ts` para cada passo, por exemplo:
   - `dashboard.png` — tela inicial
   - `board-colunas.png` — board Kanban
   - `cards-detalhes.png` — cards e modal
   - `subtarefas.png` — subtarefas
   - `ia-sugestoes.png` — painel de IA

3. **Deploy (ex.: GitHub Pages)**  
   Em `vite.config.ts`, ajuste `base` para o path do repositório, ex.: `base: '/dev_task_manager/'`.
