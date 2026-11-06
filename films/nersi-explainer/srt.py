# python3 srt.py  — out/cues.json → nersi-explainer.srt
import json, os
H = os.path.dirname(os.path.abspath(__file__))
f = lambda s: f"{int(s//3600):02}:{int(s%3600//60):02}:{int(s%60):02},{int(round(s%1*1000)):03}"
cues = json.load(open(os.path.join(H, 'out', 'cues.json')))
open(os.path.join(H, 'nersi-explainer.srt'), 'w').write(''.join(f"{i}\n{f(c['t0'])} --> {f(c['t1'])}\n{c['text']}\n\n" for i, c in enumerate(cues, 1)))
