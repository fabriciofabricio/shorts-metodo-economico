# PROGRESSO — short1

Leia isto primeiro em toda sessão. Depois leia só a seção da etapa atual no `PLANO.md`.

## Etapa atual
**CONCLUÍDO.** Etapas 1-7 feitas. Vídeo final: `app/out/short1/final.mp4` (1080x1920, 59,8 s). QA (`short_qa.py`, 2026-11-03): sem quadros
pretos, sem brancos fora do plano, sem trechos congelados, sem silêncio. "Pops" apontados: a maioria coincide com cortes de câmera e
"kicks" planejados (f76, 106, 176, 275, 401, 437, 487, 600, 637, 838, 935, 1089, 1195, 1261, 1527...); não investigados: f1075-1078 e f1401.
Opcional: sabonete 3D real (`app/public/short1/sabonete.glb`, hoje placeholder com a foto da embalagem), apagar `C:emotion-tmp`.

### Legenda estilo TikTok (2026-11-03, Opus): falta o usuário assistir `app/out/short1/final_legendado.mp4`
- `short1/legenda/legenda.py` gera `legenda.ass` a partir de `words.json` (grafia corrigida pelo `texto_para_narracao.txt`:
  "dezessete", "de Versalhes", "Aristocrata"). 68 blocos de 1-3 palavras, MAIÚSCULAS, Arial Black 82, branco com contorno preto 9,
  palavra falada em amarelo `#FFE135` ("O ARISTOCRATA" em verde), "pop" na entrada de cada bloco, centro em y 1290 (fora da UI do TikTok).
- Gravada com ffmpeg (libass) sobre o `final.mp4` (intacto), áudio copiado: `ffmpeg -i final.mp4 -vf subtitles=legenda.ass -c:v libx264
  -crf 17 -c:a copy final_legendado.mp4` (rodar dentro de `short1/legenda`). Ajustes: `Y`, tamanho da fonte, cores e `MAX_CHARS` no topo do script.
- Still de conferência: `app/out/short1/leg_check.jpg` (41,5 s).

### Médico moderno (2026-11-03, Sonnet): APROVADO pelo usuário ("está tudo certo") após `d3_*.jpg` (plano 2)
- `toon.ts`: `Outfit` ganhou `coat`, `scrubs`, `stetho`, `glasses`. `DOCTOR` agora = jaleco branco aberto sobre roupa de hospital
  azul-petróleo (decote em V), bolso com caneta, crachá, bolsos de quadril, gola, estetoscópio no pescoço, óculos redondos, cabelo
  curto escuro (`hat: "hair"`), calça de alfaiataria cinza-azulada, tênis branco; sem cartola e sem bigode. Mangas brancas (armCol).
  Só a vista frontal (`bodyFront`) tem os detalhes; a vista lateral (`bodySide`) não foi mexida (o médico só aparece de frente).
- Plano 2 (pedido do usuário: médico centralizado e com outro personagem ao fundo): `S2b` em `story.ts` agora olha direto para `DOC_AT`
  (médico no centro) de 6 m, na direção (+0,65, +0,76); `cast.ts` `quay()`: ninguém na frente dele, o morador 4 está ATRÁS dele
  (2,15 / -31,9: 1,6 m atrás, 0,65 m à direita da tela, meio escondido pelo ombro); morador 0 voltou ao lugar original (-1,4 / -34,4) para o
  plano 2c (recuo). Médico com escala 1,1. Stills: `d3_180/230/270/290.jpg`. Contou como a 1ª rodada visual do médico.

### Trecho sussurrado trocado (2026-11-03, Sonnet): falta o usuário OUVIR 34-40 s do `mix.wav`
- O usuário mandou outro take da ElevenLabs (`...22_33_56_...v4.mp3`, copiado para `short1/voice/take_sussurro.mp3`) só para a fala
  "No baile, as damas chegaram perto. Os nobres, mais perto ainda, pra descobrir o segredo." O resto da voz continua o take `22_35_03`.
  (O 1º arquivo que ele anexou, `22_35_03`, era idêntico ao que já estava em uso: por isso a dúvida.)
