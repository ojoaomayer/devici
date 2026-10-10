"use client"
import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"

export interface AuroraBackgroundProps {
  /** Extra wrapper classes */
  className?: string
  /** Content to render on top of the background */
  children?: React.ReactNode
  /** Number of “star” points */
  starCount?: number
  /** Two CSS-variable backed colors for the radial overlays */
  gradientColors?: [string, string]
  /** Pulse animation duration in seconds */
  pulseDuration?: number
  /** ARIA label for the animated background */
  ariaLabel?: string
}

const AuroraBackground: React.FC<AuroraBackgroundProps> = ({
  className = "",
  children,
  starCount = 20,
  gradientColors = [
    "var(--aurora-color1, rgba(168,85,247,0.2))",
    "var(--aurora-color2, rgba(79,70,229,0.2))",
  ],
  pulseDuration = 10,
  ariaLabel = "Animated aurora background",
}) => {
  const [colorA, colorB] = gradientColors
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Memoiza as posições e parâmetros das estrelas para não recalcular em cada render
  const stars = React.useMemo(() => {
    return Array.from({ length: starCount }).map((_, i) => ({
      id: i,
      x: `${(i * 19.3) % 100}vw`,
      y: `${(i * 27.7) % 100}vh`,
      duration: 2.5 + (i % 3),
      delay: (i * 0.4) % 5,
    }))
  }, [starCount])

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={`relative flex flex-col w-full h-full items-center justify-center bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-50 overflow-hidden ${className}`}
    >
      {/* Background layers (hidden from screen readers) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {/* Pulsing radial gradients */}
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: `
              radial-gradient(circle, ${colorA} 0%, transparent 80%),
              radial-gradient(circle, ${colorB} 0%, transparent 80%)
            `,
            backgroundSize: "100% 100%",
            animation: `pulse ${pulseDuration}s infinite`,
          }}
        />

        {/* Blurred color blobs com aceleração de hardware */}
        <motion.div
          className="absolute inset-0 mix-blend-screen will-change-transform"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, ease: "easeInOut" }}
        >
          <motion.div
            className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-purple-600 rounded-full filter blur-3xl opacity-40 will-change-transform"
            animate={{
              x: [-40, 40, -40],
              y: [-15, 15, -15],
              scale: [1, 1.15, 1],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              repeatType: "mirror",
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-fuchsia-600 rounded-full filter blur-3xl opacity-40 will-change-transform"
            animate={{
              x: [40, -40, 40],
              y: [15, -15, 15],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 40,
              repeat: Infinity,
              repeatType: "mirror",
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute top-1/3 left-1/3 w-1/3 h-1/3 bg-indigo-700 rounded-full filter blur-3xl opacity-30 will-change-transform"
            animate={{
              x: [15, -15, 15],
              y: [-20, 20, -20],
              rotate: [0, 360, 0],
            }}
            transition={{
              duration: 50,
              repeat: Infinity,
              repeatType: "mirror",
              ease: "easeInOut",
            }}
          />
        </motion.div>

        {/* Twinkling stars memoizadas */}
        {mounted &&
          stars.map((star) => (
            <motion.div
              key={star.id}
              className="absolute w-0.5 h-0.5 bg-slate-800 dark:bg-white rounded-full"
              initial={{
                x: star.x,
                y: star.y,
                opacity: 0,
              }}
              animate={{
                opacity: [0, 0.7, 0],
              }}
              transition={{
                duration: star.duration,
                repeat: Infinity,
                delay: star.delay,
              }}
            />
          ))}
      </div>

      {/* Foreground content */}
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  )
}

export default AuroraBackground
