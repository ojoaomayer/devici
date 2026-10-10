'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Sparkles, Ticket, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function CouponRedeem() {
  const { user, userData, refreshUserData } = useAuth()
  const searchParams = useSearchParams()

  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Auto-preenche se vier via URL ?cupom=XYZ ou ?codigo=XYZ
  useEffect(() => {
    const urlCoupon = searchParams.get('cupom') || searchParams.get('codigo')
    if (urlCoupon) {
      setCode(urlCoupon.toUpperCase().trim())
    }
  }, [searchParams])

  const handleRedeem = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!code.trim() || !user) return

    setLoading(true)
    setSuccessMessage(null)
    setErrorMessage(null)

    try {
      const token = await user.getIdToken()
      const response = await fetch('/api/coupons/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: code.trim() }),
      })

      // Leitura resiliente do corpo da resposta para evitar "Unexpected end of JSON input"
      let data: any = null
      try {
        const text = await response.text()
        data = text ? JSON.parse(text) : {}
      } catch {
        data = {}
      }

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sua sessão expirou. Faça login novamente para resgatar o cupom.')
        }
        if (response.status === 404) {
          throw new Error(`O cupom "${code.trim().toUpperCase()}" não foi encontrado. Verifique se o código está correto.`)
        }
        const serverError = data?.error || data?.message
        if (serverError) {
          throw new Error(serverError)
        }
        throw new Error('Não foi possível resgatar o cupom no momento. Tente novamente em instantes.')
      }

      setSuccessMessage(data.message || 'Cupom resgatado com sucesso! Plano Pro ativado.')
      setCode('')
      await refreshUserData()
    } catch (err: any) {
      const rawMsg = err?.message || ''
      let friendlyMsg = 'Erro ao processar cupom.'

      if (rawMsg.includes('Unexpected end of JSON input') || rawMsg.includes('Failed to execute')) {
        friendlyMsg = 'Não foi possível validar o cupom. Verifique sua conexão e tente novamente.'
      } else if (rawMsg) {
        friendlyMsg = rawMsg
      }

      setErrorMessage(friendlyMsg)
    } finally {
      setLoading(false)
    }
  }

  const isProWithCoupon = userData?.cupom_ativo || (userData?.plano === 'pro' && userData?.cupom_ativo)

  return (
    <div className="glass-card p-5 sm:p-6 rounded-2xl blueprint-box relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Código Promocional / Cupom VIP
            </h3>
            {userData?.cupom_ativo && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {userData.cupom_ativo}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 font-normal">
            Possui um cupom de teste? Digite o código para liberar planilhas na sua conta.
          </p>
        </div>

        <form onSubmit={handleRedeem} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative">
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase())
                if (errorMessage) setErrorMessage(null)
              }}
              placeholder="EX: BETATESTER"
              disabled={loading}
              className="w-full sm:w-48 px-3.5 py-2 rounded-xl bg-[#030712]/90 border border-white/[0.12] text-xs font-mono font-bold tracking-wider text-white placeholder:text-slate-500 placeholder:font-normal focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all uppercase"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="btn-primary px-4 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Validando...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                <span>Resgatar</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Mensagens de Sucesso / Erro */}
      {successMessage && (
        <div className="mt-3.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mt-3.5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2.5 text-xs text-red-300 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}
    </div>
  )
}
