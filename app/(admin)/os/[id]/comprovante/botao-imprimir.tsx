"use client";

export function BotaoImprimir() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="h-12 flex-2 rounded-lg bg-cyan-deep px-6 font-display font-semibold text-white hover:bg-navy"
    >
      Imprimir
    </button>
  );
}
