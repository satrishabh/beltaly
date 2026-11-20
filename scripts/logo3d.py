"""Turn the flat gold-on-black Beltaly logo into a transparent, upscaled, embossed 3D-gold PNG.
Usage: python logo3d.py <source.png> <out_dir>"""
import sys
import numpy as np
from PIL import Image, ImageFilter

src, out = sys.argv[1], sys.argv[2]
rgb = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
lum = rgb.max(2)

SCALE = 4
x0, x1, y0, y1 = 254, 857, 353, 747          # logo bbox + padding
REGIONS = {'full': (y0, y1), 'mark': (353, 595)}


def blur(a, r):
    img = Image.fromarray(np.clip(a * 255, 0, 255).astype(np.uint8), 'L')
    return np.asarray(img.filter(ImageFilter.GaussianBlur(r))).astype(np.float32) / 255


def render(top, bottom, name):
    crop = lum[top:bottom, x0:x1]
    # Soft alpha from brightness: black background → 0, gold strokes → 1.
    alpha = np.clip((crop - 45) / (150 - 45), 0, 1)
    h, w = alpha.shape
    big = Image.fromarray((alpha * 255).astype(np.uint8), 'L').resize((w * SCALE, h * SCALE), Image.LANCZOS)
    a = np.asarray(big.filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32) / 255
    a = np.clip((a - 0.35) / 0.3, 0, 1)            # re-sharpen edges after upscaling
    a = a * a * (3 - 2 * a)                       # smoothstep for clean anti-aliasing
    H, W = a.shape

    # Height map: rounded bevel from blurred alpha, so strokes look raised and domed.
    height = blur(a, 5) * 0.6 + blur(a, 2) * 0.4
    gy, gx = np.gradient(height * 14)
    nz = np.ones_like(gx)
    norm = np.sqrt(gx ** 2 + gy ** 2 + nz ** 2)
    nx, ny, nz = -gx / norm, -gy / norm, nz / norm

    light = np.array([-0.55, -0.65, 0.52]); light /= np.linalg.norm(light)
    diffuse = np.clip(nx * light[0] + ny * light[1] + nz * light[2], 0, 1)
    half = light + np.array([0, 0, 1.0]); half /= np.linalg.norm(half)
    spec = np.clip(nx * half[0] + ny * half[1] + nz * half[2], 0, 1) ** 38

    # Brushed metallic gold: vertical gradient plus fine horizontal grain.
    t = np.linspace(0, 1, H)[:, None]
    stops = np.array([[255, 236, 160], [226, 186, 92], [176, 128, 42], [236, 200, 110], [140, 98, 30]], np.float32)
    pos = np.linspace(0, 1, len(stops))
    grad = np.stack([np.interp(t[:, 0], pos, stops[:, c]) for c in range(3)], 1)[:, None, :]
    grain = (np.random.default_rng(7).normal(0, 1, (H, 1)).repeat(W, 1))
    grain = blur((grain - grain.min()) / (grain.max() - grain.min()), 0.6)[..., None] * 0.08 + 0.96

    colour = grad * grain * (0.42 + 0.78 * diffuse[..., None]) + 255 * spec[..., None] * 0.85
    # Darker rim where the bevel turns away from the light: reads as depth.
    rim = np.clip(1 - nz, 0, 1)[..., None]
    colour = colour * (1 - 0.35 * rim)
    colour = np.clip(colour, 0, 255)

    # Soft drop shadow under the metal, offset down-right.
    pad = 18 * SCALE // 4
    canvas = np.zeros((H + pad * 2, W + pad * 2, 4), np.float32)
    shadow = blur(a, 7)
    canvas[pad + 6:pad + 6 + H, pad + 8:pad + 8 + W, 3] = shadow * 0.55
    rgb_out = canvas[..., :3]
    sa = canvas[..., 3:4]
    region = (slice(pad, pad + H), slice(pad, pad + W))
    fa = a[..., None]
    out_a = fa + sa[region] * (1 - fa)
    rgb_out[region] = (colour * fa) / np.maximum(out_a, 1e-6)
    canvas[..., 3:4][region] = out_a
    img = Image.fromarray(np.dstack([rgb_out, canvas[..., 3] * 255]).clip(0, 255).astype(np.uint8), 'RGBA')
    img = img.crop(img.getbbox())
    img.save(f'{out}/logo-3d-{name}.png', optimize=True)
    small = img.resize((img.width // 2, img.height // 2), Image.LANCZOS)
    small.save(f'{out}/logo-3d-{name}-sm.png', optimize=True)
    print(name, img.size, small.size)


for name, (top, bottom) in REGIONS.items():
    render(top, bottom, name)
