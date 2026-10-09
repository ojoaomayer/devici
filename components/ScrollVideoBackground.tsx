"use client"

import React, { useEffect, useRef, useState } from "react"

interface ScrollVideoBackgroundProps {
  /** Caminho do arquivo de vídeo */
  src?: string
  /** Opacidade base do vídeo (ex: 0.35) */
  opacity?: number
  /** Fator de suavização inercial (0.01 a 0.2, padrão 0.08) */
  lerpFactor?: number
  /** Classes extras para o container */
  className?: string
}

export function ScrollVideoBackground({
  src = "/videos/building-construction.mp4",
  opacity = 0.75,
  lerpFactor = 0.08,
  className = "",
}: ScrollVideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isVideoReady, setIsVideoReady] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  // Referências para animação inercial contínua sem disparar re-render do React
  const targetTimeRef = useRef(0)
  const currentTimeRef = useRef(0)
  const durationRef = useRef(0)
  const animationFrameRef = useRef<number | null>(null)
  const isSeekingRef = useRef(false)

  useEffect(() => {
    // 1. Detecção de preferência por movimento reduzido (Acessibilidade)
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReducedMotion(motionQuery.matches)

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches)
    }
    motionQuery.addEventListener("change", handleMotionChange)

    return () => {
      motionQuery.removeEventListener("change", handleMotionChange)
    }
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video || reducedMotion) return

    // Pausa o vídeo para garantir que o avanço seja 100% conduzido pelo scroll
    video.pause()

    // 1. Mapeamento do scroll para a linha do tempo do vídeo
    const updateScrollTarget = () => {
      const docHeight = document.documentElement.scrollHeight
      const winHeight = window.innerHeight
      const maxScroll = Math.max(docHeight - winHeight, 1)
      const currentScroll = Math.max(window.scrollY || window.pageYOffset || 0, 0)

      const scrollFraction = Math.min(Math.max(currentScroll / maxScroll, 0), 1)
      targetTimeRef.current = scrollFraction * (durationRef.current || 0)
    }

    const onMetadataLoaded = () => {
      if (video.duration && !isNaN(video.duration)) {
        durationRef.current = video.duration
        setIsVideoReady(true)
        updateScrollTarget()
      }
    }

    if (video.readyState >= 1 && video.duration && !isNaN(video.duration)) {
      onMetadataLoaded()
    } else {
      video.addEventListener("loadedmetadata", onMetadataLoaded)
    }

    const onSeeking = () => {
      isSeekingRef.current = true
    }
    const onSeeked = () => {
      isSeekingRef.current = false
    }

    video.addEventListener("seeking", onSeeking)
    video.addEventListener("seeked", onSeeked)

    // 3. Loop de Interpolação Inercial (Lerp via requestAnimationFrame)
    const renderLoop = () => {
      if (durationRef.current > 0) {
        updateScrollTarget()

        const diff = targetTimeRef.current - currentTimeRef.current

        // Só atualiza se a diferença for perceptível (evita overhead na CPU)
        if (Math.abs(diff) > 0.005) {
          currentTimeRef.current += diff * lerpFactor

          // Protege contra busca travada
          if (!isSeekingRef.current) {
            try {
              video.currentTime = Math.min(
                Math.max(currentTimeRef.current, 0),
                durationRef.current
              )
            } catch {
              // Ignora pequenas oscilações de seek durante decodificação
            }
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(renderLoop)
    }

    animationFrameRef.current = requestAnimationFrame(renderLoop)

    // Eventos de scroll e redimensionamento para recalcular altura da página
    window.addEventListener("scroll", updateScrollTarget, { passive: true })
    window.addEventListener("resize", updateScrollTarget, { passive: true })

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      video.removeEventListener("loadedmetadata", onMetadataLoaded)
      video.removeEventListener("seeking", onSeeking)
      video.removeEventListener("seeked", onSeeked)
      window.removeEventListener("scroll", updateScrollTarget)
      window.removeEventListener("resize", updateScrollTarget)
    }
  }, [reducedMotion, lerpFactor])

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden select-none ${className}`}
    >
      {/* Elemento de Vídeo com aceleração gráfica */}
      <video
        ref={videoRef}
        src={src}
        playsInline
        muted
        preload="auto"
        disablePictureInPicture
        className="w-full h-full object-cover transition-opacity duration-1000 ease-out will-change-transform"
        style={{
          opacity: isVideoReady ? opacity : 0,
        }}
      />

      {/* Camada Suave de Proteção de Contraste (translúcida, sem blur pesado) */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/55 via-transparent to-[#020617]/75" />

      {/* Vinheta Suave nas Bordas (mantém o centro do vídeo 100% nítido) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(2, 6, 23, 0.5) 100%)",
        }}
      />
    </div>
  )
}

export default ScrollVideoBackground
