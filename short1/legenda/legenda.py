# Legenda estilo TikTok (palavra a palavra) a partir de words.json -> legenda.ass
# Uso: python legenda.py   (depois o ffmpeg grava a legenda no final.mp4)
import json, os, re

ROOT = os.path.dirname(os.path.abspath(__file__))
WORDS = os.path.join(ROOT, "..", "voice", "words.json")
OUT = os.path.join(ROOT, "legenda.ass")

# Correções de grafia (texto original da narração): índice -> texto exibido
FIX_TEXT = {"17,": "dezessete,", "Versalhes": "de Versalhes", "aristocrata,": "Aristocrata."}

MAX_WORDS, MAX_CHARS, GAP_BREAK = 3, 16, 0.30
Y = 1290                      # centro da legenda (1920 de altura; foge da UI do TikTok)
YELLOW = "&H0035E1FF&"        # #FFE135 (ASS = BGR)
GREEN = "&H0086E08F&"         # destaque da marca

def ts(t):
    t = max(0.0, t); cs = int(round(t * 100))
    return f"{cs // 360000}:{cs // 6000 % 60:02d}:{cs // 100 % 60:02d}.{cs % 100:02d}"

def clean(w):
    w = FIX_TEXT.get(w, w)
    w = re.sub(r"[.,:;]+$", "", w)          # tira pontuação final, mantém ? e !
    return w.upper()

words = json.load(open(WORDS, encoding="utf-8"))
for x in words:
    x["t"] = clean(x["w"])

# Agrupa em blocos curtos
chunks, cur = [], []
for i, x in enumerate(words):
    cur.append(x)
    nxt = words[i + 1] if i + 1 < len(words) else None
    chars = sum(len(c["t"]) for c in cur) + len(cur) - 1
    brk = (nxt is None or len(cur) >= MAX_WORDS or re.search(r"[.,:;?!]$", x["w"])
           or nxt["s"] - x["e"] > GAP_BREAK
           or chars + 1 + len(clean(nxt["w"])) > MAX_CHARS)
    if brk:
        chunks.append(cur); cur = []

# Palavra curta solta no fim do bloco (E, O, DE, COM...) vai para o começo do próximo
SMALL = {"E", "O", "A", "OS", "AS", "DE", "DA", "DO", "UM", "UMA", "COM", "PRA", "SE", "NA", "NO"}
for ci in range(len(chunks) - 1):
    ch, nx = chunks[ci], chunks[ci + 1]
    last = ch[-1]
    if (len(ch) > 1 and last["t"] in SMALL and not re.search(r"[.,:;?!]$", last["w"])
            and nx[0]["s"] - last["e"] <= GAP_BREAK
            and sum(len(c["t"]) + 1 for c in nx) + len(last["t"]) <= MAX_CHARS):
        chunks[ci + 1] = [ch.pop()] + nx

brand = False
lines = []
for ci, ch in enumerate(chunks):
    nxt_s = chunks[ci + 1][0]["s"] if ci + 1 < len(chunks) else ch[-1]["e"] + 1.0
    end = ch[-1]["e"] + 0.25
    if nxt_s - end < 0.5:            # pausa curta: segura até o próximo bloco (sem piscar)
        end = nxt_s
    end = min(end, nxt_s)
    if any(c["t"] == "ARISTOCRATA" for c in ch):
        brand = True
    for k, x in enumerate(ch):
        s = x["s"]
        e = ch[k + 1]["s"] if k + 1 < len(ch) else end
        if e <= s:
            continue
        hi = GREEN if (brand and x["t"] in ("O", "ARISTOCRATA")) else YELLOW
        parts = [("{\\c%s}%s{\\c&H00FFFFFF&}" % (hi, c["t"])) if c is x else c["t"] for c in ch]
        pop = "\\fscx70\\fscy70\\t(0,90,\\fscx108\\fscy108)\\t(90,160,\\fscx100\\fscy100)" if k == 0 else ""
        lines.append(f"Dialogue: 0,{ts(s)},{ts(e)},Cap,,0,0,0,,{{\\an5\\pos(540,{Y}){pop}}}" + " ".join(parts))
    brand = brand and ch[-1]["t"] != "ARISTOCRATA"

head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,Arial Black,82,&H00FFFFFF,&H00FFFFFF,&H00000000,&H90000000,0,0,0,0,100,100,0,0,1,9,5,5,40,40,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
with open(OUT, "w", encoding="utf-8-sig") as f:
    f.write(head + "\n".join(lines) + "\n")
print(f"{len(chunks)} blocos, {len(lines)} eventos -> {OUT}")
for ch in chunks:
    print(f"{ch[0]['s']:6.2f}  " + " ".join(c["t"] for c in ch))
