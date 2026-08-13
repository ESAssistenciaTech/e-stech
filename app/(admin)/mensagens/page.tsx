import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { ModeloMensagem } from "@/lib/mensagem";
import { FormularioMensagens } from "./formulario";

export default async function MensagensPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("modelos_mensagem")
    .select("id, situacao, texto");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link
        href="/configuracoes"
        className="text-sm font-medium text-cyan-deep"
      >
        ← Ajustes
      </Link>
      <div>
        <h1 className="font-display text-2xl font-bold text-navy">
          Mensagens do WhatsApp
        </h1>
        <p className="text-sm text-mute">
          O texto que abre pronto quando você avisa o cliente pela OS.
        </p>
      </div>

      <FormularioMensagens modelos={(data ?? []) as ModeloMensagem[]} />
    </div>
  );
}