- Emenda feita em `voice.wav` (backup: `voice_original.wav`; `words_original.json`): trocado o intervalo 34,02-39,84 s, nos silêncios, com
  crossfade de 15 ms. A 1ª frase do take novo (2,04 s) foi comprimida 5 % (atempo, mesma altura) para 1,94 s; a 2ª frase (3,58 s) entrou
  sem alteração; a pausa entre elas foi encurtada de 0,60 para 0,40 s. Resultado: "Os" em 36,36 s e "segredo." termina em 39,76 s, iguais
  aos de antes, então câmeras, efeitos e o `story.ts` NÃO mudaram. Duração de `voice.wav` igual (59,27 s); `words.json` ajustado nas 15 palavras.
- Nível: o take novo tinha -0,11 dB de diferença na loudness integrada (aplicado). O trecho sussurrado fica ~5 dB abaixo da fala normal.
- `mix.py` refeito: -17,65 LUFS, pico -1,2 dBTP, 59,8 s. Transcrição de conferência do `voice.wav` novo: texto e tempos corretos.
- Para voltar ao áudio anterior: copiar `voice_original.wav` sobre `voice.wav` e `words_original.json` sobre `words.json`, e rodar `mix.py`.

### Correções após o 1º render (2026-11-03, Opus): falta o usuário julgar `app/out/short1/f1_*.jpg` e re-renderizar
- Fedor (plano 3 e frasco do plano 7): `stinkAround` em `cast.ts` põe as 3 linhas AO LADO do corpo e 0,35 m atrás dele (antes uma ficava na
  cabeça e todas no mesmo plano do personagem, atravessando-o).
- Fedor do herói (pedido do usuário após ver `f1_615/655`): 3 linhas = uma de cada lado (esq. baixa, dir. mais alta) + uma CENTRADA em cima da cabeça
  (`stinkAround(..., size, topY)`, topY 2,2 no herói; o frasco do plano 7 segue com 1,5). Stills: `f2_615/655.jpg`.
- Som das moscas (`sfx.py`): era 18,20 s (fala "O perfume disfarçava", sem fedor na tela) + 22,00 s. Agora é UM zumbido de 20,0 a 22,55 s,
  exatamente enquanto o fedor está na tela (do corte "A má notícia" f600 até o fim do plano 3, passando pelo corte de f637). `mix.py` refeito
  (-17,6 LUFS).
- Plano 6 (o nobre chega ao baile): tirei a brisa verde do começo (`brisa(..., 0, 36.6)`). A do plano 7 (46,4-48,2 s) continua.
- Embalagem real: foto do usuário salva em `short1/marca/embalagem_foto.png`; a frente foi endireitada (homografia, cantos medidos pela cor:
  TL 28,73 / TR 322,29 / BR 363,337 / BL 76,384 na foto 364x387) para `app/public/short1/embalagem_frente.png` (600x636).
  `soap.ts`: caixa 0,25 x 0,266 x 0,1 m kraft com essa frente num plano SEM luz (legível); carregada em `loadKit` (`setPackFront`).
- Barra final com a mesma textura da barra na mão do nobre (`toon.ts` prop "soap"): verde-sálvia `#8fae86`, pintinhas `#6f8c68`, risco
  claro `#c7dcc0` (canvas `soapBarTex`).
- Render: o 1º render com `--concurrency 100%` (12 abas) estourou o tempo de 33 s no 1º quadro. Usar `--concurrency 4 --delay-render-timeout 120000`
  e `&&` antes do ffmpeg (o usuário usa `cmd`, não PowerShell: `set TEMP=...`).

### Som do salão (2026-11-03, Haiku) e castelo APROVADO
- Usuário aprovou o castelo à noite ("o castelo está aprovado"). Os stills `n1_*.jpg` e o médico `d3_*` estão aprovados.
- `short1/audio/sfx.py`: troquei o ambiente externo dos planos de baile. Bed 4 (22,6-26,0 s): sabiá sai, entram velas (`crackle`) e cauda
  de salão (`hall_room`). Bed 6 (vozes): `murmur` agora tem cauda de reverberação de salão (`make_ir`). Bed 7 (43,8-51,8 s, plano 7):
  brisa sai, entram 3 vozes baixas + velas + salão. Bed 5 (rio), bed 8 (final) e eventos ficaram iguais.
