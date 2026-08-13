import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navegacao } from "@/components/navegacao";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // O proxy já barra quem não tem sessão. Esta checagem é a segunda camada:
  // nenhuma tela administrativa deve depender só dele.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="nao-imprimir flex items-center gap-2 bg-navy px-4 py-2.5">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image src="/logo-mark.svg" alt="" width={26} height={26} />
          <span className="font-display text-sm font-bold tracking-tight text-white">
            E&amp;S Tech
          </span>
        </Link>

        <Link
          href="/configuracoes"
          aria-label="Ajustes"
          className="ml-auto flex size-10 items-center justify-center rounded-lg text-white/70 hover:text-white"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-5"
            aria-hidden
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1" />
          </svg>
        </Link>
      </header>

      {/* pb-20 abre espaço pra barra de navegação fixa embaixo. */}
      <main className="flex-1 px-4 pb-20 pt-5">{children}</main>

      <Navegacao />
    </div>
  );
}
