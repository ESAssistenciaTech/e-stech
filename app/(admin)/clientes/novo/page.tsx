import Link from "next/link";
import { FormularioCliente } from "../formulario";

export default function NovoClientePage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link href="/clientes" className="text-sm font-medium text-cyan-deep">
        ← Clientes
      </Link>
      <h1 className="font-display text-2xl font-bold text-navy">
        Novo cliente
      </h1>
      <FormularioCliente />
    </div>
  );
}