- `python mix.py` rodou sem erro: `mix.wav` = -17,6 LUFS, pico -1,2 dBTP, 59,8 s. Voz e tempos não mudaram. O usuário OUVIU e aprovou ("está tudo bem").
- Próximo: Etapa 7 (render final, Haiku).

### Castelo à NOITE, rodada 1 (2026-11-03, Sonnet): falta o usuário julgar `app/out/short1/n1_*.jpg`
- Pedido: castelo de noite, iluminado por dentro. Planos 4, 6 e 7 agora têm `light: "night"` (plano 5, rio, continua "golden").
  `Light` em `story.ts` ganhou `"night"`; preset novo em `lights.ts` (LIGHTS + LOOK), `grade.ts` (`GRADE_NIGHT`), `cast.ts` (CONTACT) e
  `world.ts` (nuvens; `SUN_SHOT` dos planos 4/6/7 = az 180, el 50: luz-chave quente atrás da câmera, no lugar do sol).
- `castle.ts`: vitrais azuis de luar (estrelas e lua), chamas maiores, brilho quente base reduzido (`em()` = 0,4x), e `lightUp()`:
  halos aditivos (sprites) nos lustres/candelabros/tochas/velas das mesas, poças de luz no piso (lustres, candelabros, centro do
  baile), "lavagem" de luz nas paredes laterais atrás das tochas e halo azul frio nas janelas. Tudo na camada NOINK.
- Corrigido: o medalhão do piso estava em y 0,03 e escondia as sombras de contato dos dançarinos (y 0,022); agora 0,016.
- Stills: quadros 700, 760, 1060, 1150, 1250, 1380. `tsc` sem erros; log só com o 404 esperado de `sabonete.glb`.
- Pontos de risco que não vejo: escuro/claro demais (ajuste: `lit/shade` do `night` em `lights.ts`, `GRADE_NIGHT.ky`), halos e poças
  estourados (diminuir as cores em `lightUp`), rim/tom dos personagens, o corte do plano 5 (dourado) para o 6 (noite).
- Som dos planos 4/6/7 ainda é de ar livre (pássaros/vento): trocar por eco de salão/burburinho (Haiku, `sfx.py`), se o usuário quiser.
- `C:
emotion-tmp` não limpo (o usuário apaga à mão).

### Tarefa extra (2026-11-03, Sonnet): baile dentro de um castelo, rodada 1 feita, falta o usuário julgar
- Novo `app/src/videos/short1/castle.ts` (`buildCastle(root, kit)`, chamado em `world.ts` logo depois de `buildTown`). Salão em
  coordenadas locais ao `PARK`: 24 m de largura (x ±12), do fundo z -12 ao fundo da câmera z +15, paredes e teto a 9 m.
  Piso xadrez de mármore (quadrados de 1,5 m) + medalhão redondo (r 5,6 m) sob os dançarinos; 3 janelas altas em arco com vitral
  brilhante (material sem luz) no fundo + 3 em cada parede lateral; brasão acima da janela central; 4 estandartes (2 vermelhos
  perto do trono, 2 verdes nos cantos, via `prop()` do Kenney); estrado de 3 degraus com tapete vermelho e trono; 8 colunas
  com tochas; 4 lustres (y 5,2) e 6 candelabros; 2 mesas de banquete nos cantos do fundo; vigas de madeira no teto.
- Luz: nada do salão projeta sombra (o sol baixo jogaria a sombra das paredes no piso todo). O brilho quente de vela vem de
  `emissive` nos materiais. Os tempos (`story.ts`) NÃO mudaram.
- Em `build.ts` saiu todo o parque (árvores, sebes, arbustos, flores, banco, lanternas, estandartes do anel). Em `world.ts` saiu
  o piso redondo antigo (agora está em `castle.ts`).
- `npx tsc --noEmit`: zero erros. Stills de teste: `app/out/short1/c1_*.jpg` (quadros 700, 760, 1060, 1150, 1250, 1380). O único
  erro de log é o 404 esperado de `sabonete.glb`.
- Falta: o usuário descreve os stills; no máximo 2 rodadas de correção. Pontos de risco que não consigo ver: parede de fundo
  escura demais (o sol está de frente para a câmera nos planos 4/6/7, então paredes viradas para a câmera ficam na "sombra"
  azulada; o remédio é subir o `emissive` em `mStone`), janelas estouradas, chão laranja demais, lustres/vigas cortando o quadro.
