'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Loader2 } from 'lucide-react'

interface CheckoutButtonProps {
  planId: 'pro' | 'construtora'
  billingInterval?: 'month' | 'year'
  children: React.ReactNode
  className?: string
  variant?: 'primary' | 'secondary'
}

export function CheckoutButton({
  planId,
  billingInterval = 'year',
  children,
  className = '',
  variant = 'primary',
}: CheckoutButtonProps) {
  const { user, userData } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleCheckout = async () => {
    setErrorMessage(null)

    // Se o usuário não estiver logado, direciona para login/cadastro salvando o plano e ciclo
    if (!user) {
      router.push(`/login?mode=signup&plan=${planId}&billing=${billingInterval}`)
      return
    }

    // Se o usuário já tiver esse plano ativo
    if (userData?.plano === planId) {
      router.push('/dashboard')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/checkout/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          billingInterval,
          userId: user.uid,
          userEmail: user.email,
          userName: user.displayName || userData?.nome || '',
        }),
      })

      let data: any = null
      try {
        const text = await res.text()
        data = text ? JSON.parse(text) : {}
      } catch {
        data = {}
      }

      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Não foi possível iniciar o checkout no momento. Tente novamente em instantes.')
      }

      // Redireciona para o checkout seguro do Stripe
      window.location.href = data.url
    } catch (err: any) {
      console.error('Erro ao iniciar checkout Stripe:', err)
      const rawMsg = err?.message || ''
      const friendlyMsg =
        rawMsg.includes('Unexpected end of JSON input') || rawMsg.includes('Failed to execute')
          ? 'Não foi possível conectar ao provedor de pagamento. Verifique sua conexão e tente novamente.'
          : rawMsg || 'Erro ao conectar ao checkout seguro.'
      setErrorMessage(friendlyMsg)
      setLoading(false)
    }
  }

  const baseStyle =
    variant === 'primary'
      ? 'btn-primary w-full py-2.5 text-xs font-semibold text-center flex items-center justify-center gap-2 cursor-pointer transition-all'
      : 'btn-secondary w-full py-2.5 text-xs font-semibold text-center flex items-center justify-center gap-2 cursor-pointer transition-all'

  return (
    <div className="w-full space-y-2">
      <button
        onClick={handleCheckout}
        disabled={loading}
        className={`${baseStyle} ${className}`}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
            <span>Iniciando Checkout Seguro...</span>
          </>
        ) : (
          <>{children}</>
        )}
      </button>
      {errorMessage && (
        <p className="text-[11px] text-rose-400 text-center font-mono">
          {errorMessage}
        </p>
      )}
    </div>
  )
}
