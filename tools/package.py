"""Builds dist/TamCam-itch.zip — upload this to itch.io as an HTML5 game.
Usage: python tools/package.py
Only ships what the game loads (index.html, css/, js/, fonts/); dev tools stay out.
"""
import os, re, zipfile, io

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DIST = os.path.join(ROOT, 'dist')
OUT = os.path.join(DIST, 'TamCam-itch.zip')

html = io.open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
scripts = re.findall(r'<script src="([^"]+)"', html)
styles = re.findall(r'<link rel="stylesheet" href="([^"]+)"', html)
fonts_css = io.open(os.path.join(ROOT, 'fonts', 'fonts.css'), encoding='utf-8').read()
fonts = ['fonts/' + f for f in re.findall(r'url\(([^)]+)\)', fonts_css)]

files = ['index.html'] + styles + scripts + fonts
missing = [f for f in files if not os.path.exists(os.path.join(ROOT, f))]
if missing:
    raise SystemExit('missing files: %s' % missing)

os.makedirs(DIST, exist_ok=True)
if os.path.exists(OUT):
    os.remove(OUT)
total = 0
with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    for f in files:
        p = os.path.join(ROOT, f)
        z.write(p, f.replace('\\', '/'))
        total += os.path.getsize(p)
print('%d files, %.0f KB uncompressed -> %s (%.0f KB)' % (len(files), total / 1024, OUT, os.path.getsize(OUT) / 1024))
