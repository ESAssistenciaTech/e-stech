"use client";

import { useActionState, useState } from "react";
import { STATUS, STATUS_OS, type StatusOS } from "@/lib/tipos";
import { mudarStatus, type EstadoStatus } from "./actions";

const INICIAL: EstadoStatus = { erro: null };

export function SeletorStatus({
  id,
  atual,
}: {
  id: string;
  atual: StatusOS;
}) {
  const [estado, acao, enviando] = useActionState(mudarStatus, INICIAL);
  const [escolhido, setEscolhido] = useState<StatusOS>(atual);

  return (
    <form action={acao} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={id} />

      <label className="text-sm font-medium text-mute" htmlFor="status">
        Status
      </label>
      <select
        id="status"
        name="status"
        value={escolhido}
        onChange={(e) => setEscolhido(e.target.value as StatusOS)}
        className="h-12 w-full rounded-lg border border-line bg-white px-3 text-base outline-none focus:border-cyan-deep"
      >
        {STATUS_OS.map((s) => (
          <option key={s} value={s}>
            {STATUS[s].rotulo}
          </option>
        ))}
      </select>

      {escolhido === "cancelado" && (
        <textarea
          name="motivo_cancelamento"
          rows={2}
          placeholder="Por que está sendo cancelada?"
          className="w-full rounded-lg border border-line bg-white p-3 text-base outline-none focus:border-cyan-deep"
        />
      )}

      {estado.erro && (
        <p role="alert" className="text-sm font-medium text-status-recusado">
          {estado.erro}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando || escolhido === atual}
        className="h-12 rounded-lg bg-cyan-deep font-display font-semibold text-white hover:bg-navy disabled:opacity-40"
      >
        {enviando ? "Salvando…" : "Mudar status"}
      </button>
    </form>
  );
}
