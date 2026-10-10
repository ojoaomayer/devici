import { NextResponse } from 'next/server'
import { auth, db } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

// Cupons padrão pré-configurados caso não existam no Firestore
const DEFAULT_COUPONS: Record<
  string,
  {
    plano: 'pro' | 'construtora'
    planilhas_limite: number
    maxUses?: number
    descricao: string
  }
> = {
  'BETATESTER': {
    plano: 'pro',
    planilhas_limite: 100,
    maxUses: 1000,
    descricao: 'Acesso Beta Tester - Limite de 100 Planilhas',
  },
}

export async function POST(request: Request) {
  try {
    // 1. Validar autenticação do usuário
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Você precisa estar autenticado para resgatar um cupom.' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]
    let decodedToken
    try {
      decodedToken = await auth.verifyIdToken(token)
    } catch (e) {
      return NextResponse.json(
        { error: 'Sessão inválida ou expirada. Faça login novamente.' },
        { status: 401 }
      )
    }

    const userId = decodedToken.uid
    const body = await request.json()
    const rawCode = body?.code

    if (!rawCode || typeof rawCode !== 'string' || !rawCode.trim()) {
      return NextResponse.json(
        { error: 'Por favor, informe o código do cupom.' },
        { status: 400 }
      )
    }

    // Normaliza o código: remove espaços e coloca em maiúsculo
    const code = rawCode.trim().toUpperCase()

    // 2. Verificar se o cupom existe no Firestore ou nos cupons padrão
    const couponRef = db.collection('coupons').doc(code)
    const couponSnap = await couponRef.get()

    let couponData: {
      plano: 'pro' | 'construtora'
      planilhas_limite: number
      maxUses?: number
      usedCount?: number
      active?: boolean
      redeemedBy?: string[]
      expiresAt?: any
      descricao?: string
    }

    if (couponSnap.exists) {
      couponData = couponSnap.data() as any
    } else if (DEFAULT_COUPONS[code]) {
      // Cria o cupom no Firestore com a configuração padrão
      couponData = {
        plano: DEFAULT_COUPONS[code].plano,
        planilhas_limite: DEFAULT_COUPONS[code].planilhas_limite,
        maxUses: DEFAULT_COUPONS[code].maxUses || 500,
        usedCount: 0,
        active: true,
        redeemedBy: [],
        descricao: DEFAULT_COUPONS[code].descricao,
      }
      await couponRef.set({
        ...couponData,
        criado_em: FieldValue.serverTimestamp(),
      })
    } else {
      // Verifica se há cupons dinâmicos definidos em variável de ambiente (ex: VIP_COUPONS="MEUTESTE,PARCEIRO10")
      const envCoupons = (process.env.VIP_COUPONS || '')
        .split(',')
        .map((c) => c.trim().toUpperCase())
        .filter(Boolean)

      if (envCoupons.includes(code)) {
        couponData = {
          plano: 'pro',
          planilhas_limite: 9999,
          maxUses: 1000,
          usedCount: 0,
          active: true,
          redeemedBy: [],
          descricao: 'Cupom VIP Customizado',
        }
        await couponRef.set({
          ...couponData,
          criado_em: FieldValue.serverTimestamp(),
        })
      } else {
        return NextResponse.json(
          { error: 'Cupom inválido ou inexistente. Verifique o código digitado.' },
          { status: 404 }
        )
      }
    }

    // 3. Validações do Cupom
    if (couponData.active === false) {
      return NextResponse.json(
        { error: `O cupom "${code}" foi desativado e não está mais disponível para resgate.` },
        { status: 400 }
      )
    }

    if (couponData.expiresAt) {
      const expirationDate = couponData.expiresAt.toDate
        ? couponData.expiresAt.toDate()
        : new Date(couponData.expiresAt)
      if (new Date() > expirationDate) {
        return NextResponse.json(
          { error: `O cupom "${code}" expirou e não pode mais ser utilizado.` },
          { status: 400 }
        )
      }
    }

    const usedCount = couponData.usedCount || 0
    const maxUses = couponData.maxUses || 999999
    if (usedCount >= maxUses) {
      return NextResponse.json(
        { error: `O cupom "${code}" atingiu o limite máximo de ativações disponíveis.` },
        { status: 400 }
      )
    }

    // 4. Verificar se o usuário já utilizou o cupom anteriormente
    const userRef = db.collection('users').doc(userId)
    const userSnap = await userRef.get()
    const userData = userSnap.exists ? userSnap.data() : null

    const redeemedBy = couponData.redeemedBy || []
    const cuponsResgatados: string[] = userData?.cupons_resgatados || []

    const isAlreadyRedeemed =
      userData?.cupom_ativo === code ||
      cuponsResgatados.includes(code) ||
      redeemedBy.includes(userId)

    if (isAlreadyRedeemed) {
      return NextResponse.json(
        {
          error: `Você já resgatou o cupom ${code} nesta conta! Cada cupom promocional só pode ser utilizado uma única vez por usuário. Seu acesso com limite liberado já está ativo.`,
          code: 'COUPON_ALREADY_USED',
        },
        { status: 400 }
      )
    }

    // 5. Atualizar Perfil do Usuário e Registrar o Resgate do Cupom
    const batch = db.batch()

    // Incrementa contagem de uso do cupom e adiciona o uid aos resgates
    batch.update(couponRef, {
      usedCount: FieldValue.increment(1),
      redeemedBy: FieldValue.arrayUnion(userId),
      ultimo_resgate: FieldValue.serverTimestamp(),
    })

    // Atualiza o perfil do usuário para o plano do cupom com limites liberados
    batch.set(
      userRef,
      {
        plano: couponData.plano || 'pro',
        planilhas_limite: couponData.planilhas_limite || 100,
        cupom_ativo: code,
        cupons_resgatados: FieldValue.arrayUnion(code),
        cupom_resgatado_em: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )

    await batch.commit()

    return NextResponse.json({
      success: true,
      message: `Cupom ${code} aplicado com sucesso! Seu acesso foi liberado com limite de ${couponData.planilhas_limite || 100} planilhas.`,
      plano: couponData.plano || 'pro',
      planilhas_limite: couponData.planilhas_limite || 100,
      cupom: code,
    })
  } catch (error: any) {
    console.error('Erro ao resgatar cupom:', error)
    return NextResponse.json(
      { error: error.message || 'Não foi possível validar o cupom no momento. Tente novamente em instantes.' },
      { status: 500 }
    )
  }
}
