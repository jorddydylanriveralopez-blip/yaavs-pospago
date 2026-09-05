(() => {
  const WHATSAPP_NUMBER = "525522331210";

  const PLAN_LABELS = window.YAAVS_PLAN_LABELS || {
    azul3: "AT&T Azul 3 — 14 GB · $550",
    plata: "AT&T Plata — 25 GB · $650",
    oro: "AT&T Oro — 32 GB · $725",
    black: "AT&T Black — 42 GB · $825",
    platino: "AT&T Platino — 50 GB · $1,035",
    diamante: "AT&T Diamante — 55 GB · $1,300",
    titanio: "AT&T Titanio — 42 GB · $1,599",
  };

  /* Video banner (desktop) — carga diferida para no bloquear la página */
  function initHeroVideo() {
    const video = document.querySelector(".hero__video");
    if (!video) return;
    if (window.matchMedia("(max-width: 768px)").matches) return;

    video.muted = true;
    video.playsInline = true;
    const tryPlay = () => {
      const p = video.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };
    video.addEventListener("canplay", tryPlay, { once: true });
    tryPlay();
  }

  /* Carrusel móvil de promos */
  function initMobileCarousel() {
    const root = document.querySelector("[data-mobile-carousel]");
    if (!root) return;

    const track = root.querySelector("[data-mobile-track]");
    const slides = [...root.querySelectorAll("[data-mobile-slide]")];
    const dotsWrap = root.querySelector("[data-mobile-dots]");
    const progress = root.querySelector("[data-mobile-progress]");
    const prev = root.querySelector("[data-mobile-prev]");
    const next = root.querySelector("[data-mobile-next]");
    if (!track || slides.length < 2) return;

    const INTERVAL = 4500;
    let index = 0;
    let timer = null;
    let started = 0;
    let raf = null;

    slides.forEach((slide) => {
      const img = slide.querySelector("img");
      if (img) img.loading = "eager";
    });

    const dots = slides.map((_, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-label", `Promoción ${i + 1}`);
      btn.addEventListener("click", () => go(i, true));
      dotsWrap?.appendChild(btn);
      return btn;
    });

    function paintProgress() {
      if (!progress) return;
      const t = Math.min(1, (performance.now() - started) / INTERVAL);
      progress.style.width = `${t * 100}%`;
      if (t < 1) raf = requestAnimationFrame(paintProgress);
    }

    function go(i, user = false) {
      index = (i + slides.length) % slides.length;
      track.style.transform = `translate3d(-${index * 100}%, 0, 0)`;
      slides.forEach((s, n) => s.classList.toggle("is-active", n === index));
      dots.forEach((d, n) => {
        d.classList.toggle("is-active", n === index);
        d.setAttribute("aria-selected", n === index ? "true" : "false");
      });
      if (user) restart();
      else {
        started = performance.now();
        cancelAnimationFrame(raf);
        paintProgress();
      }
    }

    function restart() {
      clearInterval(timer);
      started = performance.now();
      cancelAnimationFrame(raf);
      paintProgress();
      timer = window.setInterval(() => go(index + 1), INTERVAL);
    }

    prev?.addEventListener("click", () => go(index - 1, true));
    next?.addEventListener("click", () => go(index + 1, true));

    let touchX = 0;
    root.addEventListener(
      "touchstart",
      (e) => {
        touchX = e.changedTouches[0].clientX;
        clearInterval(timer);
        cancelAnimationFrame(raf);
      },
      { passive: true }
    );
    root.addEventListener(
      "touchend",
      (e) => {
        const dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 36) go(index + (dx < 0 ? 1 : -1), true);
        else restart();
      },
      { passive: true }
    );

    go(0);
    restart();
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        clearInterval(timer);
        cancelAnimationFrame(raf);
      } else {
        restart();
      }
    });
  }

  function initNav() {
    const nav = document.querySelector(".nav");
    const toggle = document.querySelector("[data-nav-toggle]");
    if (!nav || !toggle) return;

    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });

    // Dropdown Planes — hover (desktop) + click (desktop/móvil)
    const dropdown = nav.querySelector(".nav__dropdown");
    if (dropdown) {
      const dropLink = dropdown.querySelector(":scope > a");
      const submenu = dropdown.querySelector(".nav__submenu");
      if (dropLink && submenu) {
        const open = () => {
          submenu.classList.add("is-open");
          dropLink.setAttribute("aria-expanded", "true");
        };
        const close = () => {
          submenu.classList.remove("is-open");
          dropLink.setAttribute("aria-expanded", "false");
        };

        dropLink.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (submenu.classList.contains("is-open")) close();
          else open();
        });

        dropdown.addEventListener("mouseenter", open);
        dropdown.addEventListener("mouseleave", close);

        document.addEventListener("click", (e) => {
          if (!dropdown.contains(e.target)) close();
        });

        document.addEventListener("keydown", (e) => {
          if (e.key === "Escape") {
            close();
            nav.classList.remove("is-open");
            toggle.setAttribute("aria-expanded", "false");
          }
        });
      }
    }

    nav.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        if (!a.closest(".nav__dropdown")) {
          nav.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
        }
      });
    });
  }

  function getPlanLabel(plan) {
    return (window.YAAVS_PLAN_LABELS && window.YAAVS_PLAN_LABELS[plan]) || PLAN_LABELS[plan] || plan;
  }

  function getDeviceLabel(id) {
    if (!id) return "";
    return (window.YAAVS_DEVICE_LABELS && window.YAAVS_DEVICE_LABELS[id]) || id;
  }

  function getSelectedAppsForPlan(planId) {
    return window.YAAVS_getSelectedApps?.(planId) || [];
  }

  function planNeedsApps(planId) {
    return (window.YAAVS_getPlanAppsMax?.(planId) || 0) > 0;
  }

  function validatePlanApps(planId) {
    const max = window.YAAVS_getPlanAppsMax?.(planId) || 0;
    if (!max) return true;
    const apps = getSelectedAppsForPlan(planId);
    if (apps.length >= max) return true;
    window.alert(`Selecciona ${max} apps en la tarjeta del plan antes de cotizar.`);
    document.querySelector(`[data-plan-apps="${planId}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    return false;
  }

  function initQuote() {
    const form = document.querySelector("[data-quote-form]");
    const select = document.querySelector("[data-quote-select]");
    const deviceSelect = document.querySelector("[data-quote-device]");
    const summary = document.querySelector("[data-quote-summary]");
    if (!form || !select || !summary) return;

    const updateSummary = () => {
      const plan = select.value;
      if (!plan) {
        summary.innerHTML = "<p>Selecciona un plan para ver tu precotización.</p>";
        return;
      }
      const label = getPlanLabel(plan);
      const device = deviceSelect?.value ? getDeviceLabel(deviceSelect.value) : "";
      const apps = plan ? getSelectedAppsForPlan(plan) : [];
      const appsLine = apps.length ? ` Apps elegidas: <strong>${apps.join(", ")}</strong>.` : "";
      const deviceLine = device
        ? ` Equipo de interés: <strong>${device}</strong> (beneficio YAAVS · stock en tienda).`
        : "";
      summary.innerHTML = `<p>Precotización: <strong>${label}</strong>.${appsLine}${deviceLine} Un asesor YAAVS te confirma vigencia, equipo y seguro.</p>`;
    };

    select.addEventListener("change", updateSummary);
    deviceSelect?.addEventListener("change", updateSummary);

    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-quote-plan]");
      if (!btn) return;
      const plan = btn.getAttribute("data-quote-plan");
      if (!validatePlanApps(plan)) return;
      select.value = plan;
      if (deviceSelect) deviceSelect.value = "";
      updateSummary();
      document.querySelector("#cotizar")?.scrollIntoView({ behavior: "smooth" });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const plan = data.get("plan");
      const equipo = data.get("equipo");
      if (!validatePlanApps(plan)) return;
      const apps = getSelectedAppsForPlan(plan);
      const lines = [
        "Hola YAAVS Pospago, quiero una cotización AT&T:",
        `• Nombre: ${data.get("nombre")}`,
        `• WhatsApp: ${data.get("whatsapp")}`,
        `• Plan: ${getPlanLabel(plan)}`,
        `• Equipo: ${equipo ? getDeviceLabel(equipo) : "Sin equipo / propio / por definir"}`,
      ];
      if (apps.length) {
        lines.push(`• Apps elegidas: ${apps.join(", ")}`);
      }
      lines.push(
        `• Interés: ${data.get("interes")}`,
        `• Seguro: ${data.get("seguro")}`,
        `• Ciudad/tienda: ${data.get("ciudad") || "Por definir"}`
      );
      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
      window.open(url, "_blank", "noopener");
    });
  }

  function initReveal() {
    const items = document.querySelectorAll(
      ".promo, .renew__copy, .insurance__copy, .quote-form"
    );
    items.forEach((el) => el.classList.add("reveal"));

    // Títulos de sección siempre visibles (evita opacity:0 en laptop/Safari)
    document.querySelectorAll(".section__head, .pospago-stores__head").forEach((el) => {
      el.classList.add("is-in");
      el.classList.remove("reveal");
    });

    if (!("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -8px 0px" }
    );

    items.forEach((el) => io.observe(el));
    window.setTimeout(() => {
      items.forEach((el) => el.classList.add("is-in"));
    }, 1200);
  }

  function initHeaderGlass() {
    const header = document.querySelector("#site-header");
    if (!header) return;

    const onScroll = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 12);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

    initDevicesCarousel();

  initHeroVideo();
  initMobileCarousel();
  initNav();
  initHeaderGlass();
  initQuote();
  initReveal();
})();

/* Carrusel de smartphones destacados (efecto reloj) */
function initDevicesCarousel() {
  const root = document.querySelector("[data-devices-carousel]");
  if (!root) return;

  const track = root.querySelector("[data-devices-track]");
  let cards = [...root.querySelectorAll("[data-device-card]")];
  const dotsWrap = root.querySelector("[data-devices-dots]");
  let prev = root.querySelector("[data-devices-prev]");
  let next = root.querySelector("[data-devices-next]");
  if (!track) return;

  // Ensure prev/next arrows exist so users can navigate even without banner mode
  if (!prev) {
    prev = document.createElement('button');
    prev.type = 'button';
    prev.setAttribute('aria-label', 'Anterior');
    prev.className = 'devices-arrow devices-arrow--prev';
    prev.innerHTML = '‹';
    root.appendChild(prev);
  }
  if (!next) {
    next = document.createElement('button');
    next.type = 'button';
    next.setAttribute('aria-label', 'Siguiente');
    next.className = 'devices-arrow devices-arrow--next';
    next.innerHTML = '›';
    root.appendChild(next);
  }

  const INTERVAL = 5000;
  let index = 0;
  let timer = null;
  let transitioning = false;

  function initCardsState() {
    cards.forEach((c, i) => {
      c.classList.remove('is-entering', 'is-active', 'is-exiting');
      c.style.opacity = i === index ? '1' : '0';
      const img = c.querySelector('img');
      if (img) img.style.transform = i === index ? 'scale(1)' : 'scale(0.92)';
    });
    if (cards[index]) cards[index].classList.add('is-active');
    // reset track to show the active slide
    try {
      const containerWidth = root.clientWidth || root.offsetWidth || track.clientWidth;
      track.style.transform = `translate3d(-${containerWidth * index}px, 0, 0)`;
    } catch (e) {
      /* ignore */
    }
  }
  // initial state (may be replaced if we populate dynamically)
  initCardsState();

  // Load prices from generated JSON and apply to cards (name + price only)
  async function fetchAndApplyPrices() {
    try {
      const res = await fetch('/assets/data/devices.json', { cache: 'no-store' });
      if (!res.ok) return;
      const items = await res.json();
      const normalize = (s) => (s || '').toString().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

      cards.forEach((card) => {
        const titleEl = card.querySelector('.device-card__title');
        const priceEl = card.querySelector('.device-card__price');
        const shownName = titleEl ? titleEl.textContent.trim() : '';
        const nShown = normalize(shownName);

        // find best match
        const match = items.find((it) => {
          const n = normalize(it.name);
          return n && (n === nShown || n.includes(nShown) || nShown.includes(n));
        });

        if (match) {
          if (titleEl) titleEl.textContent = match.name;
          if (priceEl) {
            const price = match.price;
            const formatted = (typeof price === 'number')
              ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(price)
              : String(price);
            priceEl.textContent = formatted;
          }
        }

        // keep markup minimal: only name and price
        if (card.querySelectorAll('.device-card__info > *').length > 2) {
          [...card.querySelectorAll('.device-card__info > *')].forEach((el, i) => {
            if (i > 1) el.remove();
          });
        }
      });
    } catch (err) {
      // silent fail
      console.warn('devices prices load failed', err);
    }
  }

  // run price loader (best-effort)
  fetchAndApplyPrices();

  // If there's only one card in the DOM, populate the track with up to 11 slides from devices.json
  async function populateSlidesFromJSONIfNeeded() {
    if (cards.length > 1) return;
    try {
      const res = await fetch('/assets/data/devices.json', { cache: 'no-store' });
      if (!res.ok) return;
      const all = await res.json();
      const items = all.filter(it => it && it.name).slice(0, 11);
      if (!items.length) return;
      // Build a banner-style carousel (multiple visible slides)
      const visible = Math.min(5, items.length);
      track.classList.add('is-banner');
      const buildSlide = (it) => {
        const imgPath = `/assets/images/smartphones/${encodeURIComponent(it.name)}.png`;
        const title = it.name.replace(/"/g, '');
        const price = (typeof it.price === 'number') ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(it.price) : String(it.price);
        return `
          <article class="device-card banner-slide" data-device-card>
            <span class="device-card__media">
              <img src="${imgPath}" alt="${title}" loading="lazy" onerror="this.onerror=null;this.style.opacity=1;" />
            </span>
            <div class="device-card__info">
              <div class="device-card__title">${title}</div>
              <div class="device-card__price">${price}</div>
            </div>
          </article>`;
      };

      // create slides + clones at both ends (for seamless bidirectional looping)
      const htmlMain = items.map(buildSlide).join('\n');
      const clonesStart = items.slice(-visible).map(buildSlide).join('\n');
      const clonesEnd = items.slice(0, visible).map(buildSlide).join('\n');
      track.innerHTML = clonesStart + htmlMain + clonesEnd;

      // re-query cards and set up banner autoplay
      cards = [...root.querySelectorAll('[data-device-card]')];
      const originalCount = items.length;
      const percent = 100 / visible;
      // set each slide flex-basis so visible slides fit in container (CSS handles most cases)
      cards.forEach((c) => { c.style.flex = `0 0 ${percent}%`; });

      // start at the first real slide (offset by clones at start)
      let bannerIndex = visible;
      track.style.transition = 'none';
      track.style.transform = `translate3d(-${percent * bannerIndex}%, 0, 0)`;

      const INTERVAL_BANNER = 2800;
      let bannerTimer = null;

      function startBanner() {
        bannerTimer = setInterval(() => moveBanner(1), INTERVAL_BANNER);
      }
      function stopBanner() { clearInterval(bannerTimer); bannerTimer = null; }

      function moveBanner(delta) {
        bannerIndex += delta;
        track.style.transition = 'transform 0.6s ease';
        track.style.transform = `translate3d(-${percent * bannerIndex}%, 0, 0)`;
        // forward wrap
        if (bannerIndex >= visible + originalCount) {
          const handler = () => {
            track.style.transition = 'none';
            bannerIndex = visible;
            track.style.transform = `translate3d(-${percent * bannerIndex}%, 0, 0)`;
            track.removeEventListener('transitionend', handler);
          };
          track.addEventListener('transitionend', handler);
        }
        // backward wrap
        if (bannerIndex < visible) {
          const handler = () => {
            track.style.transition = 'none';
            bannerIndex = visible + originalCount - 1;
            track.style.transform = `translate3d(-${percent * bannerIndex}%, 0, 0)`;
            track.removeEventListener('transitionend', handler);
          };
          track.addEventListener('transitionend', handler);
        }
      }

      // Add arrow controls if not present
      let prevBtn = prev;
      let nextBtn = next;
      if (!prevBtn) {
        prevBtn = document.createElement('button');
        prevBtn.className = 'devices-arrow devices-arrow--prev';
        prevBtn.type = 'button';
        prevBtn.innerHTML = '‹';
        root.appendChild(prevBtn);
      }
      if (!nextBtn) {
        nextBtn = document.createElement('button');
        nextBtn.className = 'devices-arrow devices-arrow--next';
        nextBtn.type = 'button';
        nextBtn.innerHTML = '›';
        root.appendChild(nextBtn);
      }

      prevBtn.addEventListener('click', () => { stopBanner(); moveBanner(-1); startBanner(); });
      nextBtn.addEventListener('click', () => { stopBanner(); moveBanner(1); startBanner(); });

      // pause/resume on hover
      root.addEventListener('mouseenter', stopBanner);
      root.addEventListener('mouseleave', () => { if (!bannerTimer) startBanner(); });

      // start autoplay
      startBanner();

      return true;
    } catch (err) {
      // silent fail
      console.warn('populate slides failed', err);
    }
    return false;
  }

  // attempt to populate dynamic slides if needed; if it returns true we used banner mode and can stop
  const usedBanner = await populateSlidesFromJSONIfNeeded();
  if (usedBanner) return;

  function buildDots() {
    if (!dotsWrap) return;
    dotsWrap.innerHTML = "";
    cards.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("data-dot", "");
      dot.setAttribute("aria-label", `Dispositivo ${i + 1}`);
      dot.addEventListener("click", () => goTo(i));
      dotsWrap.appendChild(dot);
    });
  }

  function updateDots() {
    if (!dotsWrap) return;
    [...dotsWrap.children].forEach((d, i) => {
      d.classList.toggle("is-active", i === index);
      d.setAttribute("aria-selected", i === index ? "true" : "false");
    });
  }

  function showCard(newIndex, direction = "next") {
    if (transitioning || newIndex === index) return;
    transitioning = true;

    // compute slide width (container width) and move track
    const containerWidth = root.clientWidth || root.offsetWidth || track.clientWidth;
    const offset = containerWidth * newIndex;
    track.style.transform = `translate3d(-${offset}px, 0, 0)`;

    // update active classes and image scales
    cards.forEach((c, i) => {
      c.classList.toggle('is-active', i === newIndex);
      const img = c.querySelector('img');
      if (img) img.style.transform = i === newIndex ? 'scale(1)' : 'scale(0.92)';
      c.style.opacity = i === newIndex ? '1' : '0.0';
    });

    setTimeout(() => {
      index = newIndex;
      updateDots();
      transitioning = false;
    }, 520);
  }

  function goTo(newIndex, dir = "next") {
    const normalized = (newIndex + cards.length) % cards.length;
    showCard(normalized, dir);
  }

  function prevCard() {
    const prevIndex = (index - 1 + cards.length) % cards.length;
    showCard(prevIndex, "prev");
  }

  function nextCard() {
    const nextIndex = (index + 1) % cards.length;
    showCard(nextIndex, "next");
  }

  prev?.addEventListener("click", prevCard);
  next?.addEventListener("click", nextCard);

  buildDots();
  updateDots();

  // Auto-play
  timer = window.setInterval(() => nextCard(), INTERVAL);

  // Pause on hover
  root.addEventListener("mouseenter", () => clearInterval(timer));
  root.addEventListener("mouseleave", () => {
    timer = window.setInterval(() => nextCard(), INTERVAL);
  });

  // Swipe support
  let startX = 0;
  root.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; }, { passive: true });
  root.addEventListener("touchend", (e) => {
    const delta = e.changedTouches[0].clientX - startX;
    if (Math.abs(delta) > 40) {
      if (delta > 0) prevCard();
      else nextCard();
    }
  }, { passive: true });

  // Keep transform correct on resize
  window.addEventListener('resize', () => {
    const containerWidth = root.clientWidth || root.offsetWidth || track.clientWidth;
    track.style.transform = `translate3d(-${containerWidth * index}px, 0, 0)`;
  });
}

/* ===== IIFE existente ===== */
(() => {  "use strict";
