/**
 * Tiendas en la página pospago: sucursales AT&T integradas.
 */
(function () {
  const root = document.querySelector("[data-pospago-stores]");
  if (!root) return;

  const carriers = {
    att: {
      id: "att",
      name: "AT&T",
      title: "Sucursales AT&T",
    },
  };

  const DEFAULT_PDV_IMAGE = "assets/rotulaciones/dili-01.jpg";
  const stage = root.querySelector("[data-store-stage]");
  const listEl = root.querySelector("[data-store-list]");
  const mapHost = root.querySelector("[data-store-map]");
  const queryEl = root.querySelector("[data-store-q]");
  const statusEl = root.querySelector("[data-store-status]");
  const titleEl = root.querySelector("[data-store-title]");
  const countEl = root.querySelector("[data-store-count]");
  const contactEl = null;
  const contactNameEl = null;
  const contactManagerEl = null;
  const contactWaEl = null;
  let map = null;
  let markers = [];
  let activeId = "";
  let pinnedId = "";
  let carrierId = "";
  let activePopup = null;
  let mapReady = false;
  const MOBILE_LIST_MQ = window.matchMedia("(max-width: 860px)");
  const MOBILE_INITIAL = 5;
  const MOBILE_STEP = 3;
  let visibleCount = MOBILE_INITIAL;
  const FALLBACK_WA = "525522331210";

  function isMobileList() {
    return MOBILE_LIST_MQ.matches;
  }

  function resetVisibleCount() {
    visibleCount = MOBILE_INITIAL;
  }

  function storesFor() {
    return window.YAAVS_ATT_STORES || [];
  }

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text || "";
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function storeStatusLabel(store) {
    const name = store.name || "";
    const city = (store.city || "").trim();
    if (city && city.toUpperCase() !== name.toUpperCase()) {
      return `${name} · ${city}`;
    }
    const stateMatch = (store.address || "").match(/,\s*([A-ZÁÉÍÓÚÑ\s]+)\s*$/i);
    if (stateMatch) return `${name} · ${stateMatch[1].trim()}`;
    return name;
  }

  function mapsDirUrl(store) {
    return `https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}&travelmode=driving`;
  }

  function waUrl(store) {
    const phone = String(store.managerPhone || FALLBACK_WA).replace(/\D/g, "");
    const msg = encodeURIComponent(
      `Hola, vi la sucursal ${store.name} en YAAVS Pospago y quiero información de planes AT&T.`
    );
    return `https://wa.me/${phone}?text=${msg}`;
  }

  function updateContactPanel() {
    /* contact lives on each card next to Cómo llegar */
  }

  function scrollActiveCardIntoView() {
    if (!listEl || !activeId) return;
    const card = listEl.querySelector(`[data-store-id="${activeId}"]`);
    if (!card) return;
    card.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  const WA_ICON = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`;
  const FB_ICON = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.89v2.26h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07z"/></svg>`;

  function facebookUrl(store) {
    const raw = String(store.facebook || "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    return `https://www.facebook.com/${raw.replace(/^\/+/, "")}`;
  }
  function storeThumbSrc(store) {
    return store.image || store.photo || DEFAULT_PDV_IMAGE;
  }

  function storeThumbHtml(store) {
    const name = escapeHtml(store.name);
    const src = escapeHtml(storeThumbSrc(store));
    return `<div class="pospago-stores__map-pop"><img src="${src}" alt="Punto de venta ${name}" width="132" height="84" loading="lazy" decoding="async"><span>${name}</span></div>`;
  }

  function showMapPopup(store) {
    if (!map || !store || typeof window.L === "undefined") return;

    if (activePopup) {
      map.closePopup(activePopup);
      activePopup = null;
    }

    activePopup = window.L.popup({
      className: "pospago-stores__leaflet-pop",
      offset: [22, -12],
      closeButton: true,
      maxWidth: 152,
      minWidth: 132,
      autoPan: true,
      autoPanPadding: [28, 28],
    })
      .setLatLng([store.lat, store.lng])
      .setContent(storeThumbHtml(store))
      .openOn(map);
  }

  function foldText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function storeMatchesQuery(store, queryRaw) {
    const q = foldText(queryRaw).trim();
    if (!q) return true;
    const hay = foldText(`${store.name} ${store.city} ${store.address}`);
    const tokens = q.split(/\s+/).filter(Boolean);
    // Match at word start so "quer" hits Querétaro, not ARQUEROS.
    return tokens.every((token) => {
      const re = new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(token)}`);
      return re.test(hay);
    });
  }

  function filteredStores() {
    const all = storesFor();
    const q = (queryEl?.value || "").trim();
    let list = q ? all.filter((s) => storeMatchesQuery(s, q)) : all.slice();
    if (pinnedId) {
      const pin = list.find((s) => s.id === pinnedId);
      if (pin) list = [pin, ...list.filter((s) => s.id !== pinnedId)];
    }
    return list;
  }

  function renderList() {
    const list = filteredStores();
    if (countEl) countEl.textContent = `${list.length} sucursal${list.length === 1 ? "" : "es"}`;
    if (!listEl) return;
    if (!list.length) {
      listEl.innerHTML = `<p class="pospago-stores__empty">No hay sucursales con esa búsqueda.</p>`;
      return;
    }

    const mobile = isMobileList();
    if (!mobile) visibleCount = list.length;
    else if (visibleCount < MOBILE_INITIAL) visibleCount = MOBILE_INITIAL;

    const shown = mobile ? list.slice(0, Math.min(visibleCount, list.length)) : list;
    const remaining = mobile ? Math.max(0, list.length - shown.length) : 0;
    const nextBatch = Math.min(MOBILE_STEP, remaining);

    listEl.innerHTML =
      shown
        .map((store, i) => {
          const on = store.id === activeId ? " is-active" : "";
          const nearest = store.id === pinnedId ? `<span class="pospago-stores__badge">Más cercana</span>` : "";
          return `<article class="pospago-stores__card${on}" data-store-id="${store.id}" style="--i:${i}">
          <button type="button" class="pospago-stores__card-main" data-store-focus="${store.id}">
            ${nearest}
            <span class="pospago-stores__card-media">
              <img src="${escapeHtml(storeThumbSrc(store))}" alt="Fachada ${escapeHtml(store.name)}" width="640" height="360" loading="lazy" decoding="async">
            </span>
            <span class="pospago-stores__card-name">${store.name}</span>
            <span class="pospago-stores__card-city">${store.city}</span>
            <span class="pospago-stores__card-address">${store.address}</span>
            ${store.hours ? `<span class="pospago-stores__card-hours">${store.hours}</span>` : ""}
          </button>
          <div class="pospago-stores__card-actions">
            <a class="pospago-stores__go" href="${mapsDirUrl(store)}" target="_blank" rel="noopener noreferrer">Cómo llegar</a>
            <a class="pospago-stores__wa-btn" href="${waUrl(store)}" target="_blank" rel="noopener noreferrer" aria-label="Contactar sucursal ${escapeHtml(store.name)} por WhatsApp">
              ${WA_ICON}
              <span>Contactar sucursal</span>
            </a>
            ${
              facebookUrl(store)
                ? `<a class="pospago-stores__fb-btn" href="${escapeHtml(facebookUrl(store))}" target="_blank" rel="noopener noreferrer" aria-label="Facebook de ${escapeHtml(store.name)}">
              ${FB_ICON}
              <span>Facebook</span>
            </a>`
                : ""
            }
          </div>
        </article>`;
        })
        .join("") +
      (remaining > 0
        ? `<button type="button" class="pospago-stores__more" data-store-more>
            Ver más <span aria-hidden="true">(+${nextBatch})</span>
          </button>`
        : "");
  }

  function markerIcon(active) {
    return window.L.divIcon({
      className: "pospago-stores__pin" + (active ? " is-active" : ""),
      html: `<span style="background:#00c1d4"></span>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });
  }

  function refreshMapSize() {
    if (!map) return;
    map.invalidateSize({ pan: false });
    const list = filteredStores();
    if (!list.length) return;
    const bounds = list.map((store) => [store.lat, store.lng]);
    map.fitBounds(bounds, { padding: [28, 28], maxZoom: 12 });
  }

  function focusStore(store, pan) {
    if (!store) return;
    activeId = store.id;
    if (isMobileList()) {
      const idx = filteredStores().findIndex((s) => s.id === store.id);
      if (idx >= 0 && idx + 1 > visibleCount) {
        visibleCount = idx + 1;
      }
    }
    renderList();
    window.requestAnimationFrame(scrollActiveCardIntoView);
    markers.forEach((item) => {
      item.marker.setIcon(markerIcon(item.store.id === store.id));
    });
    if (pan !== false && map) {
      map.setView([store.lat, store.lng], Math.max(map.getZoom(), 14), { animate: true });
    }
    setStatus(storeStatusLabel(store));
    window.setTimeout(() => showMapPopup(store), 80);
  }

  function drawMap() {
    if (!mapHost || typeof window.L === "undefined") {
      setStatus("Cargando mapa…");
      return;
    }

    const list = filteredStores();
    if (!list.length) {
      setStatus("No se encontraron sucursales AT&T.");
      if (map) {
        if (activePopup) {
          map.closePopup(activePopup);
          activePopup = null;
        }
        markers.forEach((item) => map.removeLayer(item.marker));
        markers = [];
      }
      return;
    }

    if (!map) {
      map = window.L.map(mapHost, { scrollWheelZoom: false, zoomControl: true });
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);
      mapReady = true;
      map.whenReady(() => {
        window.setTimeout(refreshMapSize, 60);
        window.setTimeout(refreshMapSize, 320);
        window.setTimeout(refreshMapSize, 900);
      });
    }

    if (activePopup) {
      map.closePopup(activePopup);
      activePopup = null;
    }

    markers.forEach((item) => map.removeLayer(item.marker));
    markers = [];

    list.forEach((store) => {
      const marker = window.L.marker([store.lat, store.lng], { icon: markerIcon(store.id === activeId) })
        .addTo(map)
        .on("click", () => focusStore(store));
      markers.push({ store, marker });
    });

    refreshMapSize();

    const active = list.find((store) => store.id === activeId) || list[0];
    if (active) {
      activeId = active.id;
      renderList();
      window.setTimeout(() => {
        refreshMapSize();
        showMapPopup(active);
      }, 160);
    }
  }

  function openCarrier(id, { scroll } = { scroll: false }) {
    const carrier = carriers[id];
    if (!carrier) return;
    carrierId = id;
    const list = storesFor();
    activeId = list[0]?.id || "";
    root.dataset.carrier = id;
    root.classList.add("is-open");
    if (stage) {
      stage.hidden = false;
      stage.classList.add("is-revealed");
    }
    if (titleEl) titleEl.textContent = carrier.title;
    renderList();

    if (!list.length) {
      setStatus("No se pudieron cargar las sucursales. Recarga la página.");
      return;
    }

    whenReady(() => {
      drawMap();
      window.setTimeout(refreshMapSize, 120);
      window.setTimeout(refreshMapSize, 480);
      window.setTimeout(refreshMapSize, 1200);
    });

    if (scroll) root.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function whenReady(cb) {
    let waits = 0;
    const t = window.setInterval(() => {
      waits += 1;
      const hasLeaflet = typeof window.L !== "undefined";
      const hasStores = storesFor().length > 0;
      if (hasLeaflet && hasStores) {
        window.clearInterval(t);
        cb();
      } else if (waits > 100) {
        window.clearInterval(t);
        if (!hasStores) setStatus("No se pudieron cargar las sucursales. Recarga la página.");
        else setStatus("No se pudo cargar el mapa. Recarga la página.");
      }
    }, 80);
  }

  function nearestStore(lat, lng) {
    const list = storesFor();
    let best = list[0];
    let bestD = Infinity;
    list.forEach((store) => {
      const d =
        (store.lat - lat) * (store.lat - lat) +
        (store.lng - lng) * (store.lng - lng);
      if (d < bestD) {
        bestD = d;
        best = store;
      }
    });
    return best;
  }

  function showNearestOnMap(store) {
    if (!store) return;
    pinnedId = store.id;
    activeId = store.id;
    resetVisibleCount();
    const geoBtn = root.querySelector("[data-store-geo]");
    if (geoBtn) {
      geoBtn.textContent = store.name;
      geoBtn.setAttribute("aria-label", `Sucursal más cercana: ${store.name}`);
    }
    setStatus(`Tu sucursal más cercana: ${store.name}`);
    const reveal = () => {
      renderList();
      focusStore(store, true);
      refreshMapSize();
      setStatus(`Tu sucursal más cercana: ${store.name}`);
      window.setTimeout(() => {
        listEl?.scrollTo({ top: 0, behavior: "smooth" });
        const card = listEl?.querySelector(`[data-store-id="${store.id}"]`);
        card?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    };
    if (!mapReady) {
      whenReady(() => {
        drawMap();
        reveal();
      });
      return;
    }
    reveal();
  }

  queryEl?.addEventListener("input", () => {
    const list = filteredStores();
    activeId = list[0]?.id || "";
    resetVisibleCount();
    renderList();
    if (!list.length) {
      setStatus("No se encontraron sucursales AT&T.");
    } else {
      const q = (queryEl.value || "").trim();
      setStatus(
        q
          ? `${list.length} sucursal${list.length === 1 ? "" : "es"} para “${q}”.`
          : ""
      );
    }
    if (mapReady) drawMap();
  });

  root.querySelector("[data-store-geo]")?.addEventListener("click", () => {
    if (!navigator.geolocation) {
      setStatus("Tu navegador no permite ubicación.");
      return;
    }
    setStatus("Buscando la sucursal más cercana…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const best = nearestStore(latitude, longitude);
        if (best) showNearestOnMap(best);
      },
      () => setStatus("No pudimos detectar tu ubicación. Busca por ciudad."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });

  listEl?.addEventListener("click", (e) => {
    const more = e.target.closest("[data-store-more]");
    if (more) {
      visibleCount += MOBILE_STEP;
      renderList();
      return;
    }
    const btn = e.target.closest("[data-store-focus]");
    if (!btn) return;
    const store = storesFor().find((s) => s.id === btn.getAttribute("data-store-focus"));
    if (store) focusStore(store, true);
  });

  const onListMqChange = () => {
    resetVisibleCount();
    renderList();
  };
  if (typeof MOBILE_LIST_MQ.addEventListener === "function") {
    MOBILE_LIST_MQ.addEventListener("change", onListMqChange);
  } else if (typeof MOBILE_LIST_MQ.addListener === "function") {
    MOBILE_LIST_MQ.addListener(onListMqChange);
  }

  if (typeof ResizeObserver !== "undefined" && mapHost) {
    const ro = new ResizeObserver(() => {
      if (mapReady) refreshMapSize();
    });
    ro.observe(mapHost);
  }

  function updateStoreTotal() {
    const totalEl = root.querySelector("[data-store-total]");
    const n = storesFor().length;
    if (totalEl && n) totalEl.textContent = String(n);
  }

  function loadLeaflet() {
    return new Promise((resolve, reject) => {
      if (typeof window.L !== "undefined") {
        resolve();
        return;
      }
      if (!document.querySelector('link[data-leaflet-css]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
        link.crossOrigin = "";
        link.setAttribute("data-leaflet-css", "1");
        document.head.appendChild(link);
      }
      const existing = document.querySelector("script[data-leaflet-js]");
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", reject);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
      script.crossOrigin = "";
      script.defer = true;
      script.setAttribute("data-leaflet-js", "1");
      script.onload = () => resolve();
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  function bootStores() {
    updateStoreTotal();
    loadLeaflet()
      .then(() => openCarrier("att"))
      .catch(() => setStatus("No se pudo cargar el mapa. Recarga la página."));
  }

  let booted = false;
  function bootOnce() {
    if (booted) return;
    booted = true;
    bootStores();
  }

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          io.disconnect();
          bootOnce();
        });
      },
      { rootMargin: "400px 0px", threshold: 0 }
    );
    io.observe(root);

    const mapIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || !mapReady) return;
          refreshMapSize();
        });
      },
      { threshold: 0.2 }
    );
    mapIo.observe(root);
  }

  window.setTimeout(bootOnce, 80);
  window.addEventListener("load", () => {
    updateStoreTotal();
    bootOnce();
    if (mapReady) refreshMapSize();
  });
})();
