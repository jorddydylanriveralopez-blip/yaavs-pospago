/**
 * Equipos Premium · catálogo típico de tienda + modal beneficio YAAVS
 */
(() => {
  const PREMIUM_IDS = new Set([
    "azul",
    "azul1",
    "azul2",
    "azul3",
    "plata",
    "oro",
    "black",
    "platino",
    "diamante",
    "titanio",
  ]);

  const DEVICES = [
    {
      id: "iphone16",
      brand: "Apple",
      name: "iPhone 16",
      tag: "Flagship",
      blurb: "El más pedido en tienda",
      img: "assets/phones/iphone-16.jpg",
    },
    {
      id: "iphone15",
      brand: "Apple",
      name: "iPhone 15",
      tag: "Popular",
      blurb: "Excelente relación precio / rendimiento",
      img: "assets/phones/iphone-15.jpg",
    },
    {
      id: "galaxy-a55",
      brand: "Samsung",
      name: "Galaxy A55",
      tag: "Más vendido",
      blurb: "Gama media que siempre hay en piso",
      img: "assets/phones/galaxy-a55.jpg",
    },
    {
      id: "galaxy-s24",
      brand: "Samsung",
      name: "Galaxy S24",
      tag: "Premium",
      blurb: "Alta gama para planes Oro / Black+",
      img: "assets/phones/galaxy-s24.jpg",
    },
    {
      id: "motorola-g",
      brand: "Motorola",
      name: "Moto G",
      tag: "Entrada",
      blurb: "Opción accesible en todas las sucursales",
      img: "assets/phones/motorola-g.jpg",
    },
    {
      id: "redmi-note",
      brand: "Xiaomi",
      name: "Redmi Note",
      tag: "Valor",
      blurb: "Batería y pantalla grandes",
      img: "assets/phones/redmi-note.jpg",
    },
    {
      id: "oppo-a",
      brand: "OPPO",
      name: "OPPO A",
      tag: "Alternativa",
      blurb: "Diseño y carga rápida en piso",
      img: "assets/phones/oppo-a.jpg",
    },
  ];

  window.YAAVS_DEVICE_LABELS = Object.fromEntries(
    DEVICES.map((d) => [d.id, `${d.brand} ${d.name}`])
  );
  window.YAAVS_IS_PREMIUM_PLAN = (id) => PREMIUM_IDS.has(id);

  let activePlanId = null;
  let selectedDeviceId = null;

  function planLabel(id) {
    return (window.YAAVS_PLAN_LABELS && window.YAAVS_PLAN_LABELS[id]) || id;
  }

  function ensureModal() {
    let modal = document.querySelector("[data-device-modal]");
    if (modal) return modal;

    modal = document.createElement("div");
    modal.className = "device-modal";
    modal.setAttribute("data-device-modal", "");
    modal.setAttribute("hidden", "");
    modal.innerHTML = `
      <div class="device-modal__backdrop" data-device-close tabindex="-1"></div>
      <div class="device-modal__sheet" role="dialog" aria-modal="true" aria-labelledby="device-modal-title">
        <button type="button" class="device-modal__close" data-device-close aria-label="Cerrar">×</button>
        <div class="device-modal__benefit">
          <p class="device-modal__benefit-kicker">Beneficio YAAVS</p>
          <p class="device-modal__benefit-title">Activa con nosotros y estrena equipo en tienda</p>
          <ul class="device-modal__perks">
            <li>Stock de los modelos que más se mueven en AT&amp;T</li>
            <li>Asesoría personalizada sin costo extra</li>
            <li>Activación / portabilidad el mismo día</li>
            <li>Te armamos la cotización plan + smartphone</li>
          </ul>
        </div>
        <header class="device-modal__head">
          <p class="eyebrow">AT&amp;T Premium · con equipo</p>
          <h3 id="device-modal-title">Elige tu smartphone</h3>
          <p data-device-plan-label></p>
        </header>
        <div class="device-grid" data-device-grid role="list"></div>
        <footer class="device-modal__foot">
          <button type="button" class="btn btn--ghost" data-device-skip>Continuar sin equipo / propio</button>
          <button type="button" class="btn btn--primary" data-device-confirm disabled>Cotizar con este equipo</button>
        </footer>
        <p class="device-modal__note">Equipos de referencia en tiendas. Disponibilidad, colores y precios sujetos a inventario y plan.</p>
      </div>
    `;
    document.body.appendChild(modal);

    const grid = modal.querySelector("[data-device-grid]");
    grid.innerHTML = DEVICES.map(
      (d) => `
      <button type="button" class="device-card" role="listitem" data-device-id="${d.id}" aria-pressed="false">
        <span class="device-card__tag">${d.tag}</span>
        <span class="device-card__media">
          <img src="${d.img}" alt="${d.brand} ${d.name}" width="320" height="420" loading="lazy">
        </span>
        <span class="device-card__brand">${d.brand}</span>
        <strong class="device-card__name">${d.name}</strong>
        <span class="device-card__blurb">${d.blurb}</span>
      </button>`
    ).join("");

    modal.addEventListener("click", (e) => {
      if (e.target.closest("[data-device-close]")) {
        closeModal();
        return;
      }
      const card = e.target.closest("[data-device-id]");
      if (card) {
        selectDevice(card.getAttribute("data-device-id"));
        return;
      }
      if (e.target.closest("[data-device-confirm]")) {
        goToQuote(selectedDeviceId);
        return;
      }
      if (e.target.closest("[data-device-skip]")) {
        goToQuote(null);
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !modal.hasAttribute("hidden")) closeModal();
    });

    return modal;
  }

  function selectDevice(id) {
    selectedDeviceId = id;
    const modal = ensureModal();
    modal.querySelectorAll("[data-device-id]").forEach((card) => {
      const on = card.getAttribute("data-device-id") === id;
      card.classList.toggle("is-selected", on);
      card.setAttribute("aria-pressed", on ? "true" : "false");
    });
    const confirm = modal.querySelector("[data-device-confirm]");
    if (confirm) confirm.disabled = !id;
  }

  function openModal(planId) {
    activePlanId = planId;
    selectedDeviceId = null;
    const modal = ensureModal();
    const label = modal.querySelector("[data-device-plan-label]");
    if (label) label.textContent = planLabel(planId);
    selectDevice(null);
    modal.removeAttribute("hidden");
    document.body.classList.add("is-modal-open");
    modal.querySelector(".device-modal__close")?.focus();
  }

  function closeModal() {
    const modal = document.querySelector("[data-device-modal]");
    if (!modal) return;
    modal.setAttribute("hidden", "");
    document.body.classList.remove("is-modal-open");
  }

  function goToQuote(deviceId) {
    const select = document.querySelector("[data-quote-select]");
    const deviceInput = document.querySelector("[data-quote-device]");
    const interes = document.querySelector('select[name="interes"]');
    if (select && activePlanId) {
      select.value = activePlanId;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
    if (deviceInput) {
      deviceInput.value = deviceId || "";
      deviceInput.dispatchEvent(new Event("change", { bubbles: true }));
    }
    if (interes) {
      interes.value = deviceId ? "equipo" : interes.value || "activar";
    }
    closeModal();
    document.querySelector("#cotizar")?.scrollIntoView({ behavior: "smooth" });
  }

  function enhancePremiumCards() {
    document.querySelectorAll('[data-plans-grid="premium"] .plan').forEach((card) => {
      const id = card.getAttribute("data-plan");
      if (!id || !PREMIUM_IDS.has(id)) return;
      if (!card.querySelector(".plan__equip-badge")) {
        const badge = document.createElement("p");
        badge.className = "plan__equip-badge";
        badge.textContent = "Con equipo";
        card.appendChild(badge);
      }
      const btn = card.querySelector("[data-quote-plan]");
      if (btn) {
        btn.removeAttribute("data-quote-plan");
        btn.setAttribute("data-open-devices", id);
        btn.textContent = "Ver equipos";
      }
    });
  }

  const origRenderObserver = new MutationObserver(() => enhancePremiumCards());

  function init() {
    ensureModal();
    enhancePremiumCards();

    const premiumGrid = document.querySelector('[data-plans-grid="premium"]');
    if (premiumGrid) {
      origRenderObserver.observe(premiumGrid, { childList: true });
    }

    document.addEventListener("click", (e) => {
      const openBtn = e.target.closest("[data-open-devices]");
      if (openBtn) {
        e.preventDefault();
        e.stopPropagation();
        const planId = openBtn.getAttribute("data-open-devices");
        if (window.YAAVS_getPlanAppsMax?.(planId) > 0) {
          const max = window.YAAVS_getPlanAppsMax(planId);
          const apps = window.YAAVS_getSelectedApps?.(planId) || [];
          if (apps.length < max) {
            window.alert(`Selecciona ${max} apps en tu plan antes de ver equipos.`);
            document.querySelector(`[data-plan-apps="${planId}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
            return;
          }
        }
        openModal(planId);
        return;
      }
      const planCard = e.target.closest('[data-plans-grid="premium"] .plan');
      if (planCard && !e.target.closest("button") && !e.target.closest("[data-plan-apps]")) {
        const id = planCard.getAttribute("data-plan");
        if (id) openModal(id);
      }
    });
  }

  init();
})();
