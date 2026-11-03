# Mix final do short: voz (sem alteração) + trilha (ducking sob a fala) + SFX. Master em -15 LUFS integrados,
# true peak <= -1,2 dBTP. Duração exata = TOTAL / FPS (59,8 s), 48 kHz, estéreo, 24 bits.
# Saídas: mix.wav e cues.md (cada efeito com tempo, frame e offset).
import os
import numpy as np
from scipy import ndimage
from dsp import SR, ns, st, dbg, read_wav, write_wav, integrated, true_peak, momentary_max
import timeline as T
import music
import sfx

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
N = ns(T.DUR)
MASTER_LUFS = -15.0
CEIL_DBTP = -1.2
MUSIC_REL_DB = -7.0            # trilha antes do ducking: -7 LU da voz (fica ~-13 sob a fala)
DUCK_DB = -7.0                 # trilha sob a fala


def speech_spans(words, merge=0.3):
    spans = []
    for w in words:
        s, e = w["s"], w["e"]
        if e <= s:
            continue
        if spans and s - spans[-1][1] < merge:
            spans[-1][1] = max(spans[-1][1], e)
        else:
            spans.append([s, e])
    return spans


def duck_gain(spans):
    rate = 100
    m = int(T.DUR * rate) + 2
    g = np.zeros(m)
    for a, b in spans:
        g[max(0, int((a - 0.08) * rate)): int((b + 0.2) * rate) + 1] = 1.0
    g = ndimage.uniform_filter1d(g, size=40, mode="nearest")   # ~0,4 s de suavização
    gain = 10 ** ((DUCK_DB * g) / 20)
    return np.interp(np.arange(N) / SR, np.arange(m) / rate, gain)


def main():
    voice, sr = read_wav(os.path.join(ROOT, "voice", "voice.wav"))
    assert sr == SR, sr
    v = np.zeros((2, N))
    vs = st(voice)[:, :N]
    v[:, :vs.shape[1]] = vs
    R = integrated(v)
    M = momentary_max(v)
    print(f"voz: {R:.1f} LUFS integrados, pico momentâneo {M:.1f} LUFS")

    words = T.words(os.path.join(ROOT, "voice", "words.json"))
    duck = duck_gain(speech_spans(words))

    mus = music.build(N)
    gm = dbg((R + MUSIC_REL_DB) - integrated(mus))
    mus = mus * gm * duck[None, :]
    print(f"trilha: {integrated(mus):.1f} LUFS (com ducking)")

    fx, cues = sfx.build(N, R, M)
    print(f"sfx: {integrated(fx):.1f} LUFS integrados, {len(cues)} eventos")

    mix = v + mus + fx
    L = integrated(mix)
    mix = mix * dbg(MASTER_LUFS - L)
    tp = true_peak(mix)
    if tp > CEIL_DBTP:
        mix = mix * dbg(CEIL_DBTP - tp)
        print(f"limitado: true peak {tp:.2f} -> {CEIL_DBTP} dBTP")
    print(f"mix: {integrated(mix):.2f} LUFS, true peak {true_peak(mix):.2f} dBTP, {mix.shape[1] / SR:.3f} s")

    write_wav(os.path.join(HERE, "mix.wav"), mix, bits=24)
    with open(os.path.join(HERE, "cues.md"), "w", encoding="utf-8") as f:
        f.write("# Cues do short (tempo, frame, efeito, offset em LU relativo à voz)\n\n")
        f.write(f"Voz {R:.1f} LUFS; master {MASTER_LUFS} LUFS; trilha {MUSIC_REL_DB:+.0f} dB da voz; SFX -6 dB.\n\n")
        f.write("| t (s) | frame | efeito | offset (LU) |\n|---|---|---|---|\n")
        for t, name, off in sorted(cues):
            f.write(f"| {t:.2f} | {int(round(t * T.FPS))} | {name} | {off:+.0f} |\n")
    print("ok: mix.wav e cues.md")


if __name__ == "__main__":
    main()
