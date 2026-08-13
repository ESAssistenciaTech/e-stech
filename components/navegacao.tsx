"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Navegação embaixo, não em cima.
 *
 * Quem usa isto está em pé no balcão com o aparelho do cliente numa das
 * mãos. O topo da tela é justamente onde o polegar não alcança nessa
 * posição — então os quatro lugares que se visita o dia inteiro ficam onde
 * a mão já está. Serviços e Ajustes saíram daqui: são configuração, não
 * destino, e competiam com o que se abre vinte vezes por dia.
 */
const DESTINOS = [
  {
    href: "/dashboard",
    rotulo: "Painel",
    icone: (
      <path d="M3 10.5 12 3l9 7.5M5.5 9v11h13V9" />
    ),
  },
  {
    href: "/os",
    rotulo: "Ordens",
    icone: (
      <path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2V3ZM9 8h6M9 12h6" />
    ),
  },
  {
    href: "/clientes",
    rotulo: "Clientes",
    icone: (
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0" />
    ),
  },
  {
    href: "/financeiro",
    rotulo: "Caixa",
    icone: (
      <path d="M3 7h18v12H3zM3 7l3-4h12l3 4M12 11v4M10 13h4" />
    ),
  },
];

export function Navegacao() {
  const caminho = usePathname();

  return (
    <nav className="nao-imprimir fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper/95 backdrop-blur">
      <ul className="mx-auto flex max-w-2xl">
        {DESTINOS.map((d) => {
          const ativo =
            caminho === d.href || caminho.startsWith(`${d.href}/`);
          return (
            <li key={d.href} className="flex-1">
              <Link
                href={d.href}
                aria-current={ativo ? "page" : undefined}
                className={`flex h-16 flex-col items-center justify-center gap-1 ${
                  ativo ? "text-cyan-deep" : "text-mute"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={ativo ? 2 : 1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-6"
                  aria-hidden
                >
                  {d.icone}
                </svg>
                <span
                  className={`text-[11px] ${ativo ? "font-semibold" : "font-medium"}`}
                >
                  {d.rotulo}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
