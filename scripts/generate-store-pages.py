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

CSS_V = "20260919c"
BANNER_V = "20260919c"
STORES_CSS_V = "20260917i"
STORES_JS_V = "20260919c"
POSPAGO_JS_V = "20260912g"  # unused on landings; keep bump for map pages separately
HEADER_JS_V = "20260917b"
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
    main_shared = strip_quienes_exit_banner(main_shared)
    return main_shared, brands_footer


def strip_quienes_exit_banner(html_chunk: str) -> str:
    """Store landings must not send visitors away via «Conoce más de nosotros»."""
    stripped = re.sub(
        r"\n?\s*<!-- Banner clickable → ¿Quiénes somos -->\s*"
        r'<section class="att-banner att-banner--quienes"[^>]*>.*?</section>\s*',
        "\n",
        html_chunk,
        count=1,
        flags=re.S,
    )
    stripped = re.sub(
        r'\n?\s*<section class="att-banner att-banner--quienes"[^>]*>.*?</section>\s*',
        "\n",
        stripped,
        count=1,
        flags=re.S,
    )
    if "Conoce más de nosotros" in stripped or "att-banner--quienes" in stripped:
        raise SystemExit("Quiénes somos exit banner still present in store shared HTML")
    return stripped


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


def waze_dir_url(store: dict) -> str:
    lat = store.get("lat")
    lng = store.get("lng")
    if lat is None or lng is None:
        return maps_dir_url(store)
    return f"https://waze.com/ul?ll={lat}%2C{lng}&navigate=yes"


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


# Distinct on-brand accent pairs (cyan/teal/sky/navy/gold — no purple defaults)
STORE_ACCENTS = [
    ("#00c1d4", "#009fdb"),
    ("#22d3ee", "#0284c7"),
    ("#38bdf8", "#0369a1"),
    ("#67e8f9", "#0e7490"),
    ("#2dd4bf", "#0f766e"),
    ("#5eead4", "#115e59"),
    ("#7dd3fc", "#1d4ed8"),
    ("#93c5fd", "#1e40af"),
    ("#fbbf24", "#b45309"),
    ("#f59e0b", "#c2410c"),
    ("#34d399", "#047857"),
    ("#4ade80", "#15803d"),
    ("#fdba74", "#c2410c"),
    ("#f97316", "#9a3412"),
    ("#a5f3fc", "#155e75"),
    ("#86efac", "#166534"),
    ("#fcd34d", "#a16207"),
    ("#7fdbff", "#0077a8"),
    ("#00e5c0", "#008f7a"),
    ("#ffb454", "#d97706"),
    ("#6ee7b7", "#0d9488"),
    ("#60a5fa", "#1e3a8a"),
    ("#fca5a5", "#b91c1c"),
    ("#5eead4", "#0369a1"),
    ("#38bdf8", "#0f766e"),
    ("#fde047", "#ca8a04"),
    ("#2dd4bf", "#1d4ed8"),
    ("#fb923c", "#9a3412"),
    ("#67e8f9", "#164e63"),
    ("#86efac", "#075985"),
    ("#fde68a", "#b45309"),
    ("#7dd3fc", "#0e7490"),
    ("#99f6e4", "#0f766e"),
    ("#fcd34d", "#0369a1"),
]


def store_theme(store: dict, index: int) -> dict:
    accent, accent2 = STORE_ACCENTS[index % len(STORE_ACCENTS)]
    variant = index % 8
    state_slug = re.sub(
        r"[^a-z0-9]+",
        "-",
        (store.get("state") or "mx").lower().replace("é", "e").replace("á", "a").replace("í", "i").replace("ó", "o").replace("ú", "u"),
    ).strip("-")
    return {
        "accent": accent,
        "accent2": accent2,
        "variant": variant,
        "state_slug": state_slug,
        "index": index + 1,
    }


