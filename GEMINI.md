# GEMINI.md — Regra de Delegação Antigravity ↔ Jules por Complexidade

> Este arquivo rege o comportamento de orquestração do Antigravity no projeto **JJKPPDB Offline**, definindo quando ele delega tarefas para a Jules AI vs. quando executa sozinho. Possui prioridade máxima de execução sobre `AGENTS.md`.

## Objetivo Principal
O propósito central desta regra é **poupar a cota e os tokens do Antigravity**, utilizando a cota diária dedicada da Jules AI (100 tarefas/dia) para tarefas de baixo risco e escopo pontual.

---

## 1. Classificação de Complexidade & Perfil Operacional da Jules

| Faixa | Critério Técnico | Aptidão da Jules | Ação de Roteamento |
| :--- | :--- | :--- | :--- |
| **Baixa** | Mudança isolada num único arquivo, sem lógica algorítmica nova: ajuste de Tailwind/CSS, espaçamento, cor, texto/i18n, atributos de acessibilidade ARIA, correção de nome de variável, comentários. | **Excelente (100% autônoma):** Executa com perfeição sem riscos de efeitos colaterais. | **Delegar para a Jules via API** (se cota disponível). |
| **Média** | Função pura nova e testável isoladamente (helper, cálculo matemático, parser), ajuste de componente com lógica simples e escopo delimitado, bug com causa-raiz diagnosticada, criação/expansão de suítes de testes unitários Vitest/Jest, otimizações atômicas de performance (`React.memo`). | **Alta eficácia (escopo fechado):** Brilha em tarefas com critérios de aceite explícitos no estilo "Ticket Jira". | **Delegar para a Jules via API** (se cota disponível). |
| **Média-Alta** | Feature transversal que toca múltiplos arquivos, introdução/modificação de estado na store central (Zustand), mudança de arquitetura de um módulo, componentes com desenho visual complexo (Canvas HTML5 / Gráficos SVG Cartesianos), decisões de design ainda não consolidadas. | **Inadequada (alto risco de degradação):** Jules sofre com perda de contexto em alterações interdependentes e não tem feedback visual para telas ricas. | **Executar localmente (Antigravity)**. Nunca delegar. |
| **Alta** | Mudança em workflows do GitHub Actions, segurança, permissões e segredos, Electron IPC/main process, build nativo/release de executáveis Windows (`.exe`/NSIS) ou Android, tarefas que exigem acesso ao sistema local ou ao cofre Obsidian. | **Incompatível (ambiente isolado):** Jules roda em container Linux na nuvem sem acesso a ferramentas locais, runtime Windows ou vault. | **Executar localmente (Antigravity)**. Nunca delegar. |

### 1.1. Perfil Empírico da Jules AI: Pontos Fortes vs. Limitações Críticas (Grounding da Pesquisa)

#### 🌟 Pontos Fortes Comprovados (O "Doce Ponto" de Delegação):
1. **Execução em Sandbox Assíncrona:** Jules opera em uma VM dedicada no Google Cloud sem consumir recursos da máquina de desenvolvimento nem tokens da janela interativa do Antigravity.
2. **Tarefas de "Overhead Cognitivo" e Higiene:** Brilha na resolução de warnings de linter (Oxlint/ESLint), tipagem estrita TypeScript (eliminação de `any`), refatoração de acessibilidade (`aria-expanded`, `aria-controls`, `role`) e internacionalização.
3. **Escrita de Testes Unitários:** Excelente capacidade de derivar e cobrir casos de borda em funções puras já existentes usando suítes de teste automatizadas.
4. **Resolução de Bugs Determinísticos:** Alta precisão quando o sintoma observável e o arquivo provável são fornecidos claramente no prompt (estilo issue).

#### ⚠️ Limitações Reais & Modos de Falha da Jules:
1. **Perda de Coerência em Mudanças Transversais (Multi-Arquivo):** Quando uma alteração afeta 5+ arquivos simultâneos (ex: store Zustand + múltiplos componentes dependentes), Jules frequentemente esquece de atualizar referências secundárias ou cria interfaces divergentes.
2. **Incapacidade de Validação Visual:** Como opera em VM headless sem tela gráfica, Jules não consegue inspecionar artefatos visuais interativos (ex: Scratchpad Canvas, renderização de curvas parabólicas).
3. **Incompatibilidade com Especificidades de SO Local:** Jules roda em Linux; particularidades de Electron Windows (NSIS, PowerShell, caminhos de drive `C:\...`, locks de sincronização do OneDrive) falham ou não podem ser testadas por ela.
4. **Alucinação sob Requisitos Ambíguos:** Diante de prompts abertos ("melhore a interface da home"), Jules tende a congelar em `AWAITING_USER_FEEDBACK` ou gerar soluções genéricas fora das convenções do repositório.
5. **Isolamento de Repositório Único:** Não possui acesso a diretórios externos à árvore Git (como o Obsidian Vault ou bases locais de scrapers).

### 1.2. Engenharia de Prompt Obrigatória ao Delegar para a Jules
Toda delegação para a Jules deve seguir a estrutura de um **Ticket Determinístico**:
1. **Sintoma Observável:** O que está acontecendo vs o que deveria acontecer.
2. **Localização Provável:** O arquivo relativo (sem linha fixa).
3. **Critérios de Aceite:** O comportamento esperado após a alteração.
4. **Comando de Verificação:** Qual comando de teste ou linter a Jules deve rodar antes de concluir (ex: `npx vitest run src/tests/...`, `npm run lint`).

---

## 2. Verificação de Cota da Jules
- Manter o rastreamento de cota compartilhado no arquivo central `.antigravity/jules-quota.json`.
- Se a cota diária da Jules estiver esgotada, o Antigravity assume também tarefas de faixa Baixa e Média localmente para não travar o usuário.

---

## 3. Separação entre Código e Documentação
- A Jules atua exclusivamente no código do repositório. A Jules não tem acesso ao Obsidian Vault local.
- O registro documental no Obsidian-Vault é de responsabilidade do Antigravity após o merge e revisão do diff real do PR.

---

## 4. Proibido Pré-Resolver Antes de Delegar
Ao despachar uma tarefa para a Jules:
- Enviar apenas a descrição do sintoma observável, arquivo provável e comportamento esperado ("o quê", não "como").
- Não enviar código pronto para colar nem diffs prévios.

---

## 5. Notificação Mandatória de Complexidade e Roteamento ao Usuário
A cada solicitação ou tarefa processada, o Antigravity **DEVE sempre informar expressamente** no corpo de sua resposta ao usuário:
1. O **Nível de Dificuldade / Complexidade** avaliado (`Baixa`, `Média`, `Média-Alta` ou `Alta`), baseado estritamente na matriz da Seção 1.
2. O **Agente Responsável** (`Jules AI` via API ou `Antigravity` local) e a justificativa técnica clara do roteamento, permitindo que o usuário confira e audite a conformidade da governança agêntica.

