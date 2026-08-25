/**
 * Catálogo pospago: Lite / Simple Plus / Premium
 * Datos alineados a postpago.html (YAAVS)
 */
(() => {
  const RRSS = [
    { id: "x", name: "X" },
    { id: "waze", name: "Waze" },
    { id: "uber", name: "Uber" },
    { id: "snapchat", name: "Snapchat" },
    { id: "uber-eats", name: "Uber Eats" },
    { id: "whatsapp", name: "WhatsApp" },
    { id: "linkedin", name: "LinkedIn" },
    { id: "telegram", name: "Telegram" },
    { id: "rappi", name: "Rappi" },
    { id: "pinterest", name: "Pinterest" },
    { id: "didi", name: "DiDi" },
    { id: "messenger", name: "Messenger" },
    { id: "instagram", name: "Instagram" },
    { id: "google-maps", name: "Google Maps" },
    { id: "didi-food", name: "DiDi Food" },
    { id: "facebook", name: "Facebook" },
    { id: "tiktok", name: "TikTok" },
  ];

  const iconSrc = (id) => `assets/icons/rrss/${id}.svg`;

  const ICONS = RRSS.map(
    (r) =>
      `<img src="${iconSrc(r.id)}" alt="" width="16" height="16" loading="lazy" decoding="async" title="${r.name}">`
  ).join("");

  window.YAAVS_RRSS = RRSS;
  const CATALOG = {
    premium: {
      hint: "AT&T Premium · planes con equipo · toca un plan para ver smartphones en tienda",
      plans: [
        { id: "azul", name: "Azul", gb: 4, price: 279, color: "#00A0E3", rrss: "Elegir 6 RRSS" },
        { id: "azul1", name: "Azul 1", gb: 5, price: 330, color: "#1AA8E8", rrss: "Elegir 6 RRSS" },
        { id: "azul2", name: "Azul 2", gb: 8, price: 435, color: "#3BB0EB", rrss: "Elegir 6 RRSS" },
        { id: "azul3", name: "Azul 3", gb: 14, price: 550, color: "#00A0E3", rrss: "Elegir 6 RRSS" },
        { id: "plata", name: "Plata", gb: 25, price: 650, color: "#A8ADB0", rrss: "Elegir 6 RRSS" },
        { id: "oro", name: "Oro", gb: 32, price: 725, color: "#C9A227", rrss: "Elegir 6 RRSS" },
        { id: "black", name: "Black", gb: 42, price: 825, color: "#1A1A1A", rrss: "Elegir 6 RRSS", featured: true },
        { id: "platino", name: "Platino", gb: 50, price: 1035, color: "#B4B6C8", rrss: "Elegir 6 RRSS" },
        { id: "diamante", name: "Diamante", gb: 55, price: 1300, color: "#8FA4B5", rrss: "Elegir 6 RRSS" },
        { id: "titanio", name: "Titanio", gb: 42, price: 1599, color: "#5C8BA6", rrss: "Elegir 6 RRSS" },
      ],
    },
    simple: {
      hint: "AT&T Simple Plus · redes sociales ilimitadas · gigas de promoción",
      plans: [
        { id: "simple3", name: "Simple Plus", gb: 3, price: 299, color: "#00A9A6", rrss: "RRSS ilimitadas" },
        { id: "simple5", name: "Simple Plus", gb: 5, price: 399, color: "#00B8A9", rrss: "RRSS ilimitadas" },
        { id: "simple8", name: "Simple Plus", gb: 8, price: 599, color: "#00C1D4", rrss: "RRSS ilimitadas", featured: true },
        { id: "simple12", name: "Simple Plus", gb: 12, price: 649, color: "#009FDB", rrss: "RRSS ilimitadas" },
      ],
    },
    lite: {
      hint: "AT&T Lite · planes sin equipo · descuento en portabilidad",
      plans: [
        { id: "lite", name: "Lite", gb: 4, price: 299, color: "#5B9BD5", rrss: "Elegir 3 RRSS" },
        { id: "lite1", name: "Lite 1", gb: 12, price: 349, color: "#4A90D9", rrss: "Elegir 6 RRSS" },
        { id: "lite2", name: "Lite 2", gb: 20, price: 449, color: "#3A86CF", rrss: "Elegir 6 RRSS", featured: true },
        { id: "lite3", name: "Lite 3", gb: 30, price: 549, color: "#2B7CC4", rrss: "Elegir 6 RRSS" },
        { id: "lite4", name: "Lite 4", gb: 50, price: 669, color: "#1E6FB8", rrss: "Elegir 6 RRSS" },
        { id: "lite5", name: "Lite 5", gb: 120, price: 999, color: "#0F5FA8", rrss: "Elegir 6 RRSS" },
      ],
    },
  };

  window.YAAVS_PLAN_LABELS = Object.fromEntries(
    Object.values(CATALOG).flatMap((family) =>
      family.plans.map((p) => [
        p.id,
        `AT&T ${p.name} — ${p.gb} GB · $${p.price.toLocaleString("es-MX")}`,
      ])
    )
  );

  function money(n) {
    return `$ ${n.toLocaleString("es-MX")}`;
  }

  function cardHTML(plan, index) {
    const featured = plan.featured ? " plan--featured" : "";
    const tag = plan.featured ? `<p class="plan__tag">Popular</p>` : "";
    return `<article class="plan${featured} reveal" role="listitem" style="--plan:${plan.color};--i:${index}" data-plan="${plan.id}" data-gb="${plan.gb}" data-price="${plan.price}">
      ${tag}
      <header class="plan__head">
        <span class="plan__brand">AT&amp;T</span>
        <h3>${plan.name}</h3>
      </header>
      <div class="plan__seg plan__seg--gb"><strong>${plan.gb} GB</strong></div>
      <div class="plan__seg plan__seg--rrss">
        <p>${plan.rrss}</p>
        <div class="plan__icons" aria-hidden="true">${ICONS}</div>
      </div>
      <div class="plan__seg plan__seg--mins">Min | SMS ilimitados</div>
      <div class="plan__foot">
        <span>Renta final</span>
        <strong>${money(plan.price)}</strong>
      </div>
      <button type="button" class="btn btn--plan" data-quote-plan="${plan.id}">Cotizar</button>
    </article>`;
  }

  function renderFamily(id) {
    const family = CATALOG[id];
    const grid = document.querySelector(`[data-plans-grid="${id}"]`);
    if (!family || !grid) return;
    grid.innerHTML = family.plans.map(cardHTML).join("");
    grid.style.setProperty("--cols", String(family.plans.length));
    grid.classList.toggle("plans--few", family.plans.length <= 4);
    grid.classList.toggle("plans--many", family.plans.length >= 8);
  }

  function revealPlans(panel) {
    const items = panel.querySelectorAll(".plan");
    items.forEach((el, i) => {
      el.classList.add("reveal");
      el.style.setProperty("--i", String(i));
    });
    const showAll = () => items.forEach((el) => el.classList.add("is-in"));
    if (!("IntersectionObserver" in window)) {
      showAll();
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
      { threshold: 0.01, rootMargin: "40px 0px 40px 0px" }
    );
    items.forEach((el) => io.observe(el));
    // Fallback: en laptop a veces el IO no dispara dentro de overflow-x
    window.setTimeout(showAll, 600);
  }

  function setTab(id) {
    const root = document.querySelector("[data-plans-catalog]");
    if (!root || !CATALOG[id]) return;

    root.querySelectorAll("[data-plan-tab]").forEach((tab) => {
      const on = tab.getAttribute("data-plan-tab") === id;
      tab.classList.toggle("is-active", on);
      tab.setAttribute("aria-selected", on ? "true" : "false");
    });

    root.querySelectorAll("[data-plan-panel]").forEach((panel) => {
      const on = panel.getAttribute("data-plan-panel") === id;
      panel.classList.toggle("is-active", on);
      panel.hidden = !on;
      if (on) {
        if (!panel.dataset.rendered) {
          renderFamily(id);
          panel.dataset.rendered = "1";
        }
        revealPlans(panel);
      }
    });

    const hint = root.querySelector("[data-plan-hint]");
    if (hint) hint.textContent = CATALOG[id].hint;
  }

  function fillQuoteOptions() {
    const select = document.querySelector("[data-quote-select]");
    if (!select) return;
    const current = select.value;
    const opts = ['<option value="">Selecciona un plan</option>'];
    Object.entries(CATALOG).forEach(([family, data]) => {
      const label =
        family === "premium" ? "Premium" : family === "simple" ? "Simple Plus" : "Lite";
      opts.push(`<optgroup label="AT&T ${label}">`);
      data.plans.forEach((p) => {
        opts.push(
          `<option value="${p.id}">AT&T ${p.name} — ${p.gb} GB · $${p.price.toLocaleString("es-MX")}</option>`
        );
      });
      opts.push("</optgroup>");
    });
    select.innerHTML = opts.join("");
    if (current) select.value = current;
  }

  function init() {
    const root = document.querySelector("[data-plans-catalog]");
    if (!root) return;

    fillQuoteOptions();
    setTab("premium");

    root.querySelectorAll("[data-plan-tab]").forEach((tab) => {
      tab.addEventListener("click", () => setTab(tab.getAttribute("data-plan-tab")));
    });

    root.querySelectorAll(".plans-scroll").forEach((scroller) => {
      scroller.addEventListener(
        "wheel",
        (e) => {
          if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
          e.preventDefault();
          window.scrollBy(0, e.deltaY);
        },
        { passive: false }
      );
    });
  }

  init();
})();
