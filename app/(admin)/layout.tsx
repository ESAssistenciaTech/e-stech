import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sair } from "../(auth)/login/actions";

// Só o que existe: link para rota inexistente é 404 na cara do usuário.
const NAV = [
  { href: "/dashboard", rotulo: "Painel" },
  { href: "/os", rotulo: "Ordens" },
  { href: "/clientes", rotulo: "Clientes" },
  { href: "/financeiro", rotulo: "Caixa" },
  { href: "/servicos", rotulo: "Serviços" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // O middleware já barra quem não tem sessão. Esta checagem é a segunda
  // camada: nenhuma tela administrativa deve depender só do middleware.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-navy px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image src="/logo-mark.svg" alt="" width={32} height={32} />
          <span className="font-display text-base font-bold text-white">
            E&amp;S Tech
          </span>
        </Link>

        <form action={sair} className="ml-auto">
          <button
            type="submit"
            className="rounded px-2 py-1 text-sm text-white/70 hover:text-white"
          >
            Sair
          </button>
        </form>
      </header>

      <nav className="sticky top-[56px] z-10 flex gap-1 overflow-x-auto border-b border-line bg-paper px-2">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="shrink-0 px-3 py-3 text-sm font-medium text-mute hover:text-navy"
          >
            {item.rotulo}
          </Link>
        ))}
      </nav>

      <main className="flex-1 px-4 py-5">{children}</main>
    </div>
  );
}
