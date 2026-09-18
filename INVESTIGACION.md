# Investigación — yaavs-pospago

Informe de onboarding para retomar el trabajo. Fecha de revisión: **18 sep 2026**. Rama analizada: `main` (`f6c1cf2`). No se tocó código de producto.

---

## Resumen ejecutivo (2–3 minutos)

**Qué es.** Sitio web comercial de **YAAVS Pospago**, distribuidor autorizado AT&T. No es un POS, CRM ni backend de activaciones: es una landing independiente del Site Builder de YAAVS (prepago) para atraer tráfico a tiendas y cerrar por WhatsApp.

**Cómo se gana dinero (en el sitio).** El visitante ve planes Premium / Lite / Simple Plus, equipos con enganche 50 %, seguros y sucursales; casi todos los CTA abren `wa.me` hacia un número central o al WhatsApp del gerente de tienda.

**Stack.** HTML + CSS + JS vanilla. Sin `package.json`, sin framework, sin base de datos, sin autenticación. Mapa con Leaflet (CDN). Hosting en **Hostinger** (`yaavs-pospago.hostingersite.com`) y también se sirve en **Vercel** (`yaavs-pospago.vercel.app`).

**Madurez.** Visualmente avanzado (~206 commits, 25 ago–11 sep 2026). El brief original (audio + `_refs/BRIEF.md`) ya está cubierto en UI. Lo urgente no es “hacer la página”, sino **operación y limpieza**:

| Prioridad | Hallazgo | Por qué importa |
|-----------|----------|-----------------|
| Alta | GitHub Actions *Deploy to Hostinger* falla con `FTP 530 Login incorrect` | Los `push` a `main` **no publican**. El sitio vivo se actualiza por otro canal (script local / panel). |
| Alta | PR draft abierto: *33 landings por sucursal* (`cursor/cloud-agent-1789235298187-uht5t`) | Trabajo grande **fuera de `main`**. Hay que decidir merge, recorte o descarte. |
| Media | Formulario de precotización ya no existe en el HTML; el JS todavía lo busca | El brief pedía precotización → WhatsApp. Hoy el flujo es CTA directo a WhatsApp. |
| Media | Catálogo de equipos duplicado (HTML + `device-deals.js` + `devices.json`) | Riesgo de precios desfasados. |
| Media | Sin analytics / medición de leads | El audio de requisitos insiste en saber cuántos leads genera el web. |
| Baja | Archivos muertos (`js/yaavs.js`, CSS duplicados, `test-*.html`) | Ruido al retomar y riesgo de editar el archivo equivocado. |

**Cómo correrlo ya:** `python3 -m http.server 5173` y abrir `http://localhost:5173`. No hay variables de entorno para desarrollo local.

---

## 1. Propósito de negocio / producto

YAAVS opera como **distribuidor autorizado AT&T**. Este repo es la cara pública de **pospago** (no prepago):

