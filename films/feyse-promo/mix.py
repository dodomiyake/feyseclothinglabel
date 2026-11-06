# .venv/bin/python mix.py  — synthesize the score and foley from the film's timeline, add the voice, write out/mix.wav
# Everything is synthesized here (no samples): harpsichord, bassoon, pizzicato/spiccato strings, celesta; paper/pen/stamp foley.
import json, os
import numpy as np, soundfile as sf
from scipy.signal import fftconvolve, butter, sosfilt
HERE = os.path.dirname(os.path.abspath(__file__))
SR, DUR = 48000, 48.0
N = int(SR * DUR)
BEAT = 60 / 96; BAR = BEAT * 4; E8 = BEAT / 2
rng = np.random.default_rng(7)
mid = lambda m: 440 * 2 ** ((m - 69) / 12)
def T(d): return np.arange(int(d * SR)) / SR
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'band', fs=SR, output='sos'), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)

# ---------------- instruments ----------------
def harpsichord(m, d=1.6, v=0.5):
    f = mid(m); t = T(d); y = np.zeros_like(t)
    for k in range(1, 24):
        fk = f * k * (1 + 0.0004 * k * k)
        if fk > 16000: break
        y += (1 / k ** 0.7) * np.sin(2 * np.pi * fk * t + k) * np.exp(-t * (1.2 + 0.55 * k))
    n = len(t); a = int(0.004 * SR); y[:a] *= np.linspace(0, 1, a)
    pl = hp(rng.standard_normal(int(0.012 * SR)), 2500) * 0.25; y[:len(pl)] += pl * np.linspace(1, 0, len(pl))
    return v * 0.18 * y
def bassoon(m, d, v=0.5):
    f = mid(m); t = T(d + 0.12); vib = 1 + 0.004 * np.sin(2 * np.pi * 5.2 * t) * np.clip(t / 0.4, 0, 1)
    ph = 2 * np.pi * f * np.cumsum(vib) / SR; y = np.zeros_like(t)
    for k, a in enumerate([0.5, 1.0, 0.8, 0.6, 0.35, 0.25, 0.15, 0.1, 0.06], 1): y += a * np.sin(k * ph)
    env = np.minimum(1, t / 0.05) * np.clip((d + 0.12 - t) / 0.12, 0, 1); return v * 0.06 * lp(y * env, 2200)
def pizz(m, v=0.5):
    f = mid(m); t = T(0.7); y = np.zeros_like(t)
    for k in range(1, 9): y += (1 / k) * np.sin(2 * np.pi * f * k * t) * np.exp(-t * (5 + 2.5 * k))
    y[:96] *= np.linspace(0, 1, 96); return v * 0.22 * y
def spicc(m, v=0.5):
    f = mid(m); t = T(0.16); ph = 2 * np.pi * f * t; y = sum(np.sin(k * ph) / k ** 1.1 for k in range(1, 12))
    env = np.minimum(1, t / 0.012) * np.exp(-t * 18); return v * 0.07 * lp(y * env, 5000)
def celesta(m, v=0.5):
    f = mid(m); t = T(1.8)
    y = np.sin(2 * np.pi * f * t) * np.exp(-t * 2.2) + 0.25 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 6) + 0.08 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 9)
    y[:48] *= np.linspace(0, 1, 48); return v * 0.16 * y
def strings(m, d, v=0.5):
    f = mid(m); t = T(d + 0.5); vib = 1 + 0.003 * np.sin(2 * np.pi * 5.5 * t + m)
    ph = 2 * np.pi * f * np.cumsum(vib) / SR; y = sum(np.sin(k * ph) / k ** 1.4 for k in range(1, 14))
    env = np.minimum(1, t / 0.35) * np.clip((d + 0.5 - t) / 0.5, 0, 1); return v * 0.035 * lp(y * env, 4000)

music = np.zeros((N, 2)); PAN = {'hc': -0.15, 'bn': 0.25, 'pz': -0.3, 'sp': 0.3, 'ce': 0.1, 'st': 0.0}
def put(buf, x, t, pan=0.0, g=1.0):
    i = int(t * SR); x = x[:max(0, len(buf) - i)]
    if i < 0 or len(x) == 0: return
    buf[i:i + len(x), 0] += x * g * np.sqrt(0.5 * (1 - pan)) * 1.414; buf[i:i + len(x), 1] += x * g * np.sqrt(0.5 * (1 + pan)) * 1.414

# ---------------- score (96 bpm, D major) ----------------
MOT = {'D': [74, 78, 81, 78, 79, 76, 73, 69], 'G': [71, 74, 79, 74, 76, 74, 71, 67], 'A': [73, 76, 81, 76, 79, 76, 73, 69],
       'Dc': [74, 78, 81, 86, 85, 81, 78, 74], 'Bm': [71, 74, 78, 74, 76, 73, 71, 66]}
