import Link from "next/link";
import { FormularioFornecedor } from "../formulario";

export default function NovoFornecedorPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link href="/fornecedores" className="text-sm font-medium text-cyan-deep">
        ← Fornecedores
      </Link>
      <h1 className="font-display text-2xl font-bold text-navy">
        Novo fornecedor
      </h1>
      <FormularioFornecedor />
    </div>
  );
}
