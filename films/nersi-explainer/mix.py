# .venv/bin/python mix.py — Caption News score (120 BPM pulse) + foley from out/events.json + voice → out/mix.wav
# Everything is synthesized here: kit, electric bass, marimba, vibraphone, glockenspiel, brass stabs, timpani, cymbal.
import json, os
import numpy as np, soundfile as sf
from scipy.signal import fftconvolve, butter, sosfilt, resample_poly
HERE = os.path.dirname(os.path.abspath(__file__))
SR, DUR = 48000, 45.0
N = int(SR * DUR); BEAT = 0.5; E8 = 0.25; S16 = 0.125
rng = np.random.default_rng(3)
mid = lambda m: 440 * 2 ** ((m - 69) / 12)
T = lambda d: np.arange(int(d * SR)) / SR
def filt(x, kind, f, o=2): return sosfilt(butter(o, f, kind, fs=SR, output='sos'), x)
noise = lambda d: rng.standard_normal(int(d * SR))
V = json.load(open(os.path.join(HERE, os.environ.get('OUT', 'out'), 'voice.json')))
SIL = V['silences']

# ---------------- instruments ----------------
def kick(): t = T(0.35); return 0.9 * np.sin(2 * np.pi * (48 + 90 * np.exp(-t * 30)) * t) * np.exp(-t * 9)
def snare(): t = T(0.25); return 0.35 * filt(noise(0.25), 'band', [1500, 7000]) * np.exp(-t * 18) + 0.2 * np.sin(2 * np.pi * 190 * t) * np.exp(-t * 25)
def hat(v=1): t = T(0.06); return 0.1 * v * filt(noise(0.06), 'high', 8000) * np.exp(-t * 70)
def bass(m, d=0.22):
    f = mid(m); t = T(d + 0.05); ph = 2 * np.pi * f * t; y = np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.12 * np.sin(3 * ph)
    return 0.32 * filt(y * np.minimum(1, t / 0.005) * np.exp(-t * 4) * np.clip((d + 0.05 - t) / 0.05, 0, 1), 'low', 900)
def marimba(m, v=1):
    f = mid(m); t = T(0.45); y = np.sin(2 * np.pi * f * t) * np.exp(-t * 9) + 0.25 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 30) + 0.1 * np.sin(2 * np.pi * f * 9.9 * t) * np.exp(-t * 60)
    y[:24] *= np.linspace(0, 1, 24); return 0.07 * v * y
def vib(m, d=0.9):
    f = mid(m); t = T(d); trem = 1 + 0.25 * np.sin(2 * np.pi * 5.5 * t)
    y = (np.sin(2 * np.pi * f * t) + 0.12 * np.sin(2 * np.pi * f * 4 * t)) * np.exp(-t * 2.2) * trem; y[:48] *= np.linspace(0, 1, 48); return 0.05 * y
def glock(m): f = mid(m); t = T(1.2); y = (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 4)) * np.exp(-t * 3); y[:24] *= np.linspace(0, 1, 24); return 0.08 * y
def brass(notes, d=0.35, v=1):
    t = T(d + 0.15); y = np.zeros_like(t)
    for m in notes:
        ph = 2 * np.pi * mid(m) * t * (1 + 0.002 * rng.standard_normal())
        y += sum(np.sin(k * ph) * (1 / k) for k in range(1, 12))
    env = np.minimum(1, t / 0.02) * np.exp(-t * 3) * np.clip((d + 0.15 - t) / 0.15, 0, 1)
    return 0.05 * v * filt(y * env, 'low', 3500)
def timpani(m): t = T(1.4); return 0.5 * np.sin(2 * np.pi * mid(m) * t * (1 + 0.02 * np.exp(-t * 8))) * np.exp(-t * 3) + 0.1 * filt(noise(1.4), 'low', 300) * np.exp(-t * 6)
def cymbal(d=2.0): t = T(d); return 0.07 * filt(noise(d), 'high', 4000) * np.minimum(1, t / 0.6) * np.exp(-np.maximum(0, t - 0.6) * 1.5)

music = np.zeros((N, 2))
def put(buf, x, t, pan=0.0, g=1.0):
    i = int(round(t * SR)); x = x[:max(0, len(buf) - i)]
    if i < 0 or not len(x): return
    buf[i:i + len(x), 0] += x * g * np.sqrt(1 - pan); buf[i:i + len(x), 1] += x * g * np.sqrt(1 + pan)

