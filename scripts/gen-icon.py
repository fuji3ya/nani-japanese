"""Nani?! Japanese — placeholder app icon + favicon (PIL).

A real icon comes later (design pass). This just lets `expo prebuild` succeed
(app.json references assets/images/icon.png + favicon.png) so the iOS compile
gate can run. Funny/meme brand: pink bg, big white "?!".

Run:  cd apps/jp-kotoba && python scripts/gen-icon.py
"""
from PIL import Image, ImageDraw, ImageFont
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.normpath(os.path.join(HERE, "..", "assets", "images"))
PINK = (0xFF, 0x4D, 0x6D)
INK = (0x15, 0x13, 0x0F)
WHITE = (0xFF, 0xFF, 0xFF)


def _font(size):
    for p in [
        "C:/Windows/Fonts/arialbd.ttf",
        "C:/Windows/Fonts/arial.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    ]:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def make(size, with_alpha=False):
    img = Image.new("RGBA" if with_alpha else "RGB", (size, size), PINK)
    d = ImageDraw.Draw(img)
    # chunky ink border (neo-brutalist)
    bw = max(2, size // 28)
    d.rectangle([bw // 2, bw // 2, size - bw // 2, size - bw // 2], outline=INK, width=bw)
    # big "?!"
    txt = "?!"
    f = _font(int(size * 0.6))
    bbox = d.textbbox((0, 0), txt, font=f)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (size - tw) / 2 - bbox[0]
    y = (size - th) / 2 - bbox[1]
    # hard offset shadow then white
    off = max(2, size // 40)
    d.text((x + off, y + off), txt, font=f, fill=INK)
    d.text((x, y), txt, font=f, fill=WHITE)
    return img


def main():
    os.makedirs(ASSETS, exist_ok=True)
    make(1024).save(os.path.join(ASSETS, "icon.png"), "PNG")
    make(196).save(os.path.join(ASSETS, "favicon.png"), "PNG")
    make(1024, with_alpha=True).save(os.path.join(ASSETS, "splash-icon.png"), "PNG")
    make(432, with_alpha=True).save(os.path.join(ASSETS, "adaptive-icon.png"), "PNG")
    print("wrote icon.png / favicon.png / splash-icon.png / adaptive-icon.png ->", ASSETS)


if __name__ == "__main__":
    main()