- Identidad **AT&T** (azul/cian), no morado YAAVS.
- Objetivo: llevar gente a sucursales y generar conversaciones de venta (línea nueva, portabilidad, renovación, equipo, seguro).
- Referencia visual pedida: [attvip.mx](https://attvip.mx/).
- Nace de un audio (~61 min, transcripción en `_refs/`) + brief: planes, promociones, ofertas, tiendas, renovaciones, seguros y cotizar.

El eslogan del sitio: *“Más que números, personas.”*

**Fuera de alcance de este repo:** login, Salesforce, activación de líneas, pagos, CRM, jobs programados, APIs de AT&T.

---

## 2. Stack técnico

| Capa | Tecnología |
|------|------------|
| Front | HTML5 estático, CSS (~10.5k líneas en `css/styles.css`), JS IIFE sin bundler |
| Fuentes | Google Fonts: Outfit + Sora |
| Mapa | Leaflet 1.9.4 desde `unpkg.com` (CSS + JS) |
| Datos | Catálogos embebidos en JS + `assets/data/devices.json` |
| Contenido de precios | Excel `_refs/PLANTILLA PRECIOS 1 sept.xlsx` → script Python |
| Hosting prod | Hostinger (`hpanel` / `hcdn`), `.htaccess` desactiva cache de HTML |
| Hosting espejo | Vercel (homepage del repo en GitHub apunta aquí) |
| CI | `.github/workflows/deploy.yml` → FTP (`SamKirkland/FTP-Deploy-Action`) **roto** |
| Deploy manual | `scripts/deploy-hostinger.sh` (API Hostinger + TUS upload) |
| Extra | `scripts/extract_devices.py` (depende de `openpyxl`) |

**No hay:** Node, React, backend, auth, Netlify Functions, tests automatizados, linter, sitemap, robots.txt, GTM/GA.

**Secretos (nombres, no valores):** GitHub Actions usa `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`. El script local usa `HOSTINGER_API_TOKEN` o archivo `.hostinger-token` (gitignored). El número de WhatsApp de cotización está hardcodeado en JS/HTML (es un dato de negocio público, no un secreto de infra).

---

## 3. Estructura de carpetas y módulos

```
index.html              Home (hero, equipos, planes, seguros banner, renovaciones, tiendas, blog, marcas)
premium.html            Familia Premium (Azul → Titanio)
lite.html               Familia Lite (equipo propio)
simple.html             Familia Simple Plus
equipos.html            Catálogo promo 50 % enganche
seguro.html             Coberturas y primas
quienes-somos.html      Marca / pilares
blogs.html + blog/      3 artículos (Honor X5D, Galaxy A37, Redmi Note 17)
planes.html             Redirect a premium.html

js/header.js            Runtime principal (nav, video, carruseles, WA flotante, cookies, quote muerto)
js/plans-catalog.js     Catálogo AT&T + tabs + carrusel de tarjetas + picker de apps
js/pospago-stores.js    UI mapa/lista/búsqueda/geo
js/tiendas-att-stores.js Directorio de 33 PDV (datos)
js/device-deals.js      Cards de equipos en equipos.html
js/premium-devices.js   Modal “elige smartphone” (catálogo genérico, fotos en assets/phones/)
js/main.js              Copia antigua; igual a js/yaavs.js
css/styles.css          Hoja viva
css/stores.css          Estilos del mapa de tiendas
css/styles-v2.css, yaavs.css, fresh-*.css   Copias viejas (no enlazadas en páginas reales)

assets/banners/         Videos/imagenes hero
assets/images/          Logos, banners AT&T, smartphones, blog, about
assets/data/devices.json Precios normalizados del Excel
_refs/                  Brief, transcripción, Excel, promos internas AT&T
scripts/                Deploy Hostinger + extract_devices.py
.github/workflows/      Deploy FTP
```

**Páginas de prueba (no son producto):** `test-dropdown.html`, `demo-carrusel.html`, `test-deploy.txt`.

---

## 4. Flujos principales

No hay autenticación ni jobs. Todo corre en el navegador.

### 4.1 Navegación / UI

`js/header.js` monta menú hamburguesa, dropdown de Planes, video hero (desktop landscape + móvil vertical Plan Black), botón flotante de WhatsApp, aviso de cookies (`localStorage`), prefetch de páginas internas.

### 4.2 Planes pospago

`js/plans-catalog.js` pinta tres familias:

| Familia | Planes | Notas |
|---------|--------|--------|
| Premium | Azul* … Titanio | Toggle **Línea nueva / Portabilidad** (hasta 20 % menos; Titanio 10 %) |
| Lite | Lite … Lite 5 | Equipo propio; portabilidad con descuento |
| Simple Plus | 299 / 399 / 599 / 649 | Doble de GB; RRSS ilimitadas fijas; **sin** precio de portabilidad |

En Premium/Lite el usuario puede elegir N apps (3 o 6). Simple Plus muestra iconos fijos.

Las tarjetas **ya no tienen botón Cotizar**; el CTA de la sección es un WhatsApp genérico. `premium-devices.js` sigue interceptando clicks en tarjetas Premium para abrir un modal de equipos de referencia (iPhone 16, A55, etc.), distinto del catálogo promo de septiembre.

### 4.3 Cotización → WhatsApp

Flujo **actual en `main`:**

1. CTA header / flotante / planes / equipos / seguros / renovaciones.
2. Abre `https://wa.me/<número>?text=...` en una pestaña nueva.
3. Un humano (o el gerente de tienda) continúa.

Flujo **diseñado y abandonado en HTML:**

- `initQuote()` en `header.js` busca `[data-quote-form]`.
- Ese formulario **no está** en ninguna página de producción.
- El brief pedía precotización (plan + equipo + seguro + ciudad) y luego WhatsApp.

En `equipos.html` se cargan `device-deals.js` + `header.js` + `main.js` (este último duplica parte de header).

### 4.4 Equipos / promociones

- Home: carrusel “AT&T Market” hardcodeado en `index.html` (12 equipos). `header.js` intenta refrescar precios con `fetch('assets/data/devices.json')`.
- `equipos.html`: grid generado por `js/device-deals.js` (mismos modelos, enganche 50 %, mensualidad renovación vs portabilidad −20 %).
- Fuente original: Excel de 1 sep. Regenerar: `pip3 install openpyxl && python3 scripts/extract_devices.py` (el script actual es genérico; el JSON vivo está más enriquecido que lo que el script escribe hoy).

### 4.5 Tiendas

33 sucursales AT&T YAAVS en `js/tiendas-att-stores.js` (nombre, ciudad, dirección, lat/lng, horario, gerente, teléfono).

UI (`js/pospago-stores.js`):

- Búsqueda por ciudad/colonia/nombre (tokens al inicio de palabra; último fix en `main`).
- Mapa Leaflet.
- “Qué sucursal tengo cerca” (geolocalización del navegador).
- CTA **Cómo llegar** (Google Maps) y **Contactar sucursal** (WhatsApp del gerente; fallback al número central).

### 4.6 Seguros, renovaciones, blog, quiénes somos

Páginas estáticas + CTA WhatsApp. Seguros incluye tabla de primas por valor del equipo. Blog: 3 piezas SEO. No hay CMS.

### 4.7 Trabajo no mergeado (PR #1, draft)

Rama `cursor/cloud-agent-1789235298187-uht5t`:

- 33 landings `tienda/{slug}.html`.
- Picker estado → sucursal antes de abrir WhatsApp central.
- Fotos de fachada, links de Facebook, horarios flotantes, Maps/Waze.
- Generador `scripts/generate-store-pages.py`.

**No está en `main`.** Es el siguiente bloque de producto más grande.

---

## 5. Cómo correrlo en local

No hay build. Cualquier servidor estático sirve:

```bash
cd /ruta/a/yaavs-pospago
python3 -m http.server 5173
# http://localhost:5173
```

Las páginas usan `<base href="/">`. Con el server en la raíz del repo, las rutas (`/premium.html`, `/css/styles.css`) funcionan. Abrir un HTML con `file://` rompe assets.

**Env vars**

| Contexto | Variable | Uso |
|----------|----------|-----|
| Local | ninguna | — |
| CI | `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD` | Deploy GitHub → Hostinger (**login incorrecto hoy**) |
| Script `scripts/deploy-hostinger.sh` | `HOSTINGER_API_TOKEN` o archivo `.hostinger-token` | Upload vía API Hostinger |
| Opcional del script | `HOSTINGER_DOMAIN`, `HOSTINGER_USER`, `HOSTINGER_TOKEN_FILE` | Override de dominio/usuario |

Cache-busting: query `?v=20260908…` en CSS/JS. Tras un cambio hay que **subir el bump** o el CDN/navegador puede servir el archivo viejo. `.htaccess` ya pone `no-cache` en HTML.

Personalización documentada en `README.md`: WhatsApp en `js/header.js` (`WHATSAPP_NUMBER`); banners en `assets/banners/`.

---

## 6. Estado aparente, deuda y riesgos

**Madurez de producto:** landing lista para mostrar; iteración fuerte en móvil, carruseles y copy. 206 commits en ~2.5 semanas.

**Huecos vs brief**

- Precotización formal: código huérfano, UI ausente.
- “Ofertas tropicalizadas para fuerza de ventas”: hay equipos y banners, no un kit descargable de flyers.
- Medición de leads: no hay analytics.

**Deuda técnica**

- `js/main.js` ≡ `js/yaavs.js`; `header.js` es la versión viva. `equipos.html` carga main + header.
- Tres CSS clonados de ~85 kB; `styles.css` (~228 kB) es el real.
- Header/nav copiado a mano en cada HTML (fácil que se desincronicen; `seguro.html` ya tiene un nav más simple).
- Versiones de cache `?v=` distintas entre páginas (`20260908am` vs `ai` vs `w`).
- `premium-devices.js` usa modelos genéricos (iPhone 16 / A55) distintos del catálogo iPhone 17 / S26.
- En `index.html`, el bloque de marcas dice llevar equipo **“sin financiamiento ni cuotas fijas”**, contradictorio con el enganche 50 % / 24 meses. Riesgo comercial/legal.
- `_refs/promos-pospago.txt` cita vigencias AT&T al **31 mar / 30 jun 2026**. Hoy es sep 2026: hay que validar qué promo sigue vigente antes de seguir publicándola.
- Teléfonos y nombres de gerentes van en JS público (esperado para WhatsApp de sucursal; hay que tratarlo como PII).
- `_refs/` incluye material interno AT&T (“uso interno”). No debería ir a producción; el script de deploy ya lo excluye, el workflow FTP **no**.
- FTP sin cifrado (`protocol: ftp`). Aunque el login esté roto, el diseño es inseguro.
- Sin tests. Regresiones se cazan a mano (historial reciente: swipe de planes, búsqueda de tiendas, badges móviles).

**Deploy**

- Últimos runs de Actions: fallo `530 Login incorrect`.
- Hostinger responde 200 (HTML last-modified 17 sep 2026).
- Vercel sirve el `index.html` de `main` (tamaño idéntico al repo).
- Dos destinos = riesgo de **drift** (Hostinger ≠ GitHub ≠ Vercel).

---

## 7. Siguentes pasos recomendados

Orden sugerido si hay que retomar con poco tiempo:

1. **Arreglar publicación.** Renovar credenciales FTP (o pasar CI al script/API Hostinger / SFTP). Confirmar **una** fuente de verdad (Git `main` → un solo host). Mientras Actions falle, no asumir que un merge ya está en el aire.
2. **Decidir el PR #1 (landings por sucursal).** Revisar en staging, recortar HTML duplicado (33 × ~700 líneas) y mergear o cerrar. Es el trabajo más grande pendiente.
3. **Alinear cotización con el brief.** O se restaura el formulario de precotización, o se documenta que el flujo oficial es WhatsApp directo (y se borra `initQuote` muerto). El picker de sucursal del PR #1 encaja mejor con “lead geolocalizado”.
4. **Una sola fuente de equipos.** Elegir `devices.json` (o el Excel) como maestro y generar home + `equipos.html` desde ahí. Evitar tres listas.
5. **Revisión comercial de vigencias** (planes, −20 % portabilidad, Titanio, seguros) contra la oferta AT&T vigente post-junio 2026. Corregir el copy de “sin financiamiento”.
6. **Medición.** GTM o pixel mínimo en CTA `wa.me` (el pedido de negocio era claridad de leads).
7. **Limpieza.** Quitar duplicados JS/CSS, `test-*.html` del deploy, y no subir `_refs/` por FTP.
8. **No urgente pero útil:** extraer header/footer a un include (hoy no hay build; un script Python al estilo del generador de tiendas bastaría).

---

## Mapa mental para retomar código

| Quiero cambiar… | Archivo |
|-----------------|--------|
| Precios/GB de un plan | `js/plans-catalog.js` (`CATALOG`) |
| Look de tarjetas / home | `css/styles.css` + `index.html` |
| Lista de sucursales | `js/tiendas-att-stores.js` |
| Comportamiento del mapa | `js/pospago-stores.js` |
| WhatsApp central, menú, video, cookies | `js/header.js` |
| Equipos de `equipos.html` | `js/device-deals.js` |
| Precios overlay del carrusel home | `assets/data/devices.json` |
| Deploy automático | `.github/workflows/deploy.yml` + secrets GitHub |
| Requisitos originales | `_refs/BRIEF.md` (audio resumido) |

Páginas vivas a verificar juntas si tocas header, CTA o catálogo: `index`, `premium`, `lite`, `simple`, `equipos`, `seguro`, `quienes-somos`, `blogs` + 3 posts.