# F major: F – Dm – Bb – C, one chord per bar (2 s)
PROG = [('F', 41, [65, 69, 72]), ('Dm', 38, [62, 65, 69]), ('Bb', 46, [62, 65, 70]), ('C', 36, [64, 67, 72])]
ARP = lambda ch: [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[1] + 12, ch[2] + 12, ch[0] + 24, ch[2] + 12, ch[1] + 12]
def silent(t): return any(a - 0.02 <= t < b for a, b in SIL)
def bar_state(b):
    t = b * 2.0
    if t < 12: return 'drive'
    if t < 14: return 'stop'
    if t < 18.5: return 'turn'
    if t < 38: return 'drive'
    return 'verdict'
for b in range(int(DUR / 2) + 1):
    name, root, ch = PROG[b % 4]; t0 = b * 2.0; st = bar_state(b)
    if st == 'stop': continue
    for i in range(4):          # beats
        tb = t0 + i * BEAT
        if tb >= DUR or silent(tb): continue
        if st != 'verdict' or i % 2 == 0: put(music, kick(), tb, 0, 0.9)
        if i % 2 == 1 and st == 'drive' and t0 >= 4: put(music, snare(), tb, 0.05, 0.6)
        if not silent(tb + E8): put(music, hat(1.0), tb + E8, 0.3)
        put(music, hat(0.5), tb, 0.3)
        for e in range(2):      # eighth-note bass
            te = tb + e * E8
            if not silent(te): put(music, bass(root + (12 if e else 0)), te, -0.1)
        if not silent(tb + E8): put(music, vib(ch[(i) % 3] + 12, 0.45), tb + E8, 0.2)   # off-beat vib
    if t0 >= 2 and st in ('drive', 'turn', 'verdict'):
        for s, m in enumerate(ARP(ch) * 2):  # sixteenth marimba ostinato
            ts = t0 + s * S16
            if ts < DUR and not silent(ts): put(music, marimba(m, 0.9 if s % 4 == 0 else 0.6), ts, -0.3)
# hits and structure
put(music, brass([65, 69, 72, 77], 0.45, 1.3), 0.15); put(music, glock(84), 0.15, 0.2)
put(music, brass([60, 65, 69], 0.3, 0.9), 4.8)
put(music, timpani(41), 14.0); put(music, cymbal(2.0), 12.2); put(music, brass([65, 70, 74, 77], 0.6, 1.4), 14.0)
put(music, brass([65, 69, 72], 0.3, 1.0), 23.4); put(music, brass([67, 72, 76], 0.3, 1.0), 32.65)
for i in range(8): put(music, snare(), 37.0 + i * 0.125, 0.05, 0.25 + 0.06 * i)   # build into the verdict
put(music, brass([53, 60, 65, 69, 72, 77], 1.6, 1.3), 38.5); put(music, timpani(41), 38.5)
for i, m in enumerate([77, 81, 84, 89]): put(music, glock(m), 38.5 + i * 0.25, 0.3)
put(music, brass([53, 60, 65, 69, 72, 77], 2.5, 0.9), 44.0); put(music, glock(89), 44.0)
# hard silences
for a, b in SIL: music[int(a * SR):int(b * SR)] = 0
ir = rng.standard_normal(int(0.9 * SR)) * np.exp(-np.arange(int(0.9 * SR)) / SR * 6); ir = filt(ir, 'low', 7000); ir /= np.sqrt((ir ** 2).sum())
for c in range(2): music[:, c] += 0.15 * fftconvolve(music[:, c], ir)[:N]
for a, b in SIL: music[int(a * SR):int(b * SR)] = 0

