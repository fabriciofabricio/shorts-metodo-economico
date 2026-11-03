# PLANO — short animado de ~40 s gastando o mínimo de limite (Claude Pro)

Este plano é para a IA (Claude Code) seguir, sessão por sessão. Ele **substitui** o pipeline do
`skill-ref/SKILL.md` onde os dois discordam. O SKILL.md continua sendo a referência técnica (valores de look,
gotchas, armadilhas de leitura), mas **não** siga as partes dele que mandam usar "Opus max", subagentes,
sandboxes ou o "Look-match loop".

Objetivo: um short vertical de ~40 s (1200 frames a 30 fps) no estilo "personagens 2D num mundo 3D",
reaproveitando ao máximo o template da ponte (`templates/bridge/`), que já tem o look final ajustado.

---

## 0. Regras de economia (valem em TODAS as etapas)

1. **Comece toda sessão lendo só `PROGRESSO.md`** e depois só a seção da etapa atual deste plano. Não leia o
   plano inteiro de novo, nem o SKILL.md inteiro. Use Grep para achar o trecho certo e leia só o intervalo.
2. **Modelo certo por etapa.** Cada etapa diz qual modelo usar. Se o modelo atual for diferente, diga ao usuário
   qual comando digitar (`/model haiku`, `/model sonnet` ou `/model opus`) e **pare** até ele trocar.
   Exceção: se a etapa for de Haiku e você já for Sonnet, pode seguir (gasta um pouco mais, mas não trava).
3. **Nunca use subagentes** (ferramenta Agent), nem para pesquisa.
4. **Nunca abra imagens por conta própria** (`.jpg`/`.png`), principalmente `skill-ref/references/frames/` e
   `references/sheets/`. Quem julga os stills é o usuário, de olho, e descreve o problema em texto. Só abra uma
   imagem se o usuário pedir explicitamente, e no máximo 1 por vez.
5. **Não leia arquivos grandes inteiros.** `toon.ts` (~900 linhas), `build.ts` (~700), `cast.ts` (~470),
   `story.ts` (~350): use Grep pelo nome da função/constante e leia só o trecho necessário.
6. **Saída de comandos curta.** Use `npm install --silent`, `pip -q`, e corte logs longos com `| tail -20`.
7. **Comandos demorados ficam com o usuário.** Render final e lotes grandes de stills: escreva o comando pronto
   para ele colar no terminal, em vez de rodar e ficar esperando.
8. **No máximo 2 rodadas de correção visual** por etapa. Depois disso, aceite o resultado e siga em frente.
9. **Ao terminar cada etapa:** atualize `PROGRESSO.md` (o que foi feito, decisões, próximo passo), peça ao
   usuário para rodar `/usage` e anotar o valor, e depois `/clear`.
10. **Limpeza de disco:** o C: tem pouco espaço livre. Depois de cada lote de stills ou render, apague o
    conteúdo de `C:\remotion-tmp` (pasta criada só para isso; o usuário autorizou essa limpeza neste plano).
    Não apague nada fora dessa pasta sem perguntar.

---

## Estrutura de pastas

```
Shorts/
  CLAUDE.md          regras curtas, carregadas sozinhas em toda sessão
  PLANO.md           este arquivo
  PROGRESSO.md       estado atual (lido no início de toda sessão)
  skill-ref/         clone do github.com/mromidev/claude-animated-shorts (só referência, NÃO instalar como skill)
  app/               projeto Remotion
    public/bridge/kenney/*.glb     os 26 modelos Kenney (CC0)
    src/index.ts, src/Root.tsx     registram a composição Short1
    src/videos/short1/             cópia de skill-ref/templates/bridge/
    scripts/                       cópia de skill-ref/templates/scripts/
    out/short1/                    stills e render
  short1/
    SCRIPT.md                      fatos + roteiro
    voice/voice.wav, voice/words.json
    audio/                         cópia de skill-ref/templates/audio/ (mix.py lê ../voice/voice.wav)
```

Nome do vídeo: `short1`. Composição: `Short1`, 1080x1920, 30 fps, 1200 frames.

---

## Etapa 1: Instalação (modelo: **Haiku**; orçamento: ~10–15% de uma janela de 5 h)

Ferramentas já instaladas no PC: Node 24, npm 11, Python 3.14, ffmpeg 9, git, Chrome em
`C:/Program Files/Google/Chrome/Application/chrome.exe`.

