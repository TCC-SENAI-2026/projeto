# E-Threads — Acompanhamento de Requisitos e Tarefas para o Codex

> Referência oficial dos requisitos: `requisitos.txt` (numeração já organizada em tabelas, com repetições e ausências preservadas como no original — nada foi renumerado, reescrito ou reclassificado aqui). Arquitetura de referência: `docs/ARQUITETURA_TCC.md`. Nenhum requisito deve ser marcado como `[x]` sem evidência de teste e validação.

## 1. Status dos requisitos

Cliente: Senai
Responsável: João Rocha, Camily, Gabrielly, Nicole e Vanessa

### Autenticação e Acesso

| Nº | Descrição original | Tipo | Status |
|---|---|---|---|
| 1 | O sistema deve permitir que o usuário efetue a autenticação de forma segura, inserindo seus dados de acesso, incluindo o código de verificação (RE) e a senha. | RN | [ ] |
| 2 | Após a autenticação do funcionário, o sistema deve direcioná-lo automaticamente para a tela principal do sistema. | RN | [ ] |
| 3 | Depois da autenticação do colaborador, o colaborador terá acesso apenas as telas de: Inicio, pedido, estoque e clientes. | RN | [ ] |
| 4 | Funcionario ele também poderá fazer logout para finalizar a sessão. | RN | [ ] |
| 5 | Em todos as telas, haverá um guia de pesquisa que permitirá ao funcionário localizar pedidos pelo número e nome. | RN | [ ] |
| 6 | Todos os setores devem permitir ordenação de pedidos por nome, data ou filtros adicionais disponíveis. | RN | [ ] |
| 7 | O sistema deve carregar telas e pedidos instantâneamente para o usuário. | RN | [ ] |
| 9 | A interface deve ser totalmente responsivas para computadores, tablets e celulares. | RN | [ ] |

### Tela de Inicio

| Nº | Descrição original | Tipo | Status |
|---|---|---|---|
| 10 | Na tela de inicio terá 3 cards: Pedidos Pendentes, Total em Estoque e Estoque baixo | RF | [ ] |
| 11 | Quando a pessoa clicar em um desses cards, o sistema irá fazer um redirecionamentoda tela, seja para lista de pedidos ou estoque baixo. | RF | [ ] |
| 12 | Terá um card de Pedidos Recentes aonde o próprio sistema ele irá filtrar todos os pedidos que foram criados recentemente, junto com os status se o pedido está pendente ou em produção. | RN | [ ] |
| 13 | Na tela de inicio terá um último card aonde o sistema irá mostrar todos os itens relevante do estoque: Tipos de camisas,os tipo do técido e botões | RNF | [ ] |

### Tela de Pedidos

| Nº | Descrição original | Tipo | Status |
|---|---|---|---|
| 10 | Na tela de Pedidos terá um dropdown de duas telas: uma de Criar novo pedido e outra de Lista  de Pedidos. | RF | [ ] |
| 11 | Na tela de Criar novo Pedido terá um formulário aonde o funcionario irá preencher os dados do pedido dos clientes e depois irá ser redirecionado para a tela de  selecionar produtos. | RF | [ ] |

### Tela de Pedidos/Selecionar Produtos

| Nº | Descrição original | Tipo | Status |
|---|---|---|---|
| 12 | Nessa tela terá cards para o funcionário colocar o tipo do produto ex: camisetas e  calças etc. Nesses cards terá a opçãos de personalização, tecidos, cor, local da arte e um campo de observação do item em caso de excessões do produto. | RF | [ ] |
| 13 | Depois de selecionar o produto o card irá atualizar e ter um campo para o funcionário  a quantidade da roupa e para o upload de imagens como logo, nome etc... | RF | [ ] |
| 14 | Ao finalizar a tela de selecionar os produtos, o sistema irá mostrar uma nova tela  aonde será a ficha técnica, contendo todos os dados preenchidos pelo proprio funci- onário para analizar as informações ditas pelo cliente e clicar em um botão para finali- zar. Após o clique, aparecera um modal dizendo que o pedido já foi enviado para a fila de produção. Esse pedido será enviado para a tela de lista de pedidos automaticamente. | RF | [ ] |

### Tela de Pedidos/Lista de Pedidos

| Nº | Descrição original | Tipo | Status |
|---|---|---|---|
| 15 | Nessa tela na parte superior terá uma barra de pesquisa aonde poderá filtrar o  pedido pelo nome do cliente e pelo número do card, irá ter também um select para  buscar pedidos pendentes,finalizados e em produção, e por ultimo um botão para criar um novo pedido. | RF | [ ] |
| 16 | Em baixo desse terá os pedidos que já foram criados e em cada card terá um  número(1,2), nome da empresa ou cliente, status do pedido e dois botão para editar ou remover | RF | [ ] |
| 17 | Se o funcionário clicar em um desses pedidos, irá aparecer um modal mostrando a ficha técnica desse pedido que foi criado na tela anterior | RF | [ ] |
| 18 | quando o funcionário clicar no botão de editar, aparecerá um modal da ficha para que ele possa fazer as alterações, se ele clicar em qualquer campo, esse campo que foi selecionado, ele irá ficar com uma opacidade baixa, e logo em seguida irá aparecer um campo abaixo para ele colocar a alteração, quando ele terminar de digitar irá aparecer um icone verde. | RF | [ ] |
| 18 | Depois do funcionário terminar as ediões, no final do modal vai ter um botão pra pedir permição ao adm,depois de apertar nessa botão, vai aparecer uma mensagem no topo da seção dizendo:solicitaçào enviada para o adm. | RF | [ ] |
| 19 | Se for clicado no botão de excluir, o pedido ele ainda não será excluido da tela de lista de pedidos até que o adm autorize essa exclusão. | RF | [ ] |

### Estoque

