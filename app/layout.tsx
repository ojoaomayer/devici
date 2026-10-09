import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import SmoothScroll from "@/components/SmoothScroll";
import Onboarding from "@/components/Onboarding";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "DeVici | Orçamentos de Obras com Alta Precisão & SINAPI",
  description:
    "Plataforma de engenharia de custos para orçamentistas e construtoras. Identificação inteligente na base SINAPI, BDI oficial do TCU e conciliação em segundos.",
  keywords: [
    "orçamento de obras",
    "engenharia de custos",
    "base SINAPI",
    "planilha SINAPI",
    "orçamento inteligente",
    "software orçamentação",
    "construção civil",
    "BDI TCU",
    "DeVici",
    "inteligência artificial engenharia"
  ],
  authors: [{ name: "DeVici", url: "https://devici.com.br" }],
  creator: "DeVici",
  metadataBase: new URL("https://devici.com.br"),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "DeVici | Orçamentos SINAPI com IA em minutos",
    description:
      "Esqueça o copia-e-cola em planilhas intermináveis. O DeVici identifica composições SINAPI e entrega seu orçamento fechado em minutos.",
    url: "https://devici.com.br",
    siteName: "DeVici",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DeVici | Orçamentos SINAPI com IA",
    description:
      "Plataforma de engenharia de custos. Match semântico com a base SINAPI em segundos.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* JSON-LD Schema (Structured Data) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "DeVici",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web",
              "url": "https://devici.com.br",
              "description": "Plataforma de inteligência artificial para orçamento de obras na construção civil usando a base SINAPI e SECID.",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "BRL"
              },
              "creator": {
                "@type": "Organization",
                "name": "DeVici",
                "url": "https://devici.com.br"
              }
            })
          }}
        />

        {/* Preconnect para recursos externos críticos */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://firestore.googleapis.com" />
        <link rel="dns-prefetch" href="https://identitytoolkit.googleapis.com" />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-100 selection:bg-blue-500/30 selection:text-white font-sans transition-colors duration-300"
      >
        <ThemeProvider>
          <AuthProvider>
            <SmoothScroll>{children}</SmoothScroll>
            <Onboarding />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