1. `git clone --depth 1 https://github.com/mromidev/claude-animated-shorts skill-ref`
   (dentro de `Shorts/`). **Não** copie para `~/.claude/skills/`: como skill, ela mandaria usar Opus max e agentes.
2. Criar `app/` à mão (sem `create-video`, que é interativo):
   - `npm init -y`, depois instalar `remotion @remotion/cli @remotion/bundler @remotion/renderer @remotion/three
     three @react-three/fiber @react-three/postprocessing postprocessing react react-dom` e, como dev,
     `typescript @types/react @types/three`. Use versões compatíveis com `@remotion/three` (veja os
     peerDependencies dele com `npm view @remotion/three peerDependencies`).
   - `tsconfig.json` simples (jsx react-jsx, strict, moduleResolution bundler).
   - `src/index.ts`: `registerRoot(Root)`.
   - `src/Root.tsx`: uma `<Composition id="Short1" component={BridgeShort} durationInFrames={BRIDGE_FRAMES}
     fps={30} width={1080} height={1920} />`, importando de `./videos/short1/Bridge` (o mesmo formato de
     `skill-ref/templates/sandbox_index_example.tsx`).
3. Copiar `skill-ref/templates/bridge/*` para `app/src/videos/short1/` e `skill-ref/templates/scripts/*` para
   `app/scripts/`.
4. Ajustar `app/scripts/bridge-stills.mjs`:
   - ID da composição vindo de `process.env.COMP || "Short1"` (hoje está fixo como `"BridgeShort"`).
   - `REMOTION_TMP` com padrão `C:/remotion-tmp` (com barras normais; `\r` numa string JS vira caractere especial).
5. Modelos Kenney (CC0). A lista exata está na constante `KENNEY` de `src/videos/short1/world.ts`.
   - Vêm do **Nature Kit** (árvores, arbustos, flores, grama, lírio, canoa) e do **Fantasy Town Kit** (lantern,
     cart, stall-*, banner-*, windmill), em kenney.nl.
   - Peça ao **usuário** para baixar os dois ZIPs (é grátis) e dizer onde salvou. Não tente achar links de
     download por conta própria; isso gasta pesquisa à toa.
   - Copie só os `.glb` da lista para `app/public/bridge/kenney/`. Confira os 26 nomes e informe quais
     faltam: um modelo ausente some da cena sem dar erro.
6. Python: `pip install -q numpy scipy`. Se falhar no Python 3.14, use `py -3.12` ou `uv`.
7. Verificar: `npx tsc --noEmit` (filtrar erros só de `src/videos/short1/`) e renderizar **1 still**:
   `node scripts/bridge-stills.mjs out/short1/teste_ 300 0.5`. Peça ao usuário para abrir
   `app/out/short1/teste_300.jpg` e confirmar que aparece a ponte com cidade, árvores e personagens.
   Depois, limpe `C:\remotion-tmp`.

Pronto quando: o still de teste está correto aos olhos do usuário.

---

## Etapa 2: Tema e roteiro (modelo: **Opus**; orçamento: ~10% de uma janela)

1. **Restrição de tema (o maior fator de economia):** a história tem que se passar num cenário que o template
   já tem: cidade europeia antiga (1500–1900), casas, ruas, rio, ponte, mercado, árvores, moinho, multidão,
   soldados, crianças. Nada de espaço, fundo do mar, interior de prédios, máquinas modernas nem animais
   complexos. Isso exigiria construir um mundo novo.
   Exemplos que cabem (confira os fatos antes): a praga da dança de Estrasburgo (1518), a mania das tulipas
   na Holanda (1637), qualquer outro caso histórico real com causa e efeito visual na rua ou no rio.
2. Proponha 3 temas em uma linha cada; o usuário escolhe um.
3. Faça a checagem dos fatos (datas, números, lugar), com a fonte, no topo de `short1/SCRIPT.md`, no formato de
   `skill-ref/templates/SCRIPT_example.md`.
4. Roteiro em **português do Brasil** (decisão do usuário; vale mais que o "English only" do SKILL.md), cerca
   de **140-150 palavras** (~3,5 palavras/s para 40 s), seguindo a fórmula da seção
   "Pipeline > 2. Script" do SKILL.md: Hook (o fato absurdo numa linha) → Setting → Action (3 batidas que
   crescem) → Snap → frase dupla seca ("A boa notícia… / A má notícia…") → "Sabe por quê?" + analogia do dia a dia →
   Consequência → Twist final. As piadas têm que ser fatos reais. Não descreva o que a tela já mostra.
