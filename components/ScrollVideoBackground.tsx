"use client"

import React, { useEffect, useRef, useState } from "react"

interface ScrollVideoBackgroundProps {
  /** Caminho do arquivo de vídeo */
  src?: string
  /** Opacidade base do vídeo (ex: 0.85 a 0.95) */
  opacity?: number
  /** Fator de suavização inercial (0.01 a 0.3, padrão 0.18) */
  lerpFactor?: number
  /** ID do container de rolagem (ex: 'hero-track') para limitar o avanço à Hero Section */
  containerId?: string
  /** Classes extras para o container */
  className?: string
}

export function ScrollVideoBackground({
  src = "/videos/building-construction.mp4",
  opacity = 0.9,
  lerpFactor = 0.18,
  containerId = "hero-track",
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

    // 1. Mapeamento da rolagem para a timeline do vídeo (focado na Hero Section)
    const updateScrollTarget = () => {
      const maxDuration = Math.max(durationRef.current - 0.02, 0)
      if (maxDuration <= 0) return

      let scrollFraction = 0

      if (containerId) {
        const container = document.getElementById(containerId)
        if (container) {
          const rect = container.getBoundingClientRect()
          const scrollDistance = Math.max(container.offsetHeight - window.innerHeight, 1)
          const currentScroll = -rect.top
          scrollFraction = Math.min(Math.max(currentScroll / scrollDistance, 0), 1)
        } else {
          const maxScroll = Math.max(window.innerHeight, 1)
          scrollFraction = Math.min(Math.max(window.scrollY / maxScroll, 0), 1)
        }
      } else {
        const maxScroll = Math.max(window.innerHeight, 1)
        scrollFraction = Math.min(Math.max(window.scrollY / maxScroll, 0), 1)
      }

      targetTimeRef.current = scrollFraction * maxDuration
    }

    const onMetadataLoaded = () => {
      if (video.duration && !isNaN(video.duration) && isFinite(video.duration)) {
        durationRef.current = video.duration
        setIsVideoReady(true)
        updateScrollTarget()
      }
    }

    if (video.readyState >= 1 && video.duration && !isNaN(video.duration)) {
      onMetadataLoaded()
    } else {
      video.addEventListener("loadedmetadata", onMetadataLoaded)
      video.addEventListener("loadeddata", onMetadataLoaded)
      video.addEventListener("canplay", onMetadataLoaded)
    }

    // 2. Loop de Interpolação Inercial (Lerp contínuo via requestAnimationFrame)
    const renderLoop = () => {
      // Fallback para assegurar obtenção da duração
      if (durationRef.current <= 0 && video.duration && !isNaN(video.duration) && isFinite(video.duration)) {
        durationRef.current = video.duration
        setIsVideoReady(true)
        updateScrollTarget()
      }

      if (durationRef.current > 0) {
        updateScrollTarget()

        const diff = targetTimeRef.current - currentTimeRef.current

        // Salto imediato se a discrepância for grande
        if (Math.abs(diff) > 1.2) {
          currentTimeRef.current = targetTimeRef.current
          try {
            video.currentTime = currentTimeRef.current
          } catch {}
        } else if (Math.abs(diff) > 0.003) {
          currentTimeRef.current += diff * lerpFactor
          const clamped = Math.min(
            Math.max(currentTimeRef.current, 0),
            durationRef.current
          )
          try {
            video.currentTime = clamped
          } catch {}
        }
      }

      animationFrameRef.current = requestAnimationFrame(renderLoop)
    }

    animationFrameRef.current = requestAnimationFrame(renderLoop)

    // Eventos de scroll e redimensionamento
    window.addEventListener("scroll", updateScrollTarget, { passive: true })
    window.addEventListener("resize", updateScrollTarget, { passive: true })

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      video.removeEventListener("loadedmetadata", onMetadataLoaded)
      video.removeEventListener("loadeddata", onMetadataLoaded)
      video.removeEventListener("canplay", onMetadataLoaded)
      window.removeEventListener("scroll", updateScrollTarget)
      window.removeEventListener("resize", updateScrollTarget)
    }
  }, [reducedMotion, lerpFactor, containerId])

  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden select-none ${className}`}
    >
      {/* Vídeo ocupando 100% da Hero Section sem barras ou partes pretas */}
      <video
        ref={videoRef}
        src={src}
        playsInline
        muted
        preload="auto"
        disablePictureInPicture
        className="w-full h-full object-cover transition-opacity duration-700 ease-out will-change-transform"
        style={{
          opacity: isVideoReady ? opacity : 0,
        }}
      />

      {/* Camada translúcida ultra-leve para harmonização e leitura sem escurecer o vídeo */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/25 via-transparent to-slate-950/45 pointer-events-none" />
    </div>
  )
}

export default ScrollVideoBackground
