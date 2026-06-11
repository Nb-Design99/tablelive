/* =========================================================
   Courtio — Script partagé (header, footer, interactions)
   Aucune dépendance externe.
   ========================================================= */
(function () {
  "use strict";

  /* ---- Logo SVG (réutilisé partout) ---- */
  var LOGO = '<svg class="logo-mark" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<rect width="40" height="40" rx="11" fill="url(#cg)"/>' +
    '<path d="M13 20.5c0-3.6 2.9-6.5 6.5-6.5 1.9 0 3.6.8 4.8 2.1" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>' +
    '<path d="M27 19.5c0 3.6-2.9 6.5-6.5 6.5-1.9 0-3.6-.8-4.8-2.1" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>' +
    '<circle cx="26.5" cy="14.5" r="2.3" fill="#a5f3d0"/>' +
    '<circle cx="13.5" cy="25.5" r="2.3" fill="#a5f3d0"/>' +
    '<defs><linearGradient id="cg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">' +
    '<stop stop-color="#4f46e5"/><stop offset="1" stop-color="#6366f1"/></linearGradient></defs></svg>';

  /* ---- Navigation principale ---- */
  var NAV = [
    { href: "index.html", label: "Accueil" },
    { href: "entreprises.html", label: "Entreprises" },
    { href: "apporteurs.html", label: "Apporteurs" },
    { href: "tarifs.html", label: "Tarifs" },
    { href: "faq.html", label: "FAQ" },
    { href: "contact.html", label: "Contact" }
  ];

  function currentPage() {
    var p = location.pathname.split("/").pop();
    return p === "" ? "index.html" : p;
  }

  function buildHeader() {
    var host = document.querySelector("[data-header]");
    if (!host) return;
    var cur = currentPage();
    var links = NAV.map(function (n) {
      return '<li><a href="' + n.href + '">' + n.label + "</a></li>";
    }).join("");
    host.innerHTML =
      '<header class="site-header"><div class="container"><nav class="nav" id="nav">' +
        '<a class="brand" href="index.html">' + LOGO + "Courtio</a>" +
        '<ul class="nav-links">' + links + "</ul>" +
        '<div class="nav-actions">' +
          '<a class="btn btn-ghost desktop-only" href="connexion.html">Connexion</a>' +
          '<a class="btn btn-primary" href="inscription.html">Commencer</a>' +
          '<button class="nav-toggle" id="navToggle" aria-label="Menu">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>' +
          "</button>" +
        "</div>" +
      "</nav></div></header>";

    var toggle = document.getElementById("navToggle");
    var nav = document.getElementById("nav");
    if (toggle) toggle.addEventListener("click", function () { nav.classList.toggle("open"); });

    // marquer le lien actif
    host.querySelectorAll(".nav-links a").forEach(function (a) {
      if (a.getAttribute("href") === cur) a.style.color = "var(--c-indigo-600)";
    });
  }

  function buildFooter() {
    var host = document.querySelector("[data-footer]");
    if (!host) return;
    var year = new Date().getFullYear();
    host.innerHTML =
      '<footer class="site-footer"><div class="container">' +
        '<div class="footer-grid">' +
          '<div class="footer-brand">' +
            '<a class="brand" href="index.html">' + LOGO + "Courtio</a>" +
            "<p>La marketplace qui connecte les entreprises et les apporteurs d'affaires. Trouvez des clients, payez à la performance.</p>" +
          "</div>" +
          '<div><h4>Produit</h4>' +
            '<a href="entreprises.html">Pour les entreprises</a>' +
            '<a href="apporteurs.html">Pour les apporteurs</a>' +
            '<a href="tarifs.html">Tarifs</a>' +
            '<a href="espace.html">Démo de l\'espace</a></div>' +
          '<div><h4>Ressources</h4>' +
            '<a href="faq.html">FAQ</a>' +
            '<a href="contact.html">Contact</a>' +
            '<a href="index.html#comment">Comment ça marche</a></div>' +
          '<div><h4>Légal</h4>' +
            '<a href="mentions-legales.html">Mentions légales</a>' +
            '<a href="cgu.html">Conditions générales</a>' +
            '<a href="confidentialite.html">Confidentialité</a></div>' +
        "</div>" +
        '<div class="footer-bottom">' +
          "<span>© " + year + " Courtio — Prototype. Conçu en Suisse 🇨🇭</span>" +
          '<span>Paiements sécurisés via Stripe · CHF</span>' +
        "</div>" +
      "</div></footer>";
  }

  /* ---- FAQ accordéon ---- */
  function initFaq() {
    document.querySelectorAll(".faq-q").forEach(function (q) {
      q.addEventListener("click", function () {
        var item = q.closest(".faq-item");
        var a = item.querySelector(".faq-a");
        var open = item.classList.toggle("open");
        a.style.maxHeight = open ? a.scrollHeight + "px" : 0;
      });
    });
  }

  /* ---- Apparition au scroll ---- */
  function initReveal() {
    var els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window) || !els.length) {
      els.forEach(function (e) { e.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ---- Toast (utilisé par app.js & formulaires) ---- */
  window.courtioToast = function (msg) {
    var t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add("show"); });
    setTimeout(function () {
      t.classList.remove("show");
      setTimeout(function () { t.remove(); }, 300);
    }, 2600);
  };

  /* ---- Formulaires de démo (capture sans backend) ---- */
  function initDemoForms() {
    document.querySelectorAll("form[data-demo]").forEach(function (f) {
      f.addEventListener("submit", function (e) {
        e.preventDefault();
        var msg = f.getAttribute("data-demo") || "Envoyé ! (démo)";
        f.reset();
        window.courtioToast(msg);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    buildHeader();
    buildFooter();
    initFaq();
    initReveal();
    initDemoForms();
  });
})();
