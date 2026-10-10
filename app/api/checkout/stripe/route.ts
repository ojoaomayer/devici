import { NextRequest, NextResponse } from 'next/server';
import { createStripeCheckoutSession, PLANS } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { planId, billingInterval, userId, userEmail, userName } = body;

    if (!planId || !userId || !userEmail) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios ausentes (planId, userId, userEmail).' },
        { status: 400 }
      );
    }

    if (planId !== 'pro' && planId !== 'construtora') {
      return NextResponse.json(
        { error: `Plano inválido: ${planId}. Opções válidas: 'pro' ou 'construtora'.` },
        { status: 400 }
      );
    }

    const validInterval = billingInterval === 'month' ? 'month' : 'year';

    // Identificar origem do frontend
    const origin = req.headers.get('origin') || req.headers.get('host') || 'http://localhost:3000';
    const baseUrl = origin.startsWith('http') ? origin : `https://${origin}`;

    const { url, sessionId } = await createStripeCheckoutSession({
      planId,
      billingInterval: validInterval,
      userId,
      userEmail,
      userName,
      baseUrl,
    });

    return NextResponse.json({
      success: true,
      url,
      sessionId,
      plan: PLANS[planId as 'pro' | 'construtora'],
    });
  } catch (error: any) {
    console.error('Erro ao gerar checkout Stripe:', error);
    return NextResponse.json(
      {
        error: error.message || 'Erro ao comunicar com o Stripe Checkout.',
      },
      { status: 500 }
    );
  }
}
