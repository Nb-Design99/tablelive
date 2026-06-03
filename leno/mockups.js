/* =========================================================
   Léno Création — Moteur de mockup & broderie (SVG)
   Partagé entre la page d'accueil (démos) et le studio.
   ========================================================= */
(function () {
  const NS = "http://www.w3.org/2000/svg";

  /* --- Filtres réutilisables : fil brodé, fourrure, transfert --- */
  function filterDefs(uid) {
    uid = uid || "g";
    return `
    <defs>
      <!-- Effet broderie : fils en relief + irrégularités + lumière -->
      <filter id="embro-${uid}" x="-15%" y="-15%" width="130%" height="130%">
        <feTurbulence type="turbulence" baseFrequency="0.9 0.04" numOctaves="2" seed="7" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="2.4" xChannelSelector="R" yChannelSelector="G" result="d"/>
        <feGaussianBlur in="d" stdDeviation="0.35" result="b"/>
        <feSpecularLighting in="b" surfaceScale="2.2" specularConstant="0.9" specularExponent="16" lighting-color="#ffffff" result="s">
          <fePointLight x="-60" y="-90" z="160"/>
        </feSpecularLighting>
        <feComposite in="s" in2="b" operator="in" result="sc"/>
        <feComposite in="d" in2="sc" operator="arithmetic" k1="0" k2="1" k3="0.85" k4="0"/>
      </filter>

      <!-- Texture fourrure / sherpa du tissu -->
      <filter id="fuzz-${uid}" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="4" result="f"/>
        <feColorMatrix in="f" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.5 0" result="fa"/>
        <feComposite in="fa" in2="SourceAlpha" operator="in" result="fc"/>
        <feBlend in="SourceGraphic" in2="fc" mode="soft-light"/>
      </filter>

      <!-- Grain du tissu pour les transferts d'image -->
      <filter id="weave-${uid}" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.55 0.55" numOctaves="2" seed="2" result="w"/>
        <feColorMatrix in="w" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.22 0"/>
        <feComposite in2="SourceAlpha" operator="in"/>
      </filter>
    </defs>`;
  }

  /* --- Définition des articles : forme + zone de broderie --- */
  // viewBox commune : 0 0 400 400. zone = cadre où l'on place le visuel.
  const PRODUCTS = {
    cagoule: {
      name: "Cagoule",
      zone: { x: 130, y: 250, w: 140, h: 90 },
      shape: (c) => `
        <path d="M200 40c-78 0-120 56-120 150 0 70 18 150 30 170h180c12-20 30-100 30-170 0-94-42-150-120-150z" fill="${c}"/>
        <ellipse cx="200" cy="180" rx="78" ry="92" fill="#1d1a24" opacity=".9"/>
        <ellipse cx="200" cy="170" rx="66" ry="78" fill="#0f0d14"/>
        <path d="M134 246c12 18 120 18 132 0 6 30 4 84-6 100H140c-10-16-12-70-6-100z" fill="${shade(c,-12)}"/>`
    },
    sac: {
      name: "Sac / Tote",
      zone: { x: 120, y: 150, w: 160, h: 150 },
      shape: (c) => `
        <path d="M150 110c0-30 100-30 100 0" fill="none" stroke="${shade(c,-25)}" stroke-width="10"/>
        <rect x="100" y="110" width="200" height="240" rx="10" fill="${c}"/>
        <rect x="100" y="110" width="200" height="18" fill="${shade(c,-10)}"/>`
    },
    sweat: {
      name: "Sweat",
      zone: { x: 140, y: 170, w: 120, h: 110 },
      shape: (c) => `
        <path d="M150 110l-70 30 18 60 40-16v160h124V184l40 16 18-60-70-30c-10 20-90 20-100 0z" fill="${c}"/>
        <path d="M150 110c10 22 90 22 100 0" fill="none" stroke="${shade(c,-22)}" stroke-width="6"/>`
    },
    poncho: {
      name: "Poncho",
      zone: { x: 150, y: 190, w: 100, h: 90 },
      shape: (c) => `
        <ellipse cx="200" cy="120" rx="44" ry="22" fill="${shade(c,-12)}"/>
        <path d="M200 120 96 330h208z" fill="${c}"/>`
    },
    bonnet: {
      name: "Bonnet",
      zone: { x: 140, y: 200, w: 120, h: 70 },
      shape: (c) => `
        <path d="M110 250c0-90 180-90 180 0z" fill="${c}"/>
        <rect x="104" y="248" width="192" height="40" rx="20" fill="${shade(c,-12)}"/>`
    }
  };

  /* --- Petites couleurs --- */
  function shade(hex, pct) {
    const h = hex.replace('#', '');
    if (h.length !== 6) return hex;
    let r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    const f = (v) => Math.max(0, Math.min(255, Math.round(v + (pct / 100) * 255)));
    return '#' + [f(r), f(g), f(b)].map(v => v.toString(16).padStart(2, '0')).join('');
  }

  /* --- Démo statique pour la page d'accueil --- */
  function demo(el, opts) {
    if (!el) return;
    const p = PRODUCTS[opts.product] || PRODUCTS.cagoule;
    const fabric = opts.fabric || '#3a3340';
    const z = p.zone;
    const uid = 'd' + Math.random().toString(36).slice(2, 7);
    el.innerHTML = `
      <svg viewBox="0 0 400 400" width="100%" style="display:block">
        ${filterDefs(uid)}
        <rect width="400" height="400" fill="#efe6fb" rx="16"/>
        <g filter="url(#fuzz-${uid})">${p.shape(fabric)}</g>
        <text x="${z.x + z.w / 2}" y="${z.y + z.h / 2}" text-anchor="middle" dominant-baseline="central"
              font-family="Caveat, cursive" font-size="46" font-weight="700"
              fill="${opts.color || '#b388e0'}" filter="url(#embro-${uid})">${escapeHtml(opts.text || 'Léno')}</text>
      </svg>`;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  window.LenoMock = { PRODUCTS, filterDefs, demo, shade, escapeHtml, NS };
})();