| Nº | Descrição original | Tipo | Status |
|---|---|---|---|
| 20 | No topo da tela o sistema irá mostrar o número total de itens cadastrados no estoque. | RNF | [ ] |
| 21 | No lado diretiro desses números, vai ter um campo de pesquisa aonde o sistema irá mostrar o nome do produto em que o usuário for pesquisar para ver as quantidades disponíveis. | RNF | [ ] |
| 22 | Logo abaixo desses cards, o sitema terá 3 botões de filtros: Estoque de Produtos(aonde irá mostrar somente os estoques de produtos), Estoque de Materiais(Somente estoque dos materiais cadastrados) e movimentação(terá informações de entrada e saída de materiais). | RF | [ ] |
| 23 | Cada card que aparecer do material/produto, vai ter informações do nome do item,categoria,quantidade,status(disponivel,baixo,indisponivel) e dois botão de editar e excluir item | RF | [ ] |
| 24 | se o funcionario clicar em editar, irá aparecer a mesma tela de quando a gente vai adicionar Pedidos, mas com todas as informações preenchidas do item selecionado.No final desse modal vai ter dois botões: de movimentação(caso aconteceu alguma falha na empresa ou perca) e um botao de salvar as alterações | RF | [ ] |
| 25 | se o funcionário clicar em excluir, o sistema deve retornar uma mensagem pra confirmar essa ação, e depois de confirmado, automaticamente o sistema irá enviar uma solicitação para que o adm possa confirmar essa exclução do item. Depois que o adm permitir o sistema automaticamente irá excluir esse item do front e do banco. | RNF | [ ] |
| 26 | No botão de adicionar item, terá dois cards aonde, aonde a pessoa pode adicionar produtos(peças de roupas/uniformes) e a outra de Material(Tecidos). Embaixo deles, terá um formúlario aonde poderá colocar informações sobre o item escolhido como: nome do item, Unidade de medida e o fornecedor. Embaixo terá as opções  para colocar a quantidade, estoque mínimo,valor unitário e observações gerais. e no final de tudo um botão para cadastrar item | RF | [ ] |

### Clientes

| Nº | Descrição original | Tipo | Status |
|---|---|---|---|
| 26 | Na parte superior terá o número total de clientes cadastrado no sistema. Um campo para pesquisar o nome do cliente e um filtro aonde o usuário poderá filtrar por clientes ativos e inativos | RF | [ ] |
| 27 | Na seção de baixo, irá ter todos os clientes cadastrados no sistema. | RF | [ ] |
| 28 | quando a pesso clica no card de cada cliente, automaticamente  a tela irá levaro o colaborador para a tela de formulario do cliente em  que ele selecionou, e lá ele  podera alterar o status para ativo/inativo ou criar um  novo pedido para aquele cliente específico | RF | [ ] |

### Tela de Colaboradores

#### Autenticação

| Nº | Descrição original | Tipo | Status |
|---|---|---|---|
| 29 | O sistema deve verificar se o adm tem o token de acesso para essa tela, caso não tenha, deve aparecer uma mensagem de acesso negado | RN | [ ] |
| 30 | O sistema deve deixar apenas os ADM ter acesso a tela de colaboradores | RN | [ ] |
| 30 | Na parte superior terá o número total de colaboradores cadastrado no sistema. Um campo para pesquisar o nome do colaborador específico. Um filtro aonde filtra por colaboradores ativos e inativos | RF | [ ] |
| 30 | Na parte de baixo, haverá todos os calaboradores com suas  informações(nome,usuário,status,re,email) | RF | [ ] |
| 31 | Nessa tela o adm poderá cadastrar colaboradores ou ADM. Após ter preenchido as informações, o sistema irá salvar automaticamente  no banco de dados. | RNF | [ ] |
| 32 | Nessa tela, o sistema deve receber as solicitações que os colaboradores enviaram para o adm permitir edições ou exclusão dos pedidos e estoque, para que o ADM possa ter o controle total do sistema | RNF | [ ] |

### Tela Relatorios

| Nº | Descrição original | Tipo | Status |
|---|---|---|---|
| 27 | Nessa tela  terá todas as estatísticas do mês do sistema como: número total de produção, Pedidos Concluídos,Itens em Estoque Baixo e Pedidos Pendentes. | RF | [ ] |
| 22 | Vai ter um gráfico aonde será exibido a produção de cada mês | RF | [ ] |
| 23 | Em baixo do gráfico, irá ter um status em formato de gráfico de Pedidos pendentes,Produção e concluídos | RF | [ ] |

### Setor Administrativo

| Nº | Descrição original | Tipo | Status |
|---|---|---|---|
| 30 | O setor de ADM deve conter três campos: Controle de Funcionários, Catálogo e Histórico de Pedidos. | RN | [ ] |
| 31 | O administrador deve visualizar todos os funcionários e seus respectivos setores. | RF | [ ] |
| 32 | O administrador deve poder adicionar, atualizar e inativar funcionários. | RNF | [ ] |
| 32 | Deve haver barra de pesquisa para buscar por nome ou RE. | RF | [ ] |
| 33 |  Deve existir ícone de ordenação por ordem alfabética (A–Z) e por cargo. | RF | [ ] |

### Catálogo Administrativo

| Nº | Descrição original | Tipo | Status |
|---|---|---|---|
| 34 |  O administrador deve selecionar um cliente para visualizar padrões e fichas técnicas das roupas. | RF | [ ] |
| 35 | O administrador deve adicionar, atualizar e inativar itens do catálogo:produtos,tecidos e etc, tudo que está na tela de pedidos | RNF | [ ] |

### Histórico do Pedido

| Nº | Descrição original | Tipo | Status |
|---|---|---|---|
| 36 | O administrador deve visualizar os clientes e quando clicar neles, deve aparecer as fichas técnicas de cada pedido. | RF | [ ] |
| 37 | Deve ser possível pesquisar pedidos pela barra de pesquisa. | RF | [ ] |
| 38 | Deve ser possível ordenar pedidos por cliente. | RF | [ ] |

Total de requisitos registrados: **52** linhas (contando cada ocorrência, inclusive números repetidos: 10, 18, 22, 23, 26, 27, 30, 32 aparecem mais de uma vez com conteúdos distintos; não existe nº 8). Todos permanecem `[ ]` até implementação, teste e validação.

## 2. Planejamento técnico para o Codex

Todas as tarefas abaixo aguardam autorização individual para execução — nenhuma está liberada automaticamente. Ordem definida pela dependência técnica (infraestrutura e banco primeiro). Toda tarefa deve seguir `docs/ARQUITETURA_TCC.md` como referência de desenho.

---

### T01 — Infraestrutura do backend ⭐ (primeira tarefa recomendada)

