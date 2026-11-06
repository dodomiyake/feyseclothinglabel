# .venv/bin/python voice.py — narrate VOICE lines (out/voice.json, exported from film.js) with Kokoro, check with Whisper,
# and check each line ends before the next starts.
import json, os, re, sys
import numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
V = json.load(open(os.path.join(HERE, 'out', 'voice.json')))['voice']
VOICE, SPEED = 'af_heart', 1.12
out = os.path.join(HERE, 'out', 'voice'); os.makedirs(out, exist_ok=True)
from kokoro_onnx import Kokoro
k = Kokoro(os.path.join(HERE, 'models', 'kokoro-v1.0.onnx'), os.path.join(HERE, 'models', 'voices-v1.0.bin'))
meta = []
for i, L in enumerate(V):
    say = L['say'].replace('naira', 'nigh-rah').replace('NERSI', 'Nursy').replace('OTP', 'O.T.P.').replace('PIN', 'pin').replace('SMS', 'S.M.S.')
    a, sr = k.create(say, voice=VOICE, speed=SPEED, lang='en-us'); a = np.asarray(a, np.float32)
    nz = np.flatnonzero(np.abs(a) > 0.01); a = a[max(0, nz[0] - int(.02 * sr)): nz[-1] + int(.08 * sr)]
    f = os.path.join(out, f"line{L['id']}.wav"); sf.write(f, a, sr)
    nxt = V[i + 1]['t'] if i + 1 < len(V) else 45.0
    room = nxt - L['t'] - len(a) / sr
    meta.append({'id': L['id'], 't': L['t'], 'text': L['say'], 'file': f, 'dur': len(a) / sr})
    print(f"line {L['id']}: {len(a)/sr:.2f}s, room before next {room:+.2f}s" + ('  <-- TOO LONG' if room < 0.15 else ''))
json.dump(meta, open(os.path.join(out, 'lines.json'), 'w'), indent=1)
from faster_whisper import WhisperModel
m = WhisperModel('base.en', device='cpu', compute_type='int8')
norm = lambda s: re.sub(r'[^a-z ]', '', s.lower().replace('50,000', 'fifty thousand').replace('-', ' ')).split()
bad = 0
for L in meta:
    heard = ' '.join(s.text for s in m.transcribe(L['file'], language='en', beam_size=5)[0]).strip()
    miss = [w for w in norm(L['text']) if w not in norm(heard) and w not in ('nersi', 'otp', 'sms', 'dont')]
    bad += bool(miss); print(('OK  ' if not miss else 'MISS') + f" {L['id']}: heard '{heard}'" + (f'  missing {miss}' if miss else ''))
sys.exit(1 if bad else 0)