ROOT = {'D': 50, 'Dc': 50, 'G': 43, 'A': 45, 'Bm': 47}
CH = {'D': [62, 66, 69], 'Dc': [62, 66, 69], 'G': [62, 67, 71], 'A': [61, 64, 69], 'Bm': [62, 66, 71]}
PROG = ['D', 'G', 'A', 'Dc', 'Bm', 'G', 'A', 'Dc', 'Bm', 'G', 'A', 'D']   # bars 0..11
for b, c in enumerate(PROG):
    t0 = b * BAR
    # harpsichord motive, left-hand root on beats 1 and 3
    for i, m in enumerate(MOT[c]): put(music, harpsichord(m, v=0.55 if i % 2 == 0 else 0.45), t0 + i * E8, PAN['hc'])
    for j in (0, 2): put(music, harpsichord(ROOT[c] + 12, 2.0, 0.4), t0 + j * BEAT, PAN['hc'])
    if 2 <= b <= 11:   # bassoon canon at the octave, one bar behind
        pc = PROG[b - 1]
        for i, m in enumerate(MOT[pc]): put(music, bassoon(m - 12, E8 * 0.95, 0.55), t0 + i * E8, PAN['bn'])
    if 2 <= b <= 11:   # pizzicato bass, quarters
        for j in range(4): put(music, pizz(ROOT[c] + (0 if j % 2 == 0 else 7), 0.6), t0 + j * BEAT, PAN['pz'])
    if 5 <= b <= 10:   # spiccato 8ths on chord tones (the weft steps)
        for i in range(8): put(music, spicc(CH[c][1 + i % 2] + 12, 0.5), t0 + i * E8, PAN['sp'])
    if 8 <= b <= 10:   # celesta countermelody
        top = [86, 85, 83, 81] if c != 'G' else [86, 83, 81, 79]
        for j, m in enumerate(top): put(music, celesta(m, 0.55), t0 + j * BEAT, PAN['ce'])
# bar 12 (30–32.5): harpsichord alone, written-out ritardando into silence
for m, dt in zip([81, 79, 76, 73, 69, 66], [0, 0.32, 0.68, 1.1, 1.58, 2.12]): put(music, harpsichord(m, 1.2, 0.5), 30.0 + dt, PAN['hc'])
cut = int(32.45 * SR); fade = int(0.08 * SR); music[cut - fade:cut] *= np.linspace(1, 0, fade)[:, None]; music[cut:int(33.12 * SR)] = 0
# 33.125: cadence on the stamp
for k, m in enumerate([50, 57, 62, 66, 69, 74]): put(music, harpsichord(m, 2.4, 0.6), 33.125 + k * 0.018, PAN['hc'])
for m in [62, 66, 69, 74]: put(music, strings(m, 1.6, 0.6), 33.125, PAN['st'])
put(music, bassoon(38, 1.6, 0.6), 33.125, PAN['bn']); put(music, pizz(38, 0.8), 33.125, PAN['pz'])
# bars 14–18 (35–47.5): the theme in augmentation on celesta + harpsichord, held chord into the lights-off
for blk, c in enumerate(['D', 'A']):
    t0 = 35.0 + blk * 2 * BAR
    for i, m in enumerate(MOT[c]):
        put(music, celesta(m, 0.55), t0 + i * BEAT, PAN['ce']); put(music, harpsichord(m - 12, 1.6, 0.35), t0 + i * BEAT, PAN['hc'])
    for j in range(4): put(music, pizz(ROOT[c] + (0 if j % 2 == 0 else 7), 0.5), t0 + j * 2 * BEAT, PAN['pz'])
    for m in CH[c]: put(music, strings(m, 2 * BAR - 0.3, 0.35), t0, PAN['st'])
for m in [62, 66, 69, 74]: put(music, strings(m, 2.4, 0.45), 45.0, PAN['st'])
for k, m in enumerate([50, 57, 62, 66, 69, 74, 78]): put(music, harpsichord(m, 3.0, 0.45), 45.0 + k * 0.03, PAN['hc'])
put(music, celesta(86, 0.5), 45.6, PAN['ce'])
# light reverb on the music
ir = rng.standard_normal(int(1.3 * SR)) * np.exp(-np.arange(int(1.3 * SR)) / SR * 4.5); ir = lp(ir, 6000); ir /= np.sqrt((ir ** 2).sum())
for ch in range(2): music[:, ch] += 0.22 * fftconvolve(music[:, ch], ir)[:N]
music[cut:int(33.12 * SR)] = 0

# ---------------- foley ----------------
fx = np.zeros((N, 2))
def noise(d): return rng.standard_normal(int(d * SR))
def env_ad(n, a, d): t = np.arange(n) / SR; return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)
def pen(d, g=1.0):
    n = int(d * SR); x = bp(noise(d), 2000, 6000); jit = lp(np.abs(rng.standard_normal(n)), 30); jit /= jit.max() + 1e-9
    e = np.minimum(1, np.arange(n) / (0.02 * SR)) * np.minimum(1, (n - np.arange(n)) / (0.03 * SR)); return 0.035 * g * x * (0.4 + jit) * e
