/* =========================================================
   Léno Création — Studio de personnalisation
   ========================================================= */
(function () {
  const M = window.LenoMock;
  const stage = document.getElementById('stage');
  const VB = 400;                 // viewBox de la scène
  const UID = 'studio';

  // ⚠️ À remplacer par le vrai numéro WhatsApp de Léno (format international, sans +)
  const WHATSAPP = '41000000000';

  // Couleurs de matière disponibles
  const FABRICS = [
    { n: 'Noir', c: '#1c1a22' }, { n: 'Sherpa gris', c: '#3a3340' },
    { n: 'Écru', c: '#ece2d2' }, { n: 'Violet', c: '#7c4dca' },
    { n: 'Lavande', c: '#b89bdd' }, { n: 'Beige', c: '#cdbfa6' },
    { n: 'Rose poudré', c: '#e6c2c9' }, { n: 'Vert sapin', c: '#3c5347' }
  ];
  // Couleurs de fil à broder
  const THREADS = ['#ffffff', '#b388e0', '#7c4dca', '#1c1a22', '#e6c2c9', '#d9b44a', '#3c5347', '#c64b4b'];

  const state = {
    product: 'cagoule',
    fabric: '#3a3340',
    tab: 'texte',
    text: { value: 'Léna', font: 'Caveat', size: 48, color: '#b388e0', x: null, y: null },
    image: { src: null, mode: 'broderie', size: 110, x: null, y: null },
    tilt: false
  };

  /* ---------- Construction des contrôles ---------- */
  function buildControls() {
    // Articles
    const prodWrap = document.getElementById('products');
    const icons = {
      cagoule: '<path d="M12 2C7 2 5 6 5 12c0 4 1 8 2 9h10c1-1 2-5 2-9 0-6-2-10-7-10z" fill="currentColor"/><ellipse cx="12" cy="11" rx="4" ry="5" fill="#fff"/>',
      sac: '<path d="M8 7c0-2 8-2 8 0" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="5" y="7" width="14" height="14" rx="2" fill="currentColor"/>',
      sweat: '<path d="M8 4 4 6l1 4 2-1v11h10V9l2 1 1-4-4-2c-1 2-7 2-8 0z" fill="currentColor"/>',
      poncho: '<path d="M12 4 5 21h14z" fill="currentColor"/>',
      bonnet: '<path d="M5 15c0-7 14-7 14 0z" fill="currentColor"/><rect x="4" y="15" width="16" height="4" rx="2" fill="currentColor"/>'
    };
    prodWrap.innerHTML = Object.entries(M.PRODUCTS).map(([id, p]) =>
      `<button class="chip ${id === state.product ? 'active' : ''}" data-prod="${id}">
         <svg viewBox="0 0 24 24">${icons[id] || ''}</svg>${p.name}</button>`).join('');
    prodWrap.querySelectorAll('.chip').forEach(b => b.onclick = () => {
      state.product = b.dataset.prod;
      state.text.x = state.text.y = state.image.x = state.image.y = null; // recentrer
      prodWrap.querySelectorAll('.chip').forEach(x => x.classList.toggle('active', x === b));
      render();
    });

    // Matières
    const fab = document.getElementById('fabricSw');
    fab.innerHTML = FABRICS.map(f =>
      `<button class="sw ${f.c === state.fabric ? 'active' : ''}" title="${f.n}" style="background:${f.c}" data-c="${f.c}"></button>`).join('');
    fab.querySelectorAll('.sw').forEach(b => b.onclick = () => {
      state.fabric = b.dataset.c;
      fab.querySelectorAll('.sw').forEach(x => x.classList.toggle('active', x === b));
      render();
    });

    // Fils
    const thr = document.getElementById('threadSw');
    thr.innerHTML = THREADS.map(c =>
      `<button class="sw ${c === state.text.color ? 'active' : ''}" style="background:${c}" data-c="${c}"></button>`).join('');
    thr.querySelectorAll('.sw').forEach(b => b.onclick = () => {
      state.text.color = b.dataset.c;
      thr.querySelectorAll('.sw').forEach(x => x.classList.toggle('active', x === b));
      render();
    });

    // Onglets texte / image
    document.querySelectorAll('.tabs .tab[data-tab]').forEach(t => t.onclick = () => {
      state.tab = t.dataset.tab;
      document.querySelectorAll('.tab[data-tab]').forEach(x => x.classList.toggle('active', x === t));
      document.querySelectorAll('.tabpane').forEach(p => p.classList.toggle('active', p.dataset.pane === state.tab));
    });

    // Champs texte
    document.getElementById('text').oninput = e => { state.text.value = e.target.value; render(); };
    document.getElementById('font').onchange = e => { state.text.font = e.target.value; render(); };
    document.getElementById('textSize').oninput = e => { state.text.size = +e.target.value; render(); };

    // Mode image
    document.querySelectorAll('#imgMode .tab').forEach(t => t.onclick = () => {
      state.image.mode = t.dataset.mode;
      document.querySelectorAll('#imgMode .tab').forEach(x => x.classList.toggle('active', x === t));
      render();
    });
    document.getElementById('imgSize').oninput = e => { state.image.size = +e.target.value; render(); };

    // Upload image
    const input = document.getElementById('imgInput');
    const drop = document.getElementById('dropZone');
    input.onchange = () => input.files[0] && loadImage(input.files[0]);
    ['dragover', 'dragenter'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.style.borderColor = 'var(--violet)'; }));
    ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.style.borderColor = ''; }));
    drop.addEventListener('drop', e => { const f = e.dataTransfer.files[0]; if (f) loadImage(f); });

    // Vue 3D
    document.getElementById('tilt3d').onchange = e => {
      state.tilt = e.target.checked;
      if (!state.tilt) stage.style.transform = 'none';
    };

    // Actions
    document.getElementById('download').onclick = download;
    document.getElementById('order').onclick = order;
  }

  function loadImage(file) {
    const r = new FileReader();
    r.onload = () => {
      state.image.src = r.result;
      state.image.x = state.image.y = null;
      // bascule sur l'onglet image
      document.querySelector('.tab[data-tab="image"]').click();
      render();
    };
    r.readAsDataURL(file);
  }

  /* ---------- Rendu de la scène ---------- */
  function render() {
    const p = M.PRODUCTS[state.product];
    const z = p.zone;
    // positions par défaut = centre de la zone de broderie
    if (state.text.x == null) { state.text.x = z.x + z.w / 2; state.text.y = z.y + z.h / 2; }
    if (state.image.x == null) { state.image.x = z.x + z.w / 2; state.image.y = z.y + z.h / 2; }

    const t = state.text, im = state.image;
    const hasText = t.value.trim().length > 0;

    let textLayer = '';
    if (hasText) {
      textLayer = `<g class="design" id="layer-text" transform="translate(${t.x} ${t.y})">
        <text text-anchor="middle" dominant-baseline="central" font-family="${t.font}, cursive"
              font-size="${t.size}" font-weight="700" fill="${t.color}"
              filter="url(#embro-${UID})">${M.escapeHtml(t.value)}</text></g>`;
    }

    let imgLayer = '';
    if (im.src) {
      const s = im.size, half = s / 2;
      if (im.mode === 'broderie') {
        imgLayer = `<g class="design" id="layer-image" transform="translate(${im.x} ${im.y})">
          <image href="${im.src}" x="${-half}" y="${-half}" width="${s}" height="${s}"
                 preserveAspectRatio="xMidYMid meet" filter="url(#embro-${UID})"/></g>`;
      } else {
        // transfert / flocage : se fond dans le tissu (légère transparence + grain)
        imgLayer = `<g class="design" id="layer-image" transform="translate(${im.x} ${im.y})">
          <image href="${im.src}" x="${-half}" y="${-half}" width="${s}" height="${s}"
                 preserveAspectRatio="xMidYMid meet" opacity="0.93" style="mix-blend-mode:multiply"/>
          <image href="${im.src}" x="${-half}" y="${-half}" width="${s}" height="${s}"
                 preserveAspectRatio="xMidYMid meet" filter="url(#weave-${UID})" opacity="0.5"/></g>`;
      }
    }

    stage.innerHTML = `
      <svg viewBox="0 0 ${VB} ${VB}" id="svgStage" xmlns="http://www.w3.org/2000/svg">
        ${M.filterDefs(UID)}
        <rect width="${VB}" height="${VB}" fill="url(#bgGrad)"/>
        <defs><radialGradient id="bgGrad" cx="50%" cy="32%" r="75%">
          <stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#efe6fb"/>
        </radialGradient></defs>
        <g filter="url(#fuzz-${UID})">${p.shape(state.fabric)}</g>
        ${imgLayer}
        ${textLayer}
      </svg>`;

    attachDrag();
  }

  /* ---------- Glisser-déposer des calques ---------- */
  function attachDrag() {
    const svg = document.getElementById('svgStage');
    let active = null, startX = 0, startY = 0, origX = 0, origY = 0;

    function scale() { return VB / svg.getBoundingClientRect().width; }

    svg.querySelectorAll('.design').forEach(g => {
      g.addEventListener('pointerdown', e => {
        e.preventDefault();
        active = g.id === 'layer-image' ? state.image : state.text;
        startX = e.clientX; startY = e.clientY; origX = active.x; origY = active.y;
        g.setPointerCapture(e.pointerId);
      });
      g.addEventListener('pointermove', e => {
        if (!active) return;
        const k = scale();
        active.x = clamp(origX + (e.clientX - startX) * k, 20, VB - 20);
        active.y = clamp(origY + (e.clientY - startY) * k, 20, VB - 20);
        g.setAttribute('transform', `translate(${active.x} ${active.y})`);
      });
      const stop = () => { active = null; };
      g.addEventListener('pointerup', stop);
      g.addEventListener('pointercancel', stop);
    });
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------- Vue volume (tilt 3D) ---------- */
  const wrap = stage.parentElement;
  wrap.addEventListener('mousemove', e => {
    if (!state.tilt) return;
    const r = stage.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
    const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
    stage.style.transform = `rotateY(${dx * 18}deg) rotateX(${-dy * 18}deg) scale(1.02)`;
  });
  wrap.addEventListener('mouseleave', () => { if (state.tilt) stage.style.transform = 'rotateY(0) rotateX(0)'; });

  /* ---------- Téléchargement PNG ---------- */
  async function download() {
    const btn = document.getElementById('download');
    const old = btn.textContent; btn.textContent = '⏳ Préparation…';
    try {
      const svgEl = document.getElementById('svgStage').cloneNode(true);
      svgEl.setAttribute('width', 1000); svgEl.setAttribute('height', 1000);
      let svgStr = new XMLSerializer().serializeToString(svgEl);
      svgStr = await embedFont(svgStr, state.text.font);

      const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
      const img = new Image();
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });

      const cv = document.createElement('canvas'); cv.width = cv.height = 1000;
      cv.getContext('2d').drawImage(img, 0, 0, 1000, 1000);
      const a = document.createElement('a');
      a.download = `leno-creation-${state.product}.png`;
      a.href = cv.toDataURL('image/png');
      a.click();
    } catch (err) {
      alert("L'aperçu s'affiche bien à l'écran ✨ mais le téléchargement a échoué sur ce navigateur. Tu peux faire une capture d'écran en attendant.");
      console.error(err);
    } finally { btn.textContent = old; }
  }

  // Intègre la police choisie dans le SVG (pour que le texte s'affiche dans le PNG)
  async function embedFont(svgStr, family) {
    try {
      const fam = family.replace(/'/g, '');
      const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fam)}:wght@700&display=swap`;
      const css = await (await fetch(cssUrl)).text();
      const m = css.match(/url\((https:\/\/[^)]+\.woff2)\)/);
      if (!m) return svgStr;
      const buf = await (await fetch(m[1])).arrayBuffer();
      let bin = ''; const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      const b64 = btoa(bin);
      const face = `<style>@font-face{font-family:'${fam}';font-weight:700;src:url(data:font/woff2;base64,${b64}) format('woff2');}</style>`;
      return svgStr.replace(/(<svg[^>]*>)/, `$1${face}`);
    } catch (e) { return svgStr; }
  }

  /* ---------- Commande via WhatsApp ---------- */
  function order() {
    const p = M.PRODUCTS[state.product];
    const fabName = (FABRICS.find(f => f.c === state.fabric) || {}).n || state.fabric;
    const lines = [
      'Bonjour Léno Création ! 💜',
      'Je souhaite commander une pièce personnalisée :',
      `• Article : ${p.name}`,
      `• Matière / couleur : ${fabName}`
    ];
    if (state.text.value.trim()) lines.push(`• Broderie texte : « ${state.text.value} » (style ${state.text.font.replace(/'/g, '')})`);
    if (state.image.src) lines.push(`• Visuel ajouté : oui (rendu ${state.image.mode}) — je l'envoie en photo`);
    lines.push('', 'Voici mon aperçu :');
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank');
  }

  /* ---------- Init ---------- */
  buildControls();
  render();
})();
