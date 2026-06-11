// =====================================================================
// create-subscription-checkout
// L'entreprise lance un abonnement (Stripe Checkout, mode subscription).
// Renvoie l'URL de paiement Stripe vers laquelle rediriger l'utilisateur.
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
    // Identifie l'utilisateur via son jeton Supabase
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Non authentifié" }, 401);

    const { data: profile } = await supabase
      .from("profiles").select("*").eq("id", user.id).single();
    if (!profile || profile.role !== "entreprise") {
      return json({ error: "Réservé aux entreprises" }, 403);
    }

    // Crée (ou réutilise) le client Stripe
    let customerId = profile.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: profile.company_name ?? profile.full_name ?? undefined,
        metadata: { profile_id: user.id },
      });
      customerId = customer.id;
      await supabase.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
    }

    const origin = req.headers.get("origin") ?? "https://courtio.ch";
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: Deno.env.get("STRIPE_PRICE_PRO")!, quantity: 1 }],
      success_url: `${origin}/espace.html?abonnement=ok`,
      cancel_url: `${origin}/tarifs.html`,
      // TWINT/cartes selon la config du compte Stripe
    });

    return json({ url: session.url });
  } catch (e) {
    return json({ error: String(e?.message ?? e) }, 400);
  }
});