5. Junto com o roteiro, escreva uma **lista de 7 a 9 cenas** (uma linha cada: o que se vê, luz day/golden,
   corte ou glide). Cada cena deve reaproveitar coisas do template; marque com ⚠ o que precisar ser criado.
   Tente ter **no máximo 2 itens ⚠**.
6. O usuário aprova. Depois disso, siga sem pedir confirmação a cada passo ("just do it").

Pronto quando: `short1/SCRIPT.md` tem fatos, roteiro aprovado e lista de cenas.

---

## Etapa 3: Voz e tempos das palavras (modelo: **Haiku**; orçamento: ~10%)

1. O **usuário** gera `voice.wav` fora do Claude (gravação própria ou uma ferramenta de texto para fala), em
   **português do Brasil**, num tom constante, e salva em `short1/voice/` (texto pronto em
   `short1/voice/texto_para_narracao.txt`). Se vier MP3 ou outro formato, converta com ffmpeg para
   `voice.wav` (48 kHz, mono, 24-bit), sem filtros. Corte o silêncio do começo e do fim para ~0,2 s.
   Se passar de 46 s, avise o usuário antes de seguir (o alvo é 40-45 s).
2. Gere `short1/voice/words.json` com o tempo de cada palavra usando Whisper local
   (`pip install -q faster-whisper`, modelo multilíngue `small` com `language="pt"`, `word_timestamps=True`). Formato:
   `[{"w": "Seventy-four", "s": 0.12, "e": 0.61}, ...]`. Se não instalar no 3.14, use `py -3.12`/`uv`.
3. Compare as palavras com o roteiro e corrija as que vierem erradas (só o texto; os tempos ficam).
4. Anote em `PROGRESSO.md` a duração exata do áudio e calcule `TOTAL = ceil(duração × 30) + 15` frames.

Pronto quando: `words.json` bate com o roteiro e a duração está anotada.

---

## Etapa 4: Cenas, câmera, mundo e personagens (modelo: **Sonnet**; orçamento: 1–2 janelas; a etapa mais cara)

Use uma janela de 5 h "cheia" para esta etapa. Trabalhe só em `app/src/videos/short1/`.

1. **`story.ts`**: reescreva (não edite linha a linha) os blocos de timeline para as cenas da Etapa 2:
   `TOTAL`, `SHOTS`, `XFADE`, `FLASH_AT`, `CAMS`, `KICKS`, `dofAt`, `FOREGROUND`. Use os tempos do
   `words.json`: cada reação visual cai 0–3 frames antes da palavra. Siga as regras de câmera da seção
   "Final look values > Camera" do SKILL.md (glides smootherstep de 18–40 f, todo hold com push-in lento,
   cortes só em saltos grandes, kicks de 7 f nos impactos, rolls de 4–4,6°). Mantenha a física da ponte
   (`amp`, `deckY` etc.) só se a história usar a ponte; senão, deixe a ponte parada (sem bounce/queda), sem
   apagar código que outros arquivos importam.
2. **`build.ts` / `world.ts`**: mexa só no layout (o que aparece e onde). **Não mexa** em `lights.ts`,
   `shade.ts`, `paint.ts`, `grade.ts`, `ink.ts`, `lensblur.ts`, nem em `Bridge.tsx`, além de nomes e imports:
   é lá que está o look já ajustado.
3. **`cast.ts` / `toon.ts`**: reaproveite os personagens que já existem (soldados, oficial, moradores, criança,
   pai/mãe), trocando roupa, cor e expressão (há 14 expressões). Personagem novo desenhado do zero só se for
   indispensável, e no máximo 1.
4. **Sabonete O Aristocrata Frescor da Mata (cena final): PLACEHOLDER trocável.** Siga "Itens novos > Sabonete
   3D" em `short1/SCRIPT.md`: `soap.ts` com `buildSoap()` que carrega `app/public/short1/sabonete.glb` se existir;
   senão, monta uma barra verde lisa e uma caixa kraft lisa, sem texto. Não gaste tempo deixando o placeholder
   bonito. Fica fora do layer `NOINK` (recebe a ink do mundo).
5. Antes de renderizar, rode `npx tsc --noEmit` e corrija os erros.
6. Siga as armadilhas da seção "Gotchas" e "Readability traps" do SKILL.md (câmera dentro de casa, props
   perto demais da lente, cor teal dos modelos Kenney, trilhos na altura do peito etc.).

