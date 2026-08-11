# Direção visual — E&S Tech

Governa todas as telas. Antes de criar qualquer interface, ler este arquivo.

## O problema de design

Duas superfícies com públicos opostos, e uma restrição que atravessa as duas.

**Área administrativa.** O dono, em pé no balcão, uma mão segurando o aparelho do
cliente e a outra no celular. Com pressa, às vezes com cliente esperando na frente.
Toda decisão de interface responde a isso: alvo grande, ação principal ao alcance do
polegar, status legível de longe.

**Landing page.** Um estranho que veio da bio do Instagram, no celular, decidindo se
entrega um aparelho de R$3.000 pra alguém que ele não conhece. E a loja **não tem
reputação ainda** — nem avaliação, nem portfólio, nem "mais de 500 consertos".

É daí que sai a tese: **sem reputação pra mostrar, o que vende é método visível.**
O design não fala que a loja é organizada — ele *é* organizado, e o visitante conclui
sozinho. Ordem como argumento de venda.

## De onde vem o vocabulário

**A cor vem da marca.** O logo da E&S Tech já existe e já circula no Instagram —
navy profundo, anel ciano, traços de placa de circuito. A paleta do sistema deriva
dele, não de uma direção inventada por fora. Coerência com o que o cliente já viu
vale mais que preferência de designer.

**A estrutura vem da bancada real**, não do imaginário genérico de "tecnologia":

- A **bandeja de parafusos** — compartimentos rotulados onde cada peça tem seu lugar, senão o aparelho não fecha
- A **etiqueta de serviço** presa no aparelho na entrada — o artefato que transforma "um celular na gaveta" em "a OS 47"

## Tokens

### Cor

Extraídos do logo:

| Nome | Hex | Papel |
|---|---|---|
| `navy` | `#16304F` | Navy do logo. Chrome admin, cabeçalhos, texto forte |
| `navy-soft` | `#1E4468` | Superfícies escuras, cartões sobre navy |
| `cyan` | `#45C8D4` | Ciano do anel. **Acento da marca** — ação principal, foco, identidade |
| `cyan-deep` | `#1B8B99` | Ciano legível como texto sobre claro (o ciano puro não passa em contraste) |
| `paper` | `#F4F6F7` | Fundo. Cinza frio, da família do ciano — não é creme |
| `ink` | `#12222E` | Texto |
| `mute` | `#64757F` | Texto secundário, rótulos, estados inativos |
| `line` | `#DDE3E6` | Divisórias, bordas de compartimento |

Um acento só: **ciano**. É onde se clica.

O âmbar `#E9A13B` existe, mas **não é acento de estilo — é sinal funcional**, reservado
a uma coisa só: *esperando decisão ou dinheiro do cliente*. Aparece no status
`orcamento_enviado` e no bloco "A receber". Como faz um trabalho diferente do ciano,
os dois não competem; se o âmbar começar a aparecer em botão ou enfeite, ele perde
esse significado e vira mais uma cor.

**Status da OS** é função, não decoração — sempre cor **mais** texto, nunca só cor:

| Status | Hex |
|---|---|
| `aguardando_analise`, `em_analise` | `#64757F` |
| `orcamento_enviado` | `#E9A13B` |
| `aprovado` | `#2C6E9B` |
| `em_conserto` | `#1B8B99` |
| `pronto` | `#2E9E6B` |
| `entregue` | `#9AA5AB` |
| `recusado`, `cancelado` | `#C0492F` |

### O logo na prática

O logo cheio é ilustrado e detalhado: dois personagens, traços de circuito, tipografia
cromada. Funciona **grande** — hero da landing, cabeçalho do PDF, papelaria.

Não funciona pequeno. A 32px de favicon ou na barra do admin, os rostos e os traços
viram borrão. Isso pede uma **marca reduzida** — o monograma `E&S` sobre o círculo
navy com o anel ciano, sem os personagens. Mesma identidade, legível a qualquer
tamanho. Enquanto ela não existir, o admin usa só o texto "E&S Tech" em Archivo.

