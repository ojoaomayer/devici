import Stripe from 'stripe';

export type BillingInterval = 'month' | 'year';

export interface PlanPricing {
  priceCents: number; // Preço total cobrado no ciclo (ex: 70800 para anual)
  monthlyEquivalentCents: number; // Valor equivalente por mês (ex: 5900)
  savingsPercent?: number; // Percentual de economia (ex: 39)
}

export interface PlanConfig {
  id: 'pro' | 'construtora';
  name: string;
  monthly: PlanPricing;
  yearly: PlanPricing;
  limit: number;
  description: string;
  priceCents: number; // Mantido para retrocompatibilidade
  priceId?: string;
}

export const PLANS: Record<'pro' | 'construtora', PlanConfig> = {
  pro: {
    id: 'pro',
    name: 'Plano Profissional - DeVici',
    monthly: {
      priceCents: 9700, // R$ 97,00 / mês
      monthlyEquivalentCents: 9700,
    },
    yearly: {
      priceCents: 70800, // R$ 708,00 / ano
      monthlyEquivalentCents: 5900, // R$ 59,00 / mês
      savingsPercent: 39,
    },
    priceCents: 9700,
    limit: 10,
    description: 'Até 10 planilhas completas por mês, BDI TCU Oficial e Suporte Especializado',
  },
  construtora: {
    id: 'construtora',
    name: 'Plano Construtora - DeVici',
    monthly: {
      priceCents: 19700, // R$ 197,00 / mês
      monthlyEquivalentCents: 19700,
    },
    yearly: {
      priceCents: 142800, // R$ 1.428,00 / ano
      monthlyEquivalentCents: 11900, // R$ 119,00 / mês
      savingsPercent: 40,
    },
    priceCents: 19700,
    limit: 999,
    description: 'Planilhas ilimitadas, múltiplos acessos e suporte avançado SINAPI/SICRO/SECID',
  },
};

// Instância singleton do Stripe
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('Chave secreta do Stripe (STRIPE_SECRET_KEY) não configurada no .env');
  }

  if (!stripeInstance) {
    stripeInstance = new Stripe(secretKey, {
      typescript: true,
    });
  }

  return stripeInstance;
}

interface CreateCheckoutParams {
  planId: 'pro' | 'construtora';
  billingInterval?: BillingInterval;
  userId: string;
  userEmail: string;
  userName?: string;
  baseUrl?: string;
}

export async function createStripeCheckoutSession({
  planId,
  billingInterval = 'year',
  userId,
  userEmail,
  userName,
  baseUrl,
}: CreateCheckoutParams) {
  const stripe = getStripe();
  const plan = PLANS[planId];

  if (!plan) {
    throw new Error(`Plano inválido selecionado: ${planId}`);
  }

  const interval: 'month' | 'year' = billingInterval === 'month' ? 'month' : 'year';
  const pricing = interval === 'year' ? plan.yearly : plan.monthly;
  const periodLabel = interval === 'year' ? 'Anual' : 'Mensal';

  const host = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const successUrl = `${host}/dashboard?payment=success&plan=${planId}&billing=${interval}&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${host}/dashboard?payment=cancelled`;

  // Se houver Price ID específico por ciclo no ambiente, pode ser utilizado
  const envPriceId =
    interval === 'year'
      ? (planId === 'pro' ? process.env.STRIPE_PRICE_PRO_YEARLY : process.env.STRIPE_PRICE_CONSTRUTORA_YEARLY)
      : (planId === 'pro' ? process.env.STRIPE_PRICE_PRO_MONTHLY || process.env.STRIPE_PRICE_PRO : process.env.STRIPE_PRICE_CONSTRUTORA_MONTHLY || process.env.STRIPE_PRICE_CONSTRUTORA);

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = envPriceId
    ? [
        {
          price: envPriceId,
          quantity: 1,
        },
      ]
    : [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: `${plan.name} (${periodLabel})`,
              description: interval === 'year'
                ? `${plan.description} - Cobrança Anual (Equivalente a R$ ${(pricing.monthlyEquivalentCents / 100).toFixed(2).replace('.', ',')}/mês)`
                : `${plan.description} - Cobrança Mensal`,
            },
            unit_amount: pricing.priceCents,
            recurring: {
              interval,
            },
          },
          quantity: 1,
        },
      ];

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: lineItems,
    customer_email: userEmail,
    client_reference_id: userId,
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    metadata: {
      userId,
      planId,
      billingInterval: interval,
      planName: plan.name,
      userName: userName || '',
    },
    subscription_data: {
      metadata: {
        userId,
        planId,
        billingInterval: interval,
        planName: plan.name,
      },
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  if (!session.url) {
    throw new Error('Falha ao obter URL de checkout do Stripe.');
  }

  return {
    url: session.url,
    sessionId: session.id,
  };
}
