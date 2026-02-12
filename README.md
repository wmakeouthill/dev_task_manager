# Dev Task Manager

Aplicativo .NET-first para Windows: gerenciador de tarefas para devs com Kanban, página de card estilo Notion, IA contextual e notificações. Backend .NET 9 (Minimal APIs + Clean Architecture/DDD), frontend React 19 + Vite, host WPF + WebView2.

As regras de desenvolvimento estão em **regras-desenvolvimento-.net-react/** (backend, frontend, testes).

## Pré-requisitos

- .NET 9 SDK
- Node.js 18+
- Windows (para o host WPF e WebView2)
- **IA (Gemini):** para o assistente de IA nos cards, configure a chave da API Google Gemini em `appsettings.json` (`Gemini:ApiKey`) ou na variável de ambiente `GEMINI_API_KEY`. Obtenha a chave em [Google AI Studio](https://aistudio.google.com/apikey).

## Como rodar

### Comando único (Windows – backend + UI + janela desktop)

Para subir a aplicação completa (API, frontend React e janela WPF com WebView2) de uma vez:

```powershell
.\start-app.ps1
```

Isso abre duas janelas de console (backend e frontend) e a janela desktop do app. **Tudo com hot reload:**

- **Backend:** `dotnet watch` — a API reinicia ao salvar arquivos .cs  
- **Frontend:** Vite HMR — a UI atualiza sem recarregar a página  
- **Desktop:** `dotnet watch` — o app WPF reinicia ao salvar C#/XAML  

Ao fechar a janela do app, o script encerra backend e frontend.

**Pré-requisito:** na primeira vez, instale as dependências do frontend: `cd frontend && npm install`.

### Passo a passo (desenvolvimento)

#### 1. Backend (API)

Se você já tinha um banco SQLite antigo (criado antes das migrações), **apague o arquivo** `src/WebApi/devtaskmanager.db` e suba a API de novo para o esquema ser criado corretamente (todas as tabelas: workspaces, boards, columns, cards, comments, checklist_items, reminders).

```bash
dotnet run --project src/WebApi
```

API em `https://localhost:7xxx` ou `http://localhost:5xxx` (veja `src/WebApi/Properties/launchSettings.json`). Health: `/health`, status: `/api/v1/status`.

#### 2. Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

App em `http://localhost:5173`. O proxy envia `/api` para o backend (ajuste a porta no proxy em `frontend/vite.config.ts` se necessário).

#### 3. Desktop (WPF + WebView2)

Com o backend e o frontend rodando, execute o host WPF; ele abre o WebView2 em `http://localhost:5173`.

```bash
dotnet run --project src/Desktop
```

## Estrutura

- **src/Domain** – Entidades, value objects, interfaces (sem dependências externas).
- **src/Application** – Use cases, DTOs, validators, ports.
- **src/Infrastructure** – EF Core, repositórios, integrações.
- **src/WebApi** – Minimal APIs, middleware.
- **src/Desktop** – Host WPF + WebView2.
- **frontend/src** – App React (estrutura feature-based: `app/`, `features/`, `shared/`, `lib/`).
- **docs/** – Visão do produto, modelo de domínio, plano de backend/frontend, IA/notificações, estratégia de testes.

## Empacotamento portátil (Windows 10/11)

Para gerar uma versão **portátil** que funciona sem instalar .NET ou Node.js:

```powershell
.\publish-portable.ps1
```

A pasta `publish/` conterá:
- **DevTaskManager.Desktop.exe** – executável principal (launcher)
- **DevTaskManager.WebApi.exe** – API + SPA (iniciado automaticamente pelo Desktop)
- `appsettings.json`, `devtaskmanager.db` (criado na primeira execução)

**Compatibilidade:**
- **Windows 10** 1809+ (October 2018 Update) e **Windows 11**, arquitetura **x64**
- **WebView2 Runtime:** Windows 11 já inclui. No Windows 10, pode ser necessário instalar: [WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/)

**Uso:** copie a pasta `publish/` inteira para qualquer local (pen drive, outra máquina) e execute `DevTaskManager.Desktop.exe`.

## Testes

- Backend: `dotnet test`
- Frontend: `cd frontend && npm run test`

## Documentação de regras

- [rules.md](regras-desenvolvimento-.net-react/rules.md) – Índice e quick reference.
- [regras-backend.md](regras-desenvolvimento-.net-react/regras-backend.md) – Clean Architecture, DDD, Minimal APIs.
- [regras-frontend.md](regras-desenvolvimento-.net-react/regras-frontend.md) – React 19, feature-based, TanStack Query, Zustand.
- [regras-testes.md](regras-desenvolvimento-.net-react/regras-testes.md) – xUnit, NSubstitute, FluentAssertions, Vitest, Testing Library.
