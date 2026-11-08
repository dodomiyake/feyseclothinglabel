# .venv/bin/python voice_ng.py [voice] [rate] — narrate VOICE lines (out/voice.json) with a Nigerian English neural voice
# (Microsoft edge-tts, online; default en-NG-EzinneNeural), then check with Whisper and check each line fits before the next.
import asyncio, json, os, re, ssl, subprocess, sys
import numpy as np, soundfile as sf
import edge_tts, edge_tts.communicate as ec
HERE = os.path.dirname(os.path.abspath(__file__))
VOICE = sys.argv[1] if len(sys.argv) > 1 else 'en-NG-EzinneNeural'
RATE = sys.argv[2] if len(sys.argv) > 2 else '+10%'
CA = os.environ.get('SSL_CERT_FILE') or ('/root/.ccr/ca-bundle.crt' if os.path.exists('/root/.ccr/ca-bundle.crt') else None)
if CA: ec._SSL_CTX = ssl.create_default_context(cafile=CA)   # trust a TLS-inspecting proxy when there is one
V = json.load(open(os.path.join(HERE, 'out', 'voice.json')))['voice']
out = os.path.join(HERE, 'out', 'voice'); os.makedirs(out, exist_ok=True)
SAY = lambda s: s.replace('NERSI', 'Nersi')
async def synth():
    for L in V:
        mp3 = os.path.join(out, f"line{L['id']}.mp3")
        await edge_tts.Communicate(SAY(L['say']), VOICE, rate=RATE).save(mp3)
asyncio.run(synth())
meta = []
for i, L in enumerate(V):
    mp3, wav = os.path.join(out, f"line{L['id']}.mp3"), os.path.join(out, f"line{L['id']}.wav")
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', mp3, '-ar', '48000', '-ac', '1', wav], check=True)
    a, sr = sf.read(wav); nz = np.flatnonzero(np.abs(a) > 0.01); a = a[max(0, nz[0] - int(.02 * sr)): nz[-1] + int(.08 * sr)]; sf.write(wav, a, sr)
    nxt = V[i + 1]['t'] if i + 1 < len(V) else 45.0; room = nxt - L['t'] - len(a) / sr
    meta.append({'id': L['id'], 't': L['t'], 'text': L['say'], 'file': wav, 'dur': len(a) / sr})
    print(f"line {L['id']}: {len(a)/sr:.2f}s, room {room:+.2f}s" + ('  <-- TOO LONG' if room < 0.15 else ''))
json.dump(meta, open(os.path.join(out, 'lines.json'), 'w'), indent=1)
from faster_whisper import WhisperModel
m = WhisperModel('small.en', device='cpu', compute_type='int8')
norm = lambda s: re.sub(r'[^a-z ]', '', s.lower().replace('50,000', 'fifty thousand').replace('-', ' ')).split()
bad = 0
for L in meta:
    heard = ' '.join(s.text for s in m.transcribe(L['file'], language='en', beam_size=5)[0]).strip()
    miss = [w for w in norm(L['text']) if w not in norm(heard) and w not in ('nersi', 'otp', 'sms', 'dont', 'naira')]
    bad += bool(miss); print(('OK  ' if not miss else 'MISS') + f" {L['id']}: heard '{heard}'" + (f'  missing {miss}' if miss else ''))
sys.exit(1 if bad else 0)
