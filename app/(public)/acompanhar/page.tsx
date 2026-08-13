import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function buscar(form: FormData) {
  "use server";
  const codigo = String(form.get("codigo") ?? "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();
  if (codigo.length !== 6) redirect("/acompanhar?erro=formato");
  redirect(`/acompanhar/${codigo}`);
}

export default async function AcompanharPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;

  const supabase = await createClient();
  const { data: loja } = await supabase
    .from("dados_loja")
    .select("nome")
    .eq("singleton", true)
    .maybeSingle();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-navy px-6 py-12">
      <div className="flex flex-col items-center gap-3">
        <Image src="/logo-mark.svg" alt="" width={56} height={56} priority />
        <h1 className="font-display text-xl font-bold text-white">
          {loja?.nome ?? "E&S Tech"}
        </h1>
      </div>

      <form
        action={buscar}
        className="flex w-full max-w-sm flex-col gap-4 rounded-xl bg-paper p-6"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="codigo" className="font-display text-lg font-semibold text-navy">
            Acompanhe seu conserto
          </label>
          <p className="text-sm text-mute">
            Digite o código que está no seu comprovante.
          </p>
        </div>

        <input
          id="codigo"
          name="codigo"
          required
          autoFocus
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          placeholder="4K7-92X"
          className="dado h-16 rounded-lg border border-line bg-white px-4 text-center text-2xl font-semibold uppercase tracking-widest text-navy outline-none focus:border-cyan-deep"
        />

        {erro === "formato" && (
          <p role="alert" className="text-sm font-medium text-status-recusado">
            O código tem 6 caracteres, como 4K7-92X.
          </p>
        )}

        <button
          type="submit"
          className="h-12 rounded-lg bg-cyan-deep font-display font-semibold text-white hover:bg-navy"
        >
          Ver situação
        </button>
      </form>
    </main>
  );
}