Pronto quando: compila e cada cena tem câmera, cenário e personagens definidos.

---

## Etapa 5: Conferência dos stills (modelo: **Sonnet**; orçamento: ~20–40% de uma janela; no máximo 2 rodadas)

1. Calcule 1 frame do meio de cada cena e entregue ao usuário o comando pronto, por exemplo:
   `cd app; node scripts/bridge-stills.mjs out/short1/r1_ 60,200,340,... 0.5`
2. O **usuário** abre as imagens e descreve os problemas em texto ("cena 3: câmera dentro da casa").
   **Você não abre as imagens** (regra 4).
3. Corrija só o que foi apontado. Rodada 2 só nas cenas que mudaram. Depois de cada rodada, limpe `C:\remotion-tmp`.
4. Depois da rodada 2, **trave a imagem**: anote em `PROGRESSO.md` que `SHOTS`/`TOTAL` não mudam mais (o som
   depende disso).

Pronto quando: o usuário aprova os stills e os tempos estão travados.

---

## Etapa 6: Som (modelo: **Haiku**; se a tabela de eventos ficar confusa, **Sonnet** só nessa parte; orçamento: ~15%)

1. Copie `skill-ref/templates/audio/*` para `short1/audio/`.
2. Em `timeline.py`, espelhe `FPS`, `TOTAL`, `SHOTS`, `XFADE` e os momentos de impacto a partir do `story.ts`
   travado. Troque os eventos específicos da ponte (passos da marcha, bounce, snap, queda na água, balanço)
   pelos eventos da nova história, reaproveitando os geradores de `sfx_gen.py` que já existem.
3. Ajuste a música (`music.py`) só no necessário (andamento/duração).
4. Rode `python mix.py` dentro de `short1/audio/`. Mix padrão: música +3 dB, SFX −6 dB, voz sem alteração.
   Saída: `mix.wav` (48 kHz, duração exata) e `cues.md`.
5. Copie `mix.wav` para onde o `Bridge.tsx` espera o áudio, se ele carregar áudio; se não, o áudio entra só
   no mux da Etapa 7.

Pronto quando: `mix.wav` existe com a duração do vídeo.

---

## Etapa 7: Render final e QA (modelo: **Haiku**; orçamento: ~5%; o render em si não gasta tokens)

1. Entregue ao **usuário** os comandos para colar no PowerShell, dentro de `app/`:
   ```powershell
   $env:TEMP='C:\remotion-tmp'; $env:TMP='C:\remotion-tmp'
   npx remotion render src/index.ts Short1 out/short1/video.mp4 --codec h264 --crf 16 --scale 1.3333333333333333 --gl angle --browser-executable "C:/Program Files/Google/Chrome/Application/chrome.exe"
   ffmpeg -y -i out/short1/video.mp4 -i ../short1/audio/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 256k -shortest out/short1/final.mp4
   ```
   (2K = 1440x2560, uns 6–8 min para 40 s. Para ir mais rápido, use `--scale 1` para 1080x1920, que também
   serve para o YouTube Shorts.)
2. QA: `python scripts/short_qa.py out/short1/final.mp4 out/short1/qa <shots.json>`. Gere o `shots.json` a
   partir de `SHOTS`. Corrija só frames pretos, brancos, congelados ou com "pop" apontados pelo QA.
3. Limpe `C:\remotion-tmp`. Atualize `PROGRESSO.md` com "concluído" e o caminho do `final.mp4`.

---

## Orçamento total esperado

| Etapa | Modelo | Uso (estimativa) |
|---|---|---|
| 1 Instalação | Haiku | 10–15% de janela |
| 2 Roteiro | Opus | ~10% |
| 3 Voz | Haiku | ~10% |
| 4 Cenas/mundo | Sonnet | 1–2 janelas |
| 5 Stills | Sonnet | 20–40% |
| 6 Som | Haiku | ~15% |
| 7 Render/QA | Haiku | ~5% |
| **Total 1º vídeo** | | **~2–3 janelas, ~25–40% da semana** |

São estimativas. Os valores reais que o usuário anotar com `/usage` em `PROGRESSO.md` valem mais.
Se uma etapa passar do dobro do orçado, pare, anote e pergunte ao usuário se segue.

## Próximos vídeos

Comece da Etapa 2, copiando `src/videos/short1/` para `src/videos/short2/` e `short1/audio/` para
`short2/audio/`. A Etapa 1 não se repete.
