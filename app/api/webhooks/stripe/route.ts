import { NextRequest, NextResponse } from 'next/server';
import { getStripe, PLANS } from '@/lib/stripe';
import { db } from '@/lib/firebase-admin';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    const stripe = getStripe();
    let event: Stripe.Event;

    // Validação criptográfica de integridade do webhook
    if (webhookSecret && sig) {
      try {
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
      } catch (err: any) {
        console.error(`⚠️ Falha na verificação de assinatura Stripe: ${err.message}`);
        return NextResponse.json(
          { error: `Webhook signature verification failed: ${err.message}` },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Webhook signature or secret missing' },
        { status: 400 }
      );
    }

    console.log(`🔔 Webhook Stripe recebido: ${event.type}`);

    switch (event.type) {
      // 1. Checkout finalizado com sucesso
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId =
          session.client_reference_id ||
          session.metadata?.userId ||
          (session.customer_details?.email
            ? await findUserIdByEmail(session.customer_details.email)
            : null);

        const rawPlanId = session.metadata?.planId || 'pro';
        const planId: 'pro' | 'construtora' = rawPlanId === 'construtora' ? 'construtora' : 'pro';
        const planConfig = PLANS[planId];

        if (!userId) {
          console.error('Stripe Webhook: Impossível associar pagamento a um usuário DeVici:', session.id);
          break;
        }

        const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
        const subscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id;

        const userDocRef = db.collection('users').doc(userId);
        const userDoc = await userDocRef.get();

        const billingInterval = session.metadata?.billingInterval || 'year';

        const updateData = {
          plano: planId,
          ciclo: billingInterval,
          planilhas_limite: planConfig.limit,
          status_assinatura: 'active',
          stripe_customer_id: customerId || null,
          stripe_subscription_id: subscriptionId || null,
          ultimo_pagamento_em: new Date().toISOString(),
          atualizado_em: new Date().toISOString(),
        };

        if (userDoc.exists) {
          await userDocRef.update(updateData);
        } else {
          await userDocRef.set(
            {
              uid: userId,
              email: session.customer_details?.email || '',
              nome: session.customer_details?.name || '',
              planilhas_usadas: 0,
              ...updateData,
            },
            { merge: true }
          );
        }

        // Histórico de pagamento no Firestore
        await db.collection('pagamentos').add({
          userId,
          gateway: 'stripe',
          sessionId: session.id,
          stripeCustomerId: customerId || null,
          subscriptionId: subscriptionId || null,
          plano: planId,
          valorCentavos: session.amount_total || planConfig.priceCents,
          moeda: session.currency || 'brl',
          metodo: session.payment_method_types?.[0] || 'card',
          status: 'PAID',
          criado_em: new Date().toISOString(),
        });

        console.log(`✅ Usuário ${userId} promovido com sucesso para o plano ${planId}!`);
        break;
      }

      // 2. Pagamento de fatura recorrente mensal bem-sucedido
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription as string | undefined;
        const customerId = (invoice as any).customer as string | undefined;

        if (subscriptionId) {
          const userQuery = await db
            .collection('users')
            .where('stripe_subscription_id', '==', subscriptionId)
            .limit(1)
            .get();

          if (!userQuery.empty) {
            const userDoc = userQuery.docs[0];
            const userData = userDoc.data();
            const currentPlan: 'pro' | 'construtora' = userData.plano === 'construtora' ? 'construtora' : 'pro';
            const planConfig = PLANS[currentPlan];

            // Renovar cotas mensais
            await userDoc.ref.update({
              status_assinatura: 'active',
              planilhas_usadas: 0, // Reset da cota mensal
              planilhas_limite: planConfig.limit,
              ultimo_pagamento_em: new Date().toISOString(),
              atualizado_em: new Date().toISOString(),
            });

            await db.collection('pagamentos').add({
              userId: userDoc.id,
              gateway: 'stripe',
              invoiceId: invoice.id,
              subscriptionId,
              stripeCustomerId: customerId || null,
              plano: currentPlan,
              valorCentavos: invoice.amount_paid,
              moeda: invoice.currency,
              status: 'PAID',
              tipo: 'RENOVACAO_RECORRENTE',
              criado_em: new Date().toISOString(),
            });

            console.log(`🔄 Assinatura ${subscriptionId} renovada com sucesso para o usuário ${userDoc.id}`);
          }
        }
        break;
      }

      // 3. Assinatura cancelada
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userQuery = await db
          .collection('users')
          .where('stripe_subscription_id', '==', subscription.id)
          .limit(1)
          .get();

        if (!userQuery.empty) {
          const userDoc = userQuery.docs[0];
          await userDoc.ref.update({
            plano: 'free',
            planilhas_limite: 1,
            status_assinatura: 'canceled',
            cancelado_em: new Date().toISOString(),
            atualizado_em: new Date().toISOString(),
          });

          console.log(`⏹️ Assinatura ${subscription.id} do usuário ${userDoc.id} foi cancelada.`);
        }
        break;
      }

      // 4. Falha no pagamento da fatura recorrente
      case 'invoice.payment_failed': {
        const failedInvoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (failedInvoice as any).subscription as string | undefined;

        if (subscriptionId) {
          const userQuery = await db
            .collection('users')
            .where('stripe_subscription_id', '==', subscriptionId)
            .limit(1)
            .get();

          if (!userQuery.empty) {
            await userQuery.docs[0].ref.update({
              status_assinatura: 'past_due',
              atualizado_em: new Date().toISOString(),
            });
            console.warn(`⚠️ Pagamento falhou para assinatura ${subscriptionId}. Status marcado como past_due.`);
          }
        }
        break;
      }

      default:
        // Outros eventos ignorados silenciosamente
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Erro processando webhook Stripe:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno no webhook' },
      { status: 500 }
    );
  }
}

async function findUserIdByEmail(email: string): Promise<string | null> {
  try {
    const userQuery = await db.collection('users').where('email', '==', email).limit(1).get();
    if (!userQuery.empty) {
      return userQuery.docs[0].id;
    }
  } catch (err) {
    console.error('Erro ao buscar usuário por email:', err);
  }
  return null;
}
