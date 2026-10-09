'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, User as UserIcon, ArrowRight, AlertCircle, Terminal, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import Navbar from '@/components/Navbar'
import { BrandLogo } from '@/components/BrandLogo'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()

  const rawNext = searchParams.get('next')
  const nextPath = rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/dashboard'

  const [isSignUp, setIsSignUp] = useState(searchParams.get('mode') === 'signup')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      router.push(nextPath)
    }
  }, [user, loading, router, nextPath])

  const getFriendlyErrorMessage = (err: any) => {
    const code = err?.code || ''
    const msg = err?.message || ''

    if (code === 'auth/operation-not-allowed') {
      return 'Provedor não ativado no Firebase Console.'
    }
    if (code === 'auth/unauthorized-domain') {
      return 'Domínio não autorizado no Firebase Console.'
    }
    if (code === 'auth/invalid-api-key' || code === 'auth/api-key-not-valid') {
      return 'Chave de API do Firebase inválida ou não configurada.'
    }
    if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
      return 'E-mail ou senha incorretos.'
    }
    if (code === 'auth/email-already-in-use') {
      return 'Este e-mail já está cadastrado. Alterne para a aba "Entrar".'
    }
    if (code === 'auth/invalid-email') {
      return 'Endereço de e-mail inválido.'
    }
    if (code === 'auth/weak-password') {
      return 'Senha muito fraca. Escolha uma senha com pelo menos 6 caracteres.'
    }
    if (code === 'auth/popup-blocked') {
      return 'O navegador bloqueou a janela pop-up do Google. Permita pop-ups para este site.'
    }
    if (code === 'auth/network-request-failed') {
      return 'Falha de conexão com os servidores do Firebase. Verifique sua internet.'
    }

    return msg ? `Erro (${code || 'auth'}): ${msg}` : 'Erro ao processar autenticação. Verifique suas credenciais.'
  }

  const handleGoogleLogin = async () => {
    setErrorMsg('')
    setIsSubmitting(true)
    try {
      await signInWithGoogle()
      router.push(nextPath)
    } catch (err: any) {
      console.error('Google Auth Error:', err)
      if (err.code !== 'auth/popup-closed-by-user') {
        setErrorMsg(getFriendlyErrorMessage(err))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setIsSubmitting(true)

    try {
      if (isSignUp) {
        if (password.length < 6) {
          setErrorMsg('A senha deve conter no mínimo 6 caracteres.')
          setIsSubmitting(false)
          return
        }
        await signUpWithEmail(email, password, nome)
      } else {
        await signInWithEmail(email, password)
      }
      router.push(nextPath)
    } catch (err: any) {
      console.error('Email Auth Error:', err)
      setErrorMsg(getFriendlyErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="animate-scale-in w-full max-w-sm mx-auto">
      <div className="glass-panel rounded-2xl p-7 space-y-6 blueprint-box">
        {/* Header */}
        <div className="space-y-3 text-center flex flex-col items-center">
          <Link href="/" className="inline-block transition-transform hover:scale-105">
            <BrandLogo className="h-10 w-auto" priority />
          </Link>
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-white">
              {isSignUp ? 'Criar Conta' : 'Acesso ao Workspace'}
            </h1>
            <p className="text-xs text-slate-400">
              {isSignUp ? 'Comece com 1 orçamento gratuito' : 'Entre com suas credenciais corporativas'}
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-[#030712] p-1 rounded-full border border-white/10 text-xs font-mono">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setErrorMsg(''); }}
            className={`flex-1 py-1.5 rounded-full transition-all ${
              !isSignUp ? 'bg-white text-slate-950 font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setErrorMsg(''); }}
            className={`flex-1 py-1.5 rounded-full transition-all ${
              isSignUp ? 'bg-white text-slate-950 font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Registrar
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Google SSO */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isSubmitting}
          className="btn-secondary w-full py-2.5 px-4 text-xs font-medium flex items-center justify-center gap-2.5 disabled:opacity-50"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
            />
            <path
              fill="#FBBC05"
              d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.5s.7 4.8 1.9 7.2l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"
            />
          </svg>
          <span>Continuar com Google</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/[0.08]" />
          <span className="text-[10px] font-mono text-slate-500 uppercase">ou e-mail corporativo</span>
          <div className="flex-1 h-px bg-white/[0.08]" />
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-slate-400">Nome / Empresa</label>
              <input
                type="text"
                required={isSignUp}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Eng. João Mayer"
                className="w-full px-3.5 py-2 bg-[#030712]/90 border border-white/10 rounded-xl text-xs text-white placeholder-slate-600 focus:border-blue-500/50 outline-none transition-colors"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-slate-400">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="engenharia@empresa.com"
              className="w-full px-3.5 py-2 bg-[#030712]/90 border border-white/10 rounded-xl text-xs text-white placeholder-slate-600 focus:border-blue-500/50 outline-none transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-slate-400">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2 bg-[#030712]/90 border border-white/10 rounded-xl text-xs text-white placeholder-slate-600 focus:border-blue-500/50 outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full mt-2 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{isSignUp ? 'Criar Conta' : 'Acessar Workspace'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#020617] text-slate-100 selection:bg-blue-500/30 selection:text-white relative overflow-hidden">
      {/* Background Lighting e Blueprint Grid */}
      <div className="absolute inset-0 blueprint-grid pointer-events-none opacity-50" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-cinematic-glow pointer-events-none" />

      <Navbar />
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-16">
        <Suspense fallback={<div className="text-slate-400 font-mono text-xs">Carregando workspace...</div>}>
          <LoginForm />
        </Suspense>
      </main>
    </div>
  )
}
