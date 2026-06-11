// =====================================================================
// stripe-webhook
// Reçoit les événements Stripe et met la base à jour :
//  - abonnement entreprise activé / annulé
//  - compte Connect de l'apporteur prêt (onboarding terminé)
// À déclarer dans Stripe : Developers > Webhooks > endpoint vers cette URL.
// Déployer SANS vérification JWT (--no-verify-jwt) : Stripe n'envoie pas de JWT.
// =====================================================================
import Stripe from "https://esm.sh/stripe@14?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
});
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig!, webhookSecret);
  } catch (e) {
    return new Response(`Signature invalide: ${e.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const obj = event.data.object as any;
        const customerId = obj.customer;
        const status = obj.status === "active" || obj.payment_status === "paid"
          ? "active" : (obj.status ?? "active");
        if (customerId) {
          await admin.from("profiles")
            .update({ subscription_status: status })
            .eq("stripe_customer_id", customerId);
        }
        break;
      }
      case "customer.subscription.deleted": {
        const obj = event.data.object as any;
        await admin.from("profiles")
          .update({ subscription_status: "inactive" })
          .eq("stripe_customer_id", obj.customer);
        break;
      }
      case "account.updated": {
        const acct = event.data.object as Stripe.Account;
        const ready = acct.charges_enabled || acct.payouts_enabled ||
          (acct.capabilities?.transfers === "active");
        await admin.from("profiles")
          .update({ connect_ready: !!ready })
          .eq("stripe_connect_id", acct.id);
        break;
      }
      default:
        break;
    }
    return new Response("ok", { status: 200 });
  } catch (e) {
    return new Response(`Erreur: ${e.message}`, { status: 500 });
  }
});
