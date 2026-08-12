-- Correção de segurança na view ordens_servico_totais.
--
-- Por padrão o Postgres cria view com security_invoker = false, o que faz
-- ela rodar com o privilégio do DONO da view, não de quem consulta. Na
-- prática isso ignora o RLS das tabelas de baixo: um visitante anônimo
-- leria valor, custo e lucro de toda OS pela view, mesmo sem conseguir ler
-- a tabela ordens_servico direto.
--
-- Com security_invoker = on a view passa a rodar com o privilégio de quem
-- chama, e o RLS volta a valer.

alter view ordens_servico_totais set (security_invoker = on);

-- Regra geral pro projeto: toda view criada daqui pra frente nasce com
-- security_invoker = on. View não é uma forma de contornar RLS.
