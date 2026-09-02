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

    nav.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
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

  initHeroVideo();
  initMobileCarousel();
  initNav();
  initHeaderGlass();
  initQuote();
  initReveal();
})();
