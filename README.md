# Shorts animados — método econômico (Claude Pro)

Versão "econômica" do método de [mromidev/claude-animated-shorts](https://github.com/mromidev/claude-animated-shorts)
para fazer shorts verticais animados (personagens 2D num mundo 3D, three.js + Remotion) gastando o **mínimo** de
limite do plano Claude Pro.

O método original roda tudo numa sessão longa com Opus no esforço máximo, subagentes que comparam cada frame com
38 frames de referência e um "look-match loop". Funciona, mas consome o limite de um plano Pro muito rápido.
Aqui o mesmo template é usado, só que dividido em etapas curtas, cada uma com o modelo mais barato que dá conta.

## O que muda em relação ao original

| | Original (`SKILL.md`) | Econômico (este repo) |
|---|---|---|
| Modelo | Opus max o tempo todo | Haiku / Sonnet / Opus por etapa (ver `PLANO.md`) |
| Subagentes | Sim, para conferir o look | Nunca |
| Conferência visual | IA abre e compara imagens | O usuário olha os stills e descreve em texto |
| Rodadas de correção | Até ficar igual à referência | No máximo 2 por etapa |
| Leitura de arquivos | Livre | Grep + trecho; nunca o arquivo grande inteiro |
| Render | A IA roda e espera | A IA escreve o comando; o usuário roda |
| Memória entre sessões | Contexto longo | `PROGRESSO.md` + `/clear` ao fim de cada etapa |

## Etapas (detalhes em `PLANO.md`)

1. Instalação — Haiku
2. Tema e roteiro — Opus
3. Voz e tempos das palavras — Haiku
4. Cenas, câmera, mundo e personagens — Sonnet (a etapa mais cara)
5. Conferência dos stills — Sonnet, máx. 2 rodadas
6. Som (efeitos, música, mixagem) — Haiku
7. Render final e QA — Haiku

Extra: `short1/legenda/legenda.py` gera legenda estilo TikTok (`.ass`) a partir do `words.json`, gravada com ffmpeg.

## Uso real no primeiro vídeo (`short1`, ~60 s)

Anotado com `/usage` no fim de cada etapa (tabela completa em `PROGRESSO.md`): o vídeo inteiro, com extras
(castelo, médico, voz sussurrada, legenda), coube em poucas janelas de 5 h e **~6 pontos percentuais da semana**
(11% → 17%). A parte mais cara foram as correções visuais (Etapa 5: ~11 pontos da janela de 5 h).

## Como usar

1. Clone o original em `skill-ref/` (é a referência técnica, **não** instale como skill):
   `git clone https://github.com/mromidev/claude-animated-shorts skill-ref`
2. `cd app && npm install --silent`. Precisa de Node, Python 3 (`numpy`, `scipy`) e ffmpeg.
3. Crie uma pasta temporária do Remotion num disco com espaço (ex.: `C:\remotion-tmp`) e aponte `REMOTION_TMP` para ela.
4. Abra o Claude Code nesta pasta. O `CLAUDE.md` manda a IA ler `PROGRESSO.md` e seguir `PLANO.md` etapa por etapa.
   Para um vídeo novo, zere o `PROGRESSO.md` e comece da Etapa 2 (copie `src/videos/short1/` → `short2/`).

## O que não está no repositório

- Voz (`voice.wav`, MP3 da ElevenLabs), mixagem final (`mix.wav`) e vídeos renderizados.
- Fotos e modelo 3D do produto (`app/public/short1/`, `short1/marca/`): o código usa um placeholder se faltarem.
- `node_modules/`.

Os modelos em `app/public/bridge/kenney/` são dos kits da [Kenney](https://kenney.nl) (licença CC0).

## Licença

MIT. Código derivado de [mromidev/claude-animated-shorts](https://github.com/mromidev/claude-animated-shorts)
(Copyright (c) 2026 Mr omi); veja `LICENSE`.
