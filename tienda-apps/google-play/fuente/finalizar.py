"""
DEJA LAS IMÁGENES COMO LAS PIDE GOOGLE PLAY Y LO COMPRUEBA.

Pasa cada PNG final a 24 bits SIN canal alfa (RGB) y verifica:
medida exacta, sin alfa y peso ≤ 8 MB. Si algo no cumple, termina en error.

Uso:  python3 finalizar.py
"""
import os
import sys

from PIL import Image

CARPETA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
LIMITE = 8 * 1024 * 1024

ESPERADO = {"icono-512.png": (512, 512)}
for l in ("en", "es"):
    ESPERADO[f"grafico-destacado-{l}.png"] = (1024, 500)
    for i in range(1, 9):
        ESPERADO[f"telefono-{l}-{i:02d}.png"] = (1080, 1920)
    for i in range(1, 5):
        ESPERADO[f"tableta-{l}-{i:02d}.png"] = (1080, 1920)

fallas = 0
for nombre, medida in ESPERADO.items():
    ruta = os.path.join(CARPETA, nombre)
    if not os.path.exists(ruta):
        print(f"FALTA   {nombre}")
        fallas += 1
        continue
    im = Image.open(ruta)
    if im.mode != "RGB":
        fondo = Image.new("RGB", im.size, (16, 38, 58))
        fondo.paste(im.convert("RGBA"), mask=im.convert("RGBA").split()[-1])
        fondo.save(ruta, "PNG", optimize=True)
    im = Image.open(ruta)
    peso = os.path.getsize(ruta)
    ok = im.size == medida and im.mode == "RGB" and peso <= LIMITE
    fallas += 0 if ok else 1
    print(f"{'ok    ' if ok else 'FALLA '} {nombre:28s} {im.size[0]}x{im.size[1]}  {im.mode}  {peso / 1024:,.0f} KB")

print("\nTodo cumple." if not fallas else f"\n{fallas} archivo(s) no cumplen.")
sys.exit(1 if fallas else 0)
