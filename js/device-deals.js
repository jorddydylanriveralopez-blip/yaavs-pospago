/**
 * Equipos en promoción · financiamiento con enganche 50% y descuento por portabilidad
 * Fuente: PLANTILLA PRECIOS 1 sept.xlsx
 */
(() => {
  const WHATSAPP_NUMBER = "525522331210";

  const DEALS = [
    {
      id: "iphone17-pro-max",
      name: "Apple iPhone 17 Pro Max 256GB",
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
    return `
      <article class="deal-card${deal.flagship ? " deal-card--flagship" : ""}" role="listitem" style="--plan: ${deal.color}; --plan-text: ${deal.textColor}">
        <span class="deal-card__ribbon">${deal.flagship ? "Top ventas" : "Promo"}</span>
        <span class="deal-card__plan">Plan ${deal.plan}</span>
        <h3 class="deal-card__name">${deal.name}</h3>
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
        <a class="deal-card__cta" href="${waLink(deal)}" target="_blank" rel="noopener">
          Cotizar por WhatsApp
        </a>
      </article>`;
  }

  function init() {
    const grid = document.querySelector("[data-deals-grid]");
    if (!grid) return;
    grid.innerHTML = DEALS.map(cardHTML).join("");
  }

  init();
})();
