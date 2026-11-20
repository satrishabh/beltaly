"""Make 1200x630 JPG link-preview cards (WhatsApp, Facebook, X) from the product photos.
WhatsApp shows these when a page link is shared; JPG is used because some apps skip WebP previews.
Usage (from the repo root): python scripts/share-images.py
Writes public/og/<slug>.jpg for every product and public/og/home.jpg. Re-run after changing photos or prices."""
import json
import os
from PIL import Image, ImageChops, ImageDraw, ImageFont

ROOT = os.path.join(os.path.dirname(__file__), '..')
OUT = os.path.join(ROOT, 'public', 'og')
FONTS = os.environ.get('FONT_DIR', 'C:/Windows/Fonts')
W, H = 1200, 630
ESPRESSO, GOLD, CREAM, MUTED = (18, 14, 10), (201, 161, 74), (247, 241, 230), (185, 173, 153)


def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), size)


def studio(size):
    """Warm radial panel the photos sit on (same look as the site)."""
    w, h = size
    panel = Image.new('RGB', size)
    px = panel.load()
    inner, outer = (253, 250, 244), (230, 217, 197)
    for y in range(h):
        for x in range(w):
            d = min(1.0, (((x - w / 2) / (w * .62)) ** 2 + ((y - h * .38) / (h * .7)) ** 2) ** .5)
            px[x, y] = tuple(round(inner[i] + (outer[i] - inner[i]) * d) for i in range(3))
    return panel


def photo_on_panel(paths, size):
    """Multiply the white-background photos onto the studio panel, side by side if there are several."""
    w, h = size
    slot = w // len(paths)
    layer = Image.new('RGB', size, (255, 255, 255))
    for index, path in enumerate(paths):
        img = Image.open(os.path.join(ROOT, 'public', path.lstrip('/'))).convert('RGB')
        img.thumbnail((int(slot * .9), int(h * .84)))
        layer.paste(img, (index * slot + (slot - img.width) // 2, (h - img.height) // 2))
    return ImageChops.multiply(studio(size), layer)


def card(images, title, lines, out):
    canvas = Image.new('RGB', (W, H), ESPRESSO)
    panel = photo_on_panel(images, (560, 560))
    mask = Image.new('L', panel.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, *panel.size), 24, fill=255)
    canvas.paste(panel, (35, 35), mask)
    draw = ImageDraw.Draw(canvas)
    x = 640
    draw.text((x, 70), 'BELTALY', font=font('georgiab.ttf', 30), fill=GOLD)
    draw.line((x, 118, x + 60, 118), fill=GOLD, width=2)
    y = 150
    words, line = title.split(), ''
    for word in words:  # wrap the title to the right column
        test = f'{line} {word}'.strip()
        if draw.textlength(test, font=font('georgia.ttf', 50)) > 520 and line:
            draw.text((x, y), line, font=font('georgia.ttf', 50), fill=CREAM)
            y += 62
            line = word
        else:
            line = test
    draw.text((x, y), line, font=font('georgia.ttf', 50), fill=CREAM)
    y += 92
    for text, style in lines:
        f = {'price': font('segoeuib.ttf', 46), 'gold': font('seguisb.ttf', 26), 'muted': font('segoeui.ttf', 24)}[style]
        draw.text((x, y), text, font=f, fill={'price': CREAM, 'gold': GOLD, 'muted': MUTED}[style])
        y += {'price': 66, 'gold': 40, 'muted': 36}[style]
    draw.text((x, H - 70), 'www.beltaly.in', font=font('seguisb.ttf', 24), fill=GOLD)
    canvas.save(os.path.join(OUT, out), 'JPEG', quality=86, optimize=True, progressive=True)


def inr(value):
    s = str(value)
    if len(s) <= 3:
        return f'₹{s}'
    head, tail = s[:-3], s[-3:]
    groups = []
    while len(head) > 2:
        groups.insert(0, head[-2:])
        head = head[:-2]
    return '₹' + ','.join(([head] if head else []) + groups + [tail])


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    products = json.load(open(os.path.join(ROOT, 'src', 'data', 'products.json'), encoding='utf-8'))
    for p in products:
        off = round((1 - p['price'] / p['mrp']) * 100) if p['mrp'] > p['price'] else 0
        price = f"{inr(p['price'])}" + (f'   {off}% off' if off else '')
        card(p['images'][:1], p['name'].replace(' — ', ', '), [
            (price, 'price'),
            (f"Genuine leather · Sizes {p['sizes'][0]}–{p['sizes'][-1]}", 'gold'),
            ('Cash on Delivery · Order on WhatsApp', 'muted'),
        ], f"{p['slug']}.jpg")
    lowest = min(p['price'] for p in products)
    singles = [p['images'][0] for p in products if 'combo' not in p['name'].lower()][:2]
    card(singles, 'Genuine leather belts for men', [
        (f'From {inr(lowest)}', 'price'),
        ('Plate buckle belts & combo packs', 'gold'),
        ('Cash on Delivery across India', 'muted'),
    ], 'home.jpg')
    print('wrote', len(products) + 1, 'cards to', OUT)
