'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ChevronRight, RotateCcw, FileSpreadsheet, ArrowLeft, ArrowRight, Compass, HardHat } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Dropzone from '@/components/Dropzone'
import ReviewTable from '@/components/ReviewTable'
import ExportSection from '@/components/ExportSection'
import { useAuth } from '@/context/AuthContext'
import type { ModoOrcamento } from '@/components/ScopeSelector'

function OrcamentoContent() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialModoParam = searchParams.get('modo') as ModoOrcamento | null
  const defaultModo: ModoOrcamento = initialModoParam === 'projetos' ? 'projetos' : 'execucao'

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [config, setConfig] = useState<{
    uf: string
    desonerado: boolean
    modoOrcamento: ModoOrcamento
  }>({
    uf: defaultModo === 'projetos' ? 'PR' : 'PR',
    desonerado: false,
    modoOrcamento: defaultModo,
  })

  useEffect(() => {
    if (initialModoParam === 'projetos' || initialModoParam === 'execucao') {
      setConfig((prev) => ({
        ...prev,
        modoOrcamento: initialModoParam,
        uf: initialModoParam === 'projetos' ? 'PR' : prev.uf,
      }))
    }
  }, [initialModoParam])

  useEffect(() => {
    document.body.dataset.orcStep = String(step)
    window.dispatchEvent(new Event('devici:orcamento-step'))
    return () => {
      delete document.body.dataset.orcStep
    }
  }, [step])

  const handleProcess = async (
    data: any[],
    runConfig: { uf: string; desonerado: boolean; modoOrcamento: ModoOrcamento }
  ) => {
    setIsLoading(true)
    setConfig(runConfig)

    if (!authLoading && !user) {
      setIsLoading(false)
      alert('Faça login ou crie sua conta gratuita para processar o orçamento.')
      router.push('/login?next=/orcamento')
      return
    }

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (user) {
        const token = await user.getIdToken()
        headers['Authorization'] = `Bearer ${token}`
      }

      // Envia em lotes pequenos: evita timeout/limite de payload do servidor em produção
      const CHUNK = 25
      const allResults: any[] = []
      for (let i = 0; i < data.length; i += CHUNK) {
        const response = await fetch('/api/match', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            items: data.slice(i, i + CHUNK),
            filter_uf: runConfig.uf,
            desonerado: runConfig.desonerado,
            modoOrcamento: runConfig.modoOrcamento,
          }),
        })

        const raw = await response.text()
        let json: any = null
        try {
          json = JSON.parse(raw)
        } catch {
          /* resposta não-JSON (ex.: timeout 504 do host) */
        }

        if (!response.ok || !json?.results) {
          const detail = json?.error || `HTTP ${response.status}`
          alert(`Erro ao processar orçamento: ${detail}`)
          return
        }
        allResults.push(...json.results)
      }

      setResults(allResults)
      setStep(2)
    } catch (error) {
      console.error(error)
      alert('Falha na comunicação com o servidor.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateMatch = (index: number, newMatch: any) => {
    const newResults = [...results]
    newResults[index].match = {
      ...newMatch,
      status: 'alto',
      match_score: 100,
    }
    setResults(newResults)
  }

  const isProjetos = config.modoOrcamento === 'projetos'

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 selection:bg-blue-500/30 selection:text-white flex flex-col relative overflow-hidden">
      {/* Background Cinematographic Lighting e Blueprint Grid */}
      <div className="absolute inset-0 blueprint-grid pointer-events-none opacity-50" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-cinematic-glow pointer-events-none" />

      <Navbar />

      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Top Workflow Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.08] pb-6">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 mb-1.5 uppercase">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isProjetos ? 'bg-cyan-400 neon-dot-blue' : 'bg-blue-400 neon-dot-blue'
                }`}
              />
              <span>{isProjetos ? 'Módulo de Projetos e Serviços Técnicos' : 'Módulo Executivo'}</span>
              <span className="text-white/20">•</span>
              <span className={isProjetos ? 'text-cyan-400' : 'text-blue-400'}>
                {isProjetos ? 'SECID/PR (Res. 094/2026)' : 'SINAPI Oficial'}
              </span>
            </div>
            <h1 className="text-2xl font-light tracking-tight text-white">
              {isProjetos ? (
                <>
                  Orçamento de Projetos e{' '}
                  <span className="font-semibold text-cyan-300">Serviços Técnicos</span>
                </>
              ) : (
                <>
                  Orçamento de Obras e{' '}
                  <span className="font-semibold text-blue-300">Conciliação Oficial</span>
                </>
              )}
            </h1>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all ${
                step === 1
                  ? isProjetos
                    ? 'bg-cyan-500/10 border-cyan-400/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                    : 'bg-blue-500/10 border-blue-500/40 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.2)]'
                  : 'bg-white/[0.03] border-white/10 text-slate-500'
              }`}
            >
              <span>1. Upload</span>
            </div>

            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />

            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all ${
                step === 2
                  ? isProjetos
                    ? 'bg-cyan-500/10 border-cyan-400/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                    : 'bg-blue-500/10 border-blue-500/40 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.2)]'
                  : 'bg-white/[0.03] border-white/10 text-slate-500'
              }`}
            >
              <span>2. Revisão</span>
            </div>

            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />

            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all ${
                step === 3
                  ? isProjetos
                    ? 'bg-cyan-500/10 border-cyan-400/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                    : 'bg-blue-500/10 border-blue-500/40 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.2)]'
                  : 'bg-white/[0.03] border-white/10 text-slate-500'
              }`}
            >
              <span>3. Exportação</span>
            </div>
          </div>
        </div>

        {/* Step 1: Upload */}
        {step === 1 && (
          <div data-onboarding="upload" className="space-y-4 py-4 animate-fade-in rounded-2xl">
            <Dropzone
              onProcess={handleProcess}
              isLoading={isLoading}
              initialModo={config.modoOrcamento}
              onModoChange={(novoModo) =>
                setConfig((prev) => ({
                  ...prev,
                  modoOrcamento: novoModo,
                  uf: novoModo === 'projetos' ? 'PR' : prev.uf,
                }))
              }
            />
          </div>
        )}

        {/* Step 2: Review Table */}
        {step === 2 && (
          <div data-onboarding="review" className="space-y-6 animate-fade-in rounded-2xl">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 glass-card p-3.5 rounded-xl text-xs">
              <div className="font-mono text-slate-400 flex items-center gap-2 flex-wrap">
                <strong className="text-white font-bold">{results.length}</strong> itens processados • Base{' '}
                <strong className={isProjetos ? 'text-cyan-400 font-bold' : 'text-blue-400 font-bold'}>
                  {isProjetos ? 'SECID/PR' : `SINAPI ${config.uf}`}
                </strong>{' '}
                ({config.desonerado ? 'Desonerado' : 'Não Desonerado'})
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => {
                    setStep(1)
                    setResults([])
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04] text-slate-400 hover:text-white text-xs transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Reiniciar
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="btn-primary px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Avançar para Exportação</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <ReviewTable results={results} config={config} onUpdateMatch={handleUpdateMatch} />

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-mono transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Upload
              </button>

              <button
                onClick={() => setStep(3)}
                className="btn-primary px-5 py-2 text-xs font-semibold flex items-center gap-2 cursor-pointer"
              >
                <span>Concluir Orçamento</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Export e Save */}
        {step === 3 && (
          <div data-onboarding="export" className="space-y-6 animate-fade-in rounded-2xl">
            <ExportSection results={results} config={config} />

            <div className="flex justify-between items-center text-xs font-mono pt-2">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Revisar Itens Novamente
              </button>

              <button
                onClick={() => {
                  setStep(1)
                  setResults([])
                }}
                className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Novo Orçamento
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default function OrcamentoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#020617] flex items-center justify-center text-slate-400 font-mono text-xs">
          Carregando módulo de orçamento...
        </div>
      }
    >
      <OrcamentoContent />
    </Suspense>
  )
}
