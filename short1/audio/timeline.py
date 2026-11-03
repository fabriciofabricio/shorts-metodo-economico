# Linha do tempo espelhada (só leitura) do story.ts travado do short "O Aristocrata": 30 fps, 1794 frames, 8 planos.
import json

FPS = 30
TOTAL = 1794
DUR = TOTAL / FPS              # 59.8 s
VOICE_END = 58.94             # último som de fala (words.json)

# id: (first frame, end frame)  - espelho de SHOTS em story.ts
SHOTS = {
    1: (0, 130), 2: (130, 330), 3: (330, 679), 4: (679, 780),
    5: (780, 1025), 6: (1025, 1317), 7: (1317, 1563), 8: (1563, TOTAL),
}
XFADE = {3: 6, 4: 8, 5: 6, 6: 6, 8: 8}
FLASH = 130 / FPS              # flash branco depois do gancho (4,33 s)


def fr(f):
    return f / FPS


def shot_t(i):
    a, b = SHOTS[i]
    return fr(a), fr(b)


def words(path):
    return json.load(open(path, encoding="utf-8"))
