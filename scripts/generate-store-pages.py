#!/usr/bin/env python3
"""Generate one landing page per AT&T store under tienda/."""

from __future__ import annotations

import html
import json
import re
import sys
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"
STORES_JS = ROOT / "js" / "tiendas-att-stores.js"
OUT_DIR = ROOT / "tienda"

CSS_V = "20260912e"
STORES_CSS_V = "20260912g"
STORES_JS_V = "20260912h"
POSPAGO_JS_V = "20260912g"  # unused on landings; keep bump for map pages separately
HEADER_JS_V = "20260912e"
PLANS_JS_V = "20260908ai"
DEVICE_DEALS_V = "20260901a"
PREMIUM_DEVICES_V = "20260828d"
VIDEO_V = "20260907u"
MOBILE_VIDEO_V = "20260908u"


def load_stores() -> list[dict]:
    text = STORES_JS.read_text(encoding="utf-8")
    m = re.search(r"window\.YAAVS_ATT_STORES\s*=\s*(\[.*\])\s*;", text, re.S)
    if not m:
        raise SystemExit("Could not parse YAAVS_ATT_STORES")
    return json.loads(m.group(1))


def extract_shared(index_html: str) -> tuple[str, str]:
    """Return (main_shared_html, brands_footer_html) from index.html."""
    intro = index_html.find('    <!-- INTRO brand strip -->')
    tiendas = index_html.find('    <!-- TIENDAS / SUCURSALES AT&T -->')
    brands = index_html.find('  <!-- MARCAS DESTACADAS -->')
    scripts = index_html.find('  <script src="https://unpkg.com/leaflet')
    if min(intro, tiendas, brands, scripts) < 0:
        raise SystemExit("Failed to locate shared sections in index.html")

    # intro → just before tiendas (includes devices, plans, seguros, renew)
    main_shared = index_html[intro:tiendas].rstrip() + "\n"
    # brands + footer (skip blog which sits between tiendas and brands, outside main close)
    brands_footer = index_html[brands:scripts].rstrip() + "\n"
    return main_shared, brands_footer


def extract_header(index_html: str) -> str:
    start = index_html.find('  <header class="site-header"')
    end = index_html.find("  <main id=\"contenido\">")
    if start < 0 or end < 0:
        raise SystemExit("Failed to locate header in index.html")
    header = index_html[start:end]
    # Brand + Tiendas links point home from store pages
    header = header.replace('href="#inicio"', 'href="/"')
    header = header.replace('href="#tiendas"', 'href="/#tiendas"')
    return header


def title_case(value: str) -> str:
    return re.sub(r"(^|[\s([])\S", lambda m: m.group(0).upper(), (value or "").lower())


def wa_message(store: dict, intent: str | None = None) -> str:
    base = intent or "Hola YAAVS Pospago, quiero cotizar un plan AT&T"
    return (
        f"{base}\n"
        f"Sucursal: {store['name']}\n"
        f"Ciudad: {store['city']}\n"
        f"Estado: {store['state']}"
    )


def wa_href(store: dict, intent: str | None = None) -> str:
    return f"https://wa.me/525522331210?text={quote(wa_message(store, intent))}"


def maps_dir_url(store: dict) -> str:
    link = (store.get("mapsLink") or "").strip()
    if link:
        return link
    return (
        "https://www.google.com/maps/dir/?api=1"
        f"&destination={store['lat']},{store['lng']}"
    )


def facebook_url(store: dict) -> str | None:
    raw = str(store.get("facebook") or "").strip()
    if not raw:
        return None
    if raw.startswith("http"):
        return raw
    return f"https://www.facebook.com/{raw.lstrip('/')}"


def inject_direct_quote(html_chunk: str, store: dict) -> str:
    """Mark central WA links as direct (skip location picker) and name the store."""

    def repl(match: re.Match) -> str:
        tag = match.group(0)
        href_m = re.search(r'href="(https://wa\.me/525522331210\?text=[^"]*)"', tag)
        intent = None
        if href_m:
            from urllib.parse import unquote, urlparse, parse_qs

            parsed = urlparse(href_m.group(1).replace("&amp;", "&"))
            qs = parse_qs(parsed.query)
            raw = (qs.get("text") or [""])[0]
            intent = unquote(raw).strip() or None
            # Drop any prior Sucursal lines if regenerating
            if intent:
                intent = re.split(r"\nSucursal:", intent, maxsplit=1)[0].strip()
        new_href = wa_href(store, intent)
        tag = re.sub(
            r'href="https://wa\.me/525522331210\?text=[^"]*"',
            f'href="{html.escape(new_href, quote=True)}"',
            tag,
            count=1,
        )
        if "data-quote-direct" not in tag:
            tag = tag.replace("<a ", '<a data-quote-direct ', 1)
        return tag

    return re.sub(
        r'<a\b[^>]*href="https://wa\.me/525522331210\?text=[^"]*"[^>]*>',
        repl,
        html_chunk,
    )


