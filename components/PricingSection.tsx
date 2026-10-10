'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Check, Sparkles, Zap } from 'lucide-react'
import { CheckoutButton } from '@/components/CheckoutButton'

export function PricingSection() {
  const [billingInterval, setBillingInterval] = useState<'year' | 'month'>('year')
  const isYearly = billingInterval === 'year'

  return (
    <section id="precos" className="relative z-10 py-20 max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
      {/* Cabeçalho */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Planos Transparentes e Sem Surpresas</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-slate-900 dark:text-white">
          Escolha o ritmo da sua engenharia
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Sem contratos de fidelidade forçados. Cancele ou alterne a qualquer momento com 1 clique.
        </p>

        {/* Toggle Switch: Mensal vs Anual */}
        <div className="pt-4 flex justify-center">
          <div className="relative inline-flex items-center p-1.5 rounded-2xl bg-slate-200/80 dark:bg-slate-900/90 border border-slate-300/80 dark:border-white/10 shadow-inner">
            <button
              type="button"
              onClick={() => setBillingInterval('month')}
              className={`relative px-5 py-2 text-xs font-medium rounded-xl transition-all duration-200 cursor-pointer ${
                !isYearly
                  ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Faturamento Mensal
            </button>

            <button
              type="button"
              onClick={() => setBillingInterval('year')}
              className={`relative px-5 py-2 text-xs font-medium rounded-xl transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                isYearly
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Faturamento Anual</span>
              <span
                className={`text-[10px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded-full transition-colors ${
                  isYearly
                    ? 'bg-white/20 text-white'
                    : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                }`}
              >
                Até 40% OFF
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Planos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
        {/* 1. Plano Gratuito */}
        <div className="glass-card glass-card-hover rounded-2xl p-6 sm:p-7 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Gratuito</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Ideal para experimentar a precisão do DeVici no seu projeto real.
              </p>
            </div>

            <div className="py-2">
              <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white tabular-nums">
                R$ 0
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono"> / sempre grátis</span>
              <p className="text-[11px] text-slate-500 font-mono mt-1">
                Sem cartão de crédito necessário
              </p>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 pt-4 border-t border-slate-200 dark:border-white/[0.08] font-mono">
              <li className="flex items-center gap-2.5">
                <Check className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
                <span><strong>1 orçamento completo</strong></span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
                <span>Até 50 linhas por planilha</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
                <span>Acesso às calculadoras de BDI</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
                <span>Base SINAPI oficial 27 UFs</span>
              </li>
            </ul>
          </div>

          <Link
            href="/login?mode=signup"
            className="btn-secondary w-full py-2.5 text-xs font-semibold text-center"
          >
            Começar de graça
          </Link>
        </div>

        {/* 2. Plano Profissional (Destaque Principal) */}
        <div className="glass-panel rounded-2xl p-6 sm:p-7 flex flex-col justify-between space-y-6 relative border-blue-500/40 dark:border-blue-500/40 shadow-[0_0_35px_rgba(59,130,246,0.22)] bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-950/20 dark:to-transparent">
          {/* Badge superior */}
          <div className="absolute -top-3 right-6">
            <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.6)] flex items-center gap-1">
              <Zap className="w-3 h-3 fill-current" />
              Mais Escolhido
            </span>
          </div>

          <div className="space-y-4">
            <div className="pt-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Profissional
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Economize mais de 20 horas de digitação técnica em cada licitação.
              </p>
            </div>

            <div className="py-2">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold font-mono text-slate-900 dark:text-white tabular-nums tracking-tight">
                  {isYearly ? 'R$ 59' : 'R$ 97'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono"> / mês</span>
              </div>

              {isYearly ? (
                <div className="mt-1.5 space-y-0.5">
                  <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 font-mono">
                    Cobrado R$ 708/ano (Economia de R$ 456)
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Equivalente a menos de R$ 2,00 por dia
                  </p>
                </div>
              ) : (
                <div className="mt-1.5">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    Cobrança mensal. Cancele quando quiser sem fidelidade.
                  </p>
                </div>
              )}
            </div>

            <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-200 pt-4 border-t border-slate-200 dark:border-white/[0.08] font-mono">
              <li className="flex items-center gap-2.5">
                <Check className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
                <span><strong>Até 10 planilhas completas por mês</strong></span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
                <span>Exportação com BDI oficial do TCU</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
                <span>Atualização mensal das 27 UFs</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
                <span>Histórico corporativo em nuvem</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
                <span>Suporte especializado via WhatsApp</span>
              </li>
            </ul>
          </div>

          <CheckoutButton
            planId="pro"
            billingInterval={billingInterval}
            variant="primary"
          >
            Assinar Plano Profissional
          </CheckoutButton>
        </div>

        {/* 3. Plano Construtora */}
        <div className="glass-card glass-card-hover rounded-2xl p-6 sm:p-7 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Construtora</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Para escritórios e equipes com alto volume de licitações e orçamentos executivos.
              </p>
            </div>

            <div className="py-2">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold font-mono text-slate-900 dark:text-white tabular-nums tracking-tight">
                  {isYearly ? 'R$ 119' : 'R$ 197'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono"> / mês</span>
              </div>

              {isYearly ? (
                <div className="mt-1.5 space-y-0.5">
                  <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 font-mono">
                    Cobrado R$ 1.428/ano (Economia de R$ 936)
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Para múltiplos orçamentos ilimitados
                  </p>
                </div>
              ) : (
                <div className="mt-1.5">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    Cobrança mensal. Cancele quando quiser sem fidelidade.
                  </p>
                </div>
              )}
            </div>

            <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 pt-4 border-t border-slate-200 dark:border-white/[0.08] font-mono">
              <li className="flex items-center gap-2.5">
                <Check className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
                <span><strong>Planilhas e orçamentos ilimitados</strong></span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
                <span>Múltiplos usuários de engenharia</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
                <span>Bases SINAPI, SICRO e SECID</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
                <span>Memória de cálculo auditável para licitação</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
                <span>Onboarding e atendimento prioritário</span>
              </li>
            </ul>
          </div>

          <CheckoutButton
            planId="construtora"
            billingInterval={billingInterval}
            variant="secondary"
          >
            Automatizar meu escritório
          </CheckoutButton>
        </div>
      </div>
    </section>
  )
}
