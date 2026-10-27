import type { Metadata } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import { AlternarTema } from "@/components/AlternarTema";
import { Abas } from "@/components/Abas";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Guia do Carro",
  description: "Busca de carros com nota de risco por defeitos, proporcional às vendas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("tema");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`,
          }}
        />
      </head>
      <body className={`${inter.variable} min-h-dvh font-sans antialiased`}>
        <header className="border-b border-line">
          <div className="conteudo flex flex-wrap items-center gap-x-7 gap-y-0 pt-3 md:h-16 md:flex-nowrap md:pt-0">
            <Link href="/" className="mr-auto flex items-center gap-1.5 text-lg font-extrabold tracking-tight whitespace-nowrap md:mr-0">
              <span aria-hidden="true" className="grid size-6 place-items-center rounded bg-accent text-sm text-accent-ink">
                G
              </span>
              Guia do Carro
            </Link>
            <div className="flex items-center gap-1 md:order-last md:ml-auto">
              <Link href="/como-calculamos" className="px-2 py-1 text-sm text-muted hover:text-ink">
                Como calculamos
              </Link>
              <AlternarTema />
            </div>
            <Abas />
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
