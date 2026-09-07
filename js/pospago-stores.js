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
  let map = null;
  let markers = [];
  let activeId = "";
  let carrierId = "";
  let activePopup = null;
  let mapReady = false;

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

  function filteredStores() {
    const all = storesFor();
    const q = (queryEl?.value || "").trim().toLowerCase();
    if (!q) return all;
    return all.filter((s) => `${s.name} ${s.city} ${s.address}`.toLowerCase().includes(q));
  }

  function renderList() {
    const list = filteredStores();
    if (countEl) countEl.textContent = `${list.length} sucursal${list.length === 1 ? "" : "es"}`;
    if (!listEl) return;
    if (!list.length) {
      listEl.innerHTML = `<p class="pospago-stores__empty">No hay sucursales con esa búsqueda.</p>`;
      return;
    }
    listEl.innerHTML = list
      .map((store, i) => {
        const on = store.id === activeId ? " is-active" : "";
        return `<article class="pospago-stores__card${on}" data-store-id="${store.id}" style="--i:${i}">
          <button type="button" class="pospago-stores__card-main" data-store-focus="${store.id}">
            <span class="pospago-stores__card-name">${store.name}</span>
            <span class="pospago-stores__card-city">${store.city}</span>
            <span class="pospago-stores__card-address">${store.address}</span>
            ${store.hours ? `<span class="pospago-stores__card-hours">${store.hours}</span>` : ""}
          </button>
          <div class="pospago-stores__card-actions">
            <a class="pospago-stores__go" href="${mapsDirUrl(store)}" target="_blank" rel="noopener noreferrer">Cómo llegar</a>
          </div>
        </article>`;
      })
      .join("");
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
    renderList();
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
    const geoBtn = root.querySelector("[data-store-geo]");
    if (geoBtn) {
      geoBtn.textContent = store.name;
      geoBtn.setAttribute("aria-label", `Sucursal más cercana: ${store.name}`);
    }
    setStatus(`Tu sucursal más cercana: ${store.name}`);
    const reveal = () => {
      mapHost?.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => {
        focusStore(store, true);
        refreshMapSize();
        setStatus(`Tu sucursal más cercana: ${store.name}`);
      }, 280);
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
    renderList();
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
    const btn = e.target.closest("[data-store-focus]");
    if (!btn) return;
    const store = storesFor().find((s) => s.id === btn.getAttribute("data-store-focus"));
    if (store) focusStore(store, true);
  });

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
