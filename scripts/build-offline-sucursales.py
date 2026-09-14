#!/usr/bin/env python3
"""Build a self-contained offline folder with the 33 store landings."""

from __future__ import annotations

import json
import re
import shutil
import subprocess
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "paquete-sucursales"
STORES_JS = ROOT / "js" / "tiendas-att-stores.js"

COPY_DIRS = [
    ("css", "css"),
    ("js", "js"),
    ("assets/stores/fachadas", "assets/stores/fachadas"),
    ("assets/images/smartphones", "assets/images/smartphones"),
]

COPY_FILES = [
    "assets/images/att-logo.webp",
    "assets/images/logo-yaavs-pospago.svg",
    "assets/images/logo-yaavs-pospago-alt.png",
    "assets/images/logos-marcas-yaavs-pospago.png",
    "assets/images/banner-att-mas-que-numeros.jpg",
    "assets/images/banner-att-quienes-mobile.jpg",
    "assets/images/banner-att-seguros.jpg",
    "assets/images/banner-att-seguros-mobile.jpg",
    "assets/images/favicon.svg",
    "assets/images/favicon-32.png",
    "assets/images/favicon-180.png",
    "assets/banners/secuencia-01-4.mp4",
    "assets/banners/secuencia-01-4-poster.jpg",
    "assets/banners/plan-black-vertical-head.mp4",
    "assets/banners/plan-black-vertical-head-poster.jpg",
]


def load_stores() -> list[dict]:
    text = STORES_JS.read_text(encoding="utf-8")
    m = re.search(r"window\.YAAVS_ATT_STORES\s*=\s*(\[.*\])\s*;", text, re.S)
    if not m:
        raise SystemExit("Could not parse stores")
    return json.loads(m.group(1))


def copy_tree(src: Path, dst: Path) -> None:
    if dst.exists():
        shutil.rmtree(dst)
    shutil.copytree(src, dst)


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def download_fonts(fonts_dir: Path, css_path: Path) -> None:
    fonts_dir.mkdir(parents=True, exist_ok=True)
    url = (
        "https://fonts.googleapis.com/css2?"
        "family=Outfit:wght@400;600;700;800&family=Sora:wght@600;700;800&display=swap"
    )
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        raw = urllib.request.urlopen(req, timeout=30).read().decode("utf-8")
    except Exception as exc:
        print(f"warn: could not download fonts ({exc}); using system fallbacks")
        css_path.write_text(
            """
@font-face { font-family: 'Outfit'; src: local('Outfit'), local('Arial'); font-weight: 400 800; }
@font-face { font-family: 'Sora'; src: local('Sora'), local('Arial'); font-weight: 600 800; }
""".strip()
            + "\n",
            encoding="utf-8",
        )
        return

    local_css = raw
    for i, font_url in enumerate(re.findall(r"url\((https://[^)]+)\)", raw)):
        ext = ".woff2" if ".woff2" in font_url else Path(font_url).suffix or ".woff2"
        name = f"font-{i}{ext}"
        dest = fonts_dir / name
        try:
            urllib.request.urlretrieve(font_url, dest)
            local_css = local_css.replace(font_url, f"../fonts/{name}")
        except Exception as exc:
            print(f"warn: skip font {font_url}: {exc}")
    css_path.write_text(local_css, encoding="utf-8")


def rewrite_store_html(src: Path, dest: Path) -> None:
    html = src.read_text(encoding="utf-8")
    html = re.sub(r'\s*<base href="/">\s*', "\n", html)
    # Drop remote font CDN; use local bundle
    html = re.sub(
        r'\s*<link rel="preconnect" href="https://fonts\.googleapis\.com">\s*',
        "\n",
        html,
    )
    html = re.sub(
        r'\s*<link rel="preconnect" href="https://fonts\.gstatic\.com"[^>]*>\s*',
        "\n",
        html,
    )
    html = re.sub(
        r'\s*<link href="https://fonts\.googleapis\.com/css2\?[^"]+" rel="stylesheet">\s*',
        '\n  <link rel="stylesheet" href="../fonts/fonts.css">\n',
        html,
    )
    # Root-relative / absolute-ish asset paths → relative from tienda/
    replacements = [
        (r'href="css/', 'href="../css/'),
        (r'href="js/', 'href="../js/'),
        (r'src="js/', 'src="../js/'),
        (r'src="assets/', 'src="../assets/'),
        (r'href="assets/', 'href="../assets/'),
        (r'poster="assets/', 'poster="../assets/'),
        (r'href="/"', 'href="../index.html"'),
        (r'href="/#tiendas"', 'href="../index.html"'),
        (r'href="/#', 'href="../index.html#'),
        (r'href="quienes-somos\.html"', 'href="../index.html"'),
        (r'href="premium\.html"', 'href="../index.html"'),
        (r'href="lite\.html"', 'href="../index.html"'),
        (r'href="simple\.html"', 'href="../index.html"'),
        (r'href="equipos\.html"', 'href="../index.html"'),
        (r'href="/seguro\.html"', 'href="../index.html"'),
        (r'href="seguro\.html"', 'href="../index.html"'),
        (r'href="blogs\.html"', 'href="../index.html"'),
        (r'content="assets/', 'content="../assets/'),
    ]
    for pat, repl in replacements:
        html = re.sub(pat, repl, html)
    # og:image already handled if content="assets/
    dest.write_text(html, encoding="utf-8")


