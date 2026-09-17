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

CSS_V = "20260917b"
STORES_CSS_V = "20260917b"
STORES_JS_V = "20260912h"
POSPAGO_JS_V = "20260912g"  # unused on landings; keep bump for map pages separately
HEADER_JS_V = "20260917a"
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


def parse_hours_rows(hours: str) -> list[dict]:
    """Split store hours string into labeled rows for the floating panel."""
    if not hours:
        return []
    chunks = re.split(r"\s*[·•|]\s*", hours.strip())
    rows = []
    for chunk in chunks:
        chunk = chunk.strip()
        if not chunk:
            continue
        m = re.match(
            r"^(L-V|Lun(?:es)?(?:\s*[–-]\s*Vie(?:rnes)?)?|Sáb(?:ado)?|Sab(?:ado)?|Dom(?:ingo)?)\s+(.+)$",
            chunk,
            re.I,
        )
        if not m:
            rows.append({"label": chunk, "value": "", "days": ""})
            continue
        raw_label, value = m.group(1), m.group(2).strip()
        key = raw_label.lower().replace("á", "a")
        if key.startswith("l"):
            label, days = "Lun – Vie", "1,2,3,4,5"
        elif key.startswith("sab"):
            label, days = "Sábado", "6"
        elif key.startswith("dom"):
            label, days = "Domingo", "0"
        else:
            label, days = raw_label, ""
        rows.append({"label": label, "value": value, "days": days})
    return rows


def build_store_hours_float(store: dict) -> str:
    name = html.escape(store["name"])
    city = html.escape(title_case(store.get("city") or ""))
    hours_raw = store.get("hours") or ""
    hours_attr = html.escape(hours_raw, quote=True)
    rows = parse_hours_rows(hours_raw)
    if not rows:
        return ""

    items = []
    for row in rows:
        label = html.escape(row["label"])
        value = html.escape(row["value"] or "—")
        days = html.escape(row["days"], quote=True)
        items.append(
            f'      <li class="store-hours-float__row" data-days="{days}">'
            f'<span class="store-hours-float__day">{label}</span>'
            f'<span class="store-hours-float__time">{value}</span></li>'
        )
    rows_html = "\n".join(items)

    return f"""  <aside class="store-hours-float is-open" data-store-hours-float data-store-hours="{hours_attr}" aria-label="Horario de {name}">
    <button type="button" class="store-hours-float__toggle" data-hours-toggle aria-expanded="true" aria-controls="store-hours-panel">
      <span class="store-hours-float__clock" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22" focusable="false"><path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10.01 10.01 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8.01 8.01 0 0 1-8 8zm.75-12.5h-1.5v5.25l4.5 2.7.75-1.23-3.75-2.22z"/></svg>
      </span>
      <span class="store-hours-float__toggle-copy">
        <span class="store-hours-float__toggle-label">Horario</span>
        <span class="store-hours-float__badge" data-hours-badge>Hoy</span>
      </span>
    </button>
    <div class="store-hours-float__panel" id="store-hours-panel">
      <p class="store-hours-float__eyebrow">Horario de atención</p>
      <p class="store-hours-float__name">{name}</p>
      <p class="store-hours-float__city">{city}</p>
      <p class="store-hours-float__status" data-hours-status>Consultando horario…</p>
      <ul class="store-hours-float__list">
{rows_html}
      </ul>
    </div>
  </aside>
"""


def build_store_floats(store: dict) -> str:
    name = html.escape(store["name"])
    maps = html.escape(maps_dir_url(store), quote=True)
    fb = facebook_url(store)

    fb_float = ""
    if fb:
        fb_float = f"""    <a class="store-float__btn store-float__btn--fb" href="{html.escape(fb, quote=True)}" target="_blank" rel="noopener" aria-label="Facebook de {name}">
      <span class="store-float__label">Facebook</span>
      <svg class="store-float__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M14 8h2.5V4.5H14c-2.2 0-3.5 1.5-3.5 3.7V10H8v3.5h2.5V20H14v-6.5h2.3L17 10h-3V8.4c0-.5.2-.9.9-.9z"/></svg>
    </a>
"""

    return f"""{build_store_hours_float(store)}  <div class="store-float" aria-label="Accesos de la sucursal">
{fb_float}    <a class="store-float__btn store-float__btn--maps" href="{maps}" target="_blank" rel="noopener" aria-label="Cómo llegar a {name}">
      <span class="store-float__label">Cómo llegar</span>
      <svg class="store-float__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"/></svg>
    </a>
  </div>
"""