def build_store_hours_float(store: dict) -> str:
    name = html.escape(store["name"])
    city = html.escape(title_case(store.get("city") or ""))
    address = html.escape(store.get("address") or "")
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
    address_html = (
        f'      <p class="store-hours-float__address">{address}</p>\n' if address else ""
    )

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
{address_html}      <p class="store-hours-float__status" data-hours-status>Consultando horario…</p>
      <ul class="store-hours-float__list">
{rows_html}
      </ul>
    </div>
  </aside>
"""


def build_store_floats(store: dict) -> str:
    name = html.escape(store["name"])
    maps = html.escape(maps_dir_url(store), quote=True)
    waze = html.escape(waze_dir_url(store), quote=True)
    fb = facebook_url(store)

    fb_float = ""
    if fb:
        fb_float = f"""    <a class="store-float__btn store-float__btn--fb" href="{html.escape(fb, quote=True)}" target="_blank" rel="noopener" aria-label="Facebook de {name}">
      <span class="store-float__label">Facebook</span>
      <svg class="store-float__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M14 8h2.5V4.5H14c-2.2 0-3.5 1.5-3.5 3.7V10H8v3.5h2.5V20H14v-6.5h2.3L17 10h-3V8.4c0-.5.2-.9.9-.9z"/></svg>
    </a>
"""

    return f"""{build_store_hours_float(store)}  <div class="store-float" aria-label="Accesos de la sucursal">
{fb_float}    <div class="store-float__nav" data-store-nav>
      <button type="button" class="store-float__btn store-float__btn--maps" data-store-nav-toggle aria-expanded="false" aria-haspopup="true" aria-controls="store-nav-menu" aria-label="Cómo llegar a {name}">
        <span class="store-float__label">Cómo llegar</span>
        <svg class="store-float__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"/></svg>
      </button>
      <div class="store-float__nav-menu" id="store-nav-menu" data-store-nav-menu hidden>
        <p class="store-float__nav-title">¿Cómo quieres ir?</p>
        <a class="store-float__nav-opt store-float__nav-opt--gmaps" href="{maps}" target="_blank" rel="noopener">
          <span class="store-float__nav-opt-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" focusable="false"><path fill="currentColor" d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"/></svg>
          </span>
          <span class="store-float__nav-opt-copy">
            <strong>Google Maps</strong>
            <small>Abrir ruta</small>
          </span>
        </a>
        <a class="store-float__nav-opt store-float__nav-opt--waze" href="{waze}" target="_blank" rel="noopener">
          <span class="store-float__nav-opt-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" focusable="false"><path fill="currentColor" d="M12.5 3C7.8 3 4 6.6 4 11.1c0 2.6 1.3 4.9 3.3 6.4l-.8 2.7 3.1-1.6c.9.3 1.9.4 2.9.4 4.7 0 8.5-3.6 8.5-8.1S17.2 3 12.5 3zm-2.7 10.3c-.6 0-1.1-.5-1.1-1.1s.5-1.1 1.1-1.1 1.1.5 1.1 1.1-.5 1.1-1.1 1.1zm2.7 0c-.6 0-1.1-.5-1.1-1.1s.5-1.1 1.1-1.1 1.1.5 1.1 1.1-.5 1.1-1.1 1.1zm2.7 0c-.6 0-1.1-.5-1.1-1.1s.5-1.1 1.1-1.1 1.1.5 1.1 1.1-.5 1.1-1.1 1.1z"/></svg>
          </span>
          <span class="store-float__nav-opt-copy">
            <strong>Waze</strong>
            <small>Abrir navegación</small>
          </span>
        </a>
      </div>
    </div>
  </div>
