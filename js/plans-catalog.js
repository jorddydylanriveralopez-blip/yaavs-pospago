/**
 * Catálogo pospago AT&T — Premium / Simple Plus / Lite
 * Datos alineados a PDFs oficiales (ago 2026)
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

  const ICON_VER = "20260901b";
  const iconSrc = (id) => `assets/icons/rrss/${id}.svg?v=${ICON_VER}`;

  function staticIconsHTML() {
    return RRSS.map(
      (r) =>
        `<img class="plan__app-icon" src="${iconSrc(r.id)}" alt="" width="26" height="26" loading="lazy" decoding="async" title="${r.name}">`
    ).join("");
  }

  function pickerButtonsHTML() {
    return RRSS.map(
      (r) =>
        `<button type="button" class="plan__app-btn" data-app-id="${r.id}" aria-pressed="false" title="${r.name}">
          <img class="plan__app-icon" src="${iconSrc(r.id)}" alt="${r.name}" width="26" height="26" loading="lazy" decoding="async">
        </button>`
    ).join("");
  }

  function findPlan(planId) {
    for (const family of Object.values(CATALOG)) {
      const plan = family.plans.find((p) => p.id === planId);
      if (plan) return plan;
    }
    return null;
  }

  window.YAAVS_getPlanAppsMax = (planId) => {
    const plan = findPlan(planId);
    if (!plan || plan.unlimitedRrss || !plan.rrssCount || plan.rrssNote === "Preseleccionadas") return 0;
    return plan.rrssCount;
  };

  window.YAAVS_getSelectedApps = (planId) => {
    const wrap = document.querySelector(`[data-plan-apps="${planId}"]`);
    if (!wrap) return [];
    return [...wrap.querySelectorAll(".plan__app-btn.is-selected")]
      .map((btn) => RRSS.find((r) => r.id === btn.dataset.appId)?.name || btn.dataset.appId)
      .filter(Boolean);
  };

  window.YAAVS_RRSS = RRSS;

  const CATALOG = {
    premium: {
      label: "Premium",
      hintStandard:
        "Renovar línea · activar, adicionar, renovar, cambio de oferta o migración · Min/SMS ilimitados MX, EUA y Canadá",
      hintPortabilidad:
        "Portabilidad · al traer tu número de otra compañía · Min/SMS ilimitados MX, EUA y Canadá",
      pricingLabels: { standard: "Renovar línea", portabilidad: "Portabilidad" },
      plans: [
        { id: "azul", name: "Azul*", gb: 4, price: 279, pricePort: null, color: "#00A0E3", rrssCount: 3, addon: "incluido" },
        { id: "azul1", name: "Azul 1", gb: 5, price: 330, pricePort: 270, color: "#1AA8E8", rrssCount: 6, addon: 50 },
        { id: "azul2", name: "Azul 2", gb: 8, price: 435, pricePort: 350, color: "#3BB0EB", rrssCount: 6, addon: 50 },
        { id: "azul3", name: "Azul 3", gb: 14, price: 550, pricePort: 440, color: "#009FDB", rrssCount: 6, addon: 50 },
        { id: "plata", name: "Plata", gb: 25, price: 650, pricePort: 520, color: "#A8ADB0", rrssCount: 6, addon: 50 },
        { id: "oro", name: "Oro", gb: 32, price: 725, pricePort: 580, color: "#C9A227", rrssCount: 6, addon: 50 },
        { id: "black", name: "Black", gb: 42, price: 825, pricePort: 660, color: "#1A1A1A", rrssCount: 6, rrssNote: "Preseleccionadas", addon: 50, featured: true },
        { id: "platino", name: "Platino", gb: 50, price: 1035, pricePort: 830, color: "#B4B6C8", rrssCount: 6, addon: 50 },
        { id: "diamante", name: "Diamante", gb: 55, price: 1300, pricePort: 1040, color: "#8FA4B5", rrssCount: 6, addon: 50 },
        { id: "titanio", name: "Titanio", gb: 42, price: 1599, pricePort: 1440, color: "#5C8BA6", rrssCount: 6, addon: 50, badge: "iPhone 17 incluido" },
      ],
    },
    simple: {
      label: "Simple Plus",
      hintStandard:
        "AT&T Simple Plus / Simple · Doble de GB por promoción · Min/SMS ilimitados MX, EUA y Canadá",
      pricingLabels: null,
      plans: [
        { id: "simple299", name: "Simple 299", gb: 3, packGb: 1.5, promoGb: 1.5, price: 299, color: "#00A9A6", rrssCount: null, unlimitedRrss: true },
        { id: "simple399", name: "Simple 399", gb: 5, packGb: 2.5, promoGb: 2.5, price: 399, color: "#00B8A9", rrssCount: null, unlimitedRrss: true },
        { id: "simple599", name: "Simple 599", gb: 8, packGb: 4, promoGb: 4, price: 599, color: "#00C1D4", rrssCount: null, unlimitedRrss: true, featured: true },
        { id: "simple649", name: "Simple 649", gb: 12, packGb: 6, promoGb: 6, price: 649, color: "#009FDB", rrssCount: null, unlimitedRrss: true },
      ],
    },
    lite: {
      label: "Lite",
      hintStandard:
        "Activación · nuevas activaciones, adiciones y cambio de plan · Addon Control incluido en Lite 1–5",
      hintPortabilidad:
        "Portabilidad · renta mensual al traer tu número · descuento vs activación",
      pricingLabels: { standard: "Activación", portabilidad: "Portabilidad" },
      plans: [
        { id: "lite", name: "Lite", gb: 4, price: 299, pricePort: 270, color: "#5B9BD5", rrssCount: 3, promo: "100 GB x 6 meses" },
        { id: "lite1", name: "Lite 1", gb: 12, price: 349, pricePort: 315, color: "#4A90D9", rrssCount: 6, addon: "incluido", promo: "25% dto. renta" },
        { id: "lite2", name: "Lite 2", gb: 20, price: 449, pricePort: 360, color: "#3A86CF", rrssCount: 6, addon: "incluido", featured: true, promo: "25% dto. renta" },
        { id: "lite3", name: "Lite 3", gb: 30, price: 549, pricePort: 440, color: "#2B7CC4", rrssCount: 6, addon: "incluido", promo: "20% dto. renta" },
        { id: "lite4", name: "Lite 4", gb: 50, price: 669, pricePort: 502, color: "#1E6FB8", rrssCount: 6, addon: "incluido", promo: "20% dto. renta" },
        { id: "lite5", name: "Lite 5", gb: 120, price: 999, pricePort: 750, color: "#0F5FA8", rrssCount: 6, addon: "incluido", promo: "20% dto. renta" },
      ],
    },
  };

  let pricingMode = "standard";
  let activeFamily = "premium";

  function planLabel(p, mode) {
    const price = mode === "portabilidad" && p.pricePort ? p.pricePort : p.price;
    return `AT&T ${p.name} — ${p.gb} GB · $${price.toLocaleString("es-MX")}`;
  }

  function pricingNote(familyId, mode) {
    const family = CATALOG[familyId];
    if (!family?.pricingLabels) return "Renta mensual";
    return family.pricingLabels[mode] || family.pricingLabels.standard;
  }

  window.YAAVS_PLAN_LABELS = Object.fromEntries(
    Object.values(CATALOG).flatMap((family) =>
      family.plans.map((p) => [p.id, planLabel(p, "standard")])
    )
  );

  function money(n) {
    return `$ ${n.toLocaleString("es-MX")}`;
  }

  function addonHTML(plan) {
    if (plan.addon === "incluido") {
      return `<p class="plan__addon plan__addon--included">Addon Control incluido</p>`;
    }
    if (typeof plan.addon === "number") {
      return `<p class="plan__addon">Addon Control ${money(plan.addon)}</p>`;
    }
    return "";
  }

  function rrssHTML(plan) {
    if (plan.unlimitedRrss) {
      return `<p class="plan__rrss-label">Redes sociales ilimitadas</p>`;
    }
    const note = plan.rrssNote ? ` · ${plan.rrssNote}` : "";
    return `<p class="plan__rrss-label">${plan.rrssCount} apps a elegir${note}</p>`;
  }

  function appsSectionHTML(plan) {
    const label = rrssHTML(plan);

    if (plan.unlimitedRrss || !plan.rrssCount) {
      return `<div class="plan__seg plan__seg--rrss">${label}</div>`;
    }

    if (plan.rrssNote === "Preseleccionadas") {
      return `<div class="plan__seg plan__seg--rrss">
        ${label}
        <div class="plan__icons plan__icons--static" aria-hidden="true">${staticIconsHTML()}</div>
      </div>`;
    }

    const max = plan.rrssCount;
    return `<div class="plan__seg plan__seg--rrss">
      ${label}
      <div class="plan__apps" data-plan-apps="${plan.id}" data-apps-max="${max}">
        <p class="plan__apps-count">Toca para elegir · <span data-apps-count>0/${max}</span></p>
        <div class="plan__icons plan__icons--pick" role="group" aria-label="Elige ${max} apps">${pickerButtonsHTML()}</div>
      </div>
    </div>`;
  }

  function initAppPickers(root) {
    root.querySelectorAll("[data-plan-apps]").forEach((wrap) => {
      if (wrap.dataset.appsInit) return;
      wrap.dataset.appsInit = "1";

      const max = parseInt(wrap.dataset.appsMax, 10);
      const countSpan = wrap.querySelector("[data-apps-count]");
      const btns = [...wrap.querySelectorAll(".plan__app-btn")];

      const paint = () => {
        const selected = btns.filter((b) => b.classList.contains("is-selected"));
        if (countSpan) countSpan.textContent = `${selected.length}/${max}`;
        wrap.classList.toggle("is-complete", selected.length === max);
        const select = document.querySelector("[data-quote-select]");
        if (select?.value === wrap.dataset.planApps) {
          select.dispatchEvent(new Event("change", { bubbles: true }));
        }
      };

      btns.forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const selected = btns.filter((b) => b.classList.contains("is-selected"));
          const on = btn.classList.contains("is-selected");

          if (on) {
            btn.classList.remove("is-selected");
            btn.setAttribute("aria-pressed", "false");
          } else if (selected.length < max) {
            btn.classList.add("is-selected");
            btn.setAttribute("aria-pressed", "true");
          }
          paint();
        });
      });

      paint();
    });
  }

  function breakdownHTML(plan) {
    if (!plan.packGb || !plan.promoGb) return "";
    return `<p class="plan__breakdown">${plan.packGb} GB paquete + ${plan.promoGb} GB promo</p>`;
  }

  function badgeHTML(plan) {
    const labels = [];
    if (plan.featured) labels.push("Popular");
    if (plan.badge) labels.push(plan.badge);
    if (plan.promo && pricingMode === "standard") labels.push(plan.promo);
    if (!labels.length) return "";
    return `<div class="plan__tags">${labels.map((t) => `<p class="plan__tag">${t}</p>`).join("")}</div>`;
  }

  function cardHTML(plan, index) {
    const featured = plan.featured ? " plan--featured" : "";
    const showPort = pricingMode === "portabilidad" && plan.pricePort;
    const price = showPort ? plan.pricePort : plan.price;
    const note = pricingNote(activeFamily, pricingMode);
    const oldPrice =
      showPort && plan.pricePort < plan.price
        ? `<s class="plan__price-old">${money(plan.price)}</s>`
        : "";

    return `<article class="plan${featured} reveal" role="listitem" style="--plan:${plan.color};--i:${index}" data-plan="${plan.id}" data-gb="${plan.gb}" data-price="${price}">
      ${badgeHTML(plan)}
      <header class="plan__head">
        <span class="plan__brand">AT&amp;T</span>
        <h3>${plan.name}</h3>
      </header>
      <div class="plan__seg plan__seg--gb">
        <span class="plan__gb-kicker">Recibe en total</span>
        <strong>${plan.gb} GB</strong>
        <span class="plan__gb-sub">navegación libre</span>
        ${breakdownHTML(plan)}
      </div>
      ${appsSectionHTML(plan)}
      <div class="plan__seg plan__seg--mins">Min y SMS ilimitados<br>México · EUA · Canadá</div>
      ${addonHTML(plan) ? `<div class="plan__seg plan__seg--addon">${addonHTML(plan)}</div>` : ""}
      <div class="plan__foot">
        <span>Renta mensual · ${note}</span>
        ${oldPrice}
        <strong>${money(price)}</strong>
      </div>
      <button type="button" class="btn btn--plan" data-quote-plan="${plan.id}">Cotizar</button>
    </article>`;
  }

  function renderFamily(id) {
    const family = CATALOG[id];
    const grid = document.querySelector(`[data-plans-grid="${id}"]`);
    if (!family || !grid) return;
    grid.innerHTML = family.plans.map(cardHTML).join("");
    initAppPickers(grid);
    grid.style.setProperty("--cols", String(family.plans.length));
    grid.classList.toggle("plans--few", family.plans.length <= 4);
    grid.classList.toggle("plans--many", family.plans.length >= 8);
  }

  function renderAllFamilies() {
    Object.keys(CATALOG).forEach((id) => {
      const panel = document.querySelector(`[data-plan-panel="${id}"]`);
      if (panel?.dataset.rendered) renderFamily(id);
    });
    const active = document.querySelector("[data-plan-panel].is-active");
    if (active) revealPlans(active);
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
    window.setTimeout(showAll, 600);
  }

  function updatePricingUI(familyId) {
    const root = document.querySelector("[data-plans-catalog]");
    const family = CATALOG[familyId];
    if (!root || !family) return;

    const slot = root.querySelector("[data-pricing-slot]");
    const toggle = root.querySelector("[data-pricing-toggle]");
    const tabsBlock = root.querySelector(".plan-tabs-block");
    const hasPort = family.plans.some((p) => p.pricePort);
    const showToggle = Boolean(family.pricingLabels && hasPort);

    if (slot) slot.hidden = !showToggle;
    if (tabsBlock) {
      tabsBlock.dataset.pricingAlign = showToggle ? familyId : "";
    }

    if (family.pricingLabels) {
      const standardLabel = root.querySelector('[data-pricing-label="standard"]');
      if (standardLabel) standardLabel.textContent = family.pricingLabels.standard;
    }

    if (!showToggle && pricingMode === "portabilidad") {
      pricingMode = "standard";
    }

    root.querySelectorAll("[data-pricing-mode]").forEach((btn) => {
      const on = btn.getAttribute("data-pricing-mode") === pricingMode;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });

    if (slot) slot.dataset.activeMode = pricingMode;

    const hint = root.querySelector("[data-plan-hint]");
    if (hint) {
      hint.textContent =
        pricingMode === "portabilidad" && family.hintPortabilidad
          ? family.hintPortabilidad
          : family.hintStandard || family.hint || "";
    }
  }

  function setTab(id) {
    const root = document.querySelector("[data-plans-catalog]");
    if (!root || !CATALOG[id]) return;

    activeFamily = id;

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
        } else {
          renderFamily(id);
        }
        revealPlans(panel);
      }
    });

    updatePricingUI(id);
  }

  function setPricingMode(mode) {
    pricingMode = mode;
    const root = document.querySelector("[data-plans-catalog]");
    if (!root) return;

    root.querySelectorAll("[data-pricing-mode]").forEach((btn) => {
      const on = btn.getAttribute("data-pricing-mode") === mode;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });

    updatePricingUI(activeFamily);
    renderAllFamilies();
    fillQuoteOptions();
  }

  function fillQuoteOptions() {
    const select = document.querySelector("[data-quote-select]");
    if (!select) return;
    const current = select.value;
    const opts = ['<option value="">Selecciona un plan</option>'];
    Object.entries(CATALOG).forEach(([family, data]) => {
      opts.push(`<optgroup label="AT&T ${data.label}">`);
      data.plans.forEach((p) => {
        opts.push(`<option value="${p.id}">${planLabel(p, pricingMode)}</option>`);
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

    root.querySelectorAll("[data-pricing-mode]").forEach((btn) => {
      btn.addEventListener("click", () => setPricingMode(btn.getAttribute("data-pricing-mode")));
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
