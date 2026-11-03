# Efeitos do short, um por evento no quadro certo (tempos de words.json e dos planos de story.ts).
# Geradores de sfx_gen.py / instruments.py. Beds por plano (ambiente) + eventos pontuais.
# Cada som é normalizado para (loudness da voz + offset em LU) e o conjunto fica em -6 dB (SFX -6 dB).
import numpy as np
import scipy.signal as sig
import sfx_gen as G
from dsp import SR, ns, rng, lp, hp, bp, pan, st, place, norm_to, dbg, impulse_train, make_ir, convolve_st
from instruments import glock, pluck, brush, pad
from instruments import m2f
import timeline as T

SFX_DB = -6.0
EVENT_UP = 8.0                 # eventos: pico momentâneo da voz + offset + 8 dB (antes do SFX_DB)


def fade(x, fi=0.0, fo=0.0):
    n = x.shape[-1]
    env = np.ones(n)
    a, b = min(n, ns(fi)), min(n, ns(fo))
    if a > 0:
        env[:a] = np.linspace(0, 1, a)
    if b > 0:
        env[n - b:] *= np.linspace(1, 0, b)
    return x * env


def fly(dur, r):
    """zumbido de moscas (o cheiro ruim)"""
    n = ns(dur)
    t = np.arange(n) / SR
    buzz = sum(np.sin(2 * np.pi * k * 150 * t + r.uniform(0, 6.28)) / k for k in range(1, 10))
    wob = 0.65 + 0.35 * np.sin(2 * np.pi * (5.0 * t + 2 * np.sin(2 * np.pi * 0.7 * t)))
    return fade(buzz * wob * 0.4 + hp(r.standard_normal(n), 4000) * 0.03 * wob, 0.05, 0.15)


def crackle(dur, r, density=30.0):
    """lareira / velas do salão: estalos secos e aleatórios (mono)"""
    n = ns(dur)
    times = r.uniform(0, dur, r.poisson(density * dur))
    x = impulse_train(times, dur, r.uniform(0.2, 1.0, len(times)))[:n]
    burst = bp(r.standard_normal(ns(0.012)) * np.exp(-np.arange(ns(0.012)) / (SR * 0.0012)), 1500, 6500, 2)
    return sig.fftconvolve(x, burst)[:n]


def hall_room(dur, r, rt=2.4):
    """cauda de salão de pedra: ruído grave/médio com reverberação longa (stereo)"""
    n = ns(dur)
    dry = lp(r.standard_normal(n), 900, 2)
    return convolve_st(dry, make_ir(rt, 21))


def murmur(dur, r, voices):
    """baile: vozes ao longe (damas, nobres)"""
    n = ns(dur)
    out = np.zeros((2, n))
    for _ in range(voices):
        k = r.uniform()
        base, scale = ((r.uniform(95, 140), r.uniform(0.95, 1.05)) if k < 0.45 else
                       (r.uniform(175, 235), r.uniform(1.12, 1.2)) if k < 0.85 else
                       (r.uniform(260, 330), r.uniform(1.25, 1.35)))
        y = G.babble(dur, r, base, scale, r.uniform(3.6, 4.8), r.uniform(0.55, 0.8), fmax=3400)
        y = lp(y, r.uniform(2200, 3600), 1) * r.uniform(0.3, 1.0)
        out += pan(y, r.uniform(-0.85, 0.85))
    wet = convolve_st(out, make_ir(2.4, 31))   # salão de pedra: cauda longa
    return fade(0.5 * out + 0.5 * wet, 0.25, 0.8)


