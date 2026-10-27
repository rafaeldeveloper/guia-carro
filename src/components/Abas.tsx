"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const abas = [
  { href: "/", rotulo: "Início" },
  { href: "/comparar", rotulo: "Comparar" },
  { href: "/proposta", rotulo: "Analisar proposta" },
  { href: "/minha-ficha", rotulo: "Minha ficha" },
];

export function Abas() {
  const caminho = usePathname();
  const atual = (href: string) =>
    href === "/" ? caminho === "/" : caminho === href || (href === "/comparar" && caminho.startsWith("/carros/"));

  return (
    <nav aria-label="Seções" className="-mx-4 w-[calc(100%+2rem)] overflow-x-auto px-4 md:mx-0 md:w-auto md:self-stretch md:px-0">
      <ul className="flex gap-5 text-sm whitespace-nowrap md:h-full">
        {abas.map((a) => (
          <li key={a.href} className="flex">
            <Link
              href={a.href}
              aria-current={atual(a.href) ? "page" : undefined}
              className="flex items-center border-b-2 border-transparent py-3 font-medium text-muted hover:text-ink aria-[current=page]:border-ink aria-[current=page]:text-ink md:py-0"
            >
              {a.rotulo}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
