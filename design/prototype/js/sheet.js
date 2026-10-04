/* Component sheet: renders each component with its variants/states. */
(function () {
  const A = window.AURAQ;
  const root = document.getElementById("sheet");
  const sections = [];
  const sec = (id, title, note, body) => sections.push({ id, title, html: `
    <section class="ss" id="${id}">
      <div class="ss__head"><h2 class="ss__title">${title}</h2>${note ? `<p class="ss__note">${note}</p>` : ""}</div>
      ${body}
    </section>` });
  const group = (label, html) => `<div class="ss__group"><p class="ss__label">${label}</p>${html}</div>`;
  const cell = (name, html, cls = "") => `<div class="cell ${cls}">${html}<span class="cell__name">${name}</span></div>`;
  const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  /* ---------- Foundations ---------- */
  const colors = [
    ["Color / Background / Primary", "--color-background-primary"], ["Color / Background / Secondary", "--color-background-secondary"],
    ["Color / Background / Tertiary", "--color-background-tertiary"], ["Color / Background / Inverse", "--color-background-inverse"],
    ["Color / Pastel / Blush", "--color-pastel-blush"], ["Color / Pastel / Rose", "--color-pastel-rose"], ["Color / Pastel / Sage", "--color-pastel-sage"],
    ["Color / Pastel / Powder", "--color-pastel-powder"], ["Color / Pastel / Lavender", "--color-pastel-lavender"], ["Color / Pastel / Beige", "--color-pastel-beige"],
    ["Color / Text / Primary", "--color-text-primary"], ["Color / Text / Secondary", "--color-text-secondary"], ["Color / Text / Muted", "--color-text-muted"],
    ["Color / Text / Sale", "--color-text-sale"], ["Color / Border / Subtle", "--color-border-subtle"], ["Color / Border / Default", "--color-border-default"],
    ["Color / Action / Primary Hover", "--color-action-primary-hover"], ["Color / Status / Success", "--color-status-success"],
  ];
  sec("colors", "Colour", "Pastels are surfaces only — never text. All text pairs meet WCAG AA (4.5:1) on Background / Primary.",
    `<div class="swatch-grid">${colors.map(([n, v]) => `<div><div class="swatch__chip" style="background:var(${v})"></div><p class="swatch__name">${n.replace("Color / ", "")}</p><p class="swatch__hex">${css(v).toUpperCase()}</p></div>`).join("")}</div>`);

  const typeRows = [
    ["Type / Display / XL", "104 / 100% · Bryn Vogue", `font:400 104px/1 var(--font-display);letter-spacing:-.01em`, "The Festive Edit"],
    ["Type / Display / L", "80 / 100% · Bryn Vogue", `font:400 80px/1 var(--font-display)`, "A Study in Elegance"],
    ["Type / Heading / XL", "60 / 105% · Bryn Vogue", `font:400 60px/1.05 var(--font-display)`, "Crafted for Every Celebration"],
    ["Type / Heading / L", "44 / 110% · Bryn Vogue · Caps +4%", `font:400 44px/1.1 var(--font-display);text-transform:uppercase;letter-spacing:.04em`, "New Arrivals"],
    ["Type / Heading / M", "34 / 115% · Bryn Vogue", `font:400 34px/1.15 var(--font-display)`, "Mehr-o-Mah"],
    ["Type / Heading / S", "26 / 120% · Bryn Vogue", `font:400 26px/1.2 var(--font-display)`, "Luxury Pret"],
    ["Type / UI / Nav", "13 / 16 · Jost 500 · Caps +16%", `font:500 13px/16px var(--font-ui);letter-spacing:.16em;text-transform:uppercase`, "Ready to Wear"],
    ["Type / UI / Button", "13 / 16 · Jost 500 · Caps +18%", `font:500 13px/16px var(--font-ui);letter-spacing:.18em;text-transform:uppercase`, "Shop the Collection"],
    ["Type / UI / Label", "12 / 16 · Jost 500 · Caps +20%", `font:500 12px/16px var(--font-ui);letter-spacing:.2em;text-transform:uppercase`, "The Signature Collection"],
    ["Type / UI / Large", "18 / 26 · Jost 400", `font:400 18px/26px var(--font-ui)`, "Rs. 30,350"],
    ["Type / UI / Medium", "15 / 22 · Jost 500", `font:500 15px/22px var(--font-ui);letter-spacing:.02em`, "Gul-e-Nar"],
    ["Type / UI / Small", "13 / 18 · Jost 400", `font:400 13px/18px var(--font-ui);letter-spacing:.04em`, "Ready to Wear · 2 Piece"],
    ["Type / Body / Large", "17 / 170% · Open Sans", `font:400 17px/1.7 var(--font-body)`, "Be the first to discover new collections, exclusive launches and private offers."],
    ["Type / Body / Regular", "15 / 165% · Open Sans", `font:400 15px/1.65 var(--font-body)`, "The embroidery on the neckline is so finely done and the organza dupatta drapes perfectly."],
    ["Type / Body / Small", "13 / 160% · Open Sans", `font:400 13px/1.6 var(--font-body)`, "Shipping and taxes calculated at checkout."],
  ];
  const mobileType = [
    ["Type / Mobile / Display XL", "54 / 100%", `font:400 54px/1 var(--font-display)`, "The Festive Edit"],
    ["Type / Mobile / Heading L", "34 / 110% · Caps", `font:400 34px/1.1 var(--font-display);text-transform:uppercase;letter-spacing:.04em`, "New Arrivals"],
    ["Type / Mobile / Heading M", "28 / 115%", `font:400 28px/1.15 var(--font-display)`, "Mehr-o-Mah"],
    ["Type / Mobile / UI Nav", "14 / 20 · Caps +14%", `font:500 14px/20px var(--font-ui);letter-spacing:.14em;text-transform:uppercase`, "Unstitched"],
    ["Type / Mobile / UI Medium", "14 / 20 · Jost 500", `font:500 14px/20px var(--font-ui)`, "Neelofar"],
  ];
  const typeHTML = rows => rows.map(([n, m, st, t]) => `<div class="type-row"><div class="type-row__meta"><strong>${n}</strong>${m}</div><div style="${st}">${t}</div></div>`).join("");
  sec("type", "Typography", "Bryn Vogue renders with Bodoni Moda as fallback until the licensed font files are added to /fonts.",
    group("Desktop / Tablet", typeHTML(typeRows)) + group("Mobile — separate scale, not a blind shrink", typeHTML(mobileType)));

  const spaces = [["2XS", 4], ["XS", 8], ["S", 12], ["M", 16], ["L", 24], ["XL", 32], ["2XL", 48], ["3XL", 64], ["4XL", 96], ["5XL", 128]];
  sec("layout", "Spacing, Radius, Shadow & Grid", "Section rhythm: 128 desktop · 96 tablet · 64 mobile.",
    group("Spacing", `<div class="row" style="align-items:flex-end">${spaces.map(([n, v]) => cell(`Spacing / ${n} · ${v}`, `<div class="space-bar" style="width:${v}px"></div>`)).join("")}</div>`) +
    group("Radius", `<div class="row">${[["None", 0], ["XS", 2], ["S", 4], ["Full", 999]].map(([n, v]) => cell(`Radius / ${n} · ${v === 999 ? "999" : v}`, `<div class="radius-box" style="border-radius:${v}px"></div>`)).join("")}</div>`) +
    group("Shadow", `<div class="row board">${[["XS", "--shadow-xs"], ["S", "--shadow-s"], ["Overlay", "--shadow-overlay"]].map(([n, v]) => cell(`Shadow / ${n}`, `<div class="shadow-box" style="box-shadow:var(${v})"></div>`)).join("")}</div>`) +
    group("Grid", [["Desktop · 1440 · 12 col · 64 margin · 24 gutter", 12, 24], ["Tablet · 1024 · 8 col · 40 margin · 20 gutter", 8, 20], ["Mobile · 390 · 4 col · 16 margin · 12 gutter", 4, 12]]
      .map(([n, c, g]) => cell(`Grid / ${n}`, `<div class="grid-demo" style="grid-template-columns:repeat(${c},1fr);gap:${g}px;width:${c === 4 ? 390 : c === 8 ? 760 : 1100}px;padding:0 ${c === 4 ? 16 : c === 8 ? 28 : 40}px">${"<span></span>".repeat(c)}</div>`)).join("")));

  /* ---------- Buttons & small controls ---------- */
  sec("buttons", "Buttons", "Square corners, uppercase Jost. Hover darkens Primary, fills Secondary, and nudges the Text-button arrow 4px.",
    group("Button / Primary", `<div class="row">${cell("State=Default", `<a class="btn btn--primary">Shop the Collection</a>`)}${cell("State=Hover", `<a class="btn btn--primary is-hover">Shop the Collection</a>`)}${cell("State=Disabled", `<a class="btn btn--primary is-disabled">Sold Out</a>`)}</div>`) +
    group("Button / Secondary", `<div class="row">${cell("State=Default", `<a class="btn btn--secondary">View All Best Sellers</a>`)}${cell("State=Hover", `<a class="btn btn--secondary is-hover">View All Best Sellers</a>`)}</div>`) +
    group("Button / Light — on photography", `<div class="row board board--dark">${cell("State=Default", `<a class="btn btn--light">Discover the Collection</a>`)}${cell("State=Hover", `<a class="btn btn--light is-hover">Discover the Collection</a>`)}</div>`) +
    group("Button / Text", `<div class="row">${cell("State=Default", `<a class="btn-text">View All ${A.icon("arrow", 16)}</a>`)}${cell("State=Hover", `<a class="btn-text is-hover">View All ${A.icon("arrow", 16)}</a>`)}</div>`));

  sec("controls", "Badges, Rating, Wishlist & Bag Count", "",
    `<div class="row">
      ${cell("Badge / New", A.badge("new").replace("badge ", "badge badge--static "))}
      ${cell("Badge / Sale", A.badge("sale").replace("badge ", "badge badge--static "))}
      ${cell("Badge / Sold Out", A.badge("soldout").replace("badge ", "badge badge--static "))}
      ${cell("Rating / 5", A.stars(5, 14))}
      ${cell("Rating / 4.5", A.stars(4.5, 14))}
      ${cell("Wishlist / Unselected", `<div style="position:relative;width:40px;height:40px">${A.wishlist(false)}</div>`)}
      ${cell("Wishlist / Selected", `<div style="position:relative;width:40px;height:40px">${A.wishlist(true)}</div>`)}
      ${cell("Bag Count / Empty", `<button class="hbtn">${A.icon("bag")}</button>`)}
      ${cell("Bag Count / 2", `<button class="hbtn">${A.icon("bag")}<span class="count">2</span></button>`)}
      ${cell("Bag Count / 12", `<button class="hbtn">${A.icon("bag")}<span class="count">12</span></button>`)}
      ${cell("Quantity", `<div class="qty" style="margin:0"><button>${A.icon("minus", 14)}</button><span>1</span><button>${A.icon("plus", 14)}</button></div>`)}
    </div>`);

  /* ---------- Product card ---------- */
  const P = A.byId;
  sec("product-card", "Product Card", "One component, five variants. Hover = secondary image + Quick Add sizes. Mobile replaces hover with a 36px “+” touch target.",
    `<div class="row">
      ${cell("Product Card / Default", A.productCard({ ...P["zarrin"], rating: null }, {}), "pcard-fixed")}
      ${cell("Product Card / Hover", A.productCard({ ...P["mehtab"], badge: null }, { state: "hover" }), "pcard-fixed")}
      ${cell("Product Card / Sale", A.productCard(P["gul-e-nar"]), "pcard-fixed")}
      ${cell("Product Card / New", A.productCard(P["neelofar"]), "pcard-fixed")}
      ${cell("Product Card / Sold Out", A.productCard(P["saba"], { state: "hover" }), "pcard-fixed")}
      ${cell("Product Card / Wishlisted", A.productCard(P["afsana"], { wished: true }), "pcard-fixed")}
      ${cell("Product Card / Mobile", A.productCard(P["shirin"]), "pcard-mobile")}
    </div>`);

  /* ---------- Editorial components ---------- */
  sec("editorial", "Collection Card, Category Tile, Shop-the-Look Item, Video Card", "",
    `<div class="row">
      ${cell("Collection Card / Secondary", `<a class="story"><div class="story__img">${A.art(A.campaigns[1].art)}</div><div class="story__meta"><div><h3 class="story__title story__title--s">Mehr-o-Mah</h3><p class="story__sub">Luxury pret in moonlit pastels.</p></div><span class="btn-text">Shop Now ${A.icon("arrow", 16)}</span></div></a>`, "story-fixed")}
      ${cell("Category Tile", A.categoryTile(A.categories[2], 2), "ctile-fixed")}
      ${cell("Video Card / Default", videoCard(0, false), "vcard-fixed")}
      ${cell("Video Card / Hover", videoCard(1, true), "vcard-fixed")}
    </div>
    <div class="row" style="margin-top:40px">
      ${cell("Look Item / Default", A.miniProduct(P["sitara-kurta"], 1), "mini-fixed")}
      ${cell("Look Item / Active (hotspot hovered)", A.miniProduct(P["sitara-dupatta"], 2).replace('class="mini"', 'class="mini is-active"'), "mini-fixed")}
      ${cell("Hotspot / Default · Active", `<div class="board board--dark" style="position:relative;width:260px;height:120px">
        <span class="hotspot" style="left:20%;top:50%"><span class="hotspot__dot">1</span></span>
        <span class="hotspot is-active" style="left:48%;top:50%"><span class="hotspot__dot">2</span><span class="hotspot__tip"><strong>Sitara Dupatta</strong><span>Rs. 6,950</span></span></span></div>`)}
    </div>`);
  function videoCard(i, hover) {
    const v = A.videos[i], p = P[v.id];
    return `<article class="vcard ${hover ? "is-hover" : ""}"><div class="vcard__art">${A.art(v.art, { portrait: true })}</div>
      <div class="vcard__top"><span class="vcard__chip">${v.duration}</span><span class="vcard__chip">${A.icon("sound", 14)}</span></div>
      <button class="vcard__play">${A.icon("play", 22)}</button><span class="vcard__label">${p.name}</span>
      <div class="vcard__shop"><div class="vcard__thumb">${A.art(p.art)}</div><div><p class="vcard__name">${p.name}</p><p class="vcard__price">${A.rs(p.price)}</p><a class="btn-text">Shop Now ${A.icon("arrow", 14)}</a></div></div></article>`;
  }

  sec("reviews", "Review Card", "",
    `<div class="row">${cell("Review Card", A.reviewCard(A.reviews[0]), "rcard-fixed")}${cell("Review Card", A.reviewCard(A.reviews[2]), "rcard-fixed")}</div>`);

  /* ---------- Inputs ---------- */
  const field = (state, value = "", msg = "") => `<form class="field-inline" style="width:520px" onsubmit="return false">
      <div class="field ${state === "focus" ? "is-focus" : ""} ${state === "error" ? "is-error" : ""}"><input class="field__input" placeholder=" " value="${value}"><label class="field__label">Email Address</label></div>
      <button class="btn btn--primary">Subscribe</button>
      <p class="field__msg ${state === "error" ? "is-error-msg" : state === "success" ? "is-success-msg" : ""}">${msg}</p></form>`;
  sec("inputs", "Inputs, Newsletter Field & Dropdown", "Underline inputs with floating labels. Error and success messages use Open Sans 13.",
    group("Newsletter Field", `<div class="row">
      ${cell("State=Default", field("default"))}
      ${cell("State=Focus", field("focus"))}
      ${cell("State=Filled", field("filled", "hira.ahmed@gmail.com"))}
      ${cell("State=Error", field("error", "hira.ahmed@", "Please enter a valid email address."))}
      ${cell("State=Success", field("success", "", "Welcome to our world. Check your inbox for a note from us."))}
    </div>`) +
    group("Dropdown / Country & Currency", `<div class="row">
      ${cell("State=Closed", `<div class="dropdown"><button class="dropdown__btn">${A.icon("globe", 16)} Pakistan · PKR Rs. ${A.icon("down", 14)}</button></div>`)}
      ${cell("State=Open", `<div class="dropdown is-open"><button class="dropdown__btn">${A.icon("globe", 16)} Pakistan · PKR Rs. ${A.icon("down", 14)}</button>
        <ul class="dropdown__list"><li aria-selected="true">Pakistan · PKR Rs.</li><li>United Kingdom · GBP £</li><li>United States · USD $</li><li>UAE · AED</li></ul></div>`)}
    </div>`));

  /* ---------- Navigation ---------- */
  const navItems = (hoverIdx) => A.nav.map((n, i) => `<li class="nav__item ${i === hoverIdx ? "is-active" : ""}"><a class="nav__link ${n.sale ? "nav__link--sale" : ""}">${n.label}</a></li>`).join("");
  const headerHTML = (hoverIdx = -1) => `
    <div class="announce"><div class="announce__inner container"><span class="announce__side">Customer care: +92 42 111 287 727</span>
      <div class="announce__center"><button class="announce__arrow">‹</button><p class="announce__msg">${A.announcements[0]}</p><button class="announce__arrow">›</button></div>
      <span class="announce__side announce__side--right">Pakistan (PKR Rs.) ▾</span></div></div>
    <header class="header"><div class="header__bar container">
      <div class="header__left"><button class="hbtn js-open-search">${A.icon("search")}<span class="hbtn__label">Search</span></button></div>
      <a class="logo"><span class="logo__word">AURAQ</span><span class="logo__sub">Lahore</span></a>
      <div class="header__right"><button class="hbtn">${A.icon("user")}</button><button class="hbtn">${A.icon("heart")}</button><button class="hbtn">${A.icon("bag")}<span class="count">2</span></button></div>
    </div><nav class="nav"><ul class="nav__list container">${navItems(hoverIdx)}</ul></nav></header>`;
  const megaHTML = `<div class="mega is-open"><div class="mega__inner container">
      <div class="mega__col"><p class="mega__title">Shop by Category</p><ul>${A.mega.categories.map(c => `<li><a>${c}</a></li>`).join("")}</ul></div>
      <div class="mega__col"><p class="mega__title">Shop by Collection</p><ul>${A.mega.collections.map(c => `<li><a>${c}</a></li>`).join("")}</ul></div>
      <div class="mega__col"><p class="mega__title">Discover</p><ul>${A.mega.more.map(c => `<li><a>${c}</a></li>`).join("")}</ul><a class="btn-text mega__all">View All ${A.icon("arrow", 16)}</a></div>
      <div class="mega__features">${A.mega.features.map(f => `<a class="mega__feature"><div class="mega__feature-img">${A.art(f.art, { portrait: true })}</div><p>${f.title}</p><span>${f.sub}</span></a>`).join("")}</div>
    </div></div>`;
  sec("header", "Announcement Bar, Header & Navigation", "Nav hover: 1px underline scales in from the centre (280ms). Header compacts from 84 → 68px on scroll.",
    group("Header / Default", `<div class="frame" style="width:1440px;max-width:100%">${headerHTML()}</div>`) +
    group("Header / Nav Hover + Mega Menu Open", `<div class="frame" style="width:1440px;max-width:100%">${headerHTML(1)}${megaHTML}</div>`));

  const searchHTML = q => {
    const hits = A.products.filter(p => p.art.kind === "figure" && (p.name + " " + p.line).toLowerCase().includes(q.toLowerCase())).slice(0, 4);
    return `<div class="search is-open"><div class="search__inner container">
      <div class="search__bar">${A.icon("search")}<input class="search__input" value="${q}" placeholder="Search products..."><button class="hbtn">${A.icon("close")}</button></div>
      <div class="search__body"><aside class="search__side"><p class="eyebrow">Trending Searches</p><ul class="search__trending">${A.trending.map(t => `<li><button>${t}</button></li>`).join("")}</ul>
        <p class="eyebrow">Popular Categories</p><ul class="search__links"><li><a>New Arrivals</a></li><li><a>Ready to Wear</a></li><li><a>Formal</a></li><li><a>Best Sellers</a></li></ul></aside>
      <div class="search__results"><div class="search__results-head"><p class="eyebrow">${q ? `${hits.length} results for “${q}”` : "Just In"}</p>${q ? `<a class="btn-text">View all results ${A.icon("arrow", 16)}</a>` : ""}</div>
        <div class="search__grid">${(q ? hits : A.newArrivals.map(id => P[id])).map(p => `<a class="sresult"><div class="sresult__img">${A.art(p.art)}</div><p class="sresult__name">${q ? p.name.replace(new RegExp(`(${q})`, "i"), "<mark>$1</mark>") : p.name}</p><p class="sresult__price">${p.line}</p><p class="sresult__amount">${A.rs(p.price)}</p></a>`).join("")}</div></div></div>
    </div></div>`;
  };
  sec("search", "Search Overlay", "Drops from the top over a 40% charcoal scrim. Results update per keystroke; matches highlighted in blush.",
    group("Search / Empty", `<div class="frame" style="width:1440px;max-width:100%">${searchHTML("")}</div>`) +
    group("Search / Typing", `<div class="frame" style="width:1440px;max-width:100%">${searchHTML("Luxury")}</div>`));

  const bagHTML = `<aside class="drawer drawer--right is-open"><div class="drawer__head"><p class="drawer__title">Your Bag (2)</p><button class="hbtn">${A.icon("close")}</button></div>
    <div class="ship-progress"><p>You’ve unlocked <strong>complimentary delivery</strong></p><div class="ship-progress__bar"><span style="width:100%"></span></div></div>
    <ul class="bag-list">${[["zarrin", "M"], ["sitara-dupatta", "One Size"]].map(([id, s]) => { const p = P[id]; return `<li class="bag-item"><div class="bag-item__img">${A.art(p.art)}</div><div><p class="bag-item__name">${p.name}</p><p class="bag-item__meta">${p.line}<br>Size: ${s}</p><div class="qty"><button>${A.icon("minus", 14)}</button><span>1</span><button>${A.icon("plus", 14)}</button></div></div><div class="bag-item__price">${A.rs(p.price)}<button class="bag-item__remove">Remove</button></div></li>`; }).join("")}</ul>
    <div class="drawer__foot"><div class="drawer__total"><span>Subtotal</span><strong>${A.rs(P["zarrin"].price + P["sitara-dupatta"].price)}</strong></div><p class="drawer__note">Shipping and taxes calculated at checkout.</p><a class="btn btn--primary btn--block">Checkout</a><a class="btn btn--secondary btn--block">View Bag</a></div></aside>`;
  const accountHTML = `<div class="account is-open"><div class="account-menu"><p class="account-menu__title">Welcome to AURAQ</p><p class="account-menu__text">Sign in for faster checkout, order tracking and your wishlist.</p><a class="btn btn--primary btn--block">Sign In</a><a class="btn btn--secondary btn--block">Create Account</a><ul><li><a>My Orders</a></li><li><a>Track Order</a></li><li><a>Wishlist</a></li><li><a>Addresses</a></li></ul></div></div>`;
  const toastHTML = `<div class="toast is-show" style="position:relative;left:auto;bottom:auto;transform:none"><span>Added to bag — Gul-e-Nar · M</span><a>View Bag</a></div>`;
  sec("menus", "Account Menu, Bag Drawer & Add-to-Bag Toast", "",
    `<div class="row">${cell("Account Menu", accountHTML)}${cell("Bag Drawer", bagHTML)}${cell("Toast / Added to Bag", toastHTML)}</div>`);

  const mobileHeader = `<div class="mobile-frame"><div class="announce"><div class="announce__inner" style="grid-template-columns:1fr;height:36px;padding:0 16px"><div class="announce__center" style="justify-content:space-between"><button class="announce__arrow">‹</button><p class="announce__msg" style="min-width:0;font-size:12px">Worldwide shipping to 40+ countries</p><button class="announce__arrow">›</button></div></div></div>
    <header class="header"><div class="header__bar"><div class="header__left"><button class="hbtn hbtn--menu">${A.icon("menu")}</button><button class="hbtn js-open-search">${A.icon("search")}</button></div><a class="logo"><span class="logo__word">AURAQ</span></a><div class="header__right"><button class="hbtn">${A.icon("bag")}<span class="count">2</span></button></div></div>
    <nav class="nav" style="border-top:1px solid var(--color-border-subtle)"><ul class="nav__list" style="justify-content:flex-start;gap:24px;height:44px;overflow:hidden;padding:0 16px">${A.nav.map(n => `<li class="nav__item"><a class="nav__link ${n.sale ? "nav__link--sale" : ""}" style="font-size:12px;letter-spacing:.14em">${n.label}</a></li>`).join("")}</ul></nav></header></div>`;
  const mobileNav = `<aside class="drawer drawer--left is-open"><div class="drawer__head"><span class="logo logo--small"><span class="logo__word">AURAQ</span></span><button class="hbtn">${A.icon("close")}</button></div>
    <div class="mnav"><ul class="mnav__list">${A.nav.map((n, i) => n.mega
      ? `<li class="mnav__item ${i === 1 ? "is-open" : ""}"><button class="mnav__toggle">${n.label}${A.icon("plus", 18)}</button><div class="mnav__sub"><span class="mnav__sub-title">Category</span>${A.mega.categories.map(c => `<a>${c}</a>`).join("")}<span class="mnav__sub-title">Collection</span>${A.mega.collections.slice(0, 4).map(c => `<a>${c}</a>`).join("")}</div></li>`
      : `<li class="mnav__item"><a class="mnav__link ${n.sale ? "mnav__sale" : ""}">${n.label}</a></li>`).join("")}</ul>
    <a class="mnav__feature"><div class="mnav__feature-img">${A.art(A.campaigns[0].art, { portrait: true })}</div><div><p class="eyebrow">New Season</p><p class="mnav__feature-title">The Festive Edit</p></div></a></div></aside>`;
  sec("mobile", "Mobile Header & Navigation", "Sticky 60px header + horizontally scrolling category shortcuts. Drawer accordions keep any product two taps away.",
    `<div class="row">${cell("Mobile Header", mobileHeader)}${cell("Mobile Navigation / Ready to Wear open", mobileNav)}</div>`);

  root.innerHTML = sections.map(s => s.html).join("");
  document.getElementById("toc").innerHTML = sections.map(s => `<a href="#${s.id}">${s.title.split(",")[0]}</a>`).join("");
})();
