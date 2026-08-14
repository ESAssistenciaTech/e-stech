"use client";

import { useActionState } from "react";
import Link from "next/link";
import { salvarDoador } from "./actions";
import { DOADOR_INICIAL, type Doador } from "@/lib/doador";
import { TIPOS_APARELHO, ROTULO_IDENTIFICADOR } from "@/lib/tipos";

const campo =
  "h-12 w-full rounded-lg border border-line bg-white px-3 text-base text-ink outline-none focus:border-cyan-deep";

const ROTULO_TIPO: Record<string, string> = {
  celular: "Celular",
  notebook: "Notebook",
  desktop: "Desktop",
  tablet: "Tablet",
  outro: "Outro",
};

export function FormularioDoador({
  doador,
  marcas,
}: {
  doador?: Doador;
  marcas: string[];
}) {
  const [estado, acao, enviando] = useActionState(
    salvarDoador,
    DOADOR_INICIAL,
  );

  return (
    <form action={acao} className="flex flex-col gap-4">
      {doador && <input type="hidden" name="id" value={doador.id} />}

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-mute">Modelo</span>
        <input
          name="modelo"
          required
          autoFocus={!doador}
          defaultValue={doador?.modelo ?? ""}
          placeholder="Galaxy A14"
          className={campo}
        />
        <span className="text-xs text-mute">
          É por ele que você procura quando precisar de uma peça.
        </span>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-mute">Marca</span>
        <input
          name="marca"
          list="marcas-doador"
          defaultValue={doador?.marca ?? ""}
          placeholder="Samsung"
          className={campo}
        />
        <datalist id="marcas-doador">
          {marcas.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-mute">Tipo</span>
        <select
          name="tipo"
          defaultValue={doador?.tipo ?? ""}
          className={campo}
        >
          <option value="">Não informado</option>
          {TIPOS_APARELHO.map((t) => (
            <option key={t} value={t}>
              {ROTULO_TIPO[t]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-mute">
          {doador?.tipo ? ROTULO_IDENTIFICADOR[doador.tipo] : "IMEI ou série"}
        </span>
        <input
          name="identificador"
          defaultValue={doador?.identificador ?? ""}
          className={`dado ${campo}`}
        />
        <span className="text-xs text-mute">
          Se der para ler. Aparelho que não liga normalmente não dá.
        </span>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-mute">O que já saiu</span>
        <textarea
          name="anotacoes"
          rows={3}
          defaultValue={doador?.anotacoes ?? ""}
          placeholder="tela já saiu, placa boa, sem bateria"
          className="w-full rounded-lg border border-line bg-white p-3 text-base text-ink outline-none focus:border-cyan-deep"
        />
        <span className="text-xs text-mute">
          Texto livre, atualizado quando você arrancar algo. É o que evita a
          viagem até a gaveta.
        </span>
      </label>

      <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-line bg-white px-3">
        <input
          type="checkbox"
          name="esgotado"
          defaultChecked={doador?.esgotado ?? false}
          className="size-5 accent-cyan-deep"
        />
        <span className="text-sm">
          <span className="font-medium text-ink">Esgotado</span>
          <span className="block text-xs text-mute">
            Não sobrou nada que preste. Some da busca sem sumir do sistema.
          </span>
        </span>
      </label>

      {estado.erro && (
        <p role="alert" className="text-sm font-medium text-status-recusado">
          {estado.erro}
        </p>
      )}

      <div className="flex gap-2">
        <Link
          href="/doadores"
          className="flex h-12 flex-1 items-center justify-center rounded-lg border border-line font-medium text-mute"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={enviando}
          className="h-12 flex-[2] rounded-lg bg-cyan-deep font-display font-semibold text-white hover:bg-navy disabled:opacity-60"
        >
          {enviando ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </form>
  );
}