1. **Requisitos relacionados:** base para todos (nenhum requisito funcional isolado; viabiliza 1, 29, 30).
2. **Objetivo:** criar a base de configuração e conexão que todas as demais tarefas vão usar.
3. **Arquivos:** `backend/requirements.txt` (novo), `backend/.env.example` (novo), `backend/config.py` (novo), `backend/database/connection.py` (novo).
4. **Instruções técnicas:** listar dependências reais (`flask`, `flask-cors`, `mysql-connector-python`, `python-dotenv`, `werkzeug`); `config.py` lê `SECRET_KEY`, `DB_HOST/USER/PASSWORD/NAME`, `SMTP_*` via `python-dotenv`; `connection.py` cria um pool (`mysql.connector.pooling.MySQLConnectionPool`) e expõe uma função que devolve cursor com `dictionary=True`. O teste de conectividade usa `SELECT 1` (não depende de nenhuma tabela, já que o schema só é criado em T02).
5. **Fluxo esperado:** nenhuma chamada HTTP ainda — é infraestrutura consumida pelas tarefas seguintes.
6. **Dependências:** nenhuma para escrever o código. A *validação* do `SELECT 1` contra um MySQL de verdade só pode ser executada quando houver uma instância MySQL provisionada e acessível (local ou do time) — isso não bloqueia a entrega do código desta tarefa, só a evidência final de que a conexão funciona.
7. **Critérios de aceitação:** `app.py` sobe sem erro lendo config do `.env`; o código do pool e do `config.py` está correto e revisável mesmo sem um MySQL rodando; quando o MySQL estiver disponível, uma rota de teste consegue abrir conexão via o pool e rodar `SELECT 1` sem exigir nenhuma tabela.
8. **Testes/evidências:** print do servidor Flask iniciando sem erro; resultado do `SELECT 1` via rota temporária de smoke test assim que o MySQL estiver preparado (anexar separadamente se a instância não existir no momento da implementação do código).

---

### T02 — Schema definitivo do banco de dados

1. **Requisitos relacionados:** base estrutural para todos os módulos.
2. **Objetivo:** criar as 10 tabelas aprovadas em `docs/ARQUITETURA_TCC.md` §2.
3. **Arquivos:** `backend/database/schema.sql` (reescrito do zero).
4. **Instruções técnicas:** implementar exatamente os campos/tipos/constraints de `ARQUITETURA_TCC.md` §2.2, incluindo os `CHECK` (confirmando antes a versão do MySQL — pendência §9 do mesmo documento) e todas as `UNIQUE`/`FOREIGN KEY` listadas. Não incluir QR Code nem campos não aprovados.
5. **Fluxo esperado:** script aplicado manualmente pelo time (fora do escopo do Codex rodar migração em produção sem autorização).
6. **Dependências:** T01 (para validar a string de conexão usada ao testar o script).
7. **Critérios de aceitação:** script executa sem erro em uma base MySQL vazia; todas as FKs e CHECKs descritos em `ARQUITETURA_TCC.md` existem de fato no banco criado.
8. **Testes/evidências:** `SHOW CREATE TABLE` de cada tabela (ou export do schema aplicado) anexado à tarefa.

---

### T03 — Autenticação por sessão Flask (login, logout, `/me`, autorização)

1. **Requisitos relacionados:** nº 1, 2, 3, 4 (seção *Autenticação e Acesso*); nº 29, 30 (seção *Tela de Colaboradores/Autenticação*).
2. **Objetivo:** login exclusivo por RE+senha com sessão `HttpOnly`, decorators de autorização aplicados a todas as rotas protegidas.
3. **Arquivos:** `backend/blueprints/login.py` (ajustar — remover aceite de e-mail), `backend/auth/decorators.py` (novo: `login_required`, `admin_required`), `backend/app.py` (configurar `SESSION_COOKIE_HTTPONLY`, `SESSION_COOKIE_SAMESITE='Lax'`, CORS restrito à origem do frontend + `supports_credentials=True`), `vite.config.js` (proxy `/api` → backend).
4. **Instruções técnicas:** login consulta `colaboradores` só por `re`; `admin_required` reconsulta `nivel_acesso`/`ativo` no banco a cada chamada (não confia em dado de sessão desatualizado); `/me` retorna dados do colaborador logado a partir da sessão; `/logout` expira o cookie. **Proteção CSRF:** `SameSite=Lax` no cookie de sessão e CORS restrito à origem do frontend são proteções **complementares**, não substituem um token CSRF dedicado — implementar um token CSRF real (gerado no login/`/me`, enviado pelo frontend em um header próprio, ex. `X-CSRF-Token`) e exigido em **todo** método que altera estado (`POST`, `PUT`, `PATCH`, `DELETE`); requisições com esses métodos sem o token correto devem ser rejeitadas (403) antes de qualquer processamento de negócio.
5. **Fluxo esperado:** React → `POST /api/login` (via proxy) → Flask valida RE+senha → grava sessão e devolve o token CSRF → React guarda o token e o envia em todo `POST`/`PUT`/`PATCH`/`DELETE` subsequente.
6. **Dependências:** T01, T02 (tabela `colaboradores` precisa existir).
7. **Critérios de aceitação:** login só aceita RE; rota administrativa retorna 403 para colaborador comum e para admin desativado; logout realmente invalida a sessão (chamada seguinte retorna 401); qualquer `POST`/`PUT`/`PATCH`/`DELETE` sem o token CSRF correto é rejeitado com 403, mesmo com sessão válida; `GET` não exige token CSRF.
8. **Testes/evidências:** evidência de teste manual ou automatizado cobrindo: login válido, login com e-mail (deve falhar), acesso a rota admin por colaborador comum (403), logout seguido de chamada protegida (401), e uma chamada de escrita (`POST`/`PUT`/`PATCH`/`DELETE`) com sessão válida mas sem o token CSRF (ou com token incorreto) — deve ser bloqueada.

---

### T04 — Ativação de conta por e-mail (ajuste ao novo schema)

