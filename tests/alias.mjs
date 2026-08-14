/**
 * Resolve o alias `@/` do tsconfig para o Node.
 *
 * O Node não lê `paths` do tsconfig — quem resolve isso normalmente é o
 * bundler do Next, que não está em jogo aqui. Sem este gancho, todo módulo
 * que importa `@/lib/...` fica fora do alcance do teste, e são justamente
 * os módulos maiores.
 *
 * É `.mjs` de propósito: o `include` do tsconfig pega `.ts`, `.tsx` e
 * `.mts`, então um arquivo `.mjs` não entra na checagem de tipos do build.
 * Isto é encanamento do runner, não código do sistema, e não deve custar
 * uma dependência de tipos a mais no projeto.
 */
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const RAIZ = new URL("../", import.meta.url);

registerHooks({
  resolve(especificador, contexto, proximo) {
    if (!especificador.startsWith("@/")) {
      return proximo(especificador, contexto);
    }

    const caminho = especificador.slice(2);
    // O import do TypeScript vem sem extensão; o Node exige uma.
    const candidatos = [caminho, `${caminho}.ts`, `${caminho}.tsx`];

    for (const candidato of candidatos) {
      const url = new URL(candidato, RAIZ);
      if (existsSync(fileURLToPath(url))) {
        return proximo(url.href, contexto);
      }
    }

    return proximo(especificador, contexto);
  },
});