"""



# Full artwork banners (shown contain / uncropped; text baked into art)
STORE_ARTWORK_BANNERS = {
    "calvillo-independencia": {
        "image": "assets/stores/banners/calvillo-independencia.png?v=20260919c",
        "width": 1920,
        "height": 600,
        "alt": "AT&T Calvillo Independencia · Calvillo — Más que números, personas",
    },
    "convencion-de-1914": {
        "image": "assets/stores/banners/convencion-de-1914.png?v=20260919c",
        "width": 1920,
        "height": 600,
        "alt": "AT&T Convencion De 1914 · Aguascalientes — Más que números, personas",
    },
    "jesus-maria": {
        "image": "assets/stores/banners/jesus-maria.png?v=20260919c",
        "width": 1920,
        "height": 600,
        "alt": "AT&T Jesús María · Jesús María — Más que números, personas",
    },
    "pabellon-de-arteaga": {
        "image": "assets/stores/banners/pabellon-de-arteaga.png?v=20260919c",
        "width": 1920,
        "height": 600,
        "alt": "AT&T Pabellón De Arteaga · Pabellón De Arteaga — Más que números, personas",
    },
    "plaza-haciendas": {
        "image": "assets/stores/banners/plaza-haciendas.png?v=20260919c",
        "width": 1920,
        "height": 600,
        "alt": "AT&T Plaza Haciendas · Aguascalientes — Más que números, personas",
    },
    "plaza-patria": {
        "image": "assets/stores/banners/plaza-patria.png?v=20260919c",
        "width": 1920,
        "height": 600,
        "alt": "AT&T Plaza Patria · Aguascalientes — Más que números, personas",
    },
    "plaza-santa-anita": {
        "image": "assets/stores/banners/plaza-santa-anita.png?v=20260919c",
        "width": 1920,
        "height": 600,
        "alt": "AT&T Plaza Santa Anita · Aguascalientes — Más que números, personas",
    },
    "arqueros": {
        "image": "assets/stores/banners/arqueros.png?v=20260919c",
        "width": 1920,
        "height": 600,
        "alt": "AT&T Arqueros · Aguascalientes — Más que números, personas",
    },
    "leandro-valle-2": {
        "image": "assets/stores/banners/leandro-valle-2.png?v=20260919c",
        "width": 1920,
        "height": 600,
        "alt": "AT&T Leandro Valle 2 · Tula De Allende — Más que números, personas",
    },
    "los-heroes-chalco": {
        "image": "assets/stores/banners/los-heroes-chalco.png?v=20260919c",
        "width": 1920,
        "height": 600,
        "alt": "AT&T Los Héroes Chalco · Chalco — Más que números, personas",
    },
    "nacozari-cruz-roja-tizayuca": {
        "image": "assets/stores/banners/nacozari-cruz-roja-tizayuca.png?v=20260919c",
        "width": 1920,
        "height": 600,
        "alt": "AT&T Nacozari Cruz Roja Tizayuca · Tizayuca — Más que números, personas",
    },
    "plaza-bella": {
        "image": "assets/stores/banners/plaza-bella.png?v=20260919c",
        "width": 1920,
        "height": 600,
        "alt": "AT&T Plaza Bella · Pachuca De Soto — Más que números, personas",
    },
    "plaza-de-la-salud": {
        "image": "assets/stores/banners/plaza-de-la-salud.png?v=20260919c",
        "width": 1920,
        "height": 600,
        "alt": "AT&T Plaza De La Salud · Mérida — Más que números, personas",
    },
    "plaza-ecatepec-ii": {
        "image": "assets/stores/banners/plaza-ecatepec-ii.png?v=20260919c",
        "width": 1920,
        "height": 600,
        "alt": "AT&T Plaza Ecatepec Ii · Ecatepec De Morelos — Más que números, personas",
    },
    "plaza-revo": {
        "image": "assets/stores/banners/plaza-revo.png?v=20260919c",
        "width": 1920,
        "height": 600,
        "alt": "AT&T Plaza Revo · Pachuca De Soto — Más que números, personas",
    },
    "las-fuentes": {
        "image": "assets/stores/banners/las-fuentes.png?v=20260919c",
        "width": 1920,
        "height": 600,
        "alt": "AT&T Las Fuentes · Santiago De Querétaro — Más que números, personas",
    },
    "domingo-arrieta": {
        "image": "assets/stores/banners/domingo-arrieta.png?v=20260919c",
        "width": 1920,
        "height": 600,
        "alt": "AT&T Domingo Arrieta · Victoria De Durango — Más que números, personas",
    },
    "durango-i": {
        "image": "assets/stores/banners/durango-i.png?v=20260919c",
        "width": 1920,
        "height": 600,
        "alt": "AT&T Durango I · Victoria De Durango — Más que números, personas",
    },
    "saltillo-400": {
        "image": "assets/stores/banners/saltillo-400.png?v=20260919c",
        "width": 1920,
        "height": 600,
        "alt": "AT&T Saltillo 400 · Torreón — Más que números, personas",
    },
    "delta": {
        "image": "assets/stores/banners/delta.png?v=20260919c",
        "width": 1920,
        "height": 600,
        "alt": "AT&T Delta · León — Más que números, personas",
    },
    "division-del-norte": {
        "image": "assets/stores/banners/division-del-norte.png?v=20260919c",
        "width": 1920,
        "height": 600,
        "alt": "AT&T División Del Norte · Lagos De Moreno — Más que números, personas",
    },
    "francisco-villa": {
        "image": "assets/stores/banners/francisco-villa.png?v=20260919c",
        "width": 1920,
        "height": 600,
        "alt": "AT&T Francisco Villa · León — Más que números, personas",
    },
    "jalostotitlan-ii": {
        "image": "assets/stores/banners/jalostotitlan-ii.png?v=20260919c",
        "width": 1920,
        "height": 600,
        "alt": "AT&T Jalostotitlán Ii · Jalostotitlán — Más que números, personas",
    },
    "plaza-real": {
        "image": "assets/stores/banners/plaza-real.png?v=20260919c",
        "width": 1920,
        "height": 600,
        "alt": "AT&T Plaza Real · Silao — Más que números, personas",
    },
    "sanabria-panorama": {
        "image": "assets/stores/banners/sanabria-panorama.png?v=20260919c",
        "width": 1920,
        "height": 600,
        "alt": "AT&T Sanabria Panorama · León — Más que números, personas",
    },
    "centro-comercial-el-dorado": {
        "image": "assets/stores/banners/centro-comercial-el-dorado.png?v=20260919c",
        "width": 1920,
        "height": 600,
        "alt": "AT&T Centro Comercial El Dorado · San Luis Potosí — Más que números, personas",
    },
    "ksk-plaza-sendero": {
        "image": "assets/stores/banners/ksk-plaza-sendero.png?v=20260919c",
        "width": 1920,
        "height": 600,
        "alt": "AT&T Ksk Plaza Sendero · San Luis Potosí — Más que números, personas",
    },
    "matehuala-centro-iii": {
        "image": "assets/stores/banners/matehuala-centro-iii.png?v=20260919c",
        "width": 1920,
        "height": 600,
        "alt": "AT&T Matehuala Centro Iii · Matehuala — Más que números, personas",
    },
    "plaza-electro-del-carmen": {
        "image": "assets/stores/banners/plaza-electro-del-carmen.png?v=20260919c",
        "width": 1920,
        "height": 600,
        "alt": "AT&T Plaza Electro Del Carmen · San Luis Potosí — Más que números, personas",
    },
    "plaza-norte": {
        "image": "assets/stores/banners/plaza-norte.png?v=20260919c",
        "width": 1920,
        "height": 600,
        "alt": "AT&T Plaza Norte · Soledad De Graciano Sánchez — Más que números, personas",
    },
    "rio-verde": {
        "image": "assets/stores/banners/rio-verde.png?v=20260919c",
        "width": 1920,
        "height": 600,
        "alt": "AT&T Río Verde · Río Verde — Más que números, personas",
    },
    "walmart-arboledas-ii": {
        "image": "assets/stores/banners/walmart-arboledas-ii.png?v=20260919c",
        "width": 1920,
        "height": 600,
        "alt": "AT&T Walmart Arboledas Ii · Matehuala — Más que números, personas",
    },
    "walmart-munoz": {
        "image": "assets/stores/banners/walmart-munoz.png?v=20260919c",
        "width": 1920,
        "height": 600,
        "alt": "AT&T Walmart Muñoz · San Luis Potosí — Más que números, personas",
    },
}


def build_hero(store: dict, index: int = 0) -> str:
    name = html.escape(store["name"])
    state = html.escape(title_case(store["state"]))
    city = html.escape(title_case(store.get("city") or ""))
    slug = store.get("slug") or ""
    artwork = STORE_ARTWORK_BANNERS.get(slug)
    if not artwork and slug:
        banner_path = ROOT / "assets" / "stores" / "banners" / f"{slug}.png"
        if banner_path.is_file():
            artwork = {
                "image": f"assets/stores/banners/{slug}.png?v={BANNER_V}",
                "width": 1920,
                "height": 600,
                "alt": f"AT&T {store['name']} · {store.get('city') or ''} — Más que números, personas",
            }
    theme = store_theme(store, index)
    style = (
        f"--store-accent:{theme['accent']};"
        f"--store-accent-2:{theme['accent2']};"
        f"--store-theme-i:{theme['index']};"
    )

    if artwork:
        image = html.escape(artwork["image"])
        alt = html.escape(artwork.get("alt") or f"AT&T {store['name']}")
        w = artwork.get("width", 1920)
        h = artwork.get("height", 1080)
        return f"""    <section class="store-banner store-banner--artwork store-banner--s-{theme['state_slug']}" id="inicio" style="{style}" aria-label="Sucursal {name}">
      <div class="store-banner__media">
        <img
          class="store-banner__img"
          src="{image}"
          alt="{alt}"
          width="{w}"
          height="{h}"
          decoding="async"
          fetchpriority="high"
        >
        <h1 class="sr-only">{name}</h1>
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

    image = html.escape(store.get("image") or "assets/images/pdv-fallback.jpg")

    return f"""    <section class="store-banner store-banner--v{theme['variant']} store-banner--s-{theme['state_slug']}" id="inicio" style="{style}" aria-label="Sucursal {name}">
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
        <div class="store-banner__motif" aria-hidden="true"></div>
        <div class="store-banner__copy">
          <p class="store-banner__eyebrow"><span>Sucursal AT&amp;T</span><span class="store-banner__dot" aria-hidden="true"></span><span>{state}</span></p>
          <h1 class="store-banner__name">{name}</h1>
          <span class="store-banner__underline" aria-hidden="true"></span>
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


def build_page(store: dict, header: str, main_shared: str, brands_footer: str, index: int = 0) -> str:
    name = store["name"]
    city = title_case(store["city"])
    state = title_case(store["state"])
    title = f"AT&T {name} · {city} | YAAVS Pospago"
    desc = (
        f"Sucursal AT&T {name} en {city}, {state}. "
        f"Cotiza planes pospago, equipos y promociones con YAAVS. "
        f"{store.get('address') or ''}"
    )
    theme = store_theme(store, index)

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
  <meta name="theme-color" content="{theme['accent2']}">
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
<body class="store-landing store-landing--v{theme['variant']}" data-store-landing data-store-id="{html.escape(store['id'])}" data-store-name="{html.escape(store['name'])}" data-store-city="{html.escape(store['city'])}" data-store-state="{html.escape(store['state'])}" style="--store-accent:{theme['accent']};--store-accent-2:{theme['accent2']};">
  <a class="skip-link" href="#contenido">Saltar al contenido</a>

{header_local}
  <main id="contenido">
{build_hero(store, index)}
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
    for i, store in enumerate(stores):
        slug = store.get("slug")
        if not slug:
            raise SystemExit(f"Store missing slug: {store.get('id')}")
        page = build_page(store, header, main_shared, brands_footer, i)
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
