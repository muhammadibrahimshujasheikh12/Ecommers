/**
 * Closet Stories storefront behaviour (plain JS, no framework).
 *
 * Every feature is wired through data-* hooks in the Blade views and only
 * runs when its hook is on the page, so this single bundle is safe to load
 * everywhere. Do not rename the hooks: storefront views depend on them.
 */

/** Toggle the "selected option" look on a radio card label. */
const markSelected = (label, on, withBorder = true) => {
    label.classList.toggle('border-charcoal', on);
    label.classList.toggle('bg-cream', on);
    if (withBorder) label.classList.toggle('border-line-strong', !on);
};

/* ---------------------------------------------------------------------------
 * Announcement bar: [data-rotate] carries a JSON list in data-items and
 * cycles every 5s. The prev/next arrows restart the timer so a manual step
 * is not immediately followed by an automatic one.
 * ------------------------------------------------------------------------ */
const bar = document.querySelector('[data-rotate]');
if (bar) {
    const items = JSON.parse(bar.dataset.items || '[]');
    let i = 0;
    let timer;
    const start = () => {
        clearInterval(timer);
        timer = setInterval(() => show(1), 5000);
    };
    const show = (step) => {
        i = (i + step + items.length) % items.length;
        bar.textContent = items[i];
        start();
    };
    if (items.length > 1) {
        start();
        document.querySelector('[data-rotate-prev]')?.addEventListener('click', () => show(-1));
        document.querySelector('[data-rotate-next]')?.addEventListener('click', () => show(1));
    }
}

/* Mobile menu: the burger button shows/hides the nav panel. */
document.querySelector('[data-menu-toggle]')?.addEventListener('click', () => {
    document.querySelector('[data-menu]')?.classList.toggle('hidden');
});

/* Product gallery: clicking a [data-thumb] swaps the main image's src. */
document.querySelectorAll('[data-thumb]').forEach((thumb) => {
    thumb.addEventListener('click', () => {
        const main = document.querySelector('[data-main-image]');
        if (main) main.src = thumb.dataset.thumb;
    });
});

/* ---------------------------------------------------------------------------
 * Checkout ([data-checkout]).
 *
 * Delivery: rates depend on the city (Rs 500 Karachi, Rs 1,000 elsewhere in
 * Pakistan, international by country), so typing a city asks the server's
 * quote endpoint for the applicable rates. The current choice is kept when it
 * still applies, otherwise we fall back to the first rate. The server
 * re-validates everything on submit; this is only a live preview.
 *
 * Payment: bank account details are shown only for Bank Transfer.
 * ------------------------------------------------------------------------ */
const checkout = document.querySelector('[data-checkout]');
if (checkout) {
    const $ = (sel) => checkout.querySelector(sel);
    const city = $('[name=city]');
    const country = $('[name=country]');
    const list = $('[data-shipping-list]');
    const bank = $('[data-bank-details]');
    const subtotal = Number(checkout.dataset.subtotal);
    const money = (n) => 'Rs. ' + Number(n).toLocaleString('en-PK');
    // Escape server text before it goes into innerHTML (defence against HTML injection).
    const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

    /** Recalculate the summary (delivery name, cost, grand total). */
    const updateTotals = () => {
        const chosen = $('[name=shipping_method]:checked');
        const ship = chosen ? Number(chosen.dataset.price) : 0;
        $('[data-ship-name]').textContent = chosen ? chosen.dataset.name : '—';
        $('[data-ship-cost]').textContent = chosen ? money(ship) : '—';
        $('[data-total]').textContent = money(subtotal + ship);
    };

    /** Render the rate cards returned by the quote endpoint. */
    const renderMethods = (methods) => {
        const current = $('[name=shipping_method]:checked')?.value;
        const pick = methods.some((m) => m.code === current) ? current : methods[0]?.code;
        list.innerHTML = methods.length
            ? methods.map((m) => `
                <label class="flex cursor-pointer items-start gap-4 border p-4 ${m.code === pick ? 'border-charcoal bg-cream' : 'border-line-strong'}">
                    <input type="radio" name="shipping_method" value="${esc(m.code)}" data-price="${m.price}" data-name="${esc(m.name)}" ${m.code === pick ? 'checked' : ''} class="mt-1 accent-charcoal">
                    <span class="flex-1"><span class="block font-ui text-[15px] font-medium">${esc(m.name)}</span>
                    <span class="block text-[13px] text-ink-2">${esc(m.days)} · ${esc(m.description)}</span></span>
                    <span class="font-ui text-[14px]">${money(m.price)}</span>
                </label>`).join('')
            : '<p class="text-[14px] text-sale">We do not deliver to this address yet.</p>';
        updateTotals();
    };

    // Debounced (300ms) so we query once the customer pauses typing.
    let timer;
    const refresh = () => {
        clearTimeout(timer);
        timer = setTimeout(async () => {
            const params = new URLSearchParams({ country: country.value, city: city.value });
            const res = await fetch(`${checkout.dataset.quoteUrl}?${params}`, { headers: { Accept: 'application/json' } });
            if (res.ok) renderMethods((await res.json()).methods);
        }, 300);
    };

    city.addEventListener('input', refresh);
    country.addEventListener('change', refresh);
    list.addEventListener('change', () => {
        list.querySelectorAll('label').forEach((l) => markSelected(l, l.querySelector('input').checked));
        updateTotals();
    });

    const syncPayment = () => {
        bank.classList.toggle('hidden', $('[name=payment_method]:checked')?.value !== 'bank_transfer');
        checkout.querySelectorAll('[data-payment-option]').forEach((l) => markSelected(l, l.querySelector('input').checked, false));
    };
    checkout.querySelectorAll('[name=payment_method]').forEach((r) => r.addEventListener('change', syncPayment));

    // Initial state (e.g. after a validation error re-fills the form).
    syncPayment();
    if (city.value) refresh();
    updateTotals();
}
