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

## Deploy (GitHub Pages)

- Workflow em `.github/workflows/deploy-landing-page.yml`: dispara em push na `main` quando há mudanças em `landing-page/**`.
- No repositório: **Settings → Pages → Source**: "GitHub Actions".
- URL da landing: `https://<seu-user>.github.io/dev_task_manager/`
- Múltiplas páginas (ex. `/dev_task_manager/como-usar`) funcionam: o build copia `index.html` para `404.html`, assim o GitHub Pages entrega o SPA em qualquer rota.

## Configuração

1. **Screenshots (Como Usar)**  
   Coloque as imagens em `public/prints/` e defina `imageSrc` em `src/features/instructions/hooks/useInstructions.ts` para cada passo (ex.: `dashboard.png`, `board-colunas.png`, etc.).

2. **Link de download**  
   Atualmente apontando para Google Drive. Para alterar, edite a constante `DOWNLOAD_URL` em: Header, Hero, Download, InstructionsPage e o link no Footer.
