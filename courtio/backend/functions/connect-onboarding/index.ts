// =====================================================================
// connect-onboarding
// L'apporteur crée son compte Stripe Connect (Express) pour recevoir
// ses commissions, puis reçoit un lien d'onboarding Stripe.
// =====================================================================
import Stripe from "https://esm.sh/stripe@14?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Non authentifié" }, 401);

    const { data: profile } = await supabase
      .from("profiles").select("*").eq("id", user.id).single();
    if (!profile || profile.role !== "apporteur") {
      return json({ error: "Réservé aux apporteurs" }, 403);
    }

    // Crée le compte Connect Express s'il n'existe pas
    let accountId = profile.stripe_connect_id;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "CH",
        email: user.email,
        capabilities: { transfers: { requested: true } },
        business_type: "individual",
        metadata: { profile_id: user.id },
      });
      accountId = account.id;
      await supabase.from("profiles").update({ stripe_connect_id: accountId }).eq("id", user.id);
    }

    const origin = req.headers.get("origin") ?? "https://courtio.ch";
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/espace.html?connect=refresh`,
      return_url: `${origin}/espace.html?connect=ok`,
      type: "account_onboarding",
    });

    return json({ url: link.url });
  } catch (e) {
    return json({ error: String(e?.message ?? e) }, 400);
  }
});