- Som: o ambiente dos planos 4/6/7 ainda é de ar livre (`sfx.py`); fica para o Haiku se o usuário quiser (eco de salão, sem pássaros).
- `C:
emotion-tmp` não limpo (o usuário apaga à mão).

### Etapa 6: Som (2026-11-03, Haiku)
- Copiado `skill-ref/templates/audio/*` para `short1/audio/`. Reescritos (ponte removida): `timeline.py` (espelho de `story.ts`: 8 planos, `XFADE`, `FLASH`), `music.py` (minueto em ré maior, cravo + pad, 40 compassos de 1,5 s, fade final de 1,2 s), `sfx.py` (ambiente por plano + 33 eventos: gancho/flash, pano, camisa, spray, moscas do cheiro, splash na entrada na água, brisa verde, vidro do perfume jogado fora, espuma, brilho "pele cheirosa", toc do sabonete, acorde final do "Aristocrata") e `mix.py` (voz sem alteração; trilha -7 dB da voz, com ducking de -7 dB sob a fala; SFX -6 dB). `dsp.py`, `sfx_gen.py` e `instruments.py` ficaram como estavam.
- Saídas: `short1/audio/mix.wav` (2.870.400 amostras = 59,8 s exatos, 48 kHz, estéreo, 24 bits, pico -1,2 dBTP) e `short1/audio/cues.md` (tempo, frame e offset de cada efeito).
- **Desvio:** o master ficou em **-17,1 LUFS**, não -15: a voz tem picos altos e o teto de -1,2 dBTP reduziu o ganho. Se achar baixo, o caminho é um limitador de verdade (não feito).
- Eventos posicionados pelos tempos de `words.json` (ex.: "Entrou na água" 28,02 s; "Saiu cheirando" 31,22 s; "trocou o perfume" 41,98 s; "Aristocrata" 55,14 s).
- Sem subagentes, sem abrir imagens. Nada renderizado (o render é da Etapa 7).
Pendência de limpeza: `C:
emotion-tmp` (o usuário apaga à mão; rm é bloqueado pela checagem de segurança).

### Etapa 5, rodada 1 (2026-11-03)
- Usuário mandou um still (nobres/damas no baile): "personagens muito estranhos". Causa vista: a peruca "de trás" era
  desenhada por cima do peito/babado (virava um babador branco gigante) e a franja cobria as sobrancelhas.
  Correção em `toon.ts` (`hatBehind` wig): duas "cortinas" de cachos nos ombros, abertas no meio; franja mais alta (0,34).
- Stills novos para conferir: `app/out/short1/r1_*.jpg` (mesmos 16 quadros). Falta o usuário julgar; só 1 rodada de
  correção visual restante (máx. 2).
- `C:
emotion-tmp` NÃO limpo depois dessa rodada (rm bloqueado pela checagem de segurança): o usuário apaga à mão.

- Rodada 1 (cont.): peruca redesenhada (2 volumes no topo + cascatas de cachos nos ombros), babado em 3 camadas. O usuário
  aprovou o visual ("agora está bom") e apontou 1 defeito: risca roxa no cabelo branco = traço de "parting" do chapéu
  `hair` herdado pela `wig`. Removido (só `hair` desenha a risca). Falta re-render para conferir (rodada 2).

- Rodada 2 (cont.): pernas mais grossas (`legW`/`footW` = 9u) e pernas dos nobres mais escuras (`pants` `#b8ad9a`).
  Stills `app/out/short1/r2_*.jpg` renderizados (16 quadros), aguardando o usuário. Uso anotado acima (36% / 14%):
  as correções visuais de peruca/babado/pernas custaram ~11 pontos da janela de 5 h, quase o mesmo que a Etapa 4 inteira.