def build_hero(store: dict) -> str:
    name = html.escape(store["name"])
    city = html.escape(title_case(store["city"]))
    state = html.escape(title_case(store["state"]))
    address = html.escape(store.get("address") or "")
    hours = html.escape(store.get("hours") or "")
    image = html.escape(store.get("image") or "assets/images/pdv-fallback.jpg")
    wa = html.escape(wa_href(store), quote=True)
    maps = html.escape(maps_dir_url(store), quote=True)
    fb = facebook_url(store)

    fb_btn = ""
    if fb:
        fb_btn = (
            f'        <a class="store-hero__fb" href="{html.escape(fb, quote=True)}" '
            f'target="_blank" rel="noopener">Facebook</a>\n'
        )

    hours_html = (
        f'      <p class="store-hero__hours">{hours}</p>\n' if hours else ""
    )

    return f"""    <section class="store-hero" id="inicio" aria-label="Sucursal {name}">
      <div class="store-hero__wrap">
        <div class="store-hero__media">
          <div class="store-hero__shot">
            <img src="{image}" alt="Fachada AT&amp;T {name}" width="960" height="720" decoding="async" fetchpriority="high">
          </div>
          <div class="store-hero__video-frame">
            <video
              class="hero__video hero__video--desktop"
              src="assets/banners/secuencia-01-4.mp4?v={VIDEO_V}"
              poster="assets/banners/secuencia-01-4-poster.jpg?v={VIDEO_V}"
              muted
              loop
              playsinline
              autoplay
              preload="metadata"
              aria-label="Video promoción YAAVS Pospago AT&amp;T"
            ></video>
            <video
              class="hero__video hero__video--mobile"
              src="assets/banners/plan-black-vertical-head.mp4?v={MOBILE_VIDEO_V}"
              poster="assets/banners/plan-black-vertical-head-poster.jpg?v={MOBILE_VIDEO_V}"
              muted
              loop
              playsinline
              autoplay
              preload="none"
              aria-label="Plan Black — estrena el smartphone que tanto quieres"
            ></video>
          </div>
        </div>
        <div class="store-hero__meta">
          <p class="store-hero__eyebrow">Sucursal AT&amp;T · {state}</p>
          <h1 class="store-hero__name">{name}</h1>
          <p class="store-hero__city">{city}</p>
          <p class="store-hero__address">{address}</p>
{hours_html}          <div class="store-hero__actions">
            <a class="store-hero__wa" data-quote-direct href="{wa}" target="_blank" rel="noopener">Cotizar esta sucursal</a>
            <a href="{maps}" target="_blank" rel="noopener">Cómo llegar</a>
{fb_btn}          </div>
        </div>
      </div>
    </section>
"""


def build_page(store: dict, header: str, main_shared: str, brands_footer: str) -> str:
    name = store["name"]
    city = title_case(store["city"])
    state = title_case(store["state"])
    title = f"AT&T {name} · {city} | YAAVS Pospago"
    desc = (
        f"Sucursal AT&T {name} en {city}, {state}. "
        f"Cotiza planes pospago, equipos y promociones con YAAVS. "
        f"{store.get('address') or ''}"
    )

    header_local = inject_direct_quote(header, store)
    shared = inject_direct_quote(main_shared, store)
    footer = inject_direct_quote(brands_footer, store)
    footer = footer.replace('href="#tiendas"', 'href="/#tiendas"')
    footer = footer.replace('href="#planes"', 'href="#planes"')

    return f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=5">
  <meta name="theme-color" content="#009FDB">
  <meta name="description" content="{html.escape(desc)}">
  <meta property="og:title" content="{html.escape(title)}">
  <meta property="og:description" content="{html.escape(desc)}">
  <meta property="og:type" content="website">
  <meta property="og:image" content="{html.escape(store.get('image') or '')}">
  <title>{html.escape(title)}</title>
  <base href="/">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Sora:wght@600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/styles.css?v={CSS_V}">
  <link rel="icon" href="assets/images/favicon.svg?v=20260907ay" type="image/svg+xml">
  <link rel="icon" href="assets/images/favicon-32.png?v=20260907ay" type="image/png" sizes="32x32">
  <link rel="apple-touch-icon" href="assets/images/favicon-180.png?v=20260907ay" sizes="180x180">
</head>
<body class="store-landing" data-store-landing data-store-id="{html.escape(store['id'])}" data-store-name="{html.escape(store['name'])}" data-store-city="{html.escape(store['city'])}" data-store-state="{html.escape(store['state'])}">
  <a class="skip-link" href="#contenido">Saltar al contenido</a>

{header_local}
  <main id="contenido">
{build_hero(store)}
{shared}  </main>

{footer}
  <script src="js/plans-catalog.js?v={PLANS_JS_V}" defer></script>
  <script src="js/device-deals.js?v={DEVICE_DEALS_V}" defer></script>
  <script src="js/premium-devices.js?v={PREMIUM_DEVICES_V}" defer></script>
  <script src="js/tiendas-att-stores.js?v={STORES_JS_V}" defer></script>
  <script src="js/header.js?v={HEADER_JS_V}" defer></script>
</body>
</html>
"""


def main() -> int:
    index_html = INDEX.read_text(encoding="utf-8")
    header = extract_header(index_html)
    main_shared, brands_footer = extract_shared(index_html)
    stores = load_stores()
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    written = []
    for store in stores:
        slug = store.get("slug")
        if not slug:
            raise SystemExit(f"Store missing slug: {store.get('id')}")
        page = build_page(store, header, main_shared, brands_footer)
        out = OUT_DIR / f"{slug}.html"
        out.write_text(page, encoding="utf-8")
        written.append(out.relative_to(ROOT).as_posix())

    print(f"Generated {len(written)} pages in {OUT_DIR.relative_to(ROOT)}/")
    for path in written[:3]:
        print(" ", path)
    if len(written) > 3:
        print(f"  … and {len(written) - 3} more")
    return 0


if __name__ == "__main__":
    sys.exit(main())
