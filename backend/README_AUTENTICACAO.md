# T01/T02/T03 e parte mínima de T12 — entrega de preparação

Escopo: modelagem completa, infraestrutura, autenticação e navegação por perfil.
Nenhum schema, INSERT real, e-mail ou script de criação de conta foi executado
na etapa A. A configuração local do `.env` e a validação real são da etapa C.
Os documentos de arquitetura/acompanhamento não foram alterados.

## Decisões confirmadas

- Servidor instalado identificado pelo binário `mysqld.exe --version`:
  MySQL Community Server **8.0.46**, Win64. Nenhuma conexão foi necessária.
- RE dos dois scripts: **4 dígitos**, aprovado nesta conversa. É texto para
  preservar zeros iniciais. O schema mantém `VARCHAR(20)` conforme arquitetura.
- Token CSRF real, inclusive no login, conforme solicitação e T03. Essa
  instrução prevalece sobre o trecho antigo da arquitetura §4 sem token.
- Blueprints mantidos na raiz do backend, sem reorganizar arquivos da equipe.

## Arquivos e responsabilidades

| Arquivo | Responsabilidade |
|---|---|
| `database/schema.sql` | Única definição das 10 tabelas, sem SQL destrutivo |
| `config.py`, `.env.example`, `requirements.txt` | Configuração e dependências |
| `database/__init__.py`, `database/connection.py` | Pool e cursor nomeado |
| `resources/database_connection.py` | Compatibilidade legada, sem credenciais fixas |
| `app.py` | Factory, CORS, CSRF, proteção dos blueprints e erros de banco |
| `login.py`, `auth/` | RE/senha, sessão, decorators e token CSRF |
| `scripts/create_admin.py` | Administrador inicial com RE informado |
| `scripts/create_test_collaborator.py` | Único colaborador de teste, RE gerado |
| `scripts/bootstrap_user.py`, `scripts/__init__.py` | Validação, hash e transação dos scripts |
| `tests/test_auth.py`, `tests/test_infrastructure.py`, `tests/test_bootstrap.py` | Testes backend isolados |
| `../src/services/api.js`, `../src/auth/` | Cliente `/api`, sessão React e guardas |
| `../src/pages/Login.jsx`, `../src/components/Sidebar.jsx` | Login/menu existentes integrados |
| `../src/App.jsx`, `../src/main.jsx`, `../vite.config.js` | Rotas protegidas e proxy |
| `../tests/frontend_auth.test.mjs` | Testes React/API simulada reproduzíveis |
| `../.gitignore` | Ignora o ambiente Python local `.venv` |

## Como as tabelas se relacionam

`colaboradores` representa os dois perfis; `tokens` guarda futuros tokens de
ativação/redefinição. `clientes` tem vários `pedidos`; cada pedido referencia
seu criador e contém `pedido_itens`, desdobrados em `pedido_item_tamanhos`.
Os itens referenciam `catalogo_itens` para produto, personalização, tecido, cor
e local de arte. A aplicação futura deve conferir o tipo de cada referência.

`estoque_movimentacoes` relaciona item de estoque e colaborador responsável.
`solicitacoes` referencia solicitante, administrador decisor opcional e
exatamente um alvo: pedido **ou** estoque. Esse último vínculo é protegido
por `CHECK`; o saldo de estoque também não pode ser negativo.

FKs preservam referências com `ON DELETE RESTRICT`. RE, CPF, e-mail, número de
pedido e par tipo/nome de catálogo têm unicidade. Entidades centrais usam
inativação/exclusão lógica. Relatórios não precisam de tabela própria.
Pedidos, movimentações e aprovações terão transações nas tarefas da equipe;
criar tabelas não implementa esses fluxos.

## Conexão, autenticação e permissões

`config.py` lê as variáveis do ambiente e `backend/.env`. O pool é criado
somente na primeira consulta: iniciar Flask não acessa o MySQL. `db_cursor()`
fornece dicionários, fecha cursor e devolve conexão ao pool; `commit=True`
confirma o bloco inteiro, enquanto erros provocam rollback.

Fluxo do navegador:

1. React consulta `/api/me` ao carregar; 401 apresenta login.
2. Antes do login, `/api/csrf` retorna token e inicia sessão anônima.
3. React envia `{re, senha}` para `/api/login` com `X-CSRF-Token`.
4. O proxy Vite retira `/api` e encaminha ao Flask na porta 5000.
5. Flask consulta somente RE por SQL parametrizado, verifica conta ativa,
   ativação, perfil e hash Werkzeug. O login troca sessão e token CSRF.
6. React consulta `/api/me` novamente e monta o menu conforme o perfil.
7. `/api/logout` exige CSRF e limpa a sessão/cookie. Outra conta recebe outro
   perfil e menu no próximo login.

O cookie é `HttpOnly`, `SameSite=Lax` e `Secure` com `APP_ENV=production`.
Apenas ID e token CSRF ficam na sessão; senha/hash nunca são devolvidos.
Perfil e status vêm do banco novamente em cada requisição protegida.
O token CSRF fica só em memória no React e é exigido em todos os
`POST/PUT/PATCH/DELETE`, inclusive login. Falhas de CSRF retornam 403.

Sem `SECRET_KEY` local, desenvolvimento usa chave aleatória por processo;
reiniciar o Flask encerra as sessões. Produção exige chave com pelo menos
32 caracteres e HTTPS. A sessão tem limite de validação de oito horas e
cookie de navegador; a configuração persistente será orientada na etapa C.
A limitação documentada de sessões assinadas permanece: logout limpa o cookie
do navegador atual, mas não revoga remotamente uma cópia previamente obtida.

