/* Reusable component templates. Each maps to one React component in the
   Next.js build (ProductCard, CategoryTile, ReviewCard …). */

window.AURAQ = window.AURAQ || {};

(function () {
  const stroke = 'fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"';
  const I = {
    search: `<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>`,
    user: `<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c1.2-3.8 4-5.5 7.5-5.5s6.3 1.7 7.5 5.5"/>`,
    heart: `<path d="M12 19.5s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 7a4.2 4.2 0 0 1 7.5 2.5c0 5.4-7.5 10-7.5 10z"/>`,
    bag: `<path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>`,
    menu: `<path d="M4 7h16M4 12h16M4 17h10"/>`,
    close: `<path d="M6 6l12 12M18 6L6 18"/>`,
    left: `<path d="M15 5l-7 7 7 7"/>`,
    right: `<path d="M9 5l7 7-7 7"/>`,
    arrow: `<path d="M4 12h15M14 7l5 5-5 5"/>`,
    down: `<path d="M6 9l6 6 6-6"/>`,
    plus: `<path d="M12 5v14M5 12h14"/>`,
    minus: `<path d="M5 12h14"/>`,
    play: `<path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke="none"/>`,
    truck: `<path d="M3 6.5h11v9H3zM14 9.5h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>`,
    exchange: `<path d="M5 9h13l-3.5-3.5M19 15H6l3.5 3.5"/>`,
    lock: `<rect x="5" y="10.5" width="14" height="9.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>`,
    chat: `<path d="M4.5 5.5h15v10h-9l-4 3.5v-3.5h-2z"/>`,
    globe: `<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.4 3.6 5.3 3.6 8.5s-1.1 6.1-3.6 8.5c-2.5-2.4-3.6-5.3-3.6-8.5S9.5 5.9 12 3.5z"/>`,
    instagram: `<rect x="4" y="4" width="16" height="16" rx="4.5"/><circle cx="12" cy="12" r="3.8"/><circle cx="17" cy="7" r=".6" fill="currentColor"/>`,
    facebook: `<path d="M13.5 20v-7h2.4l.4-2.8h-2.8V8.5c0-.8.3-1.4 1.4-1.4h1.5V4.6c-.3 0-1.2-.1-2.2-.1-2.2 0-3.6 1.3-3.6 3.7v2h-2.4V13h2.4v7"/>`,
    tiktok: `<path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5M14 4c.4 2.3 1.9 3.8 4.5 4"/>`,
    pinterest: `<circle cx="12" cy="12" r="8.5"/><path d="M11 9.5c0-1.5 1.2-2.4 2.6-2.4 1.6 0 2.7 1.1 2.7 2.7 0 2-1.1 3.6-2.7 3.6-.9 0-1.5-.6-1.3-1.4M11.6 12L10 19.5"/>`,
    phone: `<path d="M6.5 4h3l1.5 4-2 1.3a9 9 0 0 0 5.7 5.7l1.3-2 4 1.5v3c0 .8-.7 1.5-1.5 1.5C10.8 19 5 13.2 5 5.5 5 4.7 5.7 4 6.5 4z"/>`,
    mail: `<rect x="3.5" y="6" width="17" height="12"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/>`,
    pin: `<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>`,
    sound: `<path d="M4.5 9.5h3.5L12.5 6v12L8 14.5H4.5z"/><path d="M16 9.5c1.3 1.4 1.3 3.6 0 5M18.5 7.5c2.4 2.6 2.4 6.4 0 9"/>`,
  };
  AURAQ.icon = (name, size = 22, cls = "") =>
    `<svg class="icon ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" ${stroke} aria-hidden="true">${I[name]}</svg>`;

  const rs = n => "Rs. " + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  AURAQ.rs = rs;

  AURAQ.stars = (value = 5, size = 13) => {
    let s = "";
    for (let i = 1; i <= 5; i++) {
      const fill = value >= i - .25 ? "currentColor" : "none";
      s += `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l2.6 5.6 6 .7-4.5 4.1 1.2 6-5.3-3-5.3 3 1.2-6L3.4 9.8l6-.7z" fill="${fill}" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>`;
    }
    return `<span class="rating" role="img" aria-label="${value} out of 5 stars">${s}</span>`;
  };

  const badgeText = { new: "New", sale: "Sale", soldout: "Sold Out" };
  AURAQ.badge = type => type ? `<span class="badge badge--${type}">${badgeText[type]}</span>` : "";

  AURAQ.wishlist = (on = false) =>
    `<button class="wish ${on ? "is-on" : ""}" aria-pressed="${on}" aria-label="${on ? "Remove from" : "Add to"} wishlist">${AURAQ.icon("heart", 20)}</button>`;

  /* Product Card — variants: default | hover | sale | new | soldout.
     opts.state forces a visual state for the component sheet. */
  AURAQ.productCard = (p, opts = {}) => {
    const variant = p.badge || "default";
    const state = opts.state ? `is-${opts.state}` : "";
    const off = p.compare ? Math.round((1 - p.price / p.compare) * 100) : 0;
    const soldout = p.badge === "soldout";
    const quick = soldout
      ? `<button class="pcard__quick pcard__quick--notify">Notify Me When Available</button>`
      : `<div class="pcard__quick" aria-label="Quick add">
           <span class="pcard__quick-label">Quick Add</span>
           <div class="pcard__sizes">${(p.sizes || []).map(s => `<button data-add="${p.id}" data-size="${s}">${s}</button>`).join("")}</div>
         </div>`;
    return `
    <article class="pcard pcard--${variant} ${state}" data-id="${p.id}">
      <div class="pcard__media">
        <a href="#" class="pcard__img" aria-label="${p.name}">${AURAQ.art(p.art, { slot: "product-" + p.id, label: p.name })}</a>
        <div class="pcard__img pcard__img--alt" aria-hidden="true">${AURAQ.art(p.art, { slot: "product-" + p.id + "-2", alt: true })}</div>
        ${AURAQ.badge(p.badge)}
        ${AURAQ.wishlist(opts.wished)}
        ${quick}
        ${soldout ? "" : `<button class="pcard__plus" data-add="${p.id}" data-size="M" aria-label="Quick add ${p.name}">${AURAQ.icon("plus", 18)}</button>`}
      </div>
      <div class="pcard__info">
        <div class="pcard__row">
          <h3 class="pcard__name"><a href="#">${p.name}</a></h3>
          ${p.rating && opts.rating !== false ? `<span class="pcard__rating" aria-label="Rated ${p.rating} from ${p.reviews} reviews"><svg width="11" height="11" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l2.6 5.6 6 .7-4.5 4.1 1.2 6-5.3-3-5.3 3 1.2-6L3.4 9.8l6-.7z" fill="currentColor"/></svg>${p.rating.toFixed(1)} <span>(${p.reviews})</span></span>` : ""}
        </div>
        <p class="pcard__line">${p.line}</p>
        <p class="pcard__price">
          <span class="${p.compare ? "is-sale" : ""}">${rs(p.price)}</span>
          ${p.compare ? `<s>${rs(p.compare)}</s><span class="pcard__off">−${off}%</span>` : ""}
        </p>
        ${p.colors && p.colors.length > 1 ? `<ul class="swatches" aria-label="Available colours">${p.colors.map((c, i) => `<li><span style="background:${c}" class="${i === 0 ? "is-active" : ""}"></span></li>`).join("")}</ul>` : ""}
      </div>
    </article>`;
  };

  AURAQ.categoryTile = (c, i) => `
    <a href="#" class="ctile">
      <div class="ctile__img">${AURAQ.art(c.art, { slot: "category-" + i, label: c.name })}</div>
      <div class="ctile__meta">
        <h3 class="ctile__name">${c.name}</h3>
        <span class="ctile__count">${c.count} styles</span>
      </div>
    </a>`;

  AURAQ.reviewCard = r => `
    <article class="rcard">
      ${AURAQ.stars(5, 14)}
      <h3 class="rcard__title">“${r.title}”</h3>
      <p class="rcard__body">${r.body}</p>
      <footer class="rcard__meta">
        <div><strong>${r.name}</strong><span>${r.city}</span></div>
        <span class="rcard__verified">${AURAQ.icon("lock", 13)} Verified Buyer</span>
      </footer>
      <p class="rcard__product">Purchased: <a href="#">${r.product}</a></p>
    </article>`;

  AURAQ.miniProduct = (p, n) => `
    <article class="mini" data-look="${p.id}">
      <span class="mini__num">0${n}</span>
      <a href="#" class="mini__img">${AURAQ.art(p.art, { slot: "product-" + p.id, label: p.name })}</a>
      <div class="mini__info">
        <h3 class="mini__name">${p.name}</h3>
        <p class="mini__line">${p.line}</p>
        <p class="mini__price">${rs(p.price)}</p>
        <a href="#" class="btn-text">View Product ${AURAQ.icon("arrow", 16)}</a>
      </div>
    </article>`;
})();
