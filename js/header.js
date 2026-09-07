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

  /* Video banner — autoplay muted loop on all viewports */
  function initHeroVideo() {
    const video = document.querySelector(".hero__video");
    if (!video) return;

    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
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
    const header = document.querySelector(".site-header");
    if (!nav || !toggle) return;

    let backdrop = document.querySelector("[data-nav-backdrop]");
    if (!backdrop) {
      backdrop = document.createElement("button");
      backdrop.type = "button";
      backdrop.className = "nav-backdrop";
      backdrop.setAttribute("data-nav-backdrop", "");
      backdrop.setAttribute("aria-label", "Cerrar menú");
      backdrop.hidden = true;
      (header || document.body).appendChild(backdrop);
    }

    const setNavOpen = (open) => {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("is-nav-open", open);
      backdrop.hidden = !open;
      backdrop.classList.toggle("is-visible", open);
    };

    const closeNav = () => setNavOpen(false);

    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      setNavOpen(!nav.classList.contains("is-open"));
    });

    backdrop.addEventListener("click", closeNav);

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
            closeNav();
          }
        });
      }
    } else {
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeNav();
      });
    }

    document.addEventListener("click", (e) => {
      if (!nav.classList.contains("is-open")) return;
      if (nav.contains(e.target) || toggle.contains(e.target)) return;
      closeNav();
    });

    nav.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        if (!a.closest(".nav__dropdown")) closeNav();
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

  function initWhatsAppFloat() {
    if (document.querySelector(".wa-float")) return;
    const a = document.createElement("a");
    a.className = "wa-float";
    a.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      "Hola YAAVS Pospago, quiero cotizar un plan AT&T"
    )}`;
    a.target = "_blank";
    a.rel = "noopener";
    a.setAttribute("aria-label", "Cotizar por WhatsApp");
    a.innerHTML = `
      <span class="wa-float__label">Cotiza por WhatsApp</span>
      <svg class="wa-float__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="currentColor" d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.96-.27-.1-.47-.15-.67.15-.2.29-.77.96-.95 1.16-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.29-.02-.45.13-.6.13-.13.3-.35.44-.52.15-.17.2-.29.3-.49.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.29-1.04 1.02-1.04 2.48s1.07 2.87 1.22 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35z"/>
        <path fill="currentColor" d="M12.04 2C6.55 2 2.1 6.45 2.1 11.94c0 1.78.47 3.45 1.3 4.91L2 22l5.3-1.39c1.4.76 2.99 1.19 4.69 1.19h.01c5.49 0 9.94-4.45 9.94-9.94C21.94 6.45 17.53 2 12.04 2zm0 18.15h-.01c-1.54 0-2.99-.41-4.26-1.13l-.3-.18-3.15.82.84-3.07-.2-.32A8.12 8.12 0 013.9 11.94c0-4.48 3.65-8.13 8.14-8.13 4.48 0 8.13 3.65 8.13 8.13 0 4.49-3.65 8.21-8.13 8.21z"/>
      </svg>`;
    document.body.appendChild(a);
  }

  function initCookieNotice() {
    const KEY = "yaavs_cookie_ok_v1";
    if (localStorage.getItem(KEY) === "1") return;
    if (document.querySelector(".cookie-notice")) return;

    const el = document.createElement("aside");
    el.className = "cookie-notice";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-live", "polite");
    el.setAttribute("aria-label", "Aviso de cookies y seguridad");
    el.innerHTML = `
      <span class="cookie-notice__glow" aria-hidden="true"></span>
      <span class="cookie-notice__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
          <path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9Z" stroke="currentColor" stroke-width="1.7"/>
          <circle cx="9" cy="10" r="1.1" fill="currentColor"/>
          <circle cx="13.5" cy="8.5" r="1" fill="currentColor"/>
          <circle cx="11" cy="14" r="1.15" fill="currentColor"/>
          <circle cx="15.2" cy="13.2" r="0.9" fill="currentColor"/>
        </svg>
      </span>
      <div class="cookie-notice__copy">
        <p class="cookie-notice__title">Cookies y seguridad</p>
        <p class="cookie-notice__text">
          Usamos cookies propias y de terceros para medir el uso del sitio, mejorar tu experiencia y proteger la navegación.
          Consulta el detalle en nuestro
          <a href="https://www.att.com.mx/aviso-de-privacidad" target="_blank" rel="noopener">Aviso de Privacidad</a>.
        </p>
      </div>
      <button type="button" class="cookie-notice__btn" data-cookie-accept>Entendido</button>
    `;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add("is-visible"));

    const accept = () => {
      localStorage.setItem(KEY, "1");
      el.classList.remove("is-visible");
      el.classList.add("is-leaving");
      window.setTimeout(() => el.remove(), 420);
    };
    el.querySelector("[data-cookie-accept]")?.addEventListener("click", accept);
  }

    initDevicesCarousel();

  initHeroVideo();
  initMobileCarousel();
  initNav();
  initHeaderGlass();
  initWhatsAppFloat();
  initCookieNotice();
  initQuote();
  initReveal();
})();

/* Carrusel de smartphones destacados (estilo AT&T Market) */
function initDevicesCarousel() {
  const root = document.querySelector("[data-devices-carousel]");
  if (!root) return;

  const slides = [...root.querySelectorAll("[data-device-card]")];
  const prev = root.querySelector("[data-devices-prev]");
  const next = root.querySelector("[data-devices-next]");
  const counter = root.querySelector("[data-devices-counter]");
  const dotsWrap = root.querySelector("[data-devices-dots]");
  if (!slides.length) return;

  const INTERVAL = 5500;
  const TRANSITION_MS = 820;
  let index = Math.max(0, slides.findIndex((s) => s.classList.contains("is-active")));
  let timer = null;
  let transitioning = false;

  const money = (value) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0,
    }).format(value);

  function updateCounter() {
    if (counter) counter.textContent = `${index + 1} / ${slides.length}`;
  }

  function buildDots() {
    if (!dotsWrap) return;
    dotsWrap.innerHTML = "";
    slides.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("aria-label", `Celular ${i + 1}`);
      dot.setAttribute("aria-selected", i === index ? "true" : "false");
      if (i === index) dot.classList.add("is-active");
      dot.addEventListener("click", () => goTo(i));
      dotsWrap.appendChild(dot);
    });
  }

  function updateDots() {
    if (!dotsWrap) return;
    [...dotsWrap.children].forEach((dot, i) => {
      const active = i === index;
      dot.classList.toggle("is-active", active);
      dot.setAttribute("aria-selected", active ? "true" : "false");
      if (active) {
        const left = dot.offsetLeft - dotsWrap.clientWidth / 2 + dot.clientWidth / 2;
        dotsWrap.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
      }
    });
  }

  async function applyPrices() {
    try {
      const res = await fetch("assets/data/devices.json?v=20260907t", { cache: "no-store" });
      if (!res.ok) return;
      const items = await res.json();
      const normalize = (s) =>
        (s || "")
          .toString()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, " ")
          .trim();

      slides.forEach((slide) => {
        const key = normalize(slide.getAttribute("data-name") || "");
        if (!key) return;
        const match = items.find((it) => {
          const n = normalize(it.name);
          return n && (n === key || n.includes(key) || key.includes(n));
        });
        if (!match) return;

        if (match.plan) slide.setAttribute("data-plan", match.plan);
        if (match.plazo) slide.setAttribute("data-plazo", String(match.plazo));

        const badgeEl = slide.querySelector(".devices-market__badge");
        if (badgeEl && match.plan) {
          badgeEl.innerHTML = `AT&amp;T Market · Plan <em>${match.plan}</em>`;
        }

        const taglineEl = slide.querySelector(".devices-market__tagline");
        if (taglineEl) {
          if (match.taglineHtml) taglineEl.innerHTML = match.taglineHtml;
          else if (match.tagline) taglineEl.textContent = match.tagline;
        }

        const priceEl = slide.querySelector("[data-device-price]");
        if (!priceEl) return;
        const amountEl = priceEl.querySelector(".devices-market__price-amount");
        const monthly =
          typeof match.monthlyPortabilityDisplay === "number"
            ? match.monthlyPortabilityDisplay
            : Math.floor(Number(match.monthlyPortability) || 0);
        if (monthly > 0) {
          slide.setAttribute("data-monthly", String(monthly));
          const label = `$${monthly.toLocaleString("es-MX")}`;
          if (amountEl) amountEl.textContent = label;
          else priceEl.textContent = label;
        } else if (typeof match.price === "number" && match.price > 0) {
          const label = money(match.price);
          if (amountEl) amountEl.textContent = label;
          else priceEl.textContent = label;
        }
      });
    } catch (err) {
      console.warn("devices prices load failed", err);
    }
  }

  function clearMotionClasses(el) {
    el.classList.remove(
      "is-active",
      "is-exiting",
      "is-entering",
      "is-exit-clock",
      "is-enter-clock",
      "is-exit-clock-rev",
      "is-enter-clock-rev",
      "is-exit-left",
      "is-exit-right",
      "is-enter-from-left",
      "is-enter-from-right"
    );
  }

  function goTo(newIndex, direction) {
    if (transitioning) return;
    const nextIndex = (newIndex + slides.length) % slides.length;
    if (nextIndex === index) return;

    let goingNext = true;
    if (direction === "prev") goingNext = false;
    else if (direction === "next") goingNext = true;
    else {
      const stepsForward = (nextIndex - index + slides.length) % slides.length;
      goingNext = stepsForward <= slides.length / 2;
    }

    transitioning = true;
    const current = slides[index];
    const incoming = slides[nextIndex];

    // Prepare incoming at clock-enter pose (no transition yet)
    clearMotionClasses(incoming);
    if (goingNext) {
      incoming.classList.add("is-entering", "is-enter-clock");
      current.classList.add("is-exiting", "is-exit-clock");
    } else {
      incoming.classList.add("is-entering", "is-enter-clock-rev");
      current.classList.add("is-exiting", "is-exit-clock-rev");
    }
    current.classList.remove("is-active");

    // Force reflow so the enter pose is painted before activating
    void incoming.offsetWidth;

    incoming.classList.remove("is-enter-clock", "is-enter-clock-rev", "is-entering");
    incoming.classList.add("is-active");

    index = nextIndex;
    updateCounter();
    updateDots();

    window.setTimeout(() => {
      slides.forEach((slide, i) => {
        if (i === index) return;
        clearMotionClasses(slide);
      });
      transitioning = false;
    }, TRANSITION_MS);
  }

  function prevCard() {
    goTo(index - 1, "prev");
  }

  function nextCard() {
    goTo(index + 1, "next");
  }

  function startTimer() {
    stopTimer();
    timer = window.setInterval(nextCard, INTERVAL);
  }

  function stopTimer() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  prev?.addEventListener("click", () => {
    prevCard();
    startTimer();
  });
  next?.addEventListener("click", () => {
    nextCard();
    startTimer();
  });

  root.addEventListener("mouseenter", stopTimer);
  root.addEventListener("mouseleave", startTimer);
  root.addEventListener("focusin", stopTimer);
  root.addEventListener("focusout", (e) => {
    if (!root.contains(e.relatedTarget)) startTimer();
  });

  let startX = 0;
  let startY = 0;
  const stage = root.querySelector("[data-devices-stage]") || root;
  stage.addEventListener(
    "touchstart",
    (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      stopTimer();
    },
    { passive: true }
  );
  stage.addEventListener(
    "touchend",
    (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.25) {
        if (dx > 0) prevCard();
        else nextCard();
      }
      startTimer();
    },
    { passive: true }
  );

  // Ensure only one active on boot
  slides.forEach((slide, i) => {
    clearMotionClasses(slide);
    if (i === index) slide.classList.add("is-active");
  });

  buildDots();
  updateCounter();
  applyPrices();
  startTimer();
}
