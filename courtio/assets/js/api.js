/* =========================================================
   Courtio — Couche d'accès aux données (Supabase)
   Nécessite config.js + le client Supabase (chargé via CDN).
   Si le projet n'est pas configuré, isReady() renvoie false
   et les pages basculent en mode démo.
   ========================================================= */
(function () {
  "use strict";

  var cfg = window.COURTIO_CONFIG || {};
  var sb = null;

  function isReady() { return !!cfg.isConfigured && !!window.supabase; }

  function client() {
    if (!sb && isReady()) {
      sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    }
    return sb;
  }

  // Appel d'une fonction Edge (paiements) avec le jeton de l'utilisateur
  async function callFunction(name, body) {
    var c = client();
    var { data: { session } } = await c.auth.getSession();
    var res = await fetch(cfg.functionsBase + "/" + name, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + (session ? session.access_token : cfg.supabaseAnonKey),
        "apikey": cfg.supabaseAnonKey,
      },
      body: JSON.stringify(body || {}),
    });
    var json = await res.json().catch(function () { return {}; });
    if (!res.ok) throw new Error(json.error || ("Erreur " + res.status));
    return json;
  }

  var Auth = {
    async signUp(opts) {
      // opts: { email, password, role, name, sector, canton }
      var c = client();
      var meta = {
        role: opts.role,
        full_name: opts.name,
        company_name: opts.role === "entreprise" ? opts.name : null,
        sector: opts.sector || null,
        canton: opts.canton || null,
      };
      var { data, error } = await c.auth.signUp({
        email: opts.email, password: opts.password, options: { data: meta },
      });
      if (error) throw error;
      return data;
    },
    async signIn(email, password) {
      var { data, error } = await client().auth.signInWithPassword({ email: email, password: password });
      if (error) throw error;
      return data;
    },
    async signOut() { return client().auth.signOut(); },
    async user() {
      var { data: { user } } = await client().auth.getUser();
      return user;
    },
    async profile() {
      var u = await this.user();
      if (!u) return null;
      var { data } = await client().from("profiles").select("*").eq("id", u.id).single();
      return data;
    },
  };

  var Missions = {
    async listActive() {
      var { data, error } = await client()
        .from("missions")
        .select("*, company:profiles!missions_company_id_fkey(company_name, sector)")
        .eq("active", true).order("created_at", { ascending: false });
      if (error) throw error; return data;
    },
    async listMine(companyId) {
      var { data, error } = await client().from("missions").select("*")
        .eq("company_id", companyId).order("created_at", { ascending: false });
      if (error) throw error; return data;
    },
    async create(m) {
      var { data, error } = await client().from("missions").insert(m).select().single();
      if (error) throw error; return data;
    },
  };

  var Leads = {
    async create(l) {
      var { data, error } = await client().from("leads").insert(l).select().single();
      if (error) throw error; return data;
    },
    async forApporteur(id) {
      var { data, error } = await client().from("leads")
        .select("*, mission:missions(title), company:profiles!leads_company_id_fkey(company_name)")
        .eq("apporteur_id", id).order("created_at", { ascending: false });
      if (error) throw error; return data;
    },
    async forCompany(id) {
      var { data, error } = await client().from("leads")
        .select("*, apporteur:profiles!leads_apporteur_id_fkey(full_name)")
        .eq("company_id", id).order("created_at", { ascending: false });
      if (error) throw error; return data;
    },
    async setStatus(id, status, quote) {
      var patch = { status: status };
      if (quote != null) patch.quote_amount = quote;
      var { data, error } = await client().from("leads").update(patch).eq("id", id).select().single();
      if (error) throw error; return data;
    },
  };

  var Pay = {
    subscriptionCheckout() { return callFunction("create-subscription-checkout"); },
    connectOnboarding() { return callFunction("connect-onboarding"); },
    payCommission(leadId) { return callFunction("pay-commission", { lead_id: leadId }); },
  };

  window.Courtio = window.Courtio || {};
  window.Courtio.api = { isReady, client, Auth: Auth, Missions: Missions, Leads: Leads, Pay: Pay };
})();
