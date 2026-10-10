// Server Component — sem 'use client', sem useState, sem hooks
// Toda a interatividade foi movida para Client Components mínimos:
//   HeroActions.tsx → botões de ação do hero
//   FaqSection.tsx  → accordion do FAQ
//   CheckoutButton  → botões de checkout dos planos pagos

import Link from 'next/link'
import {
  Calculator,
  ArrowRight,
  Database,
  Check,
  X,
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import AnimatedCounter from '@/components/AnimatedCounter'
import AuroraBackground from '@/components/ui/aurora-background'
import ScrollExpandMedia from '@/components/ui/scroll-expansion-hero'
import { CheckoutButton } from '@/components/CheckoutButton'
import { HeroActions } from '@/components/HeroActions'
import { FaqSection } from '@/components/FaqSection'
import { BrandLogo } from '@/components/BrandLogo'
import { HeroStats } from '@/components/HeroStats'

export default function LandingPage() {
  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 flex flex-col selection:bg-blue-500/30 selection:text-white relative w-full overflow-x-hidden max-w-full transition-colors bg-slate-50/20 dark:bg-[#020617]/40">
      {/* Background Aurora ambiental nas demais seções do site (sem telas pretas) */}
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <AuroraBackground />
      </div>

      <div className="relative z-10 flex flex-col flex-1 w-full">
        <Navbar />

        {/* HERO SECTION DINÂMICA COM SCROLL EXPAND MEDIA */}
        <ScrollExpandMedia
          mediaType="video"
          mediaSrc="/videos/building-construction.mp4"
          bgImageSrc="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop"
          title="DeVici Orçamentos Inteligentes"
          date="Engenharia de Custos com IA"
          scrollToExpand="Role para expandir a experiência"
          textBlend={false}
        >
          {/* Conteúdo principal da Hero revelado na expansão */}
          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-4 sm:pt-8 pb-12 text-center space-y-6 sm:space-y-8 w-full">
            {/* Headline (H1) */}
            <div className="max-w-4xl mx-auto space-y-4 sm:space-y-5">
              <h1 className="animate-fade-in-up delay-100 text-2xl sm:text-4xl md:text-5xl lg:text-[52px] font-light tracking-tight text-slate-900 dark:text-white leading-[1.2] max-w-full drop-shadow-sm">
                Seu orçamento pronto <br className="hidden sm:inline" />
                <span className="font-semibold bg-clip-text text-transparent bg-gradient-to-b from-slate-950 via-slate-800 to-blue-700 dark:from-white dark:via-slate-100 dark:to-blue-200">
                  enquanto você toma um{' '}
                  <span className="relative inline-block px-1">
                    <span className="relative z-10 text-amber-900 dark:text-amber-100 font-semibold">café.</span>
                    <span className="absolute left-0 right-0 top-[38%] bottom-0 bg-amber-200/90 dark:bg-[#451a03]/75 border-t border-amber-400 dark:border-[#b45309]/70 shadow-[0_0_20px_rgba(251,191,36,0.3)] dark:shadow-[0_0_20px_rgba(180,83,9,0.25)] -z-0 pointer-events-none" />
                  </span>
                </span>
              </h1>

              {/* Sub-headline */}
              <p className="animate-fade-in-up delay-200 text-xs sm:text-sm md:text-base text-slate-700 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal px-2">
                <strong>Plataforma inteligente de engenharia de custos.</strong> Esqueça o copia-e-cola em planilhas: Cruzamos seus quantitativos com as bases SINAPI e SECID em segundos, gerando orçamentos precisos, licitáveis e sem erros.
              </p>
            </div>

            {/* CTAs — Client Component com seleção direta de escopo */}
            <HeroActions />

            {/* Stats em Tempo Real */}
            <HeroStats />
          </div>


      {/* 3. SEÇÃO "O ANTES vs. DEPOIS" (A DOR REAL) */}
      <section className="relative z-10 py-20 max-w-5xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="text-center space-y-3">

          <h2 className="text-2xl sm:text-4xl font-light tracking-tight text-white max-w-2xl mx-auto">
            A engenharia moderna não perde dias caçando códigos no Excel.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* O jeito antigo */}
          <div className="glass-card p-6 sm:p-7 rounded-2xl space-y-5 border-white/[0.06] bg-[#0b132b]/30">
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
              <X className="w-4 h-4" />
              <span>O ciclo exaustivo tradicional</span>
            </div>

            <ul className="space-y-4 text-xs text-slate-400 leading-relaxed">
              <li className="flex items-start gap-3">
                <span className="text-rose-400/80 font-mono mt-0.5">•</span>
                <span>3 a 5 dias úteis procurando descrições em PDFs e tabelas pesadas.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-rose-400/80 font-mono mt-0.5">•</span>
                <span>Risco constante de usar códigos defasados ou errar a unidade de medida.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-rose-400/80 font-mono mt-0.5">•</span>
                <span>Orçamentos atrasados e noites perdidas para fechar propostas de licitação.</span>
              </li>
            </ul>
          </div>

          {/* Com o DeVici */}
          <div className="glass-panel p-6 sm:p-7 rounded-2xl space-y-5 border-blue-500/10 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
            <div className="flex items-center gap-2 text-blue-300 font-semibold text-sm">
              <Check className="w-4 h-4 text-blue-400" />
              <span>O fluxo inteligente do DeVici</span>
            </div>

            <ul className="space-y-4 text-xs text-slate-200 leading-relaxed">
              <li className="flex items-start gap-3">
                <span className="text-blue-400 font-mono mt-0.5">✓</span>
                <span>Faça o upload do memorial ou da planilha de quantidades.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-400 font-mono mt-0.5">✓</span>
                <span>DeVici cruza cada item técnico com o código oficial da sua UF.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-400 font-mono mt-0.5">✓</span>
                <span>Você apenas revisa o índice de confiança, ajusta o BDI e exporta pronto.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 4. COMO FUNCIONA (PASSO A PASSO OBJETIVO) */}
      <section id="como-funciona" className="relative z-10 py-20 max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="text-center space-y-3">

          <h2 className="text-2xl sm:text-4xl font-light tracking-tight text-white">
            Como nossa IA<span className="font-semibold text-blue-300"> automatiza seus orçamentos</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Passo 01 */}
          <div className="glass-card glass-card-hover p-6 rounded-2xl space-y-4 blueprint-box">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center font-mono font-bold text-sm text-blue-400">
              01
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-white">
                Suba sua planilha do jeito que ela estiver
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                Não precisa reformatar nada. O sistema identifica automaticamente colunas de descrição, quantidade e unidade.
              </p>
            </div>
          </div>

          {/* Passo 02 */}
          <div className="glass-card glass-card-hover p-6 rounded-2xl space-y-4 blueprint-box">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center font-mono font-bold text-sm text-cyan-400">
              02
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-white">
                A IA faz o pareamento técnico
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                O motor entende termos de obra, sabe a diferença entre bloco de concreto e cerâmico, e cruza com a composição certa.
              </p>
            </div>
          </div>

          {/* Passo 03 */}
          <div className="glass-card glass-card-hover p-6 rounded-2xl space-y-4 blueprint-box">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-mono font-bold text-sm text-emerald-400">
              03
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-white">
                Revise com calma e baixe em Excel
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                Cada linha ganha um selo de precisão (Verde/Amarelo). Baixe o arquivo limpo com fórmulas e BDI já calculados.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SEÇÃO DAS FERRAMENTAS GRATUITAS (VALOR ANTECIPADO) */}
      <section className="relative z-10 py-16 max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-white">
            Ferramentas essenciais para o seu dia a dia. <span className="font-semibold text-blue-300">100% gratuitas.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Calculadora BDI */}
          <div className="glass-panel p-6 sm:p-7 rounded-2xl flex flex-col justify-between space-y-5 blueprint-box">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 text-xs font-mono font-bold uppercase text-slate-200">
                <Calculator className="w-4 h-4 text-emerald-400" />
                <span>Calculadora de BDI TCU</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                Calcule seu BDI rigorosamente alinhado às faixas permitidas pelo Acórdão 2622 do TCU para obras públicas e privadas.
              </p>
            </div>
            <Link
              href="/ferramentas/calculadora-bdi"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors pt-2"
            >
              <span>Calcular BDI</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 2: Consulta Pública SINAPI */}
          <div className="glass-panel p-6 sm:p-7 rounded-2xl flex flex-col justify-between space-y-5 blueprint-box">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 text-xs font-mono font-bold uppercase text-slate-200">
                <Database className="w-4 h-4 text-blue-400" />
                <span>Consulta Pública SINAPI</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                Encontre insumos e composições por estado em segundos, sem abrir arquivos de 40 MB.
              </p>
            </div>
            <Link
              href="/consultas"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors pt-2"
            >
              <span>Consultar preços</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 6. TABELA DE PREÇOS (TRANSPARENTE E DIRETA) */}
      <section id="precos" className="relative z-10 py-20 max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="text-center space-y-2">

          <h2 className="text-3xl font-light tracking-tight text-white">
            Planos e Acesso
          </h2>
          <p className="text-xs text-slate-400">
            Sem fidelidade. Cancele quando quiser.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Plano Gratuito */}
          <div className="glass-card glass-card-hover rounded-2xl p-6 sm:p-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white">Gratuito</h3>
                <p className="text-xs text-slate-400 mt-1">Ideal para ver o DeVici funcionando no seu projeto real.</p>
              </div>

              <div className="py-2">
                <span className="text-3xl font-extrabold font-mono text-white tabular-nums">R$ 0</span>
                <span className="text-xs text-slate-400 font-mono"> / mês</span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-300 pt-4 border-t border-white/[0.08] font-mono">
                <li className="flex items-center gap-2.5">
                  <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>1 orçamento completo</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Até 50 linhas por planilha</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Acesso às calculadoras</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Base SINAPI 27 UFs</span>
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

          {/* Plano Profissional (Destaque) */}
          <div className="glass-panel rounded-2xl p-6 sm:p-7 flex flex-col justify-between space-y-6 relative border-blue-500/10 shadow-[0_0_35px_rgba(59,130,246,0.22)]">
            <div className="absolute -top-3 right-6">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-blue-500 text-slate-950 shadow-[0_0_12px_rgba(59,130,246,0.8)]">
                Mais usado
              </span>
            </div>

            <div className="space-y-4">
              <div className="pt-1">
                <h3 className="text-sm font-bold text-white">Profissional</h3>
                <p className="text-xs text-slate-400 mt-1">Economize mais de 20 horas de digitação técnica todo mês.</p>
              </div>

              <div className="py-2">
                <span className="text-3xl font-extrabold font-mono text-white tabular-nums">R$ 47</span>
                <span className="text-xs text-slate-400 font-mono"> / mês</span>
                <p className="text-[10px] text-slate-500 font-mono mt-1">
                  Custo operacional: ~R$ 31/mês (IA + cloud + base SINAPI)
                </p>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-200 pt-4 border-t border-white/[0.08] font-mono">
                <li className="flex items-center gap-2.5">
                  <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span><strong>Até 10 planilhas completas por mês</strong></span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Exportação direta com BDI</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Atualização de todas as UFs</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Histórico corporativo em nuvem</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Suporte via WhatsApp</span>
                </li>
              </ul>
            </div>

            <CheckoutButton planId="pro" variant="primary">
              Assinar Plano Profissional
            </CheckoutButton>
          </div>

          {/* Plano Construtora */}
          <div className="glass-card glass-card-hover rounded-2xl p-6 sm:p-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white">Construtora</h3>
                <p className="text-xs text-slate-400 mt-1">Para empresas com alto volume de licitações e orçamentos executivos.</p>
              </div>

              <div className="py-2">
                <span className="text-3xl font-extrabold font-mono text-white tabular-nums">R$ 97</span>
                <span className="text-xs text-slate-400 font-mono"> / mês</span>
                <p className="text-[10px] text-slate-500 font-mono mt-1">
                  Custo operacional: ~R$ 68/mês (infraestrutura + atualizações SECID/SINAPI)
                </p>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-300 pt-4 border-t border-white/[0.08] font-mono">
                <li className="flex items-center gap-2.5">
                  <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span><strong>Planilhas ilimitadas</strong></span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Múltiplos usuários de engenharia</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Suporte a SINAPI e SICRO</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Memória de cálculo para licitação</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Atendimento prioritário</span>
                </li>
              </ul>
            </div>

            <CheckoutButton planId="construtora" variant="secondary">
              Automatizar meu escritório
            </CheckoutButton>
          </div>
        </div>
      </section>

      {/* 7. FAQ (QUEBRA DE OBJEÇÕES DE ENGENHEIRO) */}
      <section className="relative z-10 py-20 w-full max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="text-center space-y-2">

          <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-white">
            Dúvidas Frequentes
          </h2>
        </div>

        {/* FAQ accordion — Client Component mínimo */}
        <FaqSection />
      </section>

      {/* 8. FOOTER e CHAMADA FINAL */}
      <section className="relative z-10 py-20 border-t border-slate-200/20 dark:border-white/[0.08] bg-transparent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-slate-900 dark:text-white">
            Pronto para orçar sua próxima obra em minutos?
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-normal">
            Suba sua primeira planilha agora mesmo e veja como o DeVici trabalha.
          </p>
          <div className="pt-2">
            <Link
              href="/orcamento"
              className="btn-primary px-8 py-3.5 text-sm font-semibold inline-flex items-center gap-2 group"
            >
              <span>Experimentar sem compromisso</span>
              <ArrowRight className="w-4 h-4 text-slate-900 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer Navigation */}
      <footer className="relative z-10 border-t border-white/[0.06] py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-3">
            <Link href="/" className="hover:opacity-85 transition-opacity">
              <BrandLogo className="h-6 sm:h-7 w-auto" />
            </Link>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-slate-400">© {new Date().getFullYear()} • Engenharia Autônoma de Custos</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-slate-400">
            <Link href="/consultas" className="hover:text-white transition-colors">
              Buscador SINAPI
            </Link>
            <Link href="/ferramentas/calculadora-bdi" className="hover:text-white transition-colors">
              Calculadora BDI
            </Link>
            <Link href="/orcamento" className="hover:text-white transition-colors">
              Orçamentador
            </Link>
            <Link href="/login" className="hover:text-white transition-colors">
              Entrar
            </Link>
          </div>
        </div>
      </footer>
      </ScrollExpandMedia>
    </div>
  </div>
  )
}

