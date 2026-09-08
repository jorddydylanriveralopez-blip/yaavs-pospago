/**
 * Equipos en promoción · financiamiento con enganche 50% y descuento por portabilidad
 * Fuente: PLANTILLA PRECIOS 1 sept.xlsx
 */
(() => {
  const WHATSAPP_NUMBER = "525522331210";
  const IMG = "assets/images/smartphones";

  const DEALS = [
    {
      id: "iphone17-pro-max",
      name: "Apple iPhone 17 Pro Max 256GB",
      image: `${IMG}/Apple%20iPhone%2017%20Pro%20Max%20256GB.png`,
      plan: "Black",
      color: "#1a1a1a",
      textColor: "#fff",
      price: 24039.72,
      planCost: 875,
      enganche: 12019.86,
      plazo: 24,
      monthlyStd: 1375.83,
      monthlyPort: 1200.83,
      flagship: true,
    },
    {
      id: "iphone17",
      name: "Apple iPhone 17 256GB",
      image: `${IMG}/Apple%20iPhone%2017%20256GB.png`,
      plan: "Black",
      color: "#1a1a1a",
      textColor: "#fff",
      price: 14989.25,
      planCost: 875,
      enganche: 7494.63,
      plazo: 24,
      monthlyStd: 1187.28,
      monthlyPort: 1012.28,
    },
    {
      id: "galaxy-s26-ultra",
      name: "Samsung Galaxy S26 Ultra 512GB",
      image: `${IMG}/Samsung%20Galaxy%20S26%20Ultra%20512GB.png`,
      plan: "Black",
      color: "#1a1a1a",
      textColor: "#fff",
      price: 15598.59,
      planCost: 875,
      enganche: 7799.3,
      plazo: 24,
      monthlyStd: 1199.97,
      monthlyPort: 1024.97,
      flagship: true,
    },
    {
      id: "galaxy-a57",
      name: "Samsung Galaxy A57 256GB",
      image: `${IMG}/Samsung%20Galaxy%20A57%20256GB.png`,
      plan: "Black",
      color: "#1a1a1a",
      textColor: "#fff",
      price: 4398.83,
      planCost: 875,
      enganche: 2199.42,
      plazo: 24,
      monthlyStd: 966.64,
      monthlyPort: 791.64,
    },
    {
      id: "moto-edge70-pro",
      name: "Motorola Moto Edge 70 Pro + Watch + Chamarra",
      image: `${IMG}/Motorola%20Moto%20Edge%2070%20Pro%20%2B%20Watch%20%2B%20Chamarra.png`,
      plan: "Black",
      color: "#1a1a1a",
      textColor: "#fff",
      price: 10899.46,
      planCost: 875,
      enganche: 5449.73,
      plazo: 24,
      monthlyStd: 1102.07,
      monthlyPort: 927.07,
    },
    {
      id: "moto-g77",
      name: "Motorola Moto G77",
      image: `${IMG}/Motorola%20Moto%20G77.png`,
      plan: "Black",
      color: "#1a1a1a",
      textColor: "#fff",
      price: 1978.95,
      planCost: 875,
      enganche: 989.48,
      plazo: 24,
      monthlyStd: 916.23,
      monthlyPort: 741.23,
    },
    {
      id: "honor-magic8-lite",
      name: "Honor Magic 8 Lite 512GB + Audífonos",
      image: `${IMG}/Honor%20Magic%208%20Lite%20512GB%205G%20Bundle%20Headphones.png`,
      plan: "Black",
      color: "#1a1a1a",
      textColor: "#fff",
      price: 3398.66,
      planCost: 875,
      enganche: 1699.33,
      plazo: 24,
      monthlyStd: 945.81,
      monthlyPort: 770.81,
    },
    {
      id: "honor-x8d",
      name: "Honor X8D",
      image: `${IMG}/Honor%20X8D.png`,
      plan: "Plata",
      color: "#a8adb0",
      textColor: "#1a1a1a",
      price: 2288.67,
      planCost: 700,
      enganche: 1144.34,
      plazo: 24,
      monthlyStd: 747.68,
      monthlyPort: 607.68,
    },
    {
      id: "xiaomi-17t-pro",
      name: "Xiaomi 17T Pro + Redmi Pad 2",
      image: `${IMG}/Xiaomi%2017T%20Pro%20Bundle%20Redmi%20Pad%202.png`,
      plan: "Black",
      color: "#1a1a1a",
      textColor: "#fff",
      price: 10799.79,
      planCost: 875,
      enganche: 5399.9,
      plazo: 24,
      monthlyStd: 1100.0,
      monthlyPort: 925.0,
    },
    {
      id: "xiaomi-17t",
      name: "Xiaomi 17T + Sound Outdoor",
      image: `${IMG}/Xiaomi%2017T%20Bundle%20Sound%20Outdoor.png`,
      plan: "Black",
      color: "#1a1a1a",
      textColor: "#fff",
      price: 7098.76,
      planCost: 875,
      enganche: 3549.38,
      plazo: 24,
      monthlyStd: 1022.89,
      monthlyPort: 847.89,
    },
    {
      id: "redmi-note17",
      name: "Xiaomi Redmi Note 17 + Sound Pocket",
      image: `${IMG}/Xiaomi%20Redmi%20Note%2017%20Bundle%20Sound%20Pocket.png`,
      plan: "Black",
      color: "#1a1a1a",
      textColor: "#fff",
      price: 1769.03,
      planCost: 700,
      enganche: 884.52,
      plazo: 24,
      monthlyStd: 736.85,
      monthlyPort: 596.85,
    },
    {
      id: "oppo-a6x",
      name: "Oppo A6x",
      image: `${IMG}/Oppo%20A6x.png`,
      plan: "Azul 3",
      color: "#009fdb",
      textColor: "#fff",
      price: 0,
      planCost: 600,
      enganche: 0,
      plazo: 36,
      monthlyStd: 600.0,
      monthlyPort: 480.0,
      free: true,
    },
  ];

  function money(n) {
    return `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function waLink(deal) {
    const lines = [
      "Hola YAAVS Pospago, me interesa esta promoción:",
      `• Equipo: ${deal.name}`,
      `• Plan: AT&T ${deal.plan}`,
      `• Precio equipo: ${deal.free ? "Gratis*" : money(deal.price)}`,
      `¿Me pueden dar más información?`,
    ];
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
  }

  function cardHTML(deal) {
    const save = deal.monthlyStd - deal.monthlyPort;
    const panelId = `deal-panel-${deal.id}`;
    return `
      <article class="deal-card${deal.flagship ? " deal-card--flagship" : ""}" role="listitem" style="--plan: ${deal.color}; --plan-text: ${deal.textColor}" data-deal-card>
        <button type="button" class="deal-card__pick" aria-expanded="false" aria-controls="${panelId}" data-deal-toggle>
          <span class="deal-card__badges">
            <span class="deal-card__plan">Plan ${deal.plan}</span>
            <span class="deal-card__ribbon">${deal.flagship ? "Top ventas" : "Promo"}</span>
          </span>
          <span class="deal-card__media">
            <img src="${deal.image}" alt="${deal.name}" width="640" height="640" loading="lazy" decoding="async">
          </span>
          <h3 class="deal-card__name">${deal.name}</h3>
          <span class="deal-card__hint">
            <span class="deal-card__hint-label" data-label-closed="Ver precios y cotizar" data-label-closed-short="Ver precios" data-label-open="Ocultar detalle">
              <span class="deal-card__hint-full">Ver precios y cotizar</span>
              <span class="deal-card__hint-short">Ver precios</span>
            </span>
            <span class="deal-card__hint-icon" aria-hidden="true">▾</span>
          </span>
        </button>
        <div class="deal-card__details" id="${panelId}" hidden data-deal-panel>
          <div class="deal-card__price">
            <span>Precio del equipo</span>
            <strong>${deal.free ? "Gratis*" : money(deal.price)}</strong>
          </div>
          <div class="deal-card__planrow">
            <span>Tarifa del plan · control incluido</span>
            <strong>${money(deal.planCost)}<small>/mes</small></strong>
          </div>
          <div class="deal-card__terms">
            <div>
              <span>Enganche 50%*</span>
              <strong>${deal.free ? "Sin enganche" : money(deal.enganche)}</strong>
            </div>
            <div>
              <span>Plazo</span>
              <strong>${deal.plazo} meses</strong>
            </div>
          </div>
          <div class="deal-card__monthly">
            <div class="deal-card__monthly-item">
              <span>Renovación</span>
              <strong>${money(deal.monthlyStd)}<small>/mes</small></strong>
            </div>
            <div class="deal-card__monthly-item deal-card__monthly-item--best">
              <span>Portabilidad −20%</span>
              <strong>${money(deal.monthlyPort)}<small>/mes</small></strong>
              <em>Ahorras ${money(save)}/mes</em>
            </div>
          </div>
          <a class="deal-card__cta deal-card__cta--wa" href="${waLink(deal)}" target="_blank" rel="noopener" data-deal-cta>
            <span class="deal-card__cta-wa" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" focusable="false"><path fill="currentColor" d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.96-.27-.1-.47-.15-.67.15-.2.29-.77.96-.95 1.16-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.29-.02-.45.13-.6.13-.13.3-.35.44-.52.15-.17.2-.29.3-.49.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.29-1.04 1.02-1.04 2.48s1.07 2.87 1.22 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35z"/><path fill="currentColor" d="M12.04 2C6.55 2 2.1 6.45 2.1 11.94c0 1.78.47 3.45 1.3 4.91L2 22l5.3-1.39c1.4.76 2.99 1.19 4.69 1.19h.01c5.49 0 9.94-4.45 9.94-9.94C21.94 6.45 17.53 2 12.04 2zm0 18.15h-.01c-1.54 0-2.99-.41-4.26-1.13l-.3-.18-3.15.82.84-3.07-.2-.32A8.12 8.12 0 013.9 11.94c0-4.48 3.65-8.13 8.14-8.13 4.48 0 8.13 3.65 8.13 8.13 0 4.49-3.65 8.21-8.13 8.21z"/></svg></span>
            Cotizar por WhatsApp
          </a>
        </div>
      </article>`;
  }

  function setOpen(card, open) {
    const toggle = card.querySelector("[data-deal-toggle]");
    const panel = card.querySelector("[data-deal-panel]");
    if (!toggle || !panel) return;
    card.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    panel.hidden = !open;
    const label = toggle.querySelector(".deal-card__hint-label");
    if (label) {
      const full = label.querySelector(".deal-card__hint-full");
      const short = label.querySelector(".deal-card__hint-short");
      const openText = label.getAttribute("data-label-open") || "Ocultar detalle";
      const closedFull = label.getAttribute("data-label-closed") || "Ver precios y cotizar";
      const closedShort = label.getAttribute("data-label-closed-short") || "Ver precios";
      if (full) full.textContent = open ? openText : closedFull;
      if (short) short.textContent = open ? openText : closedShort;
    }
  }

  function init() {
    const grid = document.querySelector("[data-deals-grid]");
    if (!grid) return;
    grid.innerHTML = DEALS.map(cardHTML).join("");

    grid.addEventListener("click", (event) => {
      const toggle = event.target.closest("[data-deal-toggle]");
      if (!toggle || !grid.contains(toggle)) return;
      const card = toggle.closest("[data-deal-card]");
      if (!card) return;
      const willOpen = !card.classList.contains("is-open");
      grid.querySelectorAll("[data-deal-card].is-open").forEach((openCard) => {
        if (openCard !== card) setOpen(openCard, false);
      });
      setOpen(card, willOpen);
      if (willOpen) {
        card.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });
  }

  init();
})();
