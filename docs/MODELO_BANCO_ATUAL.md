# Modelo atual do banco — E-Threads

Modelo consolidado em `backend/database/schema.sql`, compatível com o sistema nesta entrega. Tarefa relacionada à infraestrutura/modelagem T02 e às integrações já autorizadas.

## Banco existente

Em 15/11/2026, o banco local `ethreads_db` (MySQL 8.4.8) já contém as 11 tabelas e os campos necessários. Não foi necessário executar ALTER TABLE nesta verificação. Nenhum registro foi modificado ou removido.

Inclui:

- Colaboradores, fotos, conta ativada, perfis e tokens de ativação/redefinição.
- Clientes e estoque com `ativo` para inativação e reativação.
- Materiais com variações de cor, catálogo e imagens de estoque.
- Pedidos, itens, tamanhos e histórico de movimentações.
- Solicitações com exatamente um alvo: pedido, estoque, cliente ou colaborador. Justificativa e indicação de reativação ficam em `dados_propostos`.
- Relatórios usam consultas às tabelas existentes. Notificações temporárias usam armazenamento local do navegador, sem tabela adicional.

Não execute o schema completo sobre esse banco: ele é destinado à instalação em banco vazio. A migração `backend/database/migracao_solicitacoes_clientes.sql` já foi aplicada localmente; não deve ser reaplicada. Em outra instalação anterior, verifique primeiro se `solicitacoes.cliente_id` e suas restrições já existem.

## Instalação nova

1. Configure o banco desejado em `backend/.env`, conforme `.env.example`.
2. Em banco vazio, execute `backend/database/schema.sql` no MySQL Workbench. Ajuste o nome no SQL se não utilizar `ethreads_db`.
3. Crie o administrador usando o script indicado ao final do schema.

O schema não inclui usuários, senhas nem registros de demonstração. O comando de apagar o banco foi removido. Tabelas existentes geram erro de criação: não é um atualizador automático de estruturas antigas.

## Evidências de compatibilidade

- Comparadas as 11 tabelas do MySQL com o schema: nomes e conjuntos de colunas, tipos, nulabilidade, presença dos índices nomeados, chaves estrangeiras e CHECKs.
- Retorno HTTP 200 usando o banco real: sessão, perfil, clientes, colaboradores, estoque ativo/inativo, pedidos, solicitações, catálogo de produtos e os dois endpoints de relatórios (11 consultas).
- Verificação somente de leitura, sem novos testes de escrita nesta etapa. Não equivale à validação de todos os fluxos do sistema.
- Resultado local detalhado: `.tmp/validacao_modelo_banco.json`.

O documento de acompanhamento de requisitos não foi alterado; nenhum requisito foi marcado como concluído.
