'use client'

import { useEffect, useState, useRef } from 'react'

interface AnimatedCounterProps {
  from?: number
  to: number
  duration?: number
  prefix?: string
  suffix?: string
  decimals?: number
  enableLiveIncrement?: boolean
  incrementIntervalMin?: number
  incrementIntervalMax?: number
  className?: string
}

export default function AnimatedCounter({
  from = 0,
  to,
  duration = 1500,
  prefix = '',
  suffix = '',
  decimals = 0,
  enableLiveIncrement = false,
  incrementIntervalMin = 3000,
  incrementIntervalMax = 7000,
  className = '',
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(from)
  const [isFlashing, setIsFlashing] = useState(false)
  const currentValRef = useRef(from)
  const containerRef = useRef<HTMLSpanElement>(null)
  const hasAnimated = useRef(false)

  // Start animation only when element enters viewport
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    let rafId: number | null = null

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry.isIntersecting || hasAnimated.current) return
        hasAnimated.current = true
        observer.disconnect()

        // Ease-out cubic count up
        let startTimestamp: number | null = null
        const startValue = from
        const endValue = to

        const step = (timestamp: number) => {
          if (!startTimestamp) startTimestamp = timestamp
          const progress = Math.min((timestamp - startTimestamp) / duration, 1)
          const easeOut = 1 - Math.pow(1 - progress, 3)
          const current = startValue + (endValue - startValue) * easeOut

          currentValRef.current = current
          setDisplayValue(current)

          if (progress < 1) {
            rafId = requestAnimationFrame(step)
          } else {
            currentValRef.current = endValue
            setDisplayValue(endValue)
          }
        }

        rafId = requestAnimationFrame(step)
      },
      { threshold: 0.3 }
    )

    observer.observe(el)
    return () => {
      observer.disconnect()
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [from, to, duration])

  // Live periodic increment (telemetry simulation)
  useEffect(() => {
    if (!enableLiveIncrement) return

    let timeoutId: NodeJS.Timeout | null = null
    let flashTimeoutId: NodeJS.Timeout | null = null

    const scheduleNextTick = () => {
      const delay = Math.floor(
        Math.random() * (incrementIntervalMax - incrementIntervalMin) + incrementIntervalMin
      )

      timeoutId = setTimeout(() => {
        const increment = Math.random() > 0.4 ? 1 : 2
        const nextVal = currentValRef.current + increment
        currentValRef.current = nextVal
        setDisplayValue(nextVal)

        setIsFlashing(true)
        flashTimeoutId = setTimeout(() => setIsFlashing(false), 800)

        scheduleNextTick()
      }, delay)
    }

    const initialDelay = setTimeout(() => {
      scheduleNextTick()
    }, duration + 500)

    return () => {
      clearTimeout(initialDelay)
      if (timeoutId) clearTimeout(timeoutId)
      if (flashTimeoutId) clearTimeout(flashTimeoutId)
    }
  }, [enableLiveIncrement, duration, incrementIntervalMin, incrementIntervalMax])

  const formattedNumber =
    decimals > 0
      ? displayValue.toLocaleString('pt-BR', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : Math.floor(displayValue).toLocaleString('pt-BR')

  return (
    <span
      ref={containerRef}
      className={`inline-flex items-center transition-colors duration-500 ${
        isFlashing ? 'text-emerald-300' : ''
      } ${className}`}
    >
      {prefix}{formattedNumber}{suffix}
    </span>
  )
}