1. **Requisitos relacionados:** nº 31 (seção *Tela de Colaboradores/Autenticação*).
2. **Objetivo:** adaptar o fluxo de ativação já existente para usar a tabela `tokens` genérica e confirmar a geração de RE único.
3. **Arquivos:** `backend/blueprints/colaboradores.py`, `backend/resources/seguranca.py` (reaproveitado).
4. **Instruções técnicas:** ao cadastrar colaborador, gerar RE único (formato a confirmar — pendência em `ARQUITETURA_TCC.md` §9) e gravar token com `tipo='ativacao'` em `tokens` (hash, não o valor puro); manter envio de e-mail via `resources/email_service.py`.
5. **Fluxo esperado:** Admin cadastra → Flask gera RE + token → e-mail enviado → colaborador acessa link → `/definir-senha` ativa a conta.
6. **Dependências:** T02, T03.
7. **Critérios de aceitação:** RE gerado é sempre único (teste de colisão); token expira conforme definido; conta só fica utilizável após `/definir-senha`.
8. **Testes/evidências:** teste cobrindo cadastro → e-mail (ou log local, se envio real não for testado) → ativação → login bem-sucedido.

---

### T05 — Redefinição de senha

1. **Requisitos relacionados:** decorre do fluxo de autenticação (nº 1, seção *Autenticação e Acesso*); não há requisito específico de "esqueci minha senha" em `requisitos.txt`, mas é parte do módulo de autenticação aprovado em `ARQUITETURA_TCC.md` §5.
2. **Objetivo:** permitir que o usuário redefina a própria senha sem depender do admin.
3. **Arquivos:** `backend/blueprints/login.py` ou novo `backend/blueprints/senha.py`.
4. **Instruções técnicas:** `POST /solicitar-redefinicao` (e-mail) sempre retorna mensagem genérica; `POST /redefinir-senha` valida token `tipo='redefinicao'` e grava novo `senha_hash`.
5. **Fluxo esperado:** idêntico ao de ativação, usando `tokens.tipo='redefinicao'`.
6. **Dependências:** T02, T04 (reaproveita `seguranca.py`/`email_service.py`).
7. **Critérios de aceitação:** resposta não revela se o e-mail existe; token de uso único; login funciona com a nova senha.
8. **Testes/evidências:** teste cobrindo solicitação com e-mail existente/inexistente (resposta idêntica) e redefinição completa.

---

### T06 — Catálogo administrável

1. **Requisitos relacionados:** nº 35 (seção *Catálogo Administrativo*).
2. **Objetivo:** permitir que o admin gerencie produtos/tecidos/cores/locais/personalizações usados nos pedidos.
3. **Arquivos:** `backend/blueprints/catalogo.py` (novo).
4. **Instruções técnicas:** CRUD simples sobre `catalogo_itens`, protegido por `@admin_required` para escrita (leitura liberada para colaboradores, já que a tela de pedidos consome o catálogo); exclusão sempre lógica (`ativo=0`).
5. **Fluxo esperado:** Admin cadastra itens de catálogo → React (tela de Selecionar Produtos) passa a buscar as opções via API em vez do array fixo em `opcoesProduto.js`.
6. **Dependências:** T02, T03.
7. **Critérios de aceitação:** item em uso por um pedido não pode ser excluído fisicamente (constraint `ON DELETE RESTRICT` barra, e a rota deve responder com erro tratado, não 500).
8. **Testes/evidências:** teste de CRUD completo + tentativa de excluir item em uso (deve falhar de forma controlada).

---

### T07 — Módulo de Clientes (ajuste ao novo padrão de dados)

1. **Requisitos relacionados:** nº 26, 27, 28 (seção *Clientes*).
2. **Objetivo:** manter o CRUD já funcional, mas padronizar a resposta como JSON nomeado.
3. **Arquivos:** `backend/blueprints/clientes.py` (ajustar cursor para `dictionary=True`), `src/pages/Clientes.jsx` e `src/pages/FormCliente.jsx` (consumir campos nomeados em vez de índice de array) — frontend fica fora do escopo desta tarefa de backend e deve ser uma tarefa de integração à parte (ver T13).
4. **Instruções técnicas:** nenhuma mudança de schema; só a forma de retornar os dados.
5. **Fluxo esperado:** inalterado, exceto pelo formato da resposta.
6. **Dependências:** T01.
7. **Critérios de aceitação:** todas as rotas de clientes retornam objetos com chaves nomeadas (`nome`, `email`, etc.), nunca arrays posicionais.
8. **Testes/evidências:** resposta de `GET /listar-clientes` anexada, mostrando o novo formato.

---

### T08 — Módulo de Pedidos (criação, ficha técnica, listagem)

1. **Requisitos relacionados:** nº 10, 11 (seção *Tela de Pedidos*); nº 12, 13, 14 (seção *Tela de Pedidos/Selecionar Produtos*); nº 15, 16, 17 (seção *Tela de Pedidos/Lista de Pedidos*).
2. **Objetivo:** substituir o mock em `localStorage` (`pedidosService.js`) por persistência real.
3. **Arquivos:** `backend/blueprints/pedidos.py` (novo).
4. **Instruções técnicas:** `POST /pedidos` grava `pedidos`+`pedido_itens`+`pedido_item_tamanhos` em uma transação; `numero_pedido` gerado sequencialmente pelo backend; `GET /pedidos` lista com filtro `WHERE excluido_em IS NULL` e suporta busca por nome do cliente/número e filtro por `status`; `GET /pedidos/:id` retorna a ficha técnica completa (join com clientes, colaboradores, itens, tamanhos, catálogo).
5. **Fluxo esperado:** React (Novopedido → Selecionarprodutos → Fichatecnica) monta o payload completo e chama `POST /pedidos` só na confirmação final.
6. **Dependências:** T02, T03, T06 (catálogo precisa existir antes, por causa das FKs de `pedido_itens`), T07 (clientes).
7. **Critérios de aceitação:** criação é atômica (erro em qualquer parte desfaz tudo); listagem nunca mostra pedido com `excluido_em` preenchido; busca e filtro funcionam conforme nº 15.
8. **Testes/evidências:** teste de criação completa + teste de falha parcial (confirmar rollback) + teste de busca/filtro.

---

### T09 — Módulo de Solicitações (aprovação administrativa)