### O que a Etapa 4 fez (2026-11-03, Sonnet)
- `story.ts` reescrito: `TOTAL=1794`, 8 `SHOTS` (= 8 locações), `XFADE`, `FLASH_AT=130`, `CAMS` (~26 chaves, cortes nas
  palavras), `KICKS`, `DOF`. Ponte fica parada (sem bounce/queda). Constantes de lugares: `HERO_ST`, `DOC_AT`,
  `QUAY_HERO`, `WADE`, `SOAP_AT`, `PARK` (= centro do baile).
  Planos: 1 rua/gancho (f0-130) | 2 cais: aéreo + médico + moradores (130-330) | 3 rua: pano, camisa, perfume, cheiro
  (330-679, 6 chaves de câmera) | 4 baile de longe, golden (679-780) | 5 beira do rio: hesita no cais -> câmera na água
  -> close (780-1025, golden) | 6 baile: damas, nobres, corte inteira joga o perfume fora (1025-1317) | 7 close do nobre
  + barra na mão (1317-1563) | 8 sabonete na pedra, nobre desfocado ao fundo (1563-1794, day).
- `cast.ts`: `stage()` novo (uma função por plano). Nobres/damas/médico/criado/moradores em vista frontal. Removido
  todo o código da coluna de soldados, da criança no balanço, do oficial etc.
- `toon.ts`: outfits `noble()`, `lady()`, `DOCTOR`, `SERVANT`; chapéu `wig` (peruca com cachos) e `jabot` (babado);
  props de braço direito `["nose"|"cloth"|"spray"|"shirt"|"soap", k]` (desenhado depois do rosto); efeitos `fxStink`
  (cheiro ruim), `fxMist` (nuvem de perfume), `fxBreeze` ("brisa" verde), `fxBottle`, `fxDrop`.
- `soap.ts` (novo): `buildSoap(kit)`, PLACEHOLDER (barra verde-sálvia + caixa kraft lisas, sem texto). Se existir
  `app/public/short1/sabonete.glb`, é carregado no lugar (escala ~0,3 m, base em y=0).
- `world.ts`: loader aceita `sabonete.glb`; saiu o balanço do parque e a placa; entrou o piso redondo de pedra do baile
  (raio 5,6 m) em `PARK`; `SUN_SHOT` para os planos 2, 4, 5, 6 e 7. `build.ts`: 10 lanternas em anel + 4 faixas ao
  redor do baile; flores fora do piso.
- Não mexi em `lights.ts`, `shade.ts`, `paint.ts`, `grade.ts`, `ink.ts`, `lensblur.ts`, `Bridge.tsx`.
- Sem subagentes, sem abrir imagens. Stills de teste de runtime: `app/out/short1/t4_*.jpg` (quadros
  60,200,300,380,520,650,740,810,900,980,1080,1160,1250,1380,1450,1650).

### Causa e correção do bloqueio (não precisa repetir)
- **Causa:** em renderização o Remotion deixa o R3F em `frameloop: "never"` e chama `advance()` uma vez por frame,
  antes de o `EffectComposer` assinar o loop. O primeiro frame de cada canvas novo saía vazio (só o fundo
  `#cfe3f2`). Qualquer `EffectComposer` reproduzia isso num cubo de teste.
- **Correção:** componente `ReAdvance` em `app/src/videos/short1/Bridge.tsx` (dentro do `Inner`, depois do
  `{post}`): faz 3 `advance()` em `requestAnimationFrame` e segura o frame com `delayRender`. Vale também para o
  render de vídeo (cobre cada canvas que monta, p. ex. nos crossfades). **Se o vídeo final mostrar o primeiro
  frame de algum crossfade vazio, o ponto a revisar é este.**
- **Correção de um erro meu:** o teste "React 18 + R3F 8" que informei antes NÃO foi feito (o `npm install` não
  aplicou). Todas as versões testadas foram sempre as mesmas, as de abaixo.
