'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  FileSpreadsheet,
  Plus,
  Download,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Calculator,
  ArrowRight,
} from 'lucide-react'
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import Navbar from '@/components/Navbar'
import { CheckoutButton } from '@/components/CheckoutButton'
import CouponRedeem from '@/components/CouponRedeem'

export interface OrcamentoDoc {
  id: string
  nome_obra: string
  criado_em: any
  total_itens: number
  valor_total: number
  uf: string
  desonerado: boolean
  download_url?: string
  storage_path?: string
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, userData, loading } = useAuth()
  const [orcamentos, setOrcamentos] = useState<OrcamentoDoc[]>([])
  const [loadingDocs, setLoadingDocs] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return

    const orcRef = collection(db, 'users', user.uid, 'orcamentos')
    const q = query(orcRef, orderBy('criado_em', 'desc'))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as OrcamentoDoc[]
        setOrcamentos(docs)
        setLoadingDocs(false)
      },
      (error) => {
        console.error('Error fetching orcamentos:', error)
        setLoadingDocs(false)
      }
    )

    return () => unsubscribe()
  }, [user])

  const handleDelete = async (orcId: string) => {
    if (!user) return
    if (confirm('Deseja excluir este registro de orçamento?')) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'orcamentos', orcId))
      } catch (err) {
        console.error('Error deleting doc:', err)
      }
    }
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Hoje'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#020617] text-slate-400 flex items-center justify-center font-mono text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <span>Carregando workspace...</span>
        </div>
      </div>
    )
  }

  const planilhasUsadas = userData?.planilhas_usadas || orcamentos.length || 0
  const planilhasLimite = userData?.planilhas_limite ?? (userData?.plano === 'construtora' ? 9999 : userData?.plano === 'pro' ? 999 : 1)
  const isUnlimited = planilhasLimite >= 999
  const usagePercent = isUnlimited ? 100 : Math.min(100, Math.round((planilhasUsadas / planilhasLimite) * 100))

  return (
    <div className="min-h-screen flex flex-col bg-[#020617] text-slate-100 selection:bg-blue-500/30 selection:text-white relative overflow-hidden">
      {/* Background Lighting & Blueprint Grid */}
      <div className="absolute inset-0 blueprint-grid pointer-events-none opacity-50" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-cinematic-glow pointer-events-none" />

      <Navbar />

      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Workspace Top Bar */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 blueprint-box">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight text-white">
                Workspace • {user.displayName || user.email?.split('@')[0]}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                Plano {userData?.plano || 'Free'}
              </span>
              {userData?.cupom_ativo && (
                <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  VIP {userData.cupom_ativo}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-normal">
              Histórico de orçamentos e conciliações SINAPI salvas na nuvem corporativa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/consultas"
              className="btn-secondary px-3.5 py-1.5 text-xs font-medium flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
              <span>Base SINAPI</span>
            </Link>

            <Link
              href="/ferramentas/calculadora-bdi"
              className="btn-secondary px-3.5 py-1.5 text-xs font-medium flex items-center gap-1.5"
            >
              <Calculator className="w-3.5 h-3.5 text-emerald-400" />
              <span>BDI TCU</span>
            </Link>

            <Link
              href="/orcamento"
              className="btn-primary px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Orçamento</span>
            </Link>
          </div>
        </div>

        {/* Quota & Stat Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-card p-5 rounded-xl space-y-3 blueprint-box">
            <div className="text-[11px] font-mono uppercase text-slate-400 font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 neon-dot-blue" />
              <span>Consumo de Planilhas</span>
            </div>
            <div className="flex items-baseline justify-between font-mono">
              <span className="text-2xl font-bold text-white">
                {planilhasUsadas} <span className="text-xs text-slate-400 font-normal">/ {isUnlimited ? '∞' : planilhasLimite}</span>
              </span>
              <span className="text-xs text-slate-400">
                {isUnlimited ? 'Ilimitado' : `${planilhasLimite - planilhasUsadas} restante(s)`}
              </span>
            </div>
            <div className="w-full bg-[#030712] rounded-full h-1.5 overflow-hidden border border-white/[0.08]">
              <div
                className={`h-full rounded-full transition-all ${usagePercent >= 100 && !isUnlimited ? 'bg-amber-400' : 'bg-blue-400'}`}
                style={{ width: `${isUnlimited ? 100 : usagePercent}%` }}
              />
            </div>

            {!isUnlimited && (
              <div className="pt-2">
                <CheckoutButton planId="pro" variant="primary">
                  Fazer Upgrade (R$ 97)
                </CheckoutButton>
              </div>
            )}
          </div>

          <div className="glass-card p-5 rounded-xl space-y-2 blueprint-box">
            <div className="text-[11px] font-mono uppercase text-slate-400 font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 neon-dot-blue" />
              <span>Projetos Processados</span>
            </div>
            <div className="text-2xl font-bold font-mono text-white">
              {orcamentos.length}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Base SINAPI 27 UFs
            </div>
          </div>

          <div className="glass-card p-5 rounded-xl space-y-2 blueprint-box">
            <div className="text-[11px] font-mono uppercase text-slate-400 font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 neon-dot-emerald" />
              <span>Status do Motor</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 neon-dot-emerald" />
              <span>Operacional (15.420 itens)</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Acórdão TCU 2622 ativo
            </div>
          </div>
        </div>

        {/* Coupon / VIP Invite Redemption */}
        <CouponRedeem />

        {/* Budgets Table */}
        <div className="glass-panel rounded-2xl overflow-hidden blueprint-box">
          <div className="bg-[#0b132b]/80 px-5 py-4 border-b border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <FileSpreadsheet className="w-4 h-4 text-blue-400" />
              <span>Histórico de Planilhas Salvas</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">{orcamentos.length} registro(s)</span>
          </div>

          {loadingDocs ? (
            <div className="p-12 text-center text-xs text-slate-400 font-mono">
              Carregando histórico...
            </div>
          ) : orcamentos.length === 0 ? (
            <div className="p-16 text-center space-y-4">
              <div className="text-slate-400 text-xs font-mono">Nenhum orçamento salvo no momento.</div>
              <Link
                href="/orcamento"
                className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Criar Primeiro Orçamento</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#0b132b]/50 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-white/[0.08]">
                    <th className="py-3 px-4 font-semibold">Identificação da Obra</th>
                    <th className="py-3 px-4 font-semibold">Data</th>
                    <th className="py-3 px-4 font-semibold">Qtd. Itens</th>
                    <th className="py-3 px-4 font-semibold">UF / Regime</th>
                    <th className="py-3 px-4 font-semibold text-right">Valor Total</th>
                    <th className="py-3 px-4 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] font-mono">
                  {orcamentos.map((orc) => (
                    <tr key={orc.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-sans font-medium text-white">
                        <div>{orc.nome_obra || 'Orçamento de Obra'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">ID: {orc.id.slice(0, 8)}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {formatDate(orc.criado_em)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {orc.total_itens || 0} itens
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <span className="text-blue-400 font-bold">{orc.uf || 'PR'}</span> • {orc.desonerado ? 'Desonerada' : 'Não Desonerada'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-400 tabular-nums">
                        {formatCurrency(orc.valor_total)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {orc.download_url && (
                            <a
                              href={orc.download_url}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Baixar planilha (.xlsx)"
                              className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/10 transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => handleDelete(orc.id)}
                            title="Remover registro"
                            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