1. **Requisitos relacionados:** nº 18 (as duas ocorrências, seção *Tela de Pedidos/Lista de Pedidos*); nº 19 (mesma seção); nº 25 (seção *Estoque*); nº 32 (seção *Tela de Colaboradores/Autenticação*).
2. **Objetivo:** substituir `solicitacoesService.js` (localStorage) por fluxo real de aprovação.
3. **Arquivos:** `backend/blueprints/solicitacoes.py` (novo).
4. **Instruções técnicas:** `POST /solicitacoes` cria `tipo='edicao'|'exclusao'` com `pedido_id` **ou** `estoque_id` (nunca os dois); bloquear criação se já existir solicitação `pendente` para o mesmo alvo; `GET /solicitacoes?status=pendente` para o Painel Adm; `POST /solicitacoes/:id/aprovar` aplica a mudança real diretamente nas tabelas `pedidos`/`estoque` (`UPDATE`, `excluido_em`, ou criação da movimentação correspondente) dentro de uma transação; `POST /solicitacoes/:id/recusar` só atualiza o status. Este módulo é o **dono da lógica de aplicação** da aprovação para os dois tipos de alvo — ele não depende do blueprint de estoque (T10) para funcionar; é o contrário: T10 é quem vai chamar este módulo para criar solicitações de exclusão/ajuste.
5. **Fluxo esperado:** Colaborador solicita (via tela de pedidos/estoque) → Painel Adm lista pendentes → decisão do admin aplica ou não a mudança de verdade.
6. **Dependências:** T02 (schema), T08 (pedidos).
7. **Critérios de aceitação:** registro original nunca muda antes da aprovação; aprovação e aplicação da mudança acontecem na mesma transação (sem estado intermediário inconsistente); o módulo aprova/recusa solicitações de estoque usando só a tabela `estoque`/`estoque_movimentacoes` do schema (T02), sem precisar do blueprint `estoque.py` (T10) já estar pronto.
8. **Testes/evidências:** teste cobrindo solicitação de edição de pedido aprovada, solicitação de exclusão de pedido aprovada, solicitação de exclusão de item de estoque aprovada diretamente contra o schema, e solicitação recusada (registro original intacto nos quatro casos até a decisão).

---

### T10 — Ajustes no módulo de Estoque

1. **Requisitos relacionados:** nº 20, 21, 22, 23, 24, 25, 26 (seção *Estoque*).
2. **Objetivo:** aplicar soft delete, registrar movimentações de forma consistente e passar a usar o módulo de solicitações (T09) para exclusão e ajuste por perda.
3. **Arquivos:** `backend/blueprints/estoque.py` (ajustar — hoje faz `DELETE` real).
4. **Instruções técnicas:** exclusão deixa de ser `DELETE FROM estoque` e passa a **chamar o módulo de solicitações (T09)** para criar uma linha `tipo='exclusao'` em vez de implementar sua própria lógica de aprovação; toda alteração de `quantidade_atual` passa por `estoque_movimentacoes` dentro de uma transação com `SELECT ... FOR UPDATE`; `status` do item (disponível/baixo/indisponível) calculado na consulta, não armazenado; cadastro e entrada continuam diretos (sem aprovação) — editar campos comuns e o ajuste por perda seguem a pendência registrada em `ARQUITETURA_TCC.md` §9 (tratar como "exige aprovação" até confirmação da equipe).
5. **Fluxo esperado:** colaborador cadastra/dá entrada direto; exclusão e ajuste por perda chamam T09 para gerar solicitação para o admin.
6. **Dependências:** T02, T09 (o blueprint de estoque passa a depender do módulo de solicitações já existir — não o contrário).
7. **Critérios de aceitação:** `quantidade_atual` nunca fica negativa; nenhuma exclusão remove a linha sem aprovação prévia (via T09).
8. **Testes/evidências:** teste de entrada/saída consistente, tentativa de saída maior que o saldo (deve falhar), exclusão sem aprovação (item continua ativo, solicitação criada em `solicitacoes`).

---

### T11 — Módulo de Relatórios

1. **Requisitos relacionados:** nº 27, 22, 23 (seção *Tela Relatorios*).
2. **Objetivo:** substituir os dados fixos de `Relatorio.jsx` por estatísticas reais.
3. **Arquivos:** `backend/blueprints/relatorios.py` (novo).
4. **Instruções técnicas:** `GET /relatorios/resumo` retorna contagens por `status` em `pedidos` e itens com `quantidade_atual <= estoque_minimo` em `estoque`; `GET /relatorios/producao-mensal` agrupa por `MONTH(data_conclusao)`.
5. **Fluxo esperado:** React consulta os dois endpoints ao abrir a tela de Relatórios.
6. **Dependências:** T08 (pedidos reais), T10 (estoque ajustado).
7. **Critérios de aceitação:** números batem com uma consulta manual no banco para os mesmos filtros.
8. **Testes/evidências:** comparação entre o retorno da API e uma query manual de conferência.

---

### T12 — Client HTTP único, contexto de autenticação e guarda de rotas (frontend)

1. **Requisitos relacionados:** nº 2, 3, 4 (seção *Autenticação e Acesso*); nº 29, 30 (seção *Tela de Colaboradores/Autenticação*).
2. **Objetivo:** eliminar o `http://localhost:5000` duplicado em ~10 arquivos e criar a base para RBAC real no frontend.
3. **Arquivos:** `src/services/api.js` (novo, client único com `baseURL` relativo ao proxy do Vite), `src/context/AuthContext.jsx` (novo), `src/components/ProtectedRoute.jsx` (novo), `src/App.jsx` (aplicar guarda por perfil nas rotas), `vite.config.js` (proxy).
4. **Instruções técnicas:** `AuthContext` chama `GET /me` ao montar a aplicação; `ProtectedRoute` redireciona para `/` se não autenticado, ou bloqueia rotas admin-only para `nivel_acesso='colaborador'`.
5. **Fluxo esperado:** toda chamada de API passa a usar o client único; navegação respeita o perfil retornado por `/me`.
6. **Dependências:** T03.
7. **Critérios de aceitação:** nenhuma página React chama `axios`/`fetch` com URL hardcoded; colaborador comum não consegue nem ver o link de "Painel Adm" nem acessar a rota diretamente.
8. **Testes/evidências:** teste manual navegando como colaborador tentando acessar `/painel-adm` diretamente pela URL (deve ser bloqueado).

---

### T13 — Integração das telas de Pedidos/Ficha Técnica/Painel Adm/Clientes com a API real