def build_hero(store: dict) -> str:
    name = html.escape(store["name"])
    city = html.escape(title_case(store["city"]))
    state = html.escape(title_case(store["state"]))
    address = html.escape(store.get("address") or "")
    image = html.escape(store.get("image") or "assets/images/pdv-fallback.jpg")

    return f"""    <section class="store-banner" id="inicio" aria-label="Sucursal {name}">
      <div class="store-banner__media">
        <img
          class="store-banner__img"
          src="{image}"
          alt="Fachada AT&amp;T {name}"
          width="1600"
          height="900"
          decoding="async"
          fetchpriority="high"
        >
        <div class="store-banner__veil" aria-hidden="true"></div>
        <div class="store-banner__copy">
          <p class="store-banner__eyebrow">Sucursal AT&amp;T · {state}</p>
          <h1 class="store-banner__name">{name}</h1>
          <p class="store-banner__city">{city}</p>
          <p class="store-banner__address">{address}</p>
        </div>
      </div>
    </section>

    <section class="store-video" aria-label="Promoción YAAVS Pospago">
      <div class="store-video__frame">
        <video
          class="hero__video hero__video--desktop store-video__clip"
          src="assets/banners/secuencia-01-4.mp4?v={VIDEO_V}"
          poster="assets/banners/secuencia-01-4-poster.jpg?v={VIDEO_V}"
          muted
          loop
          playsinline
          autoplay
          preload="auto"
          aria-label="Video promoción YAAVS Pospago AT&amp;T"
        ></video>
        <video
          class="hero__video hero__video--mobile store-video__clip"
          src="assets/banners/plan-black-vertical-head.mp4?v={MOBILE_VIDEO_V}"
          poster="assets/banners/plan-black-vertical-head-poster.jpg?v={MOBILE_VIDEO_V}"
          muted
          loop
          playsinline
          autoplay
          preload="auto"
          aria-label="Plan Black — estrena el smartphone que tanto quieres"
        ></video>
      </div>
    </section>
"""


def rewrite_seguros_cta(html_chunk: str, store: dict) -> str:
    """Point seguros banner CTA to WhatsApp for this store."""
    intent = "Hola YAAVS Pospago, quiero cotizar una póliza de seguros"
    href = wa_href(store, intent)
    safe_href = html.escape(href, quote=True)

    def repl_link(match: re.Match) -> str:
        tag = match.group(0)
        tag = re.sub(
            r'href="[^"]*"',
            f'href="{safe_href}"',
            tag,
            count=1,
        )
        if "data-quote-direct" not in tag:
            tag = tag.replace("<a ", '<a data-quote-direct ', 1)
        if 'target="_blank"' not in tag:
            tag = tag.replace("<a ", '<a target="_blank" rel="noopener" ', 1)
        return tag

    html_chunk = re.sub(
        r'<a class="att-banner__link" href="(?:/)?seguro\.html"[^>]*>',
        repl_link,
        html_chunk,
        count=1,
    )
    html_chunk = html_chunk.replace(
        "Ver coberturas de seguros",
        "Cotiza póliza de seguros",
    )
    # Keep alt text aligned if present
    html_chunk = html_chunk.replace(
        "Ver coberturas de seguros",
        "Cotiza póliza de seguros",
    )
    return html_chunk


def simplify_store_footer(footer_html: str) -> str:
    """Keep Aviso Legal only — remove Planes/Quiénes/Blog/Tiendas/Cotizar nav."""
    footer_html = re.sub(
        r'<nav class="site-footer__nav"[^>]*>.*?</nav>\s*',
        "",
        footer_html,
        count=1,
        flags=re.S,
    )
    # Drop the top brand+nav block and divider; leave disclaimer + copyright
    footer_html = re.sub(
        r'<div class="site-footer__top">.*?</div>\s*'
        r'<div class="site-footer__divider"[^>]*>.*?</div>\s*',
        "",
        footer_html,
        count=1,
        flags=re.S,
    )
    return footer_html


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
    shared = rewrite_seguros_cta(shared, store)
    footer = inject_direct_quote(brands_footer, store)
    footer = simplify_store_footer(footer)

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
{build_store_floats(store)}  <script src="js/plans-catalog.js?v={PLANS_JS_V}" defer></script>
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