| Perfil | Áreas React |
|---|---|
| Administrador | Todas as telas existentes, inclusive Perfil, Colaboradores, Relatórios e Painel Adm (setor administrativo) |
| Colaborador | Início, Pedidos, Estoque, Clientes e seus formulários internos |

URLs React administrativas redirecionam colaborador para `/home`.
No Flask, todo o blueprint `colaboradores` exige administrador; `clientes` e
`estoque` exigem login. Blueprints futuros devem aplicar os decorators
`login_required`/`admin_required` antes de publicar suas rotas.

## Scripts: apenas depois da confirmação da etapa B

Os dois comandos são manuais e pedem confirmação local `BANCO CRIADO`.
Pedem nome, e-mail e senha oculta com confirmação; administrador informa RE
de quatro dígitos e colaborador recebe RE aleatório único. Guardam somente
hash Werkzeug, `ativo=1`, `conta_ativada=1` e perfil correto.

Um lock MySQL serializa os scripts; uma conta existente do mesmo perfil,
mesmo inativa, impede repetição. Portanto são procedimentos iniciais, não
cadastro de usuários adicionais. UNIQUE também impede RE/e-mail duplicados.
Nenhum cliente, pedido, item de estoque ou outro dado de negócio é criado.

Para inativar o colaborador posteriormente, confira o RE exibido pelo script
e execute manualmente no Workbench, substituindo o marcador. Não execute
esse trecho agora:

```sql
START TRANSACTION;
SELECT id, re, nome, nivel_acesso, ativo FROM colaboradores
WHERE re = '<RE_DO_COLABORADOR>' FOR UPDATE;
UPDATE colaboradores SET ativo = 0
WHERE re = '<RE_DO_COLABORADOR>' AND nivel_acesso = 'colaborador';
SELECT ROW_COUNT() AS contas_alteradas;
-- Confirme que é a conta de teste e contas_alteradas = 1 antes de COMMIT.
-- Se houver divergência, execute ROLLBACK.
```

A próxima requisição protegida bloqueia a conta inativa. Nenhum registro
histórico é apagado e o script inicial não recria a conta inativada.

## Testes isolados da etapa A

Com as dependências na `.venv`, execute da raiz:

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s backend/tests -v
node --test tests/frontend_auth.test.mjs
.\node_modules\.bin\vite.cmd build
.\node_modules\.bin\eslint.cmd src/App.jsx src/main.jsx src/pages/Login.jsx src/components/Sidebar.jsx src/auth src/services/api.js vite.config.js
```

Os testes Python substituem o cursor por mocks; os testes React simulam API
e contexto. Eles comprovam comportamentos do código, sem comprovar conexão,
constraints aplicadas ou navegação com contas reais. Resultados desta
execução estão em `EVIDENCIAS_ETAPA_A.md`.

## Etapa B — execução manual no MySQL Workbench

1. Abra sua conexão local MySQL e confirme `SELECT VERSION();`.
2. Abra `backend/database/schema.sql` com **File → Open SQL Script**.
3. Confira os comandos iniciais `CREATE DATABASE IF NOT EXISTS ethreads_db`
   e `USE ethreads_db`. Use uma base vazia. Se esse nome já contiver tabelas
   antigas, **não execute por cima**: escolha outro nome de base vazia e
   ajuste somente esses dois comandos. Não remova tabelas existentes.
4. Execute o arquivo completo pelo botão de raio. O script não contém DROP,
   DELETE, migração ou inserção de dados. CREATE TABLE não usa IF NOT EXISTS
   para não mascarar uma estrutura antiga incompatível.
5. Confira o painel **Action Output** sem erros. Atualize **Schemas**,
   expanda a base e confira as 10 tabelas. `SHOW TABLES;` também permite
   contar. Guarde o resultado de `SHOW CREATE TABLE` para a validação futura.

**Pare aqui e confirme no chat se o banco foi criado sem erros e qual nome
foi usado.** A etapa C só começa após essa confirmação: orientar `.env`,
testar conexão, criar manualmente as duas contas e validar login/permissões.
Não envie senhas ou conteúdo do `.env` pelo chat.

## Pendências e divisão com a equipe

- Validação real das 10 tabelas, FKs/CHECKs, `SELECT 1`, login e interface:
  aguardam etapa C; nenhum requisito foi marcado `[x]`.
- Os módulos legados mantêm SQL de demonstração com campos antigos e as
  telas de negócio ainda usam URLs diretas sem o novo cliente/CSRF. Acesso
  às telas não comprova seus CRUDs. Essas integrações permanecem T04,
  T07/T10, T13/T14/T17; chamadas antigas podem ser rejeitadas por sessão/CSRF
  ou falhar por incompatibilidade de campos até essas tarefas.
- Ficam para a equipe: cadastro/ativação e recuperação por e-mail, CRUDs,
  pedidos/fichas, movimentações, solicitações, relatórios/dashboard,
  catálogo/histórico, Cloudinary e QR Code.
- A tela existente de ativação foi preservada, mas seus endpoints antigos
  não estão publicados nesta etapa. O modal de redefinição informa que o
  recurso está indisponível e não confirma um envio fictício.
- Produção precisa servir `/api` na mesma origem com proxy equivalente;
  o proxy Vite é de desenvolvimento.