def build(N, R, M):
    """R = loudness integrado da voz; M = pico momentâneo da voz (LUFS). Devolve (fx (2,N), cues)."""
    r = rng(7)
    fx = np.zeros((2, N))
    cues = []

    def put(t, name, x, off, mode="momentary", p=0.0):
        x = pan(x, p) if x.ndim == 1 else x
        x = fade(x, 0.003, 0.03)
        if mode == "momentary":
            x = norm_to(x, M + off + EVENT_UP, mode=mode)
        else:
            x = norm_to(x, R + off, mode=mode)
        place(fx, x, t)
        cues.append((t, name, off))

    # ---- ambiente por plano (integrado, mais baixo)
    s = lambda a, b: b - a
    put(0.0, "bed 1 rua: pardais", G.bird_chirps(s(0, 4.33), r, 0.4, "sparrow"), -26, "integrated")
    put(0.0, "bed 1 rua: brisa", G.breeze(s(0, 4.33), r, 0.4, 0.2, 800), -28, "integrated")
    put(4.33, "bed 2 cais: rio", G.water_bed(s(4.33, 11.0), r, 0.5), -22, "integrated")
    put(4.33, "bed 2 cais: pardais", G.bird_chirps(s(4.33, 11.0), r, 0.3, "sparrow"), -26, "integrated")
    put(11.0, "bed 3 viela: brisa", G.breeze(s(11.0, 22.63), r, 0.3, 0.2, 700), -26, "integrated")
    put(22.63, "bed 4 baile de longe: cordas", pad([146.8, 220.0, 293.7, 370.0], s(22.63, 26.0), 0.12, r,
                                                    att=1.0, rel=0.6), -22, "integrated")
    put(22.63, "bed 4 castelo: velas", crackle(s(22.63, 26.0), r, 22.0), -26, "integrated")
    put(22.63, "bed 4 castelo: salão", hall_room(s(22.63, 26.0), r), -30, "integrated")
    put(26.0, "bed 5 rio: correnteza", G.water_bed(s(26.0, 34.17), r, 1.0), -20, "integrated")
    put(34.17, "bed 6 baile: vozes", murmur(s(34.17, 43.77), r, 6), -20, "integrated")
    put(43.77, "bed 7 castelo: vozes baixas", murmur(s(43.77, 51.84), r, 3), -24, "integrated")
    put(43.77, "bed 7 castelo: velas", crackle(s(43.77, 51.84), r, 22.0), -26, "integrated")
    put(43.77, "bed 7 castelo: salão", hall_room(s(43.77, 51.84), r), -30, "integrated")
    put(51.84, "bed 8 final: brisa", G.breeze(s(51.84, T.DUR), r, 0.3, 0.2, 800), -28, "integrated")

    # ---- eventos pontuais
    flash = G.whoosh(0.75, r, 0.33, 500, 4200, 0.9, 0.09, 0.4)
    put(T.FLASH - 0.1, "gancho: whoosh + boom", flash, -8)
    put(12.30, "pano seco: esfregar", brush(0.5, r, 0.5, True), -18)
    put(12.78, "pano seco: segunda passada", brush(0.35, r, 0.4, True), -22)
    put(13.44, "camisa: roçar", brush(0.45, r, 0.6, True), -18)
    put(15.20, "perfume: spray", G.whoosh(0.5, r, 0.15, 2000, 6000, 0.6, 0.1, 0.5), -16)
    put(20.00, "cheiro: moscas (com o fedor na tela, 20,0-22,55 s)", fly(2.55, r), -20)
    put(28.10, "entra na água: splash", G.splash_big(r), -8)
    put(29.80, "barra de sabonete: bolhas", G.bubbles(0.6, r, 18, 800, 2600), -16)
    put(31.00, "saiu cheirando: brisa verde", G.whoosh(1.2, r, 0.5, 700, 3000, 1.0, 0.3, 0.3), -12)
    put(34.10, "troca de plano: whoosh", G.whoosh(0.4, r, 0.2, 800, 3000, 0.7, 0.1, 0.3), -18)
    put(41.60, "perfume jogado fora: vidro", G.clink(r, 2600, 0.25, 1.0), -14)
    put(41.90, "perfume jogado fora: vidro (2)", G.clink(r, 3400, 0.25, 1.0), -15)
    put(42.50, "perfume jogado fora: vidro (3)", G.clink(r, 2100, 0.3, 1.0), -14, p=0.4)
    put(44.20, "poros fecharam: espuma", G.bubbles(0.9, r, 14, 400, 2200), -18)
    for k, f in enumerate([2093.0, 2637.0, 3136.0]):
        put(45.40 + 0.3 * k, f"pele cheirosa: brilho {k + 1}", glock(f, 0.5, r, 1.8), -14, p=0.2 * (k - 1))
    put(51.84, "sabonete na pedra: toc", pluck(m2f(45), 0.7, r, 0.6, 0.3), -14)
    for k, f in enumerate([1046.5, 1396.9, 1760.0]):
        put(55.20 + 0.25 * k, f"Aristocrata: acorde {k + 1}", glock(f, 0.6, r, 2.2), -12)

    return fx * dbg(SFX_DB), cues
