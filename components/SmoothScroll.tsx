"use client";

import { ReactLenis } from "lenis/react";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface SmoothScrollProps {
  children: ReactNode;
}

// Páginas de trabalho (upload/revisão/exportação) usam scroll nativo:
// o Lenis interceptava a roda do mouse e travava o scroll nessas telas.
const NATIVE_SCROLL_PREFIXES = ["/orcamento", "/dashboard", "/consultas", "/ferramentas", "/login"];

export default function SmoothScroll({ children }: SmoothScrollProps) {
  const pathname = usePathname();

  if (NATIVE_SCROLL_PREFIXES.some((p) => pathname.startsWith(p))) {
    return <>{children}</>;
  }

  return (
    <ReactLenis
      root
      options={{
        lerp: 0.08,
        duration: 1.2,
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
      }}
    >
      {children}
    </ReactLenis>
  );
}