1. **Requisitos relacionados:** nº 10-19 (seções *Tela de Pedidos* e correlatas); nº 25, 32 (solicitações); nº 26, 27, 28 (seção *Clientes*).
2. **Objetivo:** substituir `pedidosService.js`/`solicitacoesService.js` (localStorage) pelas chamadas reais criadas em T08/T09, e migrar as telas de Clientes do acesso por índice de array para o JSON nomeado entregue em T07.
3. **Arquivos:** `src/pages/Novopedido.jsx`, `Selecionarprodutos.jsx`, `Fichatecnica.jsx`, `Pedidos.jsx`, `PainelAdm.jsx`, `src/hooks/useSolicitacoesPedido.js`, `src/pages/Clientes.jsx`, `src/pages/FormCliente.jsx`.
4. **Instruções técnicas:** remover os `TODO(BACK)` já documentados no código e apontar para o client único (T12); catálogo de opções (tecidos, cores etc.) passa a vir de `GET /catalogo` em vez do array fixo em `utils/opcoesProduto.js`; `Clientes.jsx` passa a ler campos nomeados (`cliente.nome`, etc.) em vez de índice (`cliente[0]`); `FormCliente.jsx` passa a usar estado controlado do React em vez de `document.getElementById`, consistente com os outros formulários; busca por nome (nº 26) e filtro ativo/inativo (nº 26) passam a refletir dados reais.
5. **Fluxo esperado:** igual ao descrito em `ARQUITETURA_TCC.md` §6, agora de ponta a ponta; Clientes segue o fluxo já real do backend, só corrigindo o consumo no frontend.
6. **Dependências:** T06, T07, T08, T09, T12.
7. **Critérios de aceitação:** criar, listar, editar (com aprovação) e excluir (com aprovação) um pedido funcionando de verdade, sem `localStorage` envolvido; tela de Clientes exibe e edita corretamente todos os campos sem depender de posição no array.
8. **Testes/evidências:** roteiro de teste manual cobrindo criação de pedido → aparecer na lista → solicitar edição → aprovar como admin → refletir a mudança; e cadastro/edição/busca/filtro de um cliente ponta a ponta.

---

### T14 — Integração das telas de Relatórios, Perfil e Estoque com dados reais

1. **Requisitos relacionados:** nº 22, 23, 27 (*Tela Relatorios*); nº 20-26 (*Estoque*).
2. **Objetivo:** eliminar os últimos dados fixos/mock do frontend (`Relatorio.jsx` hardcoded, `Perfil.jsx` sem submit real) e conectar a tela de Estoque ao novo fluxo de aprovação.
3. **Arquivos:** `src/pages/Relatorio.jsx`, `src/pages/Perfil.jsx`, `src/pages/Estoque.jsx`, `src/pages/EditarEstoque.jsx`.
4. **Instruções técnicas:** gráficos e cards consomem T11; `Perfil.jsx` passa a chamar uma rota real de atualização de dados do próprio colaborador (a definir se haverá tarefa própria ou reaproveita `colaboradores.py`); `EditarEstoque.jsx` passa a diferenciar "salvar alterações" (conforme decisão pendente em §9 de `ARQUITETURA_TCC.md`) de "movimentação por perda" (sempre via solicitação).
5. **Fluxo esperado:** telas exibem dado real; nenhuma função apenas com `console.log`/`alert` como placeholder final.
6. **Dependências:** T10, T11, T12.
7. **Critérios de aceitação:** nenhum número fixo restante em `Relatorio.jsx`; `Perfil.jsx` persiste de fato.
8. **Testes/evidências:** comparação visual antes/depois + confirmação de persistência no banco após editar o perfil.

---

### T15 — Integração Cloudinary (upload de imagens)

1. **Requisitos relacionados:** nº 13 (seção *Tela de Pedidos/Selecionar Produtos* — upload de imagens como logo, nome etc.). Observação: logo de cliente (`clientes.logo_url`) está previsto na arquitetura aprovada (`ARQUITETURA_TCC.md` §8), mas não corresponde a um requisito explícito numerado em `requisitos.txt` — incluído aqui como consumidor adicional da mesma integração, sem inventar um requisito novo.
2. **Objetivo:** implementar o upload real de imagens para o Cloudinary, hoje inexistente (só há um exemplo de referência não integrado em `backend/cod_qrcode.txt`).
3. **Arquivos:** `backend/resources/cloudinary_service.py` (novo), `backend/blueprints/pedidos.py` (consumir o serviço ao salvar `pedido_itens.imagem_url`), `backend/blueprints/clientes.py` (consumir o serviço ao salvar `logo_url`), `backend/config.py` (credenciais Cloudinary via `.env`).
4. **Instruções técnicas:** usar o SDK oficial `cloudinary` Python; credenciais (`CLOUD_NAME`, `API_KEY`, `API_SECRET`) exclusivamente via variável de ambiente, nunca hardcoded; validar tipo/tamanho do arquivo antes do upload; devolver a URL segura (`secure_url`) para ser gravada no banco.
5. **Fluxo esperado:** React envia o arquivo (multipart) → Flask repassa ao Cloudinary → Cloudinary retorna a URL → Flask grava a URL na tabela correspondente.
6. **Dependências:** T01 (config/.env), T08 (pedido_itens), T07 (clientes).
7. **Critérios de aceitação:** upload funciona para os dois fluxos (arte do pedido e logo do cliente); falha de upload não derruba a criação do registro principal sem uma mensagem de erro clara; nenhuma credencial aparece no código-fonte.
8. **Testes/evidências:** teste de upload bem-sucedido com URL retornada e persistida; teste de upload com arquivo inválido (tipo/tamanho) retornando erro tratado.

---

### T16 — Integração da Tela de Início (dashboard)

