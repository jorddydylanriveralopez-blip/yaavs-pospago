# YAAVS Pospago

Landing independiente de **YAAVS Pospago** con identidad AT&T: carrusel tipo [attvip.mx](https://attvip.mx/), planes Premium, promociones, ofertas, tiendas, renovaciones, seguros y cotizador → WhatsApp.

## Abrir local

```bash
cd /Users/LBARRADAS/Documents/yaavs-pospago
python3 -m http.server 5173
```

Luego abre http://localhost:5173

## Personalizar

- Número de WhatsApp del cotizador: `js/main.js` → `WHATSAPP_NUMBER`
- Tiendas: bloque `#tiendas` en `index.html`
- Banners del carrusel: `assets/banners/`

## Origen de requisitos

Indicaciones del audio `20260824_131603.m4a` + brief del usuario (colores AT&T, banner carrusel attvip, página YAAVS independiente). Resumen en `_refs/BRIEF.md`.
