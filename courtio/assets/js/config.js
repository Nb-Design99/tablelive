/* =========================================================
   Courtio — Configuration
   ---------------------------------------------------------
   Collez ici les clés de VOTRE projet Supabase (onglet
   Project Settings > API). Tant qu'elles sont vides, le site
   reste en MODE DÉMO (données locales dans le navigateur).
   Ces clés "anon/public" sont conçues pour être exposées
   côté client — la sécurité réelle est assurée par les
   règles RLS de la base (voir backend/schema.sql).
   ========================================================= */
window.COURTIO_CONFIG = {
  supabaseUrl: "",       // ex : "https://xxxxxxxx.supabase.co"
  supabaseAnonKey: "",   // ex : "eyJhbGciOi..."
};

// Mode démo automatique si non configuré
window.COURTIO_CONFIG.isConfigured = Boolean(
  window.COURTIO_CONFIG.supabaseUrl && window.COURTIO_CONFIG.supabaseAnonKey
);
// Base d'appel des fonctions Edge (paiements)
window.COURTIO_CONFIG.functionsBase = window.COURTIO_CONFIG.supabaseUrl
  ? window.COURTIO_CONFIG.supabaseUrl + "/functions/v1"
  : "";
