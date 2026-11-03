# Trilha do short: cravo/pizzicato em compasso de 3/4 (minueto leve, ~120 bpm) + pad de cordas, em ré maior.
# Oito compassos de progressão (D G A D | Bm G A D) repetidos; some no fim, resolve em ré.
import numpy as np
import timeline as T
from dsp import rng, ns, place
from instruments import pluck, pad, m2f

BAR = 1.5                          # 3 tempos de 0,5 s
PROG = ["D", "G", "A", "D", "Bm", "G", "A", "D"]
CH = {  # (baixo MIDI, tons MIDI do acorde)
    "D": (38, [62, 66, 69]), "G": (43, [59, 62, 67]),
    "A": (45, [61, 64, 69]), "Bm": (47, [59, 62, 66]),
}


def build(N):
    r = rng(2024)
    out = np.zeros((2, N))
    b = 0
    while b * BAR < T.DUR:
        t0 = b * BAR
        bass, tones = CH[PROG[b % len(PROG)]]
        place(out, pluck(m2f(bass), 0.8, r, 1.6, 0.35), t0)
        place(out, pluck(m2f(tones[2]), 0.35, r, 1.0, 0.45), t0)
        place(out, pluck(m2f(tones[0]), 0.4, r, 1.0, 0.45), t0 + 0.5)
        place(out, pluck(m2f(tones[1]), 0.4, r, 1.0, 0.45), t0 + 1.0)
        if b % 2 == 0:
            place(out, pad([m2f(x - 12) for x in tones], 2.8, 0.2, r, att=0.5, rel=1.0, warm=1200), t0)
        b += 1
    out = out[:, :N]
    n = out.shape[1]
    env = np.ones(n)
    k = ns(1.2)
    env[n - k:] = np.linspace(1, 0, k)      # fade final de 1,2 s
    return out * env
