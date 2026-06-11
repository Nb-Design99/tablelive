/* =========================================================
   Courtio — Démo interactive de l'espace (sans backend)
   Données persistées dans localStorage (clé: courtio_demo).
   Deux rôles : "apporteur" et "entreprise".
   Flux d'un lead : nouveau → devis_envoye → signe → paye
   ========================================================= */
(function () {
  "use strict";

  var KEY = "courtio_demo_v1";
  var STATUS = {
    nouveau:      { label: "Nouveau",       badge: "badge-new" },
    devis_envoye: { label: "Devis envoyé",  badge: "badge-sent" },
    signe:        { label: "Devis signé",   badge: "badge-signed" },
    paye:         { label: "Commission payée", badge: "badge-paid" }
  };

  /* ---------- Données initiales (seed) ---------- */
  function seed() {
    return {
      role: "apporteur",
      user: { apporteur: "Alex Vendeur", entreprise: "Peinture Duval Sàrl" },
      companies: [
        { id: "c1", name: "Peinture Duval Sàrl", sector: "Peinture & rénovation", letter: "P",
          reward: { type: "percent", value: 8 },
          mission: "Nous cherchons des chantiers de peinture intérieure/extérieure dans le canton de Vaud. Particuliers et PME." },
        { id: "c2", name: "InfoNet Services", sector: "Informatique & IT", letter: "I",
          reward: { type: "fixed", value: 250 },
          mission: "Maintenance de parc informatique pour PME (5 à 50 postes). 250 CHF par contrat signé." },
        { id: "c3", name: "BatiPro Construction", sector: "Bâtiment & gros œuvre", letter: "B",
          reward: { type: "percent", value: 5 },
          mission: "Rénovations et extensions de maisons individuelles. Région lémanique." },
        { id: "c4", name: "GreenJardin", sector: "Paysagisme", letter: "G",
          reward: { type: "fixed", value: 120 },
          mission: "Entretien et création de jardins. 120 CHF par nouveau client sous contrat." }
      ],
      leads: [
        { id: "l1", companyId: "c1", client: "Famille Rochat", need: "Peinture d'un appartement 4.5 pièces à Lausanne",
          quote: 6800, status: "signe", createdBy: "apporteur", date: "2026-05-28" },
        { id: "l2", companyId: "c2", client: "Garage Moderne SA", need: "Contrat maintenance 12 postes",
          quote: 0, status: "devis_envoye", createdBy: "apporteur", date: "2026-06-02" },
        { id: "l3", companyId: "c1", client: "M. Bertholet", need: "Façade d'une villa à Morges",
          quote: 0, status: "nouveau", createdBy: "apporteur", date: "2026-06-08" }
      ]
    };
  }

  /* ---------- Persistance ---------- */
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) { var s = seed(); save(s); return s; }
      return JSON.parse(raw);
    } catch (e) { return seed(); }
  }
  function save(state) { localStorage.setItem(KEY, JSON.stringify(state)); }

  /* ---------- Helpers ---------- */
  function chf(n) { return new Intl.NumberFormat("fr-CH", { style: "currency", currency: "CHF", maximumFractionDigits: 0 }).format(n || 0); }
  function company(state, id) { return state.companies.filter(function (c) { return c.id === id; })[0]; }
  function rewardLabel(r) { return r.type === "percent" ? r.value + " % du devis" : chf(r.value) + " / client"; }
  function commission(state, lead) {
    var c = company(state, lead.companyId);
    if (!c) return 0;
    if (c.reward.type === "fixed") return c.reward.value;
    return Math.round((lead.quote || 0) * c.reward.value / 100);
  }
  function statusBadge(st) {
    var s = STATUS[st] || STATUS.nouveau;
    return '<span class="badge ' + s.badge + '">' + s.label + "</span>";
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (m) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]; }); }

  /* ---------- Icônes ---------- */
  var I = {
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    store: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l1.5-5h15L21 9M4 9v10h16V9M4 9h16"/></svg>',
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
    cash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg>',
    inbox: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h5l2 3h4l2-3h5"/><path d="M5 5h14l2 7v7H3v-7l2-7z"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>'
  };

  /* ---------- Rendu : barre latérale ---------- */
  function sideNav(state, active) {
    var items = state.role === "apporteur"
      ? [["dashboard","Tableau de bord",I.grid],["marketplace","Marketplace",I.store],["leads","Mes leads",I.list],["earnings","Mes gains",I.cash]]
      : [["dashboard","Tableau de bord",I.grid],["received","Leads reçus",I.inbox],["missions","Mes missions",I.list],["billing","Facturation",I.cash]];
    var who = state.role === "apporteur" ? state.user.apporteur : state.user.entreprise;
    var roleName = state.role === "apporteur" ? "Apporteur d'affaires" : "Entreprise";
    return '<aside class="app-side">' +
      '<div style="padding:0 8px 8px"><div style="font-weight:700;color:#fff">' + esc(who) + '</div>' +
      '<div style="font-size:.82rem;color:#64748b">' + roleName + "</div></div>" +
      '<div class="side-title">Navigation</div>' +
      items.map(function (it) {
        return '<a href="#' + it[0] + '" class="' + (active === it[0] ? "active" : "") + '">' + it[2] + it[1] + "</a>";
      }).join("") +
      '<div class="side-title">Démo</div>' +
      '<a href="#switch">' + I.cash + 'Changer de rôle</a>' +
      '<a href="index.html">← Retour au site</a>' +
      "</aside>";
  }

  /* ---------- Vues APPORTEUR ---------- */
  function viewApporteurDashboard(state) {
    var mine = state.leads;
    var signed = mine.filter(function (l) { return l.status === "signe" || l.status === "paye"; });
    var pending = mine.filter(function (l) { return l.status === "nouveau" || l.status === "devis_envoye"; });
    var earned = signed.reduce(function (s, l) { return s + commission(state, l); }, 0);
    var paid = mine.filter(function (l) { return l.status === "paye"; }).reduce(function (s, l) { return s + commission(state, l); }, 0);
    return topbar("Tableau de bord", "Bonjour " + esc(state.user.apporteur) + " 👋") +
      '<div class="stat-grid">' +
        stat("Leads soumis", mine.length, "") +
        stat("Devis signés", signed.length, "") +
        stat("Gains générés", chf(earned), "+ commissions") +
        stat("Déjà versé", chf(paid), "") +
      "</div>" +
      '<div class="notice notice-info">' + I.check + "<div>Astuce : va dans la <a href=\"#marketplace\">Marketplace</a> pour choisir une entreprise et soumettre un nouveau client. Tu es payé quand le devis est signé.</div></div>" +
      recentLeadsPanel(state);
  }

  function viewMarketplace(state) {
    var cards = state.companies.map(function (c) {
      return '<div class="mission">' +
        '<div class="co"><div class="logo">' + c.letter + '</div><div><strong style="color:var(--c-ink)">' + esc(c.name) + "</strong><div style=\"font-size:.85rem;color:var(--c-muted)\">" + esc(c.sector) + "</div></div></div>" +
        '<p style="color:var(--c-muted);font-size:.94rem">' + esc(c.mission) + "</p>" +
        '<div style="margin:6px 0 16px"><span class="reward">💰 ' + rewardLabel(c.reward) + "</span></div>" +
        '<button class="btn btn-primary btn-block" data-action="open-lead" data-company="' + c.id + '">Apporter un client</button>' +
      "</div>";
    }).join("");
    return topbar("Marketplace", "Choisis une entreprise et apporte-lui un client") +
      '<div class="mission-grid">' + cards + "</div>";
  }

  function viewMyLeads(state) {
    if (!state.leads.length) return topbar("Mes leads", "") + emptyState("Aucun lead pour l'instant.");
    var rows = state.leads.map(function (l) {
      var c = company(state, l.companyId);
      var com = (l.status === "signe" || l.status === "paye") ? chf(commission(state, l)) : "—";
      return "<tr><td class=\"strong\">" + esc(l.client) + "<div style=\"font-size:.82rem;color:var(--c-muted);font-weight:400\">" + esc(l.need) + "</div></td>" +
        "<td>" + esc(c ? c.name : "—") + "</td>" +
        "<td>" + statusBadge(l.status) + "</td>" +
        "<td class=\"strong\">" + com + "</td>" +
        "<td style=\"color:var(--c-muted)\">" + esc(l.date) + "</td></tr>";
    }).join("");
    return topbar("Mes leads", "Suivi de tous tes clients apportés") +
      '<div class="panel"><div class="panel-body" style="padding:0"><table class="data"><thead><tr>' +
      "<th>Client</th><th>Entreprise</th><th>Statut</th><th>Commission</th><th>Date</th></tr></thead><tbody>" +
      rows + "</tbody></table></div></div>";
  }

  function viewEarnings(state) {
    var signed = state.leads.filter(function (l) { return l.status === "signe" || l.status === "paye"; });
    var total = signed.reduce(function (s, l) { return s + commission(state, l); }, 0);
    var paid = state.leads.filter(function (l) { return l.status === "paye"; }).reduce(function (s, l) { return s + commission(state, l); }, 0);
    var rows = signed.map(function (l) {
      var c = company(state, l.companyId);
      return "<tr><td class=\"strong\">" + esc(l.client) + "</td><td>" + esc(c ? c.name : "") + "</td>" +
        "<td>" + statusBadge(l.status) + "</td><td class=\"strong\">" + chf(commission(state, l)) + "</td></tr>";
    }).join("") || "<tr><td colspan=\"4\" class=\"empty\">Pas encore de commission. Apporte des clients !</td></tr>";
    return topbar("Mes gains", "") +
      '<div class="stat-grid"><div class="stat"><div class="label">Total généré</div><div class="value">' + chf(total) + "</div></div>" +
      '<div class="stat"><div class="label">Déjà versé</div><div class="value">' + chf(paid) + "</div></div>" +
      '<div class="stat"><div class="label">En attente de versement</div><div class="value">' + chf(total - paid) + "</div></div></div>" +
      '<div class="panel"><div class="panel-head"><h2>Détail des commissions</h2></div><div class="panel-body" style="padding:0">' +
      '<table class="data"><thead><tr><th>Client</th><th>Entreprise</th><th>Statut</th><th>Commission</th></tr></thead><tbody>' +
      rows + "</tbody></table></div></div>" +
      '<div class="notice notice-info" style="margin-top:18px">' + I.cash + "<div>En production, les versements seraient automatiques via <strong>Stripe Connect</strong> dès que l'entreprise confirme la signature du devis.</div></div>";
  }

  /* ---------- Vues ENTREPRISE ---------- */
  function viewEntrepriseDashboard(state) {
    var received = state.leads;
    var toTreat = received.filter(function (l) { return l.status === "nouveau"; });
    var signed = received.filter(function (l) { return l.status === "signe"; });
    var toPay = signed.reduce(function (s, l) { return s + commission(state, l); }, 0);
    return topbar("Tableau de bord", "Espace entreprise — " + esc(state.user.entreprise)) +
      '<div class="stat-grid">' +
        stat("Leads reçus", received.length, "") +
        stat("À traiter", toTreat.length, "") +
        stat("Devis signés", signed.length, "") +
        stat("Commissions à payer", chf(toPay), "") +
      "</div>" +
      '<div class="notice notice-success">' + I.check + "<div>Vous ne payez que pour les résultats : une commission n'est due qu'au moment où un devis est signé.</div></div>" +
      receivedPanel(state, true);
  }

  function viewReceived(state) {
    return topbar("Leads reçus", "Traitez les clients apportés et faites avancer leur statut") + receivedPanel(state, false);
  }

  function viewMissions(state) {
    var c = state.companies[0]; // l'entreprise courante (démo)
    var cards = state.companies.map(function (co) {
      return '<div class="mission"><div class="co"><div class="logo">' + co.letter + '</div><div><strong style="color:var(--c-ink)">' + esc(co.name) + "</strong><div style=\"font-size:.85rem;color:var(--c-muted)\">" + esc(co.sector) + "</div></div></div>" +
        '<p style="color:var(--c-muted);font-size:.94rem">' + esc(co.mission) + "</p>" +
        '<div><span class="reward">💰 ' + rewardLabel(co.reward) + "</span></div></div>";
    }).join("");
    return topbar("Mes missions", "Ce que voient les apporteurs dans la marketplace") +
      '<div class="panel"><div class="panel-head"><h2>Publier une mission</h2></div><div class="panel-body">' +
      '<form data-action="add-mission" class="grid grid-2" style="gap:14px">' +
        '<div class="form-field" style="margin:0"><label>Secteur</label><input name="sector" placeholder="Ex : Plomberie" required></div>' +
        '<div class="form-field" style="margin:0"><label>Type de rémunération</label><select name="rtype"><option value="percent">Pourcentage du devis</option><option value="fixed">Montant fixe par client</option></select></div>' +
        '<div class="form-field" style="margin:0"><label>Valeur (CHF ou %)</label><input name="rvalue" type="number" min="1" placeholder="Ex : 8 ou 250" required></div>' +
        '<div class="form-field" style="margin:0"><label>Description de la mission</label><input name="mission" placeholder="Quels clients cherchez-vous ?" required></div>' +
        '<div style="grid-column:1/-1"><button class="btn btn-primary" type="submit">Publier la mission</button></div>' +
      "</form></div></div>" +
      '<div class="mission-grid">' + cards + "</div>";
  }

  function viewBilling(state) {
    var signed = state.leads.filter(function (l) { return l.status === "signe"; });
    var paid = state.leads.filter(function (l) { return l.status === "paye"; });
    var due = signed.reduce(function (s, l) { return s + commission(state, l); }, 0);
    var rows = signed.concat(paid).map(function (l) {
      return "<tr><td class=\"strong\">" + esc(l.client) + "</td><td>" + chf(l.quote) + "</td><td>" + statusBadge(l.status) + "</td><td class=\"strong\">" + chf(commission(state, l)) + "</td>" +
        "<td>" + (l.status === "signe" ? '<button class="btn btn-emerald" data-action="pay" data-id="' + l.id + '">Payer la commission</button>' : '<span class="text-muted">Réglé ✓</span>') + "</td></tr>";
    }).join("") || "<tr><td colspan=\"5\" class=\"empty\">Aucune commission à régler.</td></tr>";
    return topbar("Facturation", "Réglez les commissions des devis signés") +
      '<div class="stat-grid"><div class="stat"><div class="label">Abonnement</div><div class="value">99.-<span style="font-size:.9rem;color:var(--c-muted)">/mois</span></div></div>' +
      '<div class="stat"><div class="label">Commissions à payer</div><div class="value">' + chf(due) + "</div></div>" +
      '<div class="stat"><div class="label">Devis signés ce mois</div><div class="value">' + signed.length + "</div></div></div>" +
      '<div class="panel"><div class="panel-head"><h2>Commissions sur devis signés</h2></div><div class="panel-body" style="padding:0">' +
      '<table class="data"><thead><tr><th>Client</th><th>Montant devis</th><th>Statut</th><th>Commission</th><th></th></tr></thead><tbody>' +
      rows + "</tbody></table></div></div>" +
      '<div class="notice notice-info" style="margin-top:18px">' + I.cash + "<div>En production, le paiement passerait par <strong>Stripe</strong> (carte, TWINT, prélèvement) avec reversement automatique à l'apporteur.</div></div>";
  }

  /* ---------- Panneaux partagés ---------- */
  function receivedPanel(state, compact) {
    var leads = compact ? state.leads.slice(0, 5) : state.leads;
    if (!leads.length) return emptyState("Aucun lead reçu pour l'instant.");
    var rows = leads.map(function (l) {
      var actions = "";
      if (l.status === "nouveau") actions = '<button class="btn btn-ghost" data-action="advance" data-id="' + l.id + '" data-to="devis_envoye">Marquer « devis envoyé »</button>';
      else if (l.status === "devis_envoye") actions = '<button class="btn btn-ghost" data-action="sign" data-id="' + l.id + '">Marquer « signé »</button>';
      else if (l.status === "signe") actions = '<span class="text-muted">Commission ' + chf(commission(state, l)) + " due</span>";
      else actions = '<span class="text-muted">Clôturé ✓</span>';
      return "<tr><td class=\"strong\">" + esc(l.client) + "<div style=\"font-size:.82rem;color:var(--c-muted);font-weight:400\">" + esc(l.need) + "</div></td>" +
        "<td>" + (l.quote ? chf(l.quote) : '<span class="text-muted">—</span>') + "</td>" +
        "<td>" + statusBadge(l.status) + "</td><td>" + actions + "</td></tr>";
    }).join("");
    return '<div class="panel"><div class="panel-head"><h2>' + (compact ? "Derniers leads reçus" : "Tous les leads") + "</h2>" +
      (compact ? '<a class="btn-link" href="#received">Tout voir →</a>' : "") + "</div>" +
      '<div class="panel-body" style="padding:0"><table class="data"><thead><tr><th>Client</th><th>Devis</th><th>Statut</th><th>Action</th></tr></thead><tbody>' +
      rows + "</tbody></table></div></div>";
  }

  function recentLeadsPanel(state) {
    var leads = state.leads.slice(0, 5);
    if (!leads.length) return emptyState("Aucun lead. Va dans la Marketplace pour commencer !");
    var rows = leads.map(function (l) {
      var c = company(state, l.companyId);
      return "<tr><td class=\"strong\">" + esc(l.client) + "</td><td>" + esc(c ? c.name : "") + "</td><td>" + statusBadge(l.status) + "</td></tr>";
    }).join("");
    return '<div class="panel"><div class="panel-head"><h2>Mes derniers leads</h2><a class="btn-link" href="#leads">Tout voir →</a></div>' +
      '<div class="panel-body" style="padding:0"><table class="data"><thead><tr><th>Client</th><th>Entreprise</th><th>Statut</th></tr></thead><tbody>' +
      rows + "</tbody></table></div></div>";
  }

  function emptyState(msg) {
    return '<div class="panel"><div class="empty">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 12h5l2 3h4l2-3h5"/><path d="M5 5h14l2 7v7H3v-7l2-7z"/></svg>' +
      "<div>" + msg + "</div></div></div>";
  }

  function stat(label, value, trend) {
    return '<div class="stat"><div class="label">' + label + '</div><div class="value">' + value + "</div>" +
      (trend ? '<div class="trend">' + trend + "</div>" : "") + "</div>";
  }
  function topbar(title, sub) {
    return '<div class="app-topbar"><div><h1>' + title + "</h1>" + (sub ? '<p class="text-muted" style="margin:.2rem 0 0">' + sub + "</p>" : "") + "</div></div>";
  }

  /* ---------- Modal "apporter un client" ---------- */
  function openLeadModal(state, companyId) {
    var c = company(state, companyId);
    if (!c) return;
    var back = document.createElement("div");
    back.style.cssText = "position:fixed;inset:0;background:rgba(15,23,42,.55);display:grid;place-items:center;z-index:120;padding:20px";
    back.innerHTML =
      '<div style="background:#fff;border-radius:18px;max-width:460px;width:100%;padding:28px;box-shadow:var(--shadow-lg)">' +
      '<h2 style="margin-top:0">Apporter un client à ' + esc(c.name) + "</h2>" +
      '<p class="text-muted" style="font-size:.92rem">Rémunération : <strong>' + rewardLabel(c.reward) + "</strong></p>" +
      '<form id="leadForm">' +
        '<div class="form-field"><label>Nom du client / prospect</label><input name="client" required placeholder="Ex : Famille Martin"></div>' +
        '<div class="form-field"><label>Besoin / description</label><textarea name="need" rows="2" required placeholder="Ex : Repeindre un appartement de 3 pièces"></textarea></div>' +
        '<div class="form-field"><label>Valeur estimée du projet (CHF, optionnel)</label><input name="value" type="number" min="0" placeholder="Ex : 5000"></div>' +
        '<div class="flex gap-2" style="margin-top:8px"><button class="btn btn-primary btn-block" type="submit">Envoyer le lead</button>' +
        '<button class="btn btn-ghost" type="button" id="closeModal">Annuler</button></div>' +
      "</form></div>";
    document.body.appendChild(back);
    function close() { back.remove(); }
    back.addEventListener("click", function (e) { if (e.target === back) close(); });
    back.querySelector("#closeModal").addEventListener("click", close);
    back.querySelector("#leadForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(e.target);
      state.leads.unshift({
        id: "l" + Date.now(), companyId: companyId,
        client: fd.get("client"), need: fd.get("need"),
        quote: Number(fd.get("value")) || 0, status: "nouveau",
        createdBy: "apporteur", date: new Date().toISOString().slice(0, 10)
      });
      save(state); close();
      window.courtioToast("Lead envoyé à " + c.name + " ✅");
      location.hash = "#leads"; render();
    });
  }

  /* ---------- Actions ---------- */
  function bindActions(state) {
    document.querySelectorAll("[data-action]").forEach(function (el) {
      el.addEventListener("click", function () {
        var a = el.getAttribute("data-action");
        var id = el.getAttribute("data-id");
        var lead = state.leads.filter(function (l) { return l.id === id; })[0];
        if (a === "open-lead") return openLeadModal(state, el.getAttribute("data-company"));
        if (a === "advance" && lead) { lead.status = el.getAttribute("data-to"); save(state); window.courtioToast("Statut mis à jour"); render(); }
        if (a === "sign" && lead) {
          if (!lead.quote) {
            var v = prompt("Montant du devis signé (CHF) ?", "5000");
            if (v === null) return;
            lead.quote = Number(v) || 0;
          }
          lead.status = "signe"; save(state);
          window.courtioToast("Devis signé ! Commission : " + chf(commission(state, lead)));
          render();
        }
        if (a === "pay" && lead) { lead.status = "paye"; save(state); window.courtioToast("Commission versée (démo)"); render(); }
      });
    });
    var addForm = document.querySelector("form[data-action='add-mission']");
    if (addForm) addForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(e.target);
      var name = state.user.entreprise;
      state.companies.unshift({
        id: "c" + Date.now(), name: name, sector: fd.get("sector"),
        letter: name.charAt(0).toUpperCase(),
        reward: { type: fd.get("rtype"), value: Number(fd.get("rvalue")) || 0 },
        mission: fd.get("mission")
      });
      save(state); window.courtioToast("Mission publiée ✅"); render();
    });
  }

  /* ---------- Routeur ---------- */
  function route() { return (location.hash || "#dashboard").slice(1); }

  function render() {
    var state = load();
    var host = document.getElementById("app");
    if (!host) return;
    var r = route();

    if (r === "switch") {
      state.role = state.role === "apporteur" ? "entreprise" : "apporteur";
      save(state);
      window.courtioToast("Rôle : " + (state.role === "apporteur" ? "Apporteur" : "Entreprise"));
      location.hash = "#dashboard";
      return render();
    }

    var content;
    if (state.role === "apporteur") {
      content = ({ dashboard: viewApporteurDashboard, marketplace: viewMarketplace, leads: viewMyLeads, earnings: viewEarnings }[r] || viewApporteurDashboard)(state);
    } else {
      content = ({ dashboard: viewEntrepriseDashboard, received: viewReceived, missions: viewMissions, billing: viewBilling }[r] || viewEntrepriseDashboard)(state);
    }

    host.innerHTML = '<div class="app-shell">' + sideNav(state, r) + '<main class="app-main">' + content + "</main></div>";
    bindActions(state);
  }

  /* ---------- Réinitialisation (lien data-reset) ---------- */
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-reset]");
    if (t) { e.preventDefault(); localStorage.removeItem(KEY); window.courtioToast("Démo réinitialisée"); location.hash = "#dashboard"; render(); }
  });

  window.addEventListener("hashchange", render);
  document.addEventListener("DOMContentLoaded", render);
})();