1. **Requisitos relacionados:** nº 10, 11, 12, 13 (seção *Tela de Inicio*).
2. **Objetivo:** substituir os dados hoje misturados (estoque real + pedidos mock) por uma visão 100% real, com os 4 cards descritos no requisito.
3. **Arquivos:** `backend/blueprints/relatorios.py` ou novo `backend/blueprints/dashboard.py` (endpoint agregando pedidos pendentes, total em estoque, estoque baixo e pedidos recentes), `src/pages/Inicio.jsx` (consumir a API real via client único de T12, remover dependência de `pedidosService.js`).
4. **Instruções técnicas:** `GET /dashboard/resumo` retorna contagem de pedidos pendentes, total de itens em estoque e itens com estoque baixo (mesma regra de T11/T14: `quantidade_atual <= estoque_minimo AND ativo=1`); `GET /dashboard/pedidos-recentes` retorna os últimos pedidos criados com status; clique nos cards navega para `/pedidos` (filtrado) ou `/estoque` (filtrado), conforme nº 11.
5. **Fluxo esperado:** React carrega a tela de Início → chama os dois endpoints → preenche os 4 cards e o redirecionamento ao clicar.
6. **Dependências:** T08 (pedidos reais), T10 (estoque ajustado), T12 (client único).
7. **Critérios de aceitação:** nenhum dado de `Inicio.jsx` vem mais de `pedidosService.js`/`localStorage`; clique em cada card navega para a tela e o filtro corretos.
8. **Testes/evidências:** teste manual comparando os números exibidos com uma consulta direta no banco; teste de navegação a partir de cada card.

---

### T17 — Integração do frontend de Colaboradores e Setor Administrativo (Controle de Funcionários)

1. **Requisitos relacionados:** nº 29, 30 (as três ocorrências), 31, 32 (seção *Tela de Colaboradores/Autenticação*); nº 30, 31, 32 (as duas ocorrências), 33 (seção *Setor Administrativo*). **Observação para a equipe:** o texto de `requisitos.txt` descreve "Controle de Funcionários" (seção *Setor Administrativo*) com busca por nome/RE e ordenação alfabética/por cargo, de forma muito parecida com a tela de Colaboradores já descrita antes — pode ser a mesma tela descrita duas vezes no documento original ou uma tela administrativa separada; como `requisitos.txt` não pode ser reescrito, esta tarefa cobre ambos os conjuntos de requisitos na mesma implementação (Equipe/FormUsuario), e cabe à equipe confirmar se era intenção ter uma segunda tela distinta.
2. **Objetivo:** conectar `Equipe.jsx`/`FormUsuario.jsx` à sessão real (T03) e ao CRUD de colaboradores (T04), incluindo busca por nome/RE, filtro ativo/inativo e ordenação alfabética/por cargo.
3. **Arquivos:** `src/pages/Equipe.jsx`, `src/pages/FormUsuario.jsx`.
4. **Instruções técnicas:** tela só acessível a `nivel_acesso='administrador'` (via `ProtectedRoute` de T12, com mensagem de acesso negado conforme nº 29 quando acessada sem permissão); busca client-side ou via querystring no `GET /listar-colaboradores`; ordenação alfabética (nome) e por cargo (`nivel_acesso`) como controles de UI sobre a lista recebida.
5. **Fluxo esperado:** Admin acessa a tela → lista carregada da API real → busca/filtro/ordenação aplicados sobre os dados reais → cadastro/edição chamam T04.
6. **Dependências:** T03, T04, T12.
7. **Critérios de aceitação:** colaborador comum recebe mensagem de acesso negado ao tentar acessar a tela/rota; busca, filtro e as duas ordenações funcionam sobre dados reais.
8. **Testes/evidências:** teste de acesso negado para colaborador comum; teste de busca por nome e por RE; teste das duas ordenações.

---

### T18 — Integração de Catálogo Administrativo e Histórico de Pedidos

1. **Requisitos relacionados:** nº 34, 35 (seção *Catálogo Administrativo*); nº 36, 37, 38 (seção *Histórico do Pedido*).
2. **Objetivo:** criar a visão administrativa que falta no frontend: selecionar um cliente para ver padrões/fichas técnicas (nº 34) e o histórico completo de pedidos por cliente, com busca e ordenação (nº 36-38).
3. **Arquivos:** `src/pages/PainelAdm.jsx` (ou uma nova página dedicada, ex. `src/pages/HistoricoPedidos.jsx`, a critério da implementação) consumindo `GET /clientes`, `GET /pedidos?cliente_id=`; gestão de itens de catálogo (nº 35) consumindo o CRUD de T06.
4. **Instruções técnicas:** listagem de clientes com navegação para o histórico de pedidos daquele cliente (reaproveita `GET /pedidos/:id` de T08 para exibir a ficha técnica); busca por pedido (nº 37) e ordenação por cliente (nº 38) aplicadas sobre a listagem; tela de catálogo usa o CRUD de T06 com controles de adicionar/atualizar/inativar.
5. **Fluxo esperado:** Admin acessa Setor Administrativo → escolhe Catálogo (gerencia itens) ou Histórico de Pedidos (escolhe cliente → vê fichas técnicas de todos os pedidos dele, incluindo cancelados/excluídos, conforme `ARQUITETURA_TCC.md` §2.2).
6. **Dependências:** T06 (catálogo), T08 (pedidos/ficha técnica), T07/T13 (clientes), T12 (client único).
7. **Critérios de aceitação:** histórico mostra todos os pedidos do cliente (inclusive `cancelado`/`excluido_em` preenchido), não só os ativos; busca e ordenação por cliente funcionam; catálogo permite inativar item sem quebrar pedidos já existentes que o referenciam.
8. **Testes/evidências:** teste mostrando um pedido excluído/cancelado ainda visível no histórico; teste de busca e ordenação; teste de inativação de item de catálogo em uso.

---

### T19 — Verificação transversal de desempenho, busca, ordenação e responsividade