def write_index(stores: list[dict]) -> None:
    rows = []
    for s in stores:
        rows.append(
            f'      <li><a href="tienda/{s["slug"]}.html"><strong>{s["name"]}</strong>'
            f' <span>{s["city"]} · {s["state"]}</span></a></li>'
        )
    html = f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Landings sucursales AT&amp;T · Paquete offline YAAVS</title>
  <link rel="stylesheet" href="fonts/fonts.css">
  <link rel="stylesheet" href="css/styles.css">
  <style>
    body.pack-index {{ background: #07111c; color: #e8f4fa; font-family: Outfit, system-ui, sans-serif; margin: 0; }}
    .pack {{ width: min(920px, calc(100% - 2rem)); margin: 2rem auto 3rem; }}
    .pack h1 {{ font-family: Sora, Outfit, sans-serif; font-size: clamp(1.6rem, 4vw, 2.2rem); margin: 0 0 .5rem; }}
    .pack p {{ color: #9db4c5; line-height: 1.5; }}
    .pack ol {{ list-style: none; padding: 0; margin: 1.5rem 0 0; display: grid; gap: .55rem; }}
    .pack li a {{ display: flex; flex-wrap: wrap; gap: .35rem 1rem; align-items: baseline;
      padding: .85rem 1rem; background: rgba(255,255,255,.04); border: 1px solid rgba(0,193,212,.25);
      color: #fff; text-decoration: none; }}
    .pack li a:hover {{ background: rgba(0,193,212,.12); }}
    .pack li span {{ color: #8aa3b5; font-size: .92rem; }}
    .pack .note {{ margin-top: 1.5rem; font-size: .9rem; color: #7f96a8; }}
  </style>
</head>
<body class="pack-index">
  <main class="pack">
    <h1>33 landings de sucursal · paquete offline</h1>
    <p>Abre este archivo o cualquiera de las páginas en <code>tienda/</code> sin internet.
      Cotizar / Cómo llegar / Facebook sí necesitan conexión.</p>
    <ol>
{chr(10).join(rows)}
    </ol>
    <p class="note">Carpeta lista para copiar a USB o compartir. Generada desde el sitio YAAVS Pospago.</p>
  </main>
</body>
</html>
"""
    (OUT / "index.html").write_text(html, encoding="utf-8")


def write_readme() -> None:
    (OUT / "LEEME.txt").write_text(
        """Paquete offline — Landings por sucursal YAAVS / AT&T
=====================================================

Cómo usarlo
-----------
1. Copia toda la carpeta `paquete-sucursales` a tu computadora o USB.
2. Abre `index.html` en el navegador (doble clic).
3. Entra a cualquier sucursal desde la lista, o abre `tienda/nombre.html`.

Qué funciona sin internet
-------------------------
- Las 33 páginas de sucursal (foto, video, planes, promociones, etc.)
- Estilos, tipografías y videos locales

Qué sí necesita internet
------------------------
- Botones de WhatsApp (Cotizar)
- Cómo llegar (Google Maps)
- Facebook

Notas
-----
- No borres subcarpetas (css, js, assets, fonts, tienda).
- Si el video no reproduce en algún navegador, prueba Chrome o Edge.
""",
        encoding="utf-8",
    )


def main() -> int:
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)

    for src_rel, dst_rel in COPY_DIRS:
        src = ROOT / src_rel
        if not src.exists():
            print(f"missing dir {src_rel}", file=sys.stderr)
            continue
        copy_tree(src, OUT / dst_rel)

    for rel in COPY_FILES:
        src = ROOT / rel
        if not src.exists():
            print(f"missing file {rel}", file=sys.stderr)
            continue
        dest = OUT / rel
        ensure_parent(dest)
        shutil.copy2(src, dest)

    download_fonts(OUT / "fonts", OUT / "fonts" / "fonts.css")

    stores = load_stores()
    tienda_out = OUT / "tienda"
    tienda_out.mkdir(parents=True, exist_ok=True)
    for store in stores:
        slug = store["slug"]
        src = ROOT / "tienda" / f"{slug}.html"
        if not src.exists():
            print(f"missing page {slug}", file=sys.stderr)
            continue
        rewrite_store_html(src, tienda_out / f"{slug}.html")

    write_index(stores)
    write_readme()

    # Zip for easy share
    zip_base = ROOT / "paquete-sucursales"
    archive = shutil.make_archive(str(zip_base), "zip", root_dir=ROOT, base_dir="paquete-sucursales")
    size = Path(archive).stat().st_size
    print(f"Built {OUT} ({len(stores)} pages)")
    print(f"Zip: {archive} ({size / (1024 * 1024):.1f} MB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