def click(f=3800, g=1.0, d=0.03): n = int(d * SR); return 0.12 * g * bp(noise(d), f * 0.8, f * 1.25) * env_ad(n, 0.0005, 0.006)
def wood(f=1200, g=1.0): t = T(0.12); return 0.12 * g * (np.sin(2 * np.pi * f * t) * np.exp(-t * 45) + 0.4 * bp(noise(0.12), f, f * 2.5) * np.exp(-t * 80))
def slap(): t = T(0.25); return 0.25 * lp(noise(0.25), 1800) * np.exp(-t * 30)
def pop(): t = T(0.12); return 0.08 * np.sin(2 * np.pi * (900 - 2500 * t) * t) * np.exp(-t * 30)
def stamp():
    t = T(0.6); return 0.5 * np.sin(2 * np.pi * (75 - 25 * t) * t) * np.exp(-t * 9) + 0.25 * lp(noise(0.6), 900) * np.exp(-t * 35) + 0.08 * bp(noise(0.6), 2000, 5000) * np.exp(-t * 60)
def rustle(d, g=1.0):
    n = int(d * SR); m = lp(np.abs(rng.standard_normal(n)), 12); m /= m.max() + 1e-9
    e = np.sin(np.pi * np.arange(n) / n); return 0.05 * g * bp(noise(d), 1000, 5000) * m * e
def whirr(d): n = int(d * SR); t = np.arange(n) / SR; e = np.minimum(1, t / 0.3) * np.minimum(1, (d - t) / 0.4); return 0.025 * bp(noise(d), 300, 1400) * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * t)) * e
def squeak(d): t = T(d); return 0.02 * np.sin(2 * np.pi * (1900 + 300 * np.sin(2 * np.pi * 1.5 * t)) * t) * np.sin(np.pi * t / d)
SFX = {
    'paper_slap': lambda e: slap(), 'pen': lambda e: pen(e['dur']), 'letter': lambda e: pen(e['dur'], 0.8), 'pop': lambda e: pop(),
    'tick': lambda e: click(5000, 0.6), 'click': lambda e: click(3800, 0.8), 'balloon': lambda e: wood(1300, 0.7),
    'compass': lambda e: squeak(e['dur']), 'hatch': lambda e: pen(e['dur'], 0.7), 'shed': lambda e: wood(420, 1.0),
    'weft_step': lambda e: click(3400, 0.45), 'thread_whirr': lambda e: whirr(e['dur']), 'tick_stroke': lambda e: pen(0.16, 1.3),
    'signature': lambda e: pen(e['dur'], 1.1), 'stamp': lambda e: stamp(), 'lift': lambda e: rustle(e['dur'], 1.2),
    'light_switch': lambda e: click(2500, 1.2, 0.05),
}
EV = json.load(open(os.path.join(HERE, 'out', 'events.json')))
for e in EV:
    f = SFX.get(e['type'])
    if f: put(fx, f(e), e['t'], pan=float(rng.uniform(-0.3, 0.3)))
# room tone (not in the silence)
room = lp(noise(DUR), 400) * 0.004; room[int(32.45 * SR):int(33.12 * SR)] = 0
fx[:, 0] += room; fx[:, 1] += room

# ---------------- voice ----------------
lines = json.load(open(os.path.join(HERE, 'out', 'voice', 'lines.json')))
voice = np.zeros(N); duck = np.ones(N)
for L in lines:
    a, sr = sf.read(L['file']); a = a if a.ndim == 1 else a.mean(1)
    if sr != SR:
        from scipy.signal import resample_poly
        a = resample_poly(a, SR, sr)
    i = int((L['t'] + 0.05) * SR); a = a[:N - i]; voice[i:i + len(a)] += a
    lo, hi = max(0, i - int(0.15 * SR)), min(N, i + len(a) + int(0.25 * SR)); duck[lo:hi] = np.minimum(duck[lo:hi], 0.36)
duck = lp(duck, 6, 1)  # smooth the ducking ramps
voice = hp(voice, 80)

mix = music * duck[:, None] * 0.9 + fx * 0.55 + voice[:, None] * 0.75
mix[-int(0.4 * SR):] *= np.linspace(1, 0, int(0.4 * SR))[:, None]
peak = np.abs(mix).max(); mix *= 0.89 / peak
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR, subtype='PCM_24')
for name, x in [('music', music), ('fx', fx)]: sf.write(os.path.join(HERE, 'out', f'stem_{name}.wav'), (x / (np.abs(x).max() + 1e-9) * 0.9).astype(np.float32), SR)
print(f'mix.wav written · peak before normalise {peak:.3f} · silence check {np.abs(mix[int(32.5*SR):int(33.1*SR)]).max():.5f}')