1. **Requisitos relacionados:** nº 5, 6, 7, 9 (seção *Autenticação e Acesso* — requisitos não funcionais que se aplicam a todas as telas, não a uma tela específica).
2. **Objetivo:** confirmar, depois que as demais tarefas estiverem integradas, que os requisitos transversais (busca em todas as telas, ordenação por nome/data/filtros, carregamento rápido, responsividade) estão realmente atendidos — não é uma funcionalidade nova, é uma verificação dedicada.
3. **Arquivos:** nenhum arquivo específico — percorre as telas já entregues em T13, T16, T17, T18 (Pedidos, Estoque, Clientes, Colaboradores, Início, Histórico).
4. **Instruções técnicas:** roteiro de verificação manual (ou teste E2E, se o time optar) cobrindo: existência de busca funcional em cada tela de listagem (nº 5); ordenação por nome/data/filtro disponível em cada setor (nº 6); tempo de resposta percebido das listagens principais (nº 7); layout testado em pelo menos três larguras (mobile, tablet, desktop) para cada tela (nº 9).
5. **Fluxo esperado:** não há fluxo de dados novo — é uma verificação de qualidade sobre o que já foi implementado.
6. **Dependências:** T13, T16, T17, T18 (só faz sentido depois que as telas estiverem integradas à API real).
7. **Critérios de aceitação:** todas as telas de listagem têm busca e ordenação funcionando; nenhuma tela quebra o layout nas três larguras testadas; nenhuma listagem principal demora de forma perceptível a ponto de prejudicar o uso.
8. **Testes/evidências:** checklist preenchido por tela (busca ok/não ok, ordenação ok/não ok, responsivo ok/não ok) anexado como evidência final.

---

## 3. Resumo

- Documentos atualizados: `docs/ARQUITETURA_TCC.md` e `docs/ACOMPANHAMENTO_REQUISITOS.md`.
- Requisitos registrados: **52** (numeração original preservada, incluindo repetições — 10, 18, 22, 23, 26, 27, 30, 32 — e a ausência do nº 8). Nenhum texto ou classificação de `requisitos.txt` foi alterado.
- Tarefas técnicas planejadas: **19** (T01 a T19), em ordem de dependência — as 14 tarefas originais foram mantidas (com ajustes pontuais em T01, T03 e T09/T10) e 5 novas foram criadas só onde havia requisito sem cobertura: T15 (Cloudinary), T16 (Tela de Início), T17 (Colaboradores/Setor Administrativo), T18 (Catálogo/Histórico de Pedidos) e T19 (verificação transversal de busca, ordenação, desempenho e responsividade).
- Primeira tarefa recomendada: **T01 — Infraestrutura do backend** (a validação do `SELECT 1` contra um MySQL real fica condicionada à instância estar provisionada, sem depender de nenhuma tabela).
- Dependências entre tarefas revisadas: **sem ciclos** — T09 (Solicitações) agora depende só de T02/T08 e aplica a aprovação diretamente sobre `pedidos`/`estoque`; T10 (ajustes de Estoque) passa a depender de T09 (chama o módulo de solicitações em vez de implementar aprovação própria).
- Cobertura de requisitos conferida linha a linha contra `requisitos.txt`: todas as 52 linhas têm pelo menos uma tarefa associada (ver referências de "Requisitos relacionados" em cada tarefa, T01 a T19).
- Decisões pendentes (não implementar sem confirmação da equipe): comportamento do QR Code; se a edição comum de campos do estoque exige aprovação do admin; formato exato do RE; aceite da reorganização de pastas do Flask (`blueprints/`); versão do MySQL em uso (afeta a aplicação do `CHECK` em `solicitacoes`/`estoque`); se "Controle de Funcionários" (*Setor Administrativo*) é a mesma tela de Colaboradores ou uma tela administrativa separada (sinalizado em T17).

Nenhuma tarefa foi autorizada para execução. Nenhum requisito foi marcado como concluído.

## 4. Pendências registradas na Fase 03 (não implementar nesta fase)

Esta seção registra divergências entre o código atual e o schema/arquitetura aprovados que foram identificadas durante a auditoria técnica da Fase 03 (19/10/2026). Nenhuma delas foi corrigida — a Fase 03 cobre apenas a finalização do login real. Cada pendência aponta para a tarefa futura responsável pela correção.

| # | Arquivo | Pendência | Tarefa futura |
|---|---|---|---|
| P1 | `backend/colaboradores.py` | Usa colunas incompatíveis com o schema novo: `id_colaborador`, `nome_completo`, `token_ativacao_hash`, `token_expira_em`, `data_nascimento`; `nivel_acesso` com valores `'administrativo'`/`'padrao'` em vez de `'administrador'`/`'colaborador'`. Qualquer rota de escrita falhará contra o banco atual. | T04 |
| P2 | `backend/clientes.py` | Rotas `/cadastrar-cliente`, `/editar-cliente`, `/excluir-cliente` referenciam `nome_empresa`, `responsavel`, `cpf_cnpj`, `id_cliente` — colunas que não existem no schema atual. Somente `/listar-clientes` usa as colunas corretas via `db_cursor`. | T07 |
| P3 | `backend/estoque.py` | Rota `DELETE /excluir-estoque/:id` executa `DELETE` físico, violando o requisito 25 e a decisão de soft delete em `ARQUITETURA_TCC.md §2.2/§7`. Além disso, `/listar-estoque` e `/estoque/:id` não filtram `WHERE ativo = 1`. | T10 |
| P4 | `src/pages/Inicio.jsx`, `src/pages/Estoque.jsx`, `src/pages/AddEstoque.jsx` | Chamadas `axios` para `http://localhost:5000/...` hardcoded; bypassa o proxy do Vite, o cookie de sessão não é enviado corretamente em todos os navegadores e o token CSRF não vai junto. Também aplica-se a `EditarEstoque.jsx` por simetria. | T12 / T14 |
| P5 | `src/pages/AddEstoque.jsx` | Envia `tipo_item: "Produto"`/`"Material"` com inicial maiúscula; o schema define `ENUM('produto', 'material')` em minúsculas. Em MySQL com modo estrito, a inserção é rejeitada. | T14 |
| P6 | `src/services/pedidosService.js`, `src/services/solicitacoesService.js` | Persistência mockada em `localStorage` — nenhum backend real de pedidos ou solicitações existe ainda. Todos os `TODO(BACK)` já estão sinalizados no código. | T08 / T09 / T13 |
| P7 | `start.sh` | Script auxiliar na raiz inicia `backend/app.py` em background **e** depois chama `npm run start` — o `npm run start` agora é o launcher unificado, que subiria um segundo Flask na mesma porta. Após a Fase 03, `start.sh` ficou redundante e potencialmente conflitante. | Avaliar remoção ou simplificação em tarefa futura (sem urgência). |

Nenhuma dessas pendências é bloqueador do login da Fase 03. Elas estão listadas aqui para preservar o conhecimento da auditoria e para que cada tarefa futura (T04, T07, T08, T09, T10, T12, T13, T14) comece com o diagnóstico já feito.
