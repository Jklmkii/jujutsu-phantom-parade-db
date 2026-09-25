# 🤖 AGENTS.md — Diretrizes de Engenharia & Arquitetura para Agentes Autônomos

Bem-vindo, Agente! Este documento fornece o mapa arquitetural, convenções operacionais e restrições técnicas para agentes autônomos trabalhando no repositório **JJKPPDB (Jujutsu Kaisen: Phantom Parade Offline DB)**.

> [!NOTE]
> **Orquestração Agêntica & Precedência:** Para o agente principal **Google Antigravity**, as diretrizes executáveis de classificação de complexidade, controle de cota e roteamento de tarefas entre agentes estão formalizadas em `GEMINI.md` (raiz do projeto), o qual possui prioridade executiva máxima sobre este documento.

---

## 🧭 1. Visão Geral do Repositório & Filosofia

O **JJKPPDB Offline** é um aplicativo educacional/banco de dados completo do jogo *Jujutsu Kaisen: Phantom Parade*, 100% offline, cross-platform (Web e Desktop nativo Windows).

* **Alvos Principais:**
  * **Web Application:** React 19 + TypeScript + Vite 8 + Tailwind CSS v4.
  * **Desktop Windows App:** Electron 44 (janela nativa sem menu, diálogos nativos do Windows).
* **Filosofia Central:** 100% offline, zero dependência de telemetria ou backends remotos, latência zero (60fps), áudio procedural sintetizado via Web Audio API e gerenciamento de estado local via Zustand (`localStorage`).

---

## 🛠️ 2. Stack Tecnológica & Módulos

| Módulo | Tecnologias / Bibliotecas | Caminho |
| :--- | :--- | :--- |
| **Frontend Framework** | React `^19.2.8`, TypeScript `~6.0.2`, Vite `^8.3.0` | `src/` |
| **Estilização & Ícones** | Tailwind CSS `^4.3.3`, `@tailwindcss/vite`, Lucide React | `src/index.css`, `src/components/` |
| **Estado & Persistência** | Zustand `^5.0.15` (`persist` middleware, `localStorage`) | `src/store/useJjkStore.ts` |
| **Desktop Nativo** | Electron `^44.4.1`, Context Bridge seguro | `electron/main.cjs`, `electron/preload.cjs` |
| **Motor de Áudio** | Web Audio API (procedural, zero arquivos externos) | `src/utils/sound.ts` |
| **Lousa Tática** | HTML5 Canvas transparente (Scratchpad 6 cores, 3 espessuras) | `src/components/TacticalScratchpad.tsx` |
| **Banco de Dados Local** | JSONs estruturados (109 personagens, 241 memórias, 179 eventos) | `src/data/` |
| **Mídia Local** | 314 imagens e GIFs oficiais | `public/assets/` |
| **Linter** | Oxlint `^1.81.0` (19 arquivos, 0 erros) | `.oxlintrc.json` |

---

## 📂 3. Layout de Diretórios

```
jujutsu/
├── .github/workflows/
│   ├── ci.yml                    # Testes de build e lint em pushes e PRs
│   └── release.yml               # Build automático de executável Windows Electron
├── electron/
│   ├── main.cjs                  # Processo principal Electron (janela, menus, IPC)
│   └── preload.cjs               # ContextBridge seguro expondo window.electronAPI
├── public/
│   └── assets/                   # 314 imagens e GIFs locais oficiais
├── scripts/
│   └── compile_data.py           # Pipeline de extração e higienização de wikitexts
├── src/
│   ├── components/               # Componentes visuais (Hero, Detalhes, Catálogo, etc.)
│   ├── data/                     # characters.json, memories.json, timeline.json
│   ├── store/useJjkStore.ts      # Store Zustand com persistência local
│   ├── types/index.ts            # Interfaces TypeScript e tipagem global
│   ├── utils/sound.ts            # Motor procedural de efeitos sonoros
│   ├── App.tsx                   # Roteador principal e orquestrador
│   └── main.tsx                  # Ponto de entrada React
├── package.json
├── run_app.bat                   # Inicializador Web de 1 clique
└── run_desktop.bat               # Inicializador Desktop de 1 clique
```