- **Versões em uso (funcionam):** react 19.3.1, @react-three/fiber 9.8.2, @react-three/postprocessing 3.2.2,
  postprocessing 6.39.6, three 0.187.0, remotion e @remotion/* 4.0.540.
- `bridge-stills.mjs` ganhou `BRIDGE_POST` (JSON com as chaves `ink/lens/pre/bloom/grade/grain`, para ligar e
  desligar efeitos em stills de teste) além de `COMP`, `BRIDGE_ENTRY`, `BRIDGE_GL` e `REMOTION_TMP`.
- Cada still agora leva ~13 s (a primeira vez; o bundle copia `public/`).

### Estado da Etapa 1 (2026-11-03)
- [x] Passo 1: `skill-ref/` clonado (só referência).
- [x] Passo 2: `app/` criado, Remotion 4.0.540 + `@remotion/three`, `src/index.ts`, `src/Root.tsx` (composição `Short1`).
  Dependências gráficas trocadas durante o diagnóstico: hoje `react@18`, `@react-three/fiber@8`,
  `@react-three/postprocessing@2`. (Antes: react 19.3, fiber 9.8.) O template NÃO traz `package.json`, então
  as versões originais do autor são desconhecidas.
- [x] Passo 3: template copiado para `app/src/videos/short1/` e scripts para `app/scripts/`.
- [x] Passo 4: `bridge-stills.mjs` com `COMP` (padrão `Short1`), `REMOTION_TMP` padrão `C:/remotion-tmp` e
  `BRIDGE_GL` (padrão `angle`).
- [x] Passo 5: 26 modelos Kenney copiados de `Downloads` (nature + fantasy town) para `app/public/bridge/kenney/`,
  mais `Textures/colormap.png` (igual nos dois kits, mesmo hash). Sem 404 no log.
- [x] Passo 6: numpy 2.5.1 e scipy 1.18.1 instalados.
- [x] `npx tsc --noEmit`: zero erros.
- [ ] Passo 7: **still de teste sai em cor única** (`#cfe3f2`, o fundo do `AbsoluteFill` do Bridge.tsx). O canvas
  3D não desenha nada. Sem erro no log (só um aviso de `THREE.Clock`).

### Diagnóstico feito (não repetir)
- Testados: `gl: angle` e `gl: swiftshader`, com React 19 + R3F 9 e com React 18 + R3F 8. Todos saem idênticos
  (cor 223 uniforme).
- Descartados: textura faltando (404 corrigido), tsc, kit não carregando (`loadKit` resolve, `continueRender` roda).
- Próximo passo sugerido: **Sonnet**. Teste mínimo: uma composição com só um cubo vermelho em `ThreeCanvas`
  (sem `Bridge`, sem `EffectComposer`). Se o cubo aparecer, o problema é no `Bridge.tsx` (composer, ink ou
  lensblur). Se não aparecer, é o ambiente WebGL do Remotion/Chrome neste PC.

## Status das etapas
- [x] 1 Instalação (still `ok_*.jpg` gerado; aceito pelo usuário ao pedir para continuar)
- [x] 2 Tema e roteiro (v4 aprovado e narrado em 2026-11-03)
- [x] 3 Voz e tempos das palavras (2026-11-03)
- [x] 4 Cenas, câmera, mundo e personagens (código pronto, sem julgamento visual) 2026-11-03
- [x] 5 Conferência dos stills (aprovada pelo usuário em 2026-11-03, após 2 rodadas)
- [x] 6 Som (2026-11-03; `mix.wav` gerado, falta o usuário ouvir)
- [x] 7 Render final e QA (2026-11-03): `app/out/short1/final.mp4`, 1080x1920, 30 fps, 59,8 s, -17,7 LUFS, pico -1,6 dBFS

## Decisões tomadas
- Comercial do sabonete **O Aristocrata** (marca do usuário, uso de nome e logo autorizado).
- Narração em **português do Brasil** (vale mais que o "English only" do SKILL.md).
- Produto: **Sabonete Frescor da Mata** (barra verde-sálvia rústica + caixa kraft com mascote). Detalhes e fotos em
  `short1/SCRIPT.md` > Produto e `short1/marca/`.
- Frase final (do usuário): "Nobre de verdade usa sabonete de homem."
- Sabonete 3D = **placeholder** (barra verde + caixa kraft lisas) num componente trocável (`soap.ts`). O usuário vai
  trazer o modelo real depois → basta salvar como `app/public/short1/sabonete.glb`.
- O mascote não vira personagem animado; aparece só na caixa.
- Tema: nobres franceses do séc. XVII com medo de banho. Fatos, roteiro e cenas em `short1/SCRIPT.md`.
- Não usar o mito "Luís XIV tomou só 2 banhos".
- Slogan final: "Nobre de verdade usa sabonete de homem." Linha "Os poros fecharam" mantida por decisão do
  usuário (foi avisado do risco de alegação com CONAR/Anvisa).
- Etapa 2 feita antes da 1 (o roteiro não depende da instalação).

## Dados do vídeo
- Duração da voz: **59,27 s** após cortar silêncio das pontas (fonte: MP3 de 63,48 s). Último som de fala em 58,94 s.
- Arquivos: `short1/voice/voice.wav` (48 kHz, mono, 24-bit) e `short1/voice/words.json` (152 palavras, faster-whisper
  `small`, pt). Corrigido 1 erro de transcrição: "diversales" → "Versalhes".
- TOTAL (frames): **1794** (= ceil(59,27 × 30) + 15 = 1779 + 15). Substitui o "~1920" antigo. **TRAVADO.**
- Pausas com tag, detectadas por intervalos entre palavras (para reação facial): `[chuckles]` ~10,8–11,1 s
  (entre "eles." e "Então"); `[sighs]` ~17,1–17,5 s (entre "perfume." e "A boa"); `[short pause]` ~4,8–5,8 s
  (entre "17," e "os"). Os demais tags não geram intervalo claro.
- Tema: "Os nobres que tinham medo de banho", roteiro v4 (1ª metade real, 2ª metade ficção cômica em que a corte
  adota o sabonete verde; o nome da marca só na última linha)
- Tempos travados (SHOTS/TOTAL não mudam mais): **SIM** (travado em 2026-11-03, Etapa 5 aprovada). O som (Etapa 6) depende disso.

## Uso de limite anotado (/usage ao fim de cada etapa)
| Etapa | Modelo | % janela 5 h | % semana |
|---|---|---|---|
| 1 (fim) + 3 | Haiku (+ Sonnet no bloqueio da 1) | 11% → 15% (+4 pontos só na sessão de Haiku) | 11% → 11% (sem mudança) |
| 4 | Sonnet | 15% → 25% (+10 pontos) | 11% → 12% (+1) |
| 5 (rodadas 1-2 de correção visual; aprovada) | Sonnet (+ Opus em parte da rodada 1) | 25% → 36% (+11 pontos) | 12% → 14% (+2) |
| 6 (som) | Haiku | 36% → 37% (+1 ponto) | 14% → 14% (sem mudança) |
| 7 (render + QA) e correções finais (fedor, embalagem, voz sussurrada) | Sonnet/Opus | janela de 5 h em 26% desde o último reset | semana: 17% (era 16%) |
| Extras: castelo (dia e noite) + médico moderno + enquadramento do plano 2 | Sonnet | janela de 5 h reiniciou durante a sessão; a sessão adicionou ~11% | semana: 16% (era 14%) |

## Próximo passo
**Etapa 7 (Haiku): render final e QA.** Ler só a seção "Etapa 7" do `PLANO.md`. Antes, o usuário ouve `short1/audio/mix.wav`
e aponta problemas de som. Não alterar tempos de `story.ts`.
- Voz: `short1/voice/voice.wav` (59,27 s) e `words.json` (152 palavras). Tags de emoção da narração (risadas,
  suspiros) estão anotadas em "Dados do vídeo".
- Orçamento observado: as correções visuais da Etapa 5 custaram ~11 pontos da janela de 5 h. Na Etapa 6, evite vai e volta.
- O sabonete 3D ainda é placeholder; o usuário salva o modelo real em `app/public/short1/sabonete.glb` quando tiver.

## Problemas / observações
- 1ª voz (ElevenLabs, voz "Elvis", speed 1.00, com tags de emoção) = 63,5 s, 9,6 s de pausas, ~2,4 palavras/s.
  Longa demais para o alvo de 40-45 s. O usuário também mudou o texto: "Os poros fecharam. E a pele ficou
  cheirosa." (antes: "Os poros continuaram abertos. Só que agora, cheirosos."). O `texto_para_narracao.txt`
  agora tem as tags e é a versão que vale. Atualizar `SCRIPT.md` quando a voz final estiver definida.
- C: com 56 GB livres em 2026-11-03 (usuário liberou espaço).
- C: tinha ~18 GB livres em 2026-11-03. Limpar `C:\remotion-tmp` depois de cada lote de stills ou render.