### Tipografia

Três faces, cada uma com um trabalho claro:

- **Archivo** — display. Grotesca de sinalização, robusta, com peso. Nos pesos pesados e na versão expandida ela tem qualidade de placa gravada. Vem da Omnibus-Type, fundição argentina: tipo latino-americano para um negócio latino-americano, não é enfeite de argumento.
- **IBM Plex Sans** — corpo. Desenhada para legibilidade técnica, aguenta tamanho pequeno em tela de celular sob pressa.
- **IBM Plex Mono** — dados. Código da OS, IMEI, número de série, dinheiro, datas.

O mono não é estilo: **número é dado, e dado quer largura fixa.** Alinha em coluna,
não confunde 0 com O, e faz um código de OS parecer o que ele é — um identificador,
não uma palavra.

Escala (mobile primeiro): 12 · 14 · 16 · 20 · 28 · 40 · 56.
Corpo a 16px é o piso — abaixo disso não se lê em pé, com pressa, no balcão.

### Layout

**A bandeja.** Compartimentos com borda visível, cada coisa no seu lugar. Na landing,
as seções são compartimentos. No admin, cada OS é um compartimento.

Não é decoração: no admin a compartimentação **é** o que deixa a lista escaneável de
relance, e na landing **é** o argumento de método que substitui a reputação ausente.

Alvo de toque mínimo 48px. Ação principal na metade inferior da tela — é onde o
polegar chega quando a outra mão está ocupada.

## Elemento-assinatura: a etiqueta de serviço

O único elemento memorável, e ele é honesto: **é literalmente o que a loja produz.**
Quando alguém deixa um aparelho, o que recebe de volta é isto.

```
        ╭───◯───────────────────╮
        │  E&S TECH             │
        │                       │
        │  4K7-92X              │  ← código público, mono, em blocos
        │  ─────────────────    │
        │  Galaxy A14           │
        │  entrada 11 ago       │
        │                       │
        │ ▓▓ EM CONSERTO        │  ← faixa de status, cor + texto
        ╰───────────────────────╯
```

O entalhe no topo é afordância real de etiqueta — é por ali que ela prende no aparelho.

A mesma etiqueta aparece em **toda** superfície, e em cada uma ela faz um trabalho
diferente:

| Onde | O que ela faz |
|---|---|
| Landing | Objeto do hero. Diz "seu aparelho ganha identidade aqui" sem se gabar |
| Lista de OS (admin) | Cartão da lista. A faixa de status colorida é o que torna a lista escaneável |
| Portal público | É a página inteira. O cliente digita o código e recebe a etiqueta dele |
| PDF | Impressa, com o QR do portal |

Um artefato, quatro superfícies. É isso que dá unidade ao sistema — não um logo repetido.

## Movimento

Um momento orquestrado, e só: na abertura da landing, a etiqueta cai e assenta com uma
leve rotação, como um objeto largado na bancada. Nada mais.

Sem revelação no scroll, sem efeito espalhado — animação demais é justamente o que faz
uma página parecer gerada por IA. No admin, movimento só como resposta a ação: salvou,
mudou status, apagou.

`prefers-reduced-motion` respeitado em tudo.

## Texto de interface

- Voz ativa, e o nome da ação não muda no meio do caminho: o botão diz "Avisar cliente", o aviso de sucesso diz "Cliente avisado".
- Nomear pelo que a pessoa reconhece, não pelo que o sistema faz por dentro: "Serviços", não "Tipos de serviço cadastrados".
- Erro não pede desculpa e não é vago — diz o que aconteceu e como resolver.
- Tela vazia é convite pra agir, não lamento: "Nenhuma OS aberta. Criar a primeira."
- Caixa alta só na faixa de status e nos rótulos de dado. Em título é ruído.

## Piso de qualidade

Não se anuncia, mas não se negocia: responsivo até 360px de largura, foco de teclado
visível, `prefers-reduced-motion` respeitado, contraste AA em todo texto, e status
nunca comunicado só por cor — sempre cor **mais** texto.
