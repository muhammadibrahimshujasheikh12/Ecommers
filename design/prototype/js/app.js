/* Homepage rendering + interactions. */
(function () {
  const A = window.AURAQ;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const isMobile = () => matchMedia("(max-width: 767px)").matches;

  /* ---- Icon tokens in static markup: {{icon:name[:size]}} ---- */
  document.body.innerHTML = document.body.innerHTML.replace(/\{\{icon:(\w+)(?::(\d+))?\}\}/g, (_, n, s) => A.icon(n, s ? +s : 22));

  /* ---- Art slots referenced from markup (data-art="campaigns.0") ---- */
  const resolve = path => {
    const v = path.split(".").reduce((o, k) => o && o[k], A);
    return v && v.art ? v.art : v;
  };
  $$("[data-art]").forEach(el => {
    const o = resolve(el.dataset.art);
    if (o) el.innerHTML = A.art(o, { slot: el.dataset.slot, align: el.dataset.align, portrait: !!el.dataset.portrait, compact: !!el.dataset.compact });
  });

  /* ---- Announcement bar ---- */
  let ai = 0;
  const msg = $(".announce__msg");
  const showMsg = () => { msg.style.opacity = 0; setTimeout(() => { msg.textContent = A.announcements[ai]; msg.style.opacity = 1; }, 160); };
  msg.textContent = A.announcements[0];
  $$("[data-announce]").forEach(b => b.addEventListener("click", () => { ai = (ai + +b.dataset.announce + A.announcements.length) % A.announcements.length; showMsg(); }));
  setInterval(() => { ai = (ai + 1) % A.announcements.length; showMsg(); }, 5000);

  /* ---- Navigation + mega menu ---- */
  const navList = $(".nav__list");
  navList.innerHTML = A.nav.map((n, i) =>
    `<li class="nav__item" data-i="${i}"><a href="${n.href}" class="nav__link ${n.sale ? "nav__link--sale" : ""}" ${n.mega ? 'aria-haspopup="true" aria-expanded="false"' : ""}>${n.label}</a></li>`).join("");
  $(".js-mega-categories").innerHTML = A.mega.categories.map(c => `<li><a href="#">${c}</a></li>`).join("");
  $(".js-mega-collections").innerHTML = A.mega.collections.map(c => `<li><a href="#">${c}</a></li>`).join("");
  $(".js-mega-more").innerHTML = A.mega.more.map(c => `<li><a href="#">${c}</a></li>`).join("");
  $(".js-mega-features").innerHTML = A.mega.features.map((f, i) =>
    `<a href="#" class="mega__feature"><div class="mega__feature-img">${A.art(f.art, { slot: "mega-" + i, portrait: true })}</div><p>${f.title}</p><span>${f.sub}</span></a>`).join("");

  const header = $("#header"), mega = $("#mega");
  let megaTimer;
  const openMega = item => {
    clearTimeout(megaTimer);
    $$(".nav__item").forEach(li => { li.classList.toggle("is-active", li === item); const a = $("a", li); if (a.hasAttribute("aria-expanded")) a.setAttribute("aria-expanded", li === item); });
    mega.classList.add("is-open"); mega.setAttribute("aria-hidden", "false");
  };
  const closeMega = () => {
    megaTimer = setTimeout(() => {
      mega.classList.remove("is-open"); mega.setAttribute("aria-hidden", "true");
      $$(".nav__item").forEach(li => li.classList.remove("is-active"));
    }, 120);
  };
  $$(".nav__item").forEach(li => {
    const n = A.nav[li.dataset.i];
    li.addEventListener("mouseenter", () => { if (isMobile()) return; n.mega ? openMega(li) : closeMega(); });
    $("a", li).addEventListener("click", e => { if (n.mega && !isMobile()) { e.preventDefault(); mega.classList.contains("is-open") && li.classList.contains("is-active") ? closeMega() : openMega(li); } });
  });
  $(".nav").addEventListener("mouseleave", closeMega);
  mega.addEventListener("mouseenter", () => clearTimeout(megaTimer));
  mega.addEventListener("mouseleave", closeMega);

  addEventListener("scroll", () => header.classList.toggle("is-scrolled", scrollY > 40), { passive: true });

  /* ---- Overlays: search, bag, mobile nav ---- */
  const scrim = $(".js-scrim");
  let openPanel = null;
  const open = (el, focusSel) => {
    close();
    openPanel = el; el.classList.add("is-open"); el.setAttribute("aria-hidden", "false");
    scrim.hidden = false; document.body.classList.add("is-locked");
    setTimeout(() => (focusSel ? $(focusSel, el) : $("button, a, input", el))?.focus(), 80);
  };
  const close = () => {
    if (!openPanel) return;
    openPanel.classList.remove("is-open"); openPanel.setAttribute("aria-hidden", "true");
    openPanel = null; scrim.hidden = true; document.body.classList.remove("is-locked");
  };
  scrim.addEventListener("click", close);
  addEventListener("keydown", e => { if (e.key === "Escape") { close(); closeAccount(); } });
  $$(".js-close-drawer, .js-close-search").forEach(b => b.addEventListener("click", close));
  $(".js-open-search").addEventListener("click", () => open($("#search"), ".search__input"));
  $(".js-open-bag").addEventListener("click", () => open($("#bag")));
  $(".js-open-nav").addEventListener("click", () => open($("#mobile-nav")));

  /* ---- Account menu ---- */
  const account = $(".account"), accBtn = $(".js-account");
  const closeAccount = () => { account.classList.remove("is-open"); accBtn.setAttribute("aria-expanded", "false"); };
  accBtn.addEventListener("click", e => { e.stopPropagation(); const o = account.classList.toggle("is-open"); accBtn.setAttribute("aria-expanded", o); });
  document.addEventListener("click", e => { if (!account.contains(e.target)) closeAccount(); });

  /* ---- Search ---- */
  const sGrid = $(".js-search-grid"), sHead = $(".js-search-heading"), sAll = $(".js-search-all"), sInput = $(".search__input");
  $(".js-trending").innerHTML = A.trending.map(t => `<li><button>${t}</button></li>`).join("");
  const searchable = A.products.filter(p => p.art.kind === "figure");
  const resultCard = (p, q) => {
    const name = q ? p.name.replace(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"), "<mark>$1</mark>") : p.name;
    return `<a href="#" class="sresult"><div class="sresult__img">${A.art(p.art, { slot: "product-" + p.id })}</div><p class="sresult__name">${name}</p><p class="sresult__price">${p.line}</p><p class="sresult__amount">${A.rs(p.price)}</p></a>`;
  };
  const runSearch = q => {
    q = q.trim();
    if (!q) { sHead.textContent = "Just In"; sAll.hidden = true; sGrid.innerHTML = A.newArrivals.map(id => resultCard(A.byId[id])).join(""); return; }
    const words = q.toLowerCase().split(/\s+/);
    const hits = searchable.filter(p => words.every(w => (p.name + " " + p.line).toLowerCase().includes(w)));
    sHead.textContent = `${hits.length} result${hits.length === 1 ? "" : "s"} for “${q}”`;
    sAll.hidden = !hits.length;
    sGrid.innerHTML = hits.length ? hits.slice(0, 4).map(p => resultCard(p, q)).join("")
      : `<p class="search__empty">No exact matches. Try “formal”, “luxury pret” or browse New Arrivals.</p>`;
  };
  sInput.addEventListener("input", () => runSearch(sInput.value));
  $$(".js-trending button").forEach(b => b.addEventListener("click", () => { sInput.value = b.textContent.split(" ")[0]; runSearch(sInput.value); sInput.focus(); }));
  runSearch("");

  /* ---- Hero campaign slider ---- */
  const hero = $("#hero"), slides = $(".js-hero");
  slides.innerHTML = A.hero.map((h, i) => `
    <div class="slide ${i === 0 ? "is-active" : ""}" role="group" aria-roledescription="slide" aria-label="${i + 1} of ${A.hero.length}">
      <div class="slide__art">
        <div class="art-wide">${A.art(h.art, { slot: "hero-" + (i + 1), align: "right", label: h.title })}</div>
        <div class="art-tall">${A.art(h.art, { slot: "hero-" + (i + 1) + "-mobile", portrait: true, compact: true, label: h.title })}</div>
      </div>
      <div class="slide__content container">
        <div class="slide__copy">
          <p class="eyebrow">${h.eyebrow}</p>
          ${i === 0 ? `<h1 class="slide__title">${h.title}</h1>` : `<h2 class="slide__title">${h.title}</h2>`}
          <p class="slide__sub">${h.sub}</p>
          <a href="#" class="btn btn--light">${h.cta}</a>
        </div>
      </div>
    </div>`).join("");
  const prog = $(".js-hero-progress");
  prog.innerHTML = A.hero.map((_, i) => `<button aria-label="Go to campaign ${i + 1}"><span></span></button>`).join("");
  $(".js-hero-total").textContent = String(A.hero.length).padStart(2, "0");
  let hi = 0, heroTimer;
  const go = n => {
    hi = (n + A.hero.length) % A.hero.length;
    $$(".slide", slides).forEach((s, i) => s.classList.toggle("is-active", i === hi));
    $$("button", prog).forEach((b, i) => { b.classList.remove("is-active"); b.classList.toggle("is-done", i < hi); void b.offsetWidth; if (i === hi) b.classList.add("is-active"); });
    $(".js-hero-index").textContent = String(hi + 1).padStart(2, "0");
    clearTimeout(heroTimer); heroTimer = setTimeout(() => go(hi + 1), 7000);
  };
  $$("[data-hero]").forEach(b => b.addEventListener("click", () => go(hi + +b.dataset.hero)));
  $$("button", prog).forEach((b, i) => b.addEventListener("click", () => go(i)));
  let tx = 0;
  hero.addEventListener("touchstart", e => { tx = e.touches[0].clientX; }, { passive: true });
  hero.addEventListener("touchend", e => { const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 40) go(hi + (dx < 0 ? 1 : -1)); });
  if (!new URLSearchParams(location.search).has("static")) go(0);
  else $$("button", prog)[0].classList.add("is-done");

  /* ---- Categories, products, look, video, reviews, gallery ---- */
  $(".js-categories").innerHTML = A.categories.map(A.categoryTile).join("");
  $(".js-new").innerHTML = A.newArrivals.map(id => A.productCard(A.byId[id], { rating: false })).join("");
  $(".js-best").innerHTML = A.bestSellers.map(id => A.productCard(A.byId[id])).join("");

  const lookItems = A.look.items.map(it => A.byId[it.id]);
  $(".js-look").innerHTML = lookItems.map((p, i) => A.miniProduct(p, i + 1)).join("");
  $(".js-look-total").textContent = A.rs(lookItems.reduce((s, p) => s + p.price, 0));
  $(".js-hotspots").innerHTML = A.look.items.map((it, i) => {
    const p = A.byId[it.id];
    return `<button class="hotspot" style="left:${it.hotspot.x}%;top:${it.hotspot.y}%" data-look="${p.id}" aria-label="${p.name}, ${A.rs(p.price)}">
      <span class="hotspot__dot">${i + 1}</span><span class="hotspot__tip"><strong>${p.name}</strong><span>${A.rs(p.price)}</span></span></button>`;
  }).join("");
  $$("[data-look]").forEach(el => {
    const sync = on => $$(`[data-look="${el.dataset.look}"]`).forEach(x => x.classList.toggle("is-active", on));
    el.addEventListener("mouseenter", () => sync(true));
    el.addEventListener("mouseleave", () => sync(false));
  });

  $(".js-watch").innerHTML = A.videos.map((v, i) => {
    const p = A.byId[v.id];
    return `<article class="vcard">
      <div class="vcard__art">${A.art(v.art, { slot: "video-" + (i + 1), portrait: true, label: p.name + " video" })}</div>
      <div class="vcard__top"><span class="vcard__chip">${v.duration}</span><span class="vcard__chip" aria-label="Muted">${A.icon("sound", 14)}</span></div>
      <button class="vcard__play" aria-label="Play video">${A.icon("play", 22)}</button>
      <span class="vcard__label">${p.name}</span>
      <div class="vcard__shop">
        <div class="vcard__thumb">${A.art(p.art, { slot: "product-" + p.id })}</div>
        <div><p class="vcard__name">${p.name}</p><p class="vcard__price">${A.rs(p.price)}</p><a href="#" class="btn-text">Shop Now ${A.icon("arrow", 14)}</a></div>
      </div>
    </article>`;
  }).join("");

  $(".js-score").textContent = A.rating.average.toFixed(1);
  $(".js-score-stars").innerHTML = A.stars(A.rating.average, 16);
  $(".js-score-count").textContent = A.rating.count.toLocaleString("en-US");
  $(".js-reviews").innerHTML = A.reviews.map(A.reviewCard).join("");

  $(".js-gallery").innerHTML = A.gallery.map((g, i) =>
    `<a href="#" class="gitem" aria-label="View on Instagram"><div>${A.art(g.art, { slot: "gallery-" + (i + 1), portrait: true })}</div>${A.icon("instagram", 28)}</a>`).join("");

  /* ---- Mobile nav ---- */
  $(".js-mnav").innerHTML = A.nav.map(n => n.mega
    ? `<li class="mnav__item"><button class="mnav__toggle" aria-expanded="false">${n.label}${A.icon("plus", 18)}</button>
        <div class="mnav__sub"><span class="mnav__sub-title">Category</span>${A.mega.categories.map(c => `<a href="#">${c}</a>`).join("")}
        <span class="mnav__sub-title">Collection</span>${A.mega.collections.slice(0, 4).map(c => `<a href="#">${c}</a>`).join("")}</div></li>`
    : `<li class="mnav__item"><a href="${n.href}" class="mnav__link ${n.sale ? "mnav__sale" : ""}">${n.label}</a></li>`).join("");
  $$(".mnav__toggle").forEach(b => b.addEventListener("click", () => { const o = b.parentElement.classList.toggle("is-open"); b.setAttribute("aria-expanded", o); }));
  $(".js-mnav-feature").innerHTML = A.art(A.campaigns[0].art, { slot: "mnav-feature", portrait: true });

  /* ---- Wishlist ---- */
  let wishes = 0;
  document.addEventListener("click", e => {
    const w = e.target.closest(".wish"); if (!w) return;
    e.preventDefault();
    const on = !w.classList.contains("is-on");
    w.classList.toggle("is-on", on); w.setAttribute("aria-pressed", on);
    w.setAttribute("aria-label", (on ? "Remove from" : "Add to") + " wishlist");
    w.classList.remove("is-pop"); void w.offsetWidth; if (on) w.classList.add("is-pop");
    wishes += on ? 1 : -1;
    const c = $(".js-wish-count"); c.textContent = wishes; c.hidden = wishes === 0;
  });

  /* ---- Bag ---- */
  const FREE = 5000;
  const bag = [
    { id: "zarrin", size: "M", qty: 1 },
    { id: "sitara-dupatta", size: "One Size", qty: 1 },
  ];
  const renderBag = () => {
    const count = bag.reduce((s, i) => s + i.qty, 0);
    const total = bag.reduce((s, i) => s + A.byId[i.id].price * i.qty, 0);
    $$(".js-bag-count").forEach(c => c.textContent = count);
    $(".js-bag-count-text").textContent = `(${count})`;
    $(".js-bag-total").textContent = A.rs(total);
    const left = Math.max(0, FREE - total);
    $(".ship-progress p").innerHTML = left ? `You’re <strong>${A.rs(left)}</strong> away from complimentary delivery` : `You’ve unlocked <strong>complimentary delivery</strong>`;
    $(".js-ship-bar").style.width = Math.min(100, (total / FREE) * 100) + "%";
    $(".js-bag-list").innerHTML = bag.map((it, i) => {
      const p = A.byId[it.id];
      return `<li class="bag-item">
        <div class="bag-item__img">${A.art(p.art, { slot: "product-" + p.id })}</div>
        <div><p class="bag-item__name">${p.name}</p><p class="bag-item__meta">${p.line}<br>Size: ${it.size}</p>
          <div class="qty"><button data-qty="${i}" data-d="-1" aria-label="Decrease">${A.icon("minus", 14)}</button><span>${it.qty}</span><button data-qty="${i}" data-d="1" aria-label="Increase">${A.icon("plus", 14)}</button></div></div>
        <div class="bag-item__price">${A.rs(p.price * it.qty)}<button class="bag-item__remove" data-remove="${i}">Remove</button></div>
      </li>`;
    }).join("") || `<li class="search__empty">Your bag is empty.</li>`;
  };
  renderBag();
  $(".js-bag-list").addEventListener("click", e => {
    const q = e.target.closest("[data-qty]"), r = e.target.closest("[data-remove]");
    if (q) { const it = bag[q.dataset.qty]; it.qty = Math.max(1, it.qty + +q.dataset.d); }
    if (r) bag.splice(+r.dataset.remove, 1);
    if (q || r) renderBag();
  });

  const toast = $(".js-toast"); let toastTimer;
  const showToast = html => { toast.innerHTML = html; toast.classList.add("is-show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("is-show"), 3200); };
  toast.addEventListener("click", e => { if (e.target.closest("a")) { e.preventDefault(); toast.classList.remove("is-show"); open($("#bag")); } });

  const addToBag = (id, size) => {
    const ex = bag.find(i => i.id === id && i.size === size);
    ex ? ex.qty++ : bag.push({ id, size, qty: 1 });
    renderBag();
    $$(".js-bag-count").forEach(c => { c.classList.remove("is-bump"); void c.offsetWidth; c.classList.add("is-bump"); });
    showToast(`<span>Added to bag — ${A.byId[id].name}${size ? " · " + size : ""}</span><a href="#">View Bag</a>`);
  };
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-add]"); if (!b) return;
    e.preventDefault();
    addToBag(b.dataset.add, b.dataset.size);
    b.classList.add("is-added"); setTimeout(() => b.classList.remove("is-added"), 900);
  });
  $(".js-add-look").addEventListener("click", () => {
    A.look.items.forEach(it => { const ex = bag.find(i => i.id === it.id); ex ? ex.qty++ : bag.push({ id: it.id, size: "M", qty: 1 }); });
    renderBag(); showToast(`<span>Complete look added — 3 pieces</span><a href="#">View Bag</a>`);
  });

  /* ---- Newsletter field states ---- */
  $$(".js-newsletter").forEach(f => f.addEventListener("submit", e => {
    e.preventDefault();
    const input = $("input", f), field = $(".field", f), m = $(".field__msg", f);
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value);
    field.classList.toggle("is-error", !ok);
    m.className = "field__msg " + (ok ? "is-success-msg" : "is-error-msg");
    m.textContent = ok ? "Welcome to our world. Check your inbox for a note from us." : "Please enter a valid email address.";
    if (ok) input.value = "";
  }));

  /* ---- Currency dropdown ---- */
  $$(".js-dropdown").forEach(d => {
    const btn = $(".dropdown__btn", d);
    btn.addEventListener("click", e => { e.stopPropagation(); const o = d.classList.toggle("is-open"); btn.setAttribute("aria-expanded", o); });
    $$("li", d).forEach(li => li.addEventListener("click", () => {
      $$("li", d).forEach(x => x.setAttribute("aria-selected", x === li));
      $(".js-dropdown-value", d).textContent = li.textContent; d.classList.remove("is-open");
    }));
    document.addEventListener("click", () => d.classList.remove("is-open"));
  });
  $(".js-currency").addEventListener("click", () => $("#footer").scrollIntoView());

  /* ---- Footer accordions collapse on mobile ---- */
  if (isMobile()) $$(".fcol").forEach(d => d.removeAttribute("open"));

  /* ---- Pause hero when tab hidden ---- */
  document.addEventListener("visibilitychange", () => { if (document.hidden) clearTimeout(heroTimer); else if (!new URLSearchParams(location.search).has("static")) go(hi); });
})();
