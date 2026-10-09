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
  opacity = 0.85,
  lerpFactor = 0.15,
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

    // 1. Mapeamento da rolagem para a timeline do vídeo
    const updateScrollTarget = () => {
      const docHeight = document.documentElement.scrollHeight
      const winHeight = window.innerHeight
      const maxScroll = Math.max(docHeight - winHeight, 1)
      const currentScroll = Math.max(window.scrollY || window.pageYOffset || 0, 0)

      const scrollFraction = Math.min(Math.max(currentScroll / maxScroll, 0), 1)
      const maxDuration = Math.max(durationRef.current - 0.02, 0)
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

        // Salto imediato se a discrepância for grande (ex: carregamento já com rolagem prévia)
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
  }, [reducedMotion, lerpFactor])

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden select-none bg-[#020617] ${className}`}
    >
      {/* Moldura 16:9 centralizada e estática no viewport */}
      <div className="relative w-full h-full max-w-[1920px] flex items-center justify-center">
        <video
          ref={videoRef}
          src={src}
          playsInline
          muted
          preload="auto"
          disablePictureInPicture
          className="w-full h-full object-contain aspect-video transition-opacity duration-700 ease-out will-change-transform"
          style={{
            opacity: isVideoReady ? opacity : 0,
          }}
        />

        {/* Camada sutil para harmonização e leitura sem bloquear nitidez do vídeo */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/35 via-transparent to-[#020617]/55 pointer-events-none" />
      </div>
    </div>
  )
}

export default ScrollVideoBackground
