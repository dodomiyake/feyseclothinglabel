# python3 storyboard.py  — tile the key stills into storyboard.jpg with captions
from PIL import Image, ImageDraw, ImageFont
import os
HERE = os.path.dirname(os.path.abspath(__file__))
F = [
    ("2.40", "1 · Medium, slow push · 0–5 s", "A centre line crosses the empty sheet; the label drafts itself.", "NOTE 1: Every garment carries a signature."),
    ("7.60", "2 · Two-shot, push · 5–12.5 s", "A customer's message arrives as a drawing.", "NOTE 2: Yours starts as a message."),
    ("11.40", "2 · (cont.)", "Dimensions count up to 50 × 20 mm; balloons call out the parts.", "NOTE 3: We draw it to the millimetre…"),
    ("16.50", "3 · Cut, 3× close-up · 12.5–20 s", "Detail B: the warp sheds on every beat, the weft steps through.", "NOTE 4: …and weave it, thread by thread, in Lagos."),
    ("24.00", "4 · Track along the thread · 20–27.5 s", "The thread becomes the order route, LAGOS → UK, one status per balloon.", "NOTE 5: Every step, tracked on WhatsApp."),
    ("31.20", "5 · Locked-off, title block · 27.5–35 s", "The QC row is ticked by hand, then signed.", "NOTE 6: And every label is checked by hand."),
    ("33.60", "5 · (cont.) after a silence", "The red APPROVED stamp lands: the film's only colour.", "(no voice)"),
    ("41.80", "6 · Pull to the whole sheet · 35–42.6 s", "The label leaves the drawing as a real woven label.", "NOTES 7–8: Feyse Clothing Labels. Made in Lagos. Worn everywhere."),
    ("46.50", "6 · Push-in, lights off · 42.6–48 s", "The lights go off; the lines glow on the dark sheet.", "(music only)"),
]
TW, TH, PAD, CAP = 640, 360, 24, 104
cols, rows = 3, 3
out = Image.new("RGB", (cols * TW + (cols + 1) * PAD, 110 + rows * (TH + CAP) + (rows + 1) * PAD), (13, 17, 22))
d = ImageDraw.Draw(out)
def font(name, size):
    try: return ImageFont.truetype(name, size)
    except Exception: return ImageFont.load_default(size)
fb = font("DejaVuSans-Bold.ttf", 22); fr = font("DejaVuSans.ttf", 17); fh = font("DejaVuSans-Bold.ttf", 34)
d.text((PAD, 30), "FEYSE CLOTHING LABELS · “Signature” · Blueprint · 48 s storyboard", font=fh, fill=(231, 240, 249))
for i, (t, a, b, c) in enumerate(F):
    x = PAD + (i % cols) * (TW + PAD); y = 110 + PAD + (i // cols) * (TH + CAP + PAD)
    im = Image.open(os.path.join(HERE, "stills", f"t_{t}.jpg")).resize((TW, TH), Image.LANCZOS)
    out.paste(im, (x, y))
    d.text((x, y + TH + 8), a, font=fb, fill=(231, 240, 249))
    d.text((x, y + TH + 38), b, font=fr, fill=(170, 190, 215))
    d.text((x, y + TH + 62), c, font=fr, fill=(230, 160, 150) if "APPROVED" in b else (140, 165, 200))
out.save(os.path.join(HERE, "storyboard.jpg"), quality=90)
print("ok")
