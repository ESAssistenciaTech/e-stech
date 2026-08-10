---
status: accepted
---

# Portal público usa código curto, não o número sequencial da OS

A rota pública `/acompanhar/[x]` originalmente usaria o `numero` sequencial da OS. Isso é enumerável: alguém digitando outros números em sequência veria status de outros clientes — os dados expostos ali são baixa sensibilidade (status, marca/modelo), mas ainda é exposição de volume de negócio e dados de terceiros sem necessidade.

Decidido gerar um `codigo_publico` curto e não sequencial por OS, usado só na rota pública e distribuído ao cliente via QR code impresso na OS/termo de garantia. O `numero` sequencial continua existindo e sendo usado, mas só na área admin.

## Considered Options
- Aceitar o risco do número sequencial (descartado — dado de baixo custo pra resolver direito).
- Código curto não sequencial + QR code (escolhido).
