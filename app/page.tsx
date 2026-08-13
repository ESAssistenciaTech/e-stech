import Link from "next/link";
import Image from "next/image";

/**
 * Provisório. A landing page de verdade é da Fase 2 — ver inicio.md e
 * docs/design.md. Isto aqui só evita a raiz cair na página do Next, e dá
 * caminho para quem chegar sem o link direto do comprovante.
 */
export default function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-navy px-6 text-center">
      <Image src="/logo-mark.svg" alt="" width={72} height={72} priority />
      <div>
        <h1 className="font-display text-3xl font-bold text-white">E&amp;S Tech</h1>
        <p className="mt-1 text-white/70">Assistência técnica</p>
      </div>

      <Link
        href="/acompanhar"
        className="flex h-12 items-center rounded-lg bg-cyan-deep px-6 font-display font-semibold text-white"
      >
        Acompanhar meu conserto
      </Link>

      <Link href="/login" className="text-sm font-medium text-white/60">
        Entrar
      </Link>
    </main>
  );
}
