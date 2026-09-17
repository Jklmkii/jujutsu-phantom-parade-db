# GEMINI.md — Regra de Delegação Antigravity ↔ Jules por Complexidade

> Este arquivo rege o comportamento de orquestração do Antigravity no projeto **JJKPPDB Offline**, definindo quando ele delega tarefas para a Jules AI vs. quando executa sozinho. Possui prioridade máxima de execução sobre `AGENTS.md`.

## Objetivo Principal
O propósito central desta regra é **poupar a cota e os tokens do Antigravity**, utilizando a cota diária dedicada da Jules AI (100 tarefas/dia) para tarefas de baixo risco e escopo pontual.

---

## 1. Classificação de Complexidade

| Faixa | Critério | Ação |
| :--- | :--- | :--- |
| **Baixa** | Mudança isolada num único arquivo, sem lógica nova: ajuste de Tailwind/CSS, cores, texto, badges, correção de nome de variável. | Delegar para a Jules via API |
| **Média** | Função pura nova e testável isoladamente, ajuste de componente com lógica simples, correção de bug com causa raiz diagnosticada. | Delegar para a Jules via API |
| **Média-Alta** | Feature que toca múltiplos arquivos, novo estado na store Zustand, mecânica nova de transformação ou filtro complexo. | Executar localmente (Antigravity) |
| **Alta** | Mudanças no Electron IPC/main process, workflows do GitHub Actions, empacotamento Windows (.exe), arquitetura do banco de dados. | Executar localmente (Antigravity) |

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

