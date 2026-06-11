// =====================================================================
// pay-commission
// L'entreprise verse la commission d'un devis signé à l'apporteur.
// Utilise un transfert Stripe Connect vers le compte de l'apporteur,
// puis marque le lead comme "payé". Exécuté avec la clé service_role
// pour pouvoir écrire en base en toute sécurité côté serveur.
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
    const { lead_id } = await req.json();
    if (!lead_id) return json({ error: "lead_id manquant" }, 400);

    // Vérifie l'appelant (doit être l'entreprise propriétaire du lead)
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } },
    );
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return json({ error: "Non authentifié" }, 401);

    // Client admin (service role) pour les écritures
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: lead } = await admin
      .from("leads").select("*").eq("id", lead_id).single();
    if (!lead) return json({ error: "Lead introuvable" }, 404);
    if (lead.company_id !== user.id) return json({ error: "Accès refusé" }, 403);
    if (lead.status !== "signe") return json({ error: "Le devis n'est pas signé" }, 400);

    const { data: apporteur } = await admin
      .from("profiles").select("*").eq("id", lead.apporteur_id).single();
    if (!apporteur?.stripe_connect_id || !apporteur.connect_ready) {
      return json({ error: "L'apporteur n'a pas finalisé son compte de versement" }, 400);
    }

    const amountChf = Math.round(Number(lead.commission_amount) * 100); // centimes
    if (amountChf <= 0) return json({ error: "Commission nulle" }, 400);

    // Transfert vers le compte Connect de l'apporteur
    const transfer = await stripe.transfers.create({
      amount: amountChf,
      currency: "chf",
      destination: apporteur.stripe_connect_id,
      metadata: { lead_id, apporteur_id: lead.apporteur_id },
    });

    await admin.from("payments").insert({
      lead_id,
      apporteur_id: lead.apporteur_id,
      amount: lead.commission_amount,
      stripe_transfer_id: transfer.id,
      status: "paid",
    });
    await admin.from("leads").update({ status: "paye" }).eq("id", lead_id);

    return json({ ok: true, transfer_id: transfer.id });
  } catch (e) {
    return json({ error: String(e?.message ?? e) }, 400);
  }
});
