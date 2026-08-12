"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";
import { entrar, type EstadoLogin } from "./actions";

const INICIAL: EstadoLogin = { erro: null };

function Formulario() {
  const params = useSearchParams();
  const proxima = params.get("proxima") ?? "/dashboard";
  const [estado, acao, enviando] = useActionState(entrar, INICIAL);

  return (
    <form action={acao} className="flex w-full max-w-sm flex-col gap-5">
      <input type="hidden" name="proxima" value={proxima} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-mute">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-12 rounded-lg border border-line bg-white px-3 text-base text-ink outline-none focus:border-cyan-deep"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="senha" className="text-sm font-medium text-mute">
          Senha
        </label>
        <input
          id="senha"
          name="senha"
          type="password"
          autoComplete="current-password"
          required
          className="h-12 rounded-lg border border-line bg-white px-3 text-base text-ink outline-none focus:border-cyan-deep"
        />
      </div>

      {estado.erro && (
        <p role="alert" className="text-sm font-medium text-status-recusado">
          {estado.erro}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="h-12 rounded-lg bg-cyan-deep font-display text-base font-semibold text-white transition-colors hover:bg-navy disabled:opacity-60"
      >
        {enviando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-navy px-6 py-12">
      <div className="flex flex-col items-center gap-3">
        <Image
          src="/logo-mark.svg"
          alt=""
          width={64}
          height={64}
          priority
        />
        <h1 className="font-display text-2xl font-bold text-white">E&amp;S Tech</h1>
      </div>

      <div className="w-full max-w-sm rounded-xl bg-paper p-6">
        <Suspense fallback={null}>
          <Formulario />
        </Suspense>
      </div>
    </main>
  );
}
