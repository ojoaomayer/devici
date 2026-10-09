'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Sparkles, X, ArrowRight, UploadCloud, ListChecks, FileDown, PartyPopper } from 'lucide-react'

const STORAGE_KEY = 'devici:onboarding:v1'
type Phase = 'welcome' | 'guide' | 'done'

interface Slide {
  icon: React.ReactNode
  title: string
  text: string
  cta?: { label: string; href: string }
}

function getSlide(pathname: string, orcStep: number): Slide {
  if (pathname !== '/orcamento') {
    return {
      icon: <Sparkles className="w-4 h-4" />,
      title: 'Vamos ao seu primeiro orçamento',
      text: 'Envie uma planilha com seus itens e o DeVici encontra as composições SINAPI automaticamente. Leva poucos minutos.',
      cta: { label: 'Ir para o orçamento', href: '/orcamento' },
    }
  }
  if (orcStep === 2) {
    return {
      icon: <ListChecks className="w-4 h-4" />,
      title: 'Passo 2 · Revise os itens',
      text: 'Confira o vínculo sugerido para cada item. Se algum não estiver certo, troque pela composição correta. Depois avance para a exportação.',
    }
  }
  if (orcStep === 3) {
    return {
      icon: <FileDown className="w-4 h-4" />,
      title: 'Passo 3 · Exporte e salve',
      text: 'Baixe o orçamento pronto ou salve na sua conta. Você concluiu o primeiro orçamento!',
    }
  }
  return {
    icon: <UploadCloud className="w-4 h-4" />,
    title: 'Passo 1 · Envie sua planilha',
    text: 'Escolha o módulo, o estado (UF) e se é desonerado. Depois arraste sua planilha (.xlsx/.csv) para a área de upload e inicie o processamento.',
  }
}

export default function Onboarding() {
  const pathname = usePathname()
  const router = useRouter()
  const [phase, setPhase] = useState<Phase | null>(null)
  const [orcStep, setOrcStep] = useState(1)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Phase | null
    setPhase(saved ?? 'welcome')
  }, [])

  useEffect(() => {
    const read = () => setOrcStep(Number(document.body.dataset.orcStep || 1))
    read()
    window.addEventListener('devici:orcamento-step', read)
    return () => window.removeEventListener('devici:orcamento-step', read)
  }, [])

  const update = (p: Phase) => {
    localStorage.setItem(STORAGE_KEY, p)
    setPhase(p)
  }

  // Nas etapas de revisão/exportação o card começa minimizado para não cobrir a tabela
  const [minimized, setMinimized] = useState(false)
  useEffect(() => {
    setMinimized(pathname === '/orcamento' && orcStep >= 2)
  }, [pathname, orcStep])

  // Destaca o elemento da etapa atual
  useEffect(() => {
    if (phase !== 'guide' || pathname !== '/orcamento') return
    const key = ({ 1: 'upload', 2: 'review', 3: 'export' } as Record<number, string>)[orcStep]
    const el = document.querySelector<HTMLElement>(`[data-onboarding="${key}"]`)
    if (!el) return
    el.classList.add('onboarding-highlight')
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    return () => el.classList.remove('onboarding-highlight')
  }, [phase, pathname, orcStep])

  if (!phase || phase === 'done' || pathname.startsWith('/login')) return null

  if (phase === 'welcome') {
    return (
      <div
        className="animate-fade-in"
        style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      >
        <div className="relative w-full max-w-md glass-card rounded-2xl p-7 border border-white/10 bg-[#0b1220]/90 text-slate-100 shadow-2xl">
          <button
            aria-label="Fechar"
            onClick={() => update('done')}
            className="absolute top-3 right-3 text-slate-500 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="w-11 h-11 rounded-xl bg-blue-500/15 border border-blue-400/30 flex items-center justify-center text-blue-300 mb-4">
            <PartyPopper className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-semibold text-white">Bem-vindo ao DeVici</h2>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            Quer um guia rápido? Vamos te acompanhar até o seu primeiro orçamento em 3 passos: enviar, revisar e exportar.
          </p>
          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={() => {
                update('guide')
                if (pathname !== '/orcamento') router.push('/orcamento')
              }}
              className="btn-primary px-5 py-2 text-sm font-semibold flex items-center gap-2 cursor-pointer"
            >
              Começar guia <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => update('done')}
              className="text-sm text-slate-400 hover:text-white cursor-pointer"
            >
              Agora não
            </button>
          </div>
        </div>
      </div>
    )
  }

  const slide = getSlide(pathname, orcStep)
  const onOrc = pathname === '/orcamento'
  const current = onOrc ? orcStep : 0

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        aria-label="Abrir guia"
        className="animate-fade-in cursor-pointer"
        style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 100 }}
      >
        <span className="flex items-center gap-2 rounded-full border border-blue-400/40 bg-[#0b1220]/95 px-3.5 py-2 text-xs text-blue-200 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:text-white">
          {slide.icon}
          Guia · {current}/3
        </span>
      </button>
    )
  }

  return (
    <div
      className="animate-fade-in"
      style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 100, width: 'min(360px, calc(100vw - 32px))' }}
    >
      <div className="relative rounded-2xl border border-blue-400/30 bg-[#0b1220]/95 backdrop-blur-md p-5 text-slate-100 shadow-[0_0_30px_rgba(59,130,246,0.25)]">
        <button
          aria-label="Dispensar guia"
          onClick={() => update('done')}
          className="absolute top-3 right-3 text-slate-500 hover:text-white cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 text-blue-300 text-[11px] font-mono uppercase mb-2">
          {slide.icon}
          <span>Guia · {current === 0 ? 'Início' : `${current}/3`}</span>
        </div>
        <h3 className="text-sm font-semibold text-white">{slide.title}</h3>
        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{slide.text}</p>
        <div className="flex gap-1.5 mt-3">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full ${i <= current ? 'bg-blue-400' : 'bg-white/10'}`}
            />
          ))}
        </div>
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => update('done')}
            className="text-xs text-slate-500 hover:text-white cursor-pointer"
          >
            {current === 3 ? 'Concluir' : 'Pular guia'}
          </button>
          {slide.cta && (
            <button
              onClick={() => router.push(slide.cta!.href)}
              className="btn-primary px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              {slide.cta.label} <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
