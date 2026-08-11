---
status: accepted
---

# Stack: Next.js na Vercel (front e back), Supabase e Cloudinary

Custo zero é restrição dura do projeto. Comparando os planos gratuitos: MongoDB Atlas 512 MB contra Supabase 500 MB (equivalentes), e Cloudinary 25 créditos/mês contra 1 GB do Supabase Storage — Cloudinary ganha de longe para imagem.

Decidido: **Next.js hospedado na Vercel servindo front e back**, **Supabase** como banco, autenticação e autorização, e **Cloudinary** para as fotos, guardando apenas a URL no banco.

Não existe backend separado. Route handlers e server actions do Next *são* o backend, o que elimina o Render, o cold start de aproximadamente um minuto e o robô de ping que existiria só para manter um serviço acordado dentro do orçamento de 750 horas mensais.

## Considered Options

MongoDB chegou a ser escolhido — é o banco que o dono domina, e o custo seria igual. Foi revertido ao ficar claro o que se perderia junto: o Supabase entrega **autenticação e Row Level Security prontos**, e sem ele os dois viram trabalho próprio. Autenticação exigiria Auth.js configurado do zero, e a autorização passaria a depender inteiramente da disciplina da aplicação, sem rede de proteção no banco.

O encaixe também pesou: as consultas centrais do sistema são todas junção e agregação — saldo da OS, total a receber, lucro por serviço, última cotação por fornecedor — que em Postgres são uma query e no MongoDB seriam *aggregation pipelines*. E em ambiente serverless o acesso por HTTP do Supabase evita o problema de pool de conexões que o driver do Mongo enfrenta com o limite de 500 conexões do plano gratuito.

Storage do Supabase não é usado: 1 GB acabaria em poucas dezenas de OS com fotos, enquanto os 25 créditos do Cloudinary suportam mais de dez mil.

## Consequences

- O portal público é protegido em duas camadas: Row Level Security no banco e uma função dedicada que monta o objeto público campo a campo. A rota pública nunca acessa a tabela direto, e nada de espalhar o registro inteiro (`{...os}`) no caminho público — a OS carrega senha do aparelho, custo de peça e valores no mesmo registro que o status.
- WebSocket não entra no projeto. A Vercel tem suporte nativo em beta desde junho de 2026, com teto de 5 minutos e sem fan-out, mas nada no domínio exige tempo real — o portal público atualiza por recarga de página.
- Duas contas gratuitas para administrar (Supabase e Cloudinary), além da Vercel.
