/* Photography system.
   Every image slot is described by an art-direction object. Until real
   campaign/product photography is supplied, a tonal SVG stand-in is drawn
   (studio backdrop, Mughal arch set, model silhouette in the garment colour).
   To use real photography, add the slot id to AURAQ.mediaManifest:
     AURAQ.mediaManifest["hero-1"] = "/images/festive-edit-hero.jpg";
   Aspect ratios are set by the containing element, never by the image. */

window.AURAQ = window.AURAQ || {};
AURAQ.mediaManifest = AURAQ.mediaManifest || {};

(function () {
  let uid = 0;

  function mix(hex, amt) {
    // amt > 0 → toward white, amt < 0 → toward black
    const n = parseInt(hex.slice(1, 7), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const t = amt > 0 ? 255 : 0, p = Math.abs(amt);
    r = Math.round(r + (t - r) * p); g = Math.round(g + (t - g) * p); b = Math.round(b + (t - b) * p);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  const SKIN = ["#C59A7D", "#B88A6C", "#CFA486"];
  const HAIR = "#2B211C";

  function pattern(id, base, dot) {
    return `<pattern id="${id}" width="9" height="9" patternUnits="userSpaceOnUse">
      <rect width="9" height="9" fill="${base}"/>
      <circle cx="4.5" cy="4.5" r="1.7" fill="${dot}" opacity=".75"/>
      <circle cx="0" cy="0" r="1" fill="${dot}" opacity=".5"/><circle cx="9" cy="9" r="1" fill="${dot}" opacity=".5"/>
    </pattern>`;
  }

  /* Model silhouette in a 300×400 coordinate space, feet at y≈376. */
  function figure(o, i = 0) {
    const id = "a" + (++uid);
    const skin = o.skin || SKIN[i % SKIN.length];
    const g = o.garment, tr = o.trouser || mix(g, .35), ac = o.accent || mix(g, .55);
    const dup = o.dupatta || mix(g, .3);
    const hemY = o.short ? 262 : o.long ? 352 : 318;
    const hw = o.long ? 80 : o.short ? 44 : 54;
    const kameez = `M118,124 Q150,116 182,124 L188,170 L${150 + hw},${hemY} Q150,${hemY + 8} ${150 - hw},${hemY} L112,170 Z`;
    const trousers = o.short
      ? `M124,${hemY - 6} L118,372 L147,372 L150,${hemY + 12} L153,372 L182,372 L176,${hemY - 6} Z`
      : `M130,${hemY - 4} L132,370 L146,370 L150,${hemY + 6} L154,370 L168,370 L170,${hemY - 4} Z`;
    return `
    <defs>${pattern(id + "p", ac, mix(g, -.15))}<clipPath id="${id}c"><path d="${kameez}"/></clipPath></defs>
    <ellipse cx="150" cy="377" rx="74" ry="7" fill="#000" opacity=".07"/>
    <path d="M128,84 Q130,58 150,58 Q170,58 172,84 L180,152 Q150,160 120,152 Z" fill="${HAIR}"/>
    <path d="${trousers}" fill="${tr}"/>
    <path d="${o.short ? "M118,364 L147,364 L147,372 L118,372 Z M153,364 L182,364 L182,372 L153,372 Z" : "M132,362 L146,362 L146,370 L132,370 Z M154,362 L168,362 L168,370 L154,370 Z"}" fill="${ac}" opacity=".9"/>
    <ellipse cx="${o.short ? 134 : 139}" cy="374" rx="8" ry="3" fill="#3A2E28" opacity=".75"/><ellipse cx="${o.short ? 166 : 161}" cy="374" rx="8" ry="3" fill="#3A2E28" opacity=".75"/>
    <path d="M118,124 L104,136 L96,228 L110,230 L116,168 Z" fill="${mix(g, -.05)}"/>
    <path d="M182,124 L196,136 L204,228 L190,230 L184,168 Z" fill="${mix(g, -.08)}"/>
    <path d="M96,219 L110,221 L110,230 L96,228 Z M204,219 L190,221 L190,230 L204,228 Z" fill="${ac}"/>
    <ellipse cx="103" cy="238" rx="6" ry="8" fill="${skin}"/><ellipse cx="197" cy="238" rx="6" ry="8" fill="${skin}"/>
    <rect x="144" y="102" width="12" height="22" fill="${skin}"/>
    <path d="${kameez}" fill="${g}"/>
    <g clip-path="url(#${id}c)">
      <rect x="40" y="${hemY - 22}" width="220" height="40" fill="url(#${id}p)"/>
      <rect x="150" y="110" width="120" height="260" fill="#000" opacity=".05"/>
      <path d="M142,172 Q138,240 ${150 - hw * .6},${hemY}" stroke="#000" stroke-opacity=".08" stroke-width="2" fill="none"/>
      <path d="M160,172 Q164,240 ${150 + hw * .55},${hemY}" stroke="#000" stroke-opacity=".08" stroke-width="2" fill="none"/>
    </g>
    <path d="M135,121 L150,152 L165,121 Q150,127 135,121 Z" fill="url(#${id}p)"/>
    <ellipse cx="150" cy="86" rx="16" ry="20" fill="${skin}"/>
    <path d="M134,84 Q135,62 150,62 Q166,62 167,82 Q158,70 150,72 Q140,72 134,84 Z" fill="${HAIR}"/>
    <path d="M176,120 Q216,190 208,${Math.min(hemY, 318)} L193,${Math.min(hemY, 318) + 4} Q198,210 166,128 Z" fill="${dup}" opacity=".78"/>
    <path d="M176,120 Q216,190 208,${Math.min(hemY, 318)}" stroke="${ac}" stroke-width="2.5" fill="none"/>`;
  }

  function backdrop(w, h, bg, floorY, floor) {
    return `<rect width="${w}" height="${h}" fill="${bg}"/>
      <rect y="${floorY}" width="${w}" height="${h - floorY}" fill="${floor || mix(bg, -.05)}"/>`;
  }

  function arch(cx, aw, top, h, fill, line) {
    const x0 = cx - aw / 2, x1 = cx + aw / 2, sh = aw * .42;
    const d = (x0, x1, top) => `M${x0},${h} L${x0},${top + sh} Q${x0},${top + sh * .25} ${(x0 + x1) / 2},${top} Q${x1},${top + sh * .25} ${x1},${top + sh} L${x1},${h} Z`;
    const inset = aw * .06;
    return `<path d="${d(x0, x1, top)}" fill="${fill}"/>
      <path d="${d(x0 + inset, x1 - inset, top + inset * 1.3)}" fill="none" stroke="${line}" stroke-width="${Math.max(1.5, aw * .004)}"/>`;
  }

  function place(cx, baseY, s, inner) {
    return `<g transform="translate(${cx - 150 * s} ${baseY - 376 * s}) scale(${s})">${inner}</g>`;
  }

  function productArt(o, alt) {
    const W = 300, H = 400;
    const body = alt
      ? `<g transform="translate(150 205) scale(2.15) translate(-150 -158)">${figure(o)}</g>`
      : `<g transform="translate(0 6)">${figure(o)}</g>`;
    return { W, H, svg: backdrop(W, H, o.bg, 300) + body };
  }

  function sceneArt(o, opts) {
    const portrait = o.portrait || opts.portrait;
    const W = portrait ? 600 : 1440, H = portrait ? 800 : 810;
    const align = opts.align || "center";
    // compact: mobile hero/editorial crops — figures sit higher so copy can live on the floor plane
    const compact = !!opts.compact;
    const floorY = H * (compact ? .5 : .8);
    const cx = align === "right" ? W * .67 : W * .5;
    const aw = portrait ? W * (compact ? .74 : .64) : W * .3;
    const s = (H * (compact ? .42 : portrait ? .7 : .74)) / 320;
    const baseY = H * (compact ? .55 : .93);
    const n = o.figures || 1;
    const garments = o.garments || ["#EADBC6"];
    const gap = portrait ? W * .2 : W * .095;
    let figs = "";
    for (let i = 0; i < n; i++) {
      const g = garments[i % garments.length];
      const x = n === 1 ? cx : cx + (i === 0 ? -gap / 2 : gap / 2);
      const sc = n > 1 && i === 1 ? s * .97 : s;
      figs += place(x, baseY + (i ? 4 : 0), sc, figure({ garment: g, trouser: mix(g, .3), accent: o.tone === "dark" ? "#D9BE8E" : mix(g, .55), long: i === 1 }, i));
    }
    const svg = backdrop(W, H, o.bg, floorY, o.floor) +
      arch(cx, aw, H * (compact ? .03 : .1), floorY, o.arch || mix(o.bg, .1), mix(o.bg, -.08)) + figs;
    return { W, H, svg };
  }

  function flatlayArt(o) {
    const W = 300, H = 400;
    const f = o.fabrics || ["#E8DCC4"];
    let s = backdrop(W, H, o.bg, 400);
    f.forEach((c, i) => {
      const id = "a" + (++uid);
      const y = 70 + i * 92, rot = [-5, 3, -2][i % 3], x = 52 + (i % 2) * 12;
      s += `<defs>${pattern(id, mix(c, .45), mix(c, -.2))}</defs>
        <g transform="rotate(${rot} 150 ${y + 60})">
          <rect x="${x + 4}" y="${y + 6}" width="190" height="120" fill="#000" opacity=".06"/>
          <rect x="${x}" y="${y}" width="190" height="120" fill="${c}"/>
          <rect x="${x}" y="${y + 92}" width="190" height="28" fill="url(#${id})"/>
          <line x1="${x}" y1="${y + 40}" x2="${x + 190}" y2="${y + 40}" stroke="#000" stroke-opacity=".06"/>
          <line x1="${x + 120}" y1="${y}" x2="${x + 120}" y2="${y + 92}" stroke="#fff" stroke-opacity=".25"/>
        </g>`;
    });
    return { W, H, svg: s };
  }

  /* Returns markup for a media slot. opts: { slot, alt, align, portrait, label } */
  AURAQ.art = function (o, opts = {}) {
    const src = opts.slot && AURAQ.mediaManifest[opts.slot];
    const label = opts.label || "";
    if (src) return `<img class="media-img" src="${src}" alt="${label}" loading="lazy">`;
    const r = o.kind === "scene" ? sceneArt(o, opts)
      : o.kind === "flatlay" ? flatlayArt(o)
      : productArt(o, opts.alt || o.alt);
    return `<svg viewBox="0 0 ${r.W} ${r.H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${label}" data-slot="${opts.slot || ""}">${r.svg}</svg>`;
  };

  AURAQ.mix = mix;
})();