---

## ⚡ 4. Comandos de Verificação & Validação

Antes de submeter qualquer Pull Request ou propor commits no repositório, execute e valide:

```bash
# 1. Verificar compilação TypeScript e bundle de produção (Deve sair com código 0)
npm run build

# 2. Executar linter Oxlint em todo o projeto (Deve retornar 0 erros e 0 warnings)
npm run lint
```

---

## 📏 5. Regras & Convenções para Agentes

### A. 100% Offline & Segurança de Dados
* Nunca adicione scripts externos via CDN, Google Analytics ou chamadas `fetch` a servidores externos.
* Todos os assets devem ser servidos localmente a partir de `public/assets/`.
* A persistência deve ser mantida estritamente no `localStorage` via Zustand (`name: 'jjkppdb-user-storage'`).

### B. Mecânicas de Combate & Transformações (`[Base]` ↔ `[Mudado]`)
* Personagens transformáveis (ex: *Yuji Vermelho*, *Mahito Vermelho*, *Megumi Expansão de Domínio*) possuem campos `changed` nas habilidades.
* A alternância entre modos base e transformado deve ser instantânea, com o seletor vertical e reprodução do som `playTransformSurge()`.
* O alternador de nível `[Nível 1]` vs `[Nível 10]` deve recalcular todas as porcentagens de forma reativa sem recarregar a página.

### C. Convenção de Commits Semânticos
* Utilize **Conventional Commits**:
  * `feat:` para novas telas, modos ou filtros.
  * `fix:` para correções de bugs ou links quebrados.
  * `refactor:` para melhorias de código sem alteração funcional.
  * `docs:` para atualizações de documentação.
* **Gatilhos de Versão:**
  * `#minor` no commit para avanço de versão secundária (`x.y.z -> x.(y+1).0`).
  * `#major` no commit para quebras de compatibilidade arquitetural.

### D. Sincronização Obrigatória com o Vault JJK_Scraper
* A documentação de arquitetura, changelog, ADRs e histórico de demandas está centralizada no cofre dedicado **`JJK_Scraper/JJK_Database/Projeto/`** (com acesso pelo `Dashboard.md`). Sempre mantenha essas notas sincronizadas após novas implementações.

### E. Estilo Conversacional de Pair-Programming Ativo (Narração Passo a Passo em Tempo Real)
* **Princípio Mandatório:** O desenvolvedor prefere expressamente a condução em tempo real passo a passo demonstrada pelo Claude. O agente NUNCA deve operar de forma silenciosa ou emitir blocos massivos sem contexto.
* **Comunicação Ativa:** Antes de cada ferramenta ou edição, contextualizar brevemente a ação em frases curtas (ex: *"Agora vou inspecionar o arquivo X:"*, *"Edit 1: Adicionar filtro de coleção ao useMemo:"*).
* **Diagnóstico Aberto:** Se um replace corromper linhas ou a compilação falhar, relatar o diagnóstico e a correção em andamento abertamente.
* **Feedback Atômico de Qualidade:** Reportar compilação e linter imediatamente com marcadores visuais (ex: *"Build passou com código 0! ✅ Agora vou rodar o lint:"*).
* **Tabela de Fechamento:** Ao concluir, estruturar a tabela resumo com Tarefa, Status, Build e Lint com checkmarks verdes (`✅`).

### F. Link Mandatório de Acompanhamento de Commits
* **Regra Obrigatória:** Sempre que realizar um `git push` ou concluir uma tarefa que resulte em novo commit, o agente DEVE expressamente fornecer o link clicável direto para o commit no GitHub (`https://github.com/Jklmkii/jujutsu-phantom-parade-db/commit/<hash>`), permitindo ao desenvolvedor auditar e acompanhar o diff e os workflows de CI/CD em tempo real.
