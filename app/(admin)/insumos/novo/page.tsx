import { FormularioInsumo } from "../formulario";

export default function NovoInsumoPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="font-display text-2xl font-bold text-navy">
        Novo insumo
      </h1>
      <p className="-mt-3 text-sm text-mute">
        O que a loja compra em quantidade e vai gastando — película, cola,
        bateria genérica. Peça de conserto que você não tem em casa vive em
        Peças, não aqui.
      </p>

      <FormularioInsumo />
    </div>
  );
}