# ---------------- foley ----------------
fx = np.zeros((N, 2))
def env(n, a, d): t = np.arange(n) / SR; return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)
def slam(): n = int(0.12 * SR); t = T(0.12); return 0.25 * filt(noise(0.12), 'band', [2000, 6000]) * env(n, 0.0005, 0.01) + 0.3 * np.sin(2 * np.pi * 90 * t) * np.exp(-t * 30)
def counter(d): o = np.zeros(int(d * SR) + 2000); [o.__setitem__(slice(int(i * 0.045 * SR), int(i * 0.045 * SR) + 600), o[int(i * 0.045 * SR):int(i * 0.045 * SR) + 600] + 0.12 * filt(noise(600 / SR), 'band', [3000, 6000]) * np.exp(-np.arange(600) / 100)) for i in range(int(d / 0.045))]; return o
def whoosh(): d = 0.35; t = T(d); return 0.12 * filt(noise(d), 'band', [400, 2500]) * np.sin(np.pi * t / d) ** 2
def hl(d): t = T(d); return 0.05 * filt(noise(d), 'band', [2500, 7000]) * (0.6 + 0.4 * np.sin(2 * np.pi * 23 * t)) * np.sin(np.pi * t / d)
def pop(): t = T(0.08); return 0.12 * np.sin(2 * np.pi * (1200 - 4000 * t) * t) * np.exp(-t * 40)
def tick(): return 0.1 * filt(noise(0.02), 'band', [4000, 8000]) * np.exp(-np.arange(int(0.02 * SR)) / 100)
def stamp(): t = T(0.4); return 0.55 * np.sin(2 * np.pi * (70 - 20 * t) * t) * np.exp(-t * 12) + 0.2 * filt(noise(0.4), 'low', 1200) * np.exp(-t * 40)
def shutter(): t = T(0.12); a = filt(noise(0.12), 'band', [1500, 6000]); return 0.25 * a * (np.exp(-t * 80) + 0.7 * np.exp(-np.abs(t - 0.06) * 120))
def rise(): d = 0.5; t = T(d); return 0.06 * filt(noise(d), 'band', [600, 5000]) * (t / d) ** 2
def sms(): t = T(0.5); return 0.08 * (np.sin(2 * np.pi * 1318 * t) * (t < .12) + np.sin(2 * np.pi * 1760 * t) * (t > .15) * (t < .3)) * np.exp(-t * 3)
def buzz(): t = T(0.18); return 0.07 * np.sign(np.sin(2 * np.pi * 110 * t)) * np.exp(-t * 14)
SFX = {'slam': lambda e: slam(), 'counter': lambda e: counter(e['dur']), 'whoosh': lambda e: whoosh(), 'highlighter': lambda e: hl(e['dur']),
       'pop': lambda e: pop(), 'tick': lambda e: tick(), 'stamp': lambda e: stamp(), 'shutter': lambda e: shutter(), 'rise': lambda e: rise(),
       'sms': lambda e: sms(), 'buzz': lambda e: buzz(), 'hit_big': lambda e: stamp() * 0.6, 'turn_hit': lambda e: stamp(), 'verdict': lambda e: stamp() * 0.7}
for e in json.load(open(os.path.join(HERE, os.environ.get('OUT', 'out'), 'events.json'))):
    f = SFX.get(e['type'])
    if f: put(fx, f(e), e['t'], float(rng.uniform(-0.25, 0.25)))

# ---------------- voice (compressed, ~8 dB over the music) ----------------
voice = np.zeros(N); duck = np.ones(N)
for L in json.load(open(os.path.join(HERE, os.environ.get('OUT', 'out'), 'voice', 'lines.json'))):
    a, sr = sf.read(L['file']); a = a if a.ndim == 1 else a.mean(1)
    if sr != SR: a = resample_poly(a, SR, sr)
    i = int(L['t'] * SR); a = a[:N - i]; voice[i:i + len(a)] += a
    lo, hi = max(0, i - int(0.1 * SR)), min(N, i + len(a) + int(0.2 * SR)); duck[lo:hi] = np.minimum(duck[lo:hi], 0.55)
voice = filt(voice, 'high', 90)
envv = filt(np.abs(voice), 'low', 20, 1); g = np.where(envv > 0.08, (0.08 / np.maximum(envv, 1e-9)) ** 0.6, 1.0); voice *= g; voice /= np.abs(voice).max() + 1e-9
duck = filt(duck, 'low', 8, 1)
mix = music * duck[:, None] * 0.55 + fx * 0.6 + voice[:, None] * 0.9
mix[-int(0.5 * SR):] *= np.linspace(1, 0, int(0.5 * SR))[:, None]
mix *= 0.89 / np.abs(mix).max()
sf.write(os.path.join(HERE, os.environ.get('OUT', 'out'), 'mix.wav'), mix.astype(np.float32), SR, subtype='PCM_24')
print('mix.wav ok · silence peaks', [round(float(np.abs(music[int(a * SR):int(b * SR)]).max()), 5) for a, b in SIL])
