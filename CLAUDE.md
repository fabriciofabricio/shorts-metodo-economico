# Shorts — instruções para a IA

Projeto: um short animado de ~40 s (three.js + Remotion, estilo "personagens 2D num mundo 3D") com o
template de github.com/mromidev/claude-animated-shorts, gastando o **mínimo** de limite do plano Claude Pro.

Em toda sessão:
1. Leia `PROGRESSO.md` primeiro. Depois leia **só** a seção da etapa atual em `PLANO.md`.
2. Siga as "Regras de economia" do `PLANO.md`. Resumo:
   - Use o modelo da etapa (se for outro, peça `/model ...` ao usuário).
   - Sem subagentes.
   - Não abra imagens; o usuário julga os stills e descreve em texto.
   - Grep + leitura por trecho em arquivos grandes.
   - Comandos demorados (render) ficam com o usuário.
   - No máximo 2 rodadas de correção visual.
   - Limpe `C:\remotion-tmp` depois de renders.
3. Onde `PLANO.md` e `skill-ref/SKILL.md` discordarem, vale o `PLANO.md`. Ignore "Opus max", agentes e o
   "Look-match loop" do SKILL.md.
4. Ao fim de cada etapa: atualize `PROGRESSO.md`, peça ao usuário para rodar `/usage` e anotar, e depois `/clear`.

Responda ao usuário em português.
