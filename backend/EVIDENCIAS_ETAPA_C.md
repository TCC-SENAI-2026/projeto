# Evidências da Fase 03 — 19/10/2026

Branch verificada: `teste`. Escopo: validação real do login (Flask Session), criação dos usuários padrão de desenvolvimento, registro de pendências e documentação. Nenhum arquivo de autenticação, nenhum módulo de negócio e nenhum requisito original foi modificado nesta fase.

## 1. Objetivo

Finalizar a Fase 03 com:

- Usuários padrão criados no MySQL via script idempotente, sem interação.
- Documentação de credenciais para a equipe testar login/logout no navegador.
- Registro das pendências identificadas na auditoria de 19/10/2026, apontando as tarefas futuras.
- Preservação integral da arquitetura Flask Session + CSRF aprovada em `ARQUITETURA_TCC.md`.
- Nenhuma mudança em `login.py`, `auth/csrf.py`, `auth/decorators.py`, `app.py`, `config.py`, `database/connection.py`, `AuthProvider.jsx`, `ProtectedRoute.jsx`, `api.js` ou `Login.jsx`.

## 2. Decisões aprovadas (D1–D6)

| ID | Decisão aplicada |
|---|---|
| D1 | Manter Flask Session + cookies `HttpOnly` + CSRF existentes. Nenhum JWT. |
| D2 | Admin RE=`0123`, Colaborador RE=`0234`, senha `12345678` para ambos. RE tratado como texto. |
| D3 | Nenhuma biblioteca JWT instalada; nenhuma tabela nova; sem `localStorage`/`sessionStorage` para auth. |
| D4 | Arquivos de autenticação preservados; novo script é código independente. |
| D5 | `backend/auth/csrf.py` inalterado; token continua obrigatório em POST/PUT/PATCH/DELETE. |
| D6 | Testes automatizados executados neste ambiente; roteiro de testes reais entregue para execução local pelo responsável. |

## 3. Arquivos analisados

- `backend/app.py`
- `backend/config.py`
- `backend/login.py`
- `backend/auth/csrf.py`
- `backend/auth/decorators.py`
- `backend/database/schema.sql`
- `backend/database/connection.py`
- `backend/scripts/bootstrap_user.py`
- `backend/scripts/create_admin.py`
- `backend/scripts/create_test_collaborator.py`
- `backend/EVIDENCIAS_ETAPA_A.md`
- `src/App.jsx`
- `src/main.jsx`
- `src/pages/Login.jsx`
- `src/auth/AuthProvider.jsx`
- `src/auth/ProtectedRoute.jsx`
- `src/services/api.js`
- `vite.config.js`
- `docs/ARQUITETURA_TCC.md`
- `docs/ACOMPANHAMENTO_REQUISITOS.md`
- `requisitos.txt`
- `contexto-projeto.txt`
- `CLAUDE.md`
- `AGENTS.md`

## 4. Arquivos criados nesta fase

| Arquivo | Finalidade |
|---|---|
| `backend/scripts/criar_usuarios_teste.py` | Script idempotente, não interativo, que cria os usuários `0123` (administrador) e `0234` (colaborador) com senha `12345678` no MySQL configurado em `backend/.env`. |
| `backend/scripts/CREDENCIAIS_TESTE.md` | Documentação das credenciais de desenvolvimento, pré-requisitos, comandos e roteiro de testes manuais. |
| `backend/scripts/iniciar_sistema.py` | Launcher Python chamado pelo `npm run start`. Verifica MySQL + schema, cadastra as contas ausentes, sobe Flask e Vite em paralelo e encerra os dois no Ctrl+C. |
| `backend/scripts/iniciar_sistema.cjs` | Shim Node.js (invocado pelo `npm run start`) que localiza a venv em `.venv/` ou `backend/.venv/`, de forma multiplataforma (Windows + macOS + Linux), e executa `iniciar_sistema.py` com o Python correto. |
| `backend/EVIDENCIAS_ETAPA_C.md` | Este documento. |

## 5. Arquivos atualizados nesta fase

| Arquivo | O que foi acrescentado |
|---|---|
| `docs/ACOMPANHAMENTO_REQUISITOS.md` | Nova seção **4. Pendências registradas na Fase 03 (não implementar nesta fase)** com as 6 pendências identificadas na auditoria, apontando as tarefas futuras (T04, T07, T08, T09, T10, T12, T13, T14). As 52 linhas de requisitos originais e as 19 tarefas T01–T19 permanecem intactas. |
| `AGENTS.md` | Nova seção **8. Convenção de nomenclatura de arquivos** apontando para `CLAUDE.md §5`, para que o Codex siga o mesmo padrão. |
| `package.json` | Linha `"start"` atualizada para `node backend/scripts/iniciar_sistema.cjs`, concretizando a inicialização unificada. `"dev": "vite"` permanece como atalho para quem quiser rodar só o frontend. |
| `backend/scripts/CREDENCIAIS_TESTE.md` | Seção 3 reescrita para o fluxo `npm run start` (verificação de MySQL, cadastro, Flask e Vite num só comando); seção 4 agora traz os comandos de debug para rodar componentes isolados; tabela de erros possíveis acrescentada. |

## 6. Arquivos NÃO modificados (confirmação explícita)

Backend:
- `backend/app.py`
- `backend/config.py`
- `backend/login.py`
- `backend/auth/csrf.py`
- `backend/auth/decorators.py`
- `backend/database/connection.py`
- `backend/database/schema.sql`
- `backend/scripts/bootstrap_user.py`
- `backend/scripts/create_admin.py`
- `backend/scripts/create_test_collaborator.py`
- `backend/clientes.py`
- `backend/estoque.py`
- `backend/colaboradores.py`
- `backend/resources/database_connection.py`
- `backend/resources/email_service.py`
- `backend/resources/seguranca.py`

Frontend:
- `src/App.jsx`
- `src/main.jsx`
- `src/pages/Login.jsx`
- `src/auth/*` (todos)
- `src/services/api.js`
- `src/services/pedidosService.js`
- `src/services/solicitacoesService.js`
- `vite.config.js`

Documentação:
- `requisitos.txt` (nenhuma alteração nas 52 linhas originais)
- `docs/ARQUITETURA_TCC.md` (nenhuma alteração — decisão de manter Flask Session preserva a arquitetura aprovada)
- `contexto-projeto.txt`
- `CLAUDE.md` (já contém a seção 5 de nomenclatura; nada a acrescentar)

## 7. Como o script funciona

**Comando:** `python backend/scripts/criar_usuarios_teste.py` (executar da raiz do projeto, com `backend/.env` configurado).

**Fluxo interno:**

1. Carrega `config.load_config()` que lê `backend/.env` via `python-dotenv`.
2. Monta uma aplicação Flask mínima (sem registrar blueprints) e inicializa o pool via `database.connection.init_db`.
3. Dentro de `db_cursor(commit=True)`:
   - Executa `SELECT GET_LOCK('ethreads_seed_dev', 10)` para serializar execuções simultâneas na mesma base.
   - Para cada usuário na constante `USUARIOS_PADRAO`:
     - Faz `SELECT id, nome, nivel_acesso, email FROM colaboradores WHERE re = %s`.
     - Se não existe: `INSERT` com `senha_hash` gerado por `werkzeug.security.generate_password_hash("12345678")`, `conta_ativada=1`, `ativo=1`. Imprime `CREATED: 0123 (administrador)`.
     - Se existe com os mesmos `(nome, nivel_acesso, email)`: imprime `SKIP: 0123 ja existe com os mesmos dados` e segue adiante.
     - Se existe com dados divergentes: imprime `CONFLICT: ...` e marca a flag; nenhuma alteração é feita no registro.
4. `commit` ao final; se houve conflito, o script sai com código `2`. Se tudo correu bem, código `0`. Erros de MySQL ou de configuração resultam em código `1` com mensagem genérica (sem vazar DB_HOST/USER).

**Idempotência:** o `GET_LOCK` isola execuções paralelas; o `SELECT ... WHERE re = %s` antes do `INSERT` garante que não há duplicação; o não-sobrescrever protege dados divergentes de serem silenciosamente apagados.

**Reaproveitamento:**
- `config.load_config` (compartilhado com `bootstrap_user.py` e com `app.py`).
- `database.connection.db_cursor` e `init_db` (mesmo pool do backend em produção).
- `werkzeug.security.generate_password_hash` (mesma função usada no bootstrap interativo).

**Não reaproveitado (justificativa):** `bootstrap_user.main()` é inteiramente interativo (`input()`, `getpass`, confirmação `"BANCO CRIADO"`) e bloqueia uma segunda execução por perfil (`"Já existe uma conta deste perfil; este script inicial não pode ser repetido"`). O requisito D2 pede exatamente o oposto: dois usuários pré-definidos, idempotente, sem interação. Preservei `bootstrap_user.py` intocado para o fluxo original de setup inicial.

## 8. Arquitetura Flask Session + CSRF (resumo)

Fonte canônica: `docs/ARQUITETURA_TCC.md` §4. Mantido integralmente.

- **Login (`POST /login`):** recebe `{re, senha}`, valida com `check_password_hash`, confere `ativo=1 AND conta_ativada=1 AND nivel_acesso IN ('administrador','colaborador')`, limpa a sessão anterior, grava `colaborador_id` na sessão nova e retorna um `csrf_token` fresco.
- **Cookie:** `HttpOnly=True`, `SameSite=Lax`, `Secure` quando `APP_ENV=production`, `PERMANENT_SESSION_LIFETIME=8h` (de `config.py`).
- **CSRF:** `auth/csrf.py` exige header `X-CSRF-Token` igual ao `session[CSRF_SESSION_KEY]` em POST/PUT/PATCH/DELETE; GETs dispensados. Validação feita por `before_request` global, antes de qualquer lógica de negócio.
- **Autorização:** `auth/decorators.py` relê o banco a cada request protegido — a conta desativada/rebaixada no MySQL deixa de autorizar na próxima chamada mesmo que o cookie ainda não tenha expirado.
- **Logout (`POST /logout`):** limpa a sessão (`session.clear()`); Flask expira o cookie no `Set-Cookie` da resposta.
- **Expiração:** cookie assinado com `itsdangerous`, sem tabela de sessões. Não há revogação remota de uma sessão específica — aceito como trade-off para o escopo do TCC (ARQUITETURA_TCC.md §4).

## 8.1 Inicialização unificada (`npm run start`)

**Objetivo:** permitir que qualquer integrante da equipe inicie Flask + React em um único comando, com cadastro automático das contas de desenvolvimento, após ter configurado o ambiente uma única vez.

**Fluxo detalhado:**

1. `npm run start` → executa `node backend/scripts/iniciar_sistema.cjs`.
2. O shim Node localiza o Python da venv (procura em `.venv/<Scripts|bin>/python[.exe]` da raiz **ou** em `backend/.venv/<Scripts|bin>/python[.exe]`; o primeiro que existir é usado).
3. O shim executa `iniciar_sistema.py` com esse Python; o `stdio` é herdado para que o usuário veja a saída em tempo real.
4. `iniciar_sistema.py`:
   - **[1/2]** Verifica MySQL + schema (`SELECT 1 FROM colaboradores LIMIT 1`). Erros são traduzidos em mensagens claras (configuração incompleta, banco inacessível, tabela ausente). Se qualquer um ocorrer, aborta sem subir servidores.
   - **[2/2]** Importa `criar_usuarios_teste` e chama sua `main()` para cadastrar `0123`/`0234` se estiverem ausentes. Exit `0` ou `2` prosseguem; `1` aborta.
   - Sobe Flask (`sys.executable backend/app.py`) e Vite (`npm run dev`) em paralelo via `subprocess.Popen`, com saída prefixada por `[flask]` e `[vite]`.
   - `Ctrl+C` encerra os dois processos limpos (SIGINT no POSIX, `CTRL_BREAK_EVENT` no Windows).
   - Se um dos processos cair sozinho, mata o outro e sai com código ≠ 0.

**Multiplataforma:** `npm.cmd` no Windows, `npm` no macOS/Linux; venv procurada em ambos os locais; nenhum shell script envolvido.

**Preserva contas existentes:** o script `criar_usuarios_teste.py` nunca sobrescreve `nome`, `senha_hash`, `email` ou `nivel_acesso` de um RE já cadastrado — a mensagem `CONFLICT` é informativa e o sistema continua subindo normalmente.

## 9. Resultados dos testes automatizados

Comandos executados nesta sessão, no diretório do projeto:

### Backend

```
backend/.venv/bin/python -m unittest discover -s backend/tests -v
```

**Resultado real:**
```
Ran 57 tests in 1.482s
OK
```

Distribuição aproximada: 28 testes de autenticação/CSRF/sessão (`test_auth.py`), 20+ de infraestrutura (`test_infrastructure.py`), 9 de scripts de bootstrap (`test_bootstrap.py`). Nenhum conecta ao MySQL real; todos usam mocks e banco simulado em memória.

Observação: EVIDENCIAS_ETAPA_A.md registrava 55 testes. A diferença de 2 testes corresponde a novos casos acrescentados pela equipe desde 15/10/2026 — todos passam.

### Frontend

```
node --test tests/frontend_auth.test.mjs
```

**Resultado real:**
```
tests 19
suites 3
pass 19
fail 0
```

Cobre: cliente `/api`, token CSRF, login→`/me`→logout, restauração de sessão, respostas inválidas, menus por perfil, guardas de rotas para `/equipe`, `/painel-adm`, `/relatorio`, carregamento inicial. Fetch e perfis são simulados; não substitui o teste visual com cookie real do item 10.

### Compilação dos novos scripts

```
backend/.venv/bin/python -m py_compile backend/scripts/criar_usuarios_teste.py
backend/.venv/bin/python -m py_compile backend/scripts/iniciar_sistema.py
```

**Resultado real:** `COMPILE OK` para ambos (byte-compile sem erros de sintaxe).

### Execução real de `npm run start` nesta sessão

Durante esta sessão o MySQL do responsável estava ativo com o schema aplicado. Executamos `npm run start` por aproximadamente 8 segundos e interrompemos com SIGINT para capturar a saída. Resultado real observado:

```
> meu-app@0.0.0 start
> node backend/scripts/iniciar_sistema.cjs

[1/2] Verificando MySQL e schema...
      conexao e schema OK.
[2/2] Cadastrando contas de desenvolvimento...
Conflito detectado nas contas de desenvolvimento (acima). Nenhum dado foi alterado; prosseguindo com a inicializacao.
CONFLICT: 0123 ja existe com dados diferentes (nome='JOAO', nivel_acesso='administrador'). Nenhuma alteracao feita; resolva manualmente antes de continuar.
CONFLICT: 0234 ja existe com dados diferentes (nome='joao', nivel_acesso='colaborador'). Nenhuma alteracao feita; resolva manualmente antes de continuar.
Iniciando backend (Flask) e frontend (Vite). Ctrl+C para encerrar.
[flask]  * Serving Flask app 'app'
[flask]  * Running on http://127.0.0.1:5000
[vite]   VITE v8.0.3  ready in 746 ms
[vite]   ➜  Local:   http://localhost:5173/
Encerrando a pedido do usuario...
```

**Interpretação:**

- A conexão com o MySQL e o schema estão operacionais (etapa C de EVIDENCIAS_ETAPA_A.md fecha-se aqui pelo probe automático do launcher).
- O banco **já tinha** contas com `re='0123'` (nome `'JOAO'`, administrador) e `re='0234'` (nome `'joao'`, colaborador). O script detectou a divergência de nome, **não** sobrescreveu nada (nenhum `UPDATE` foi executado) e emitiu `CONFLICT`.
- A inicialização continuou: Flask subiu em `http://127.0.0.1:5000` e Vite em `http://localhost:5173/`.
- O Ctrl+C encerrou os dois processos como esperado.

**Consequência prática para a Fase 03:** o responsável tem duas opções:

1. **Manter as contas existentes** (`JOAO` e `joao`) e usar as **senhas que já estão no banco** para logar. Nesse caso, as credenciais listadas em `CREDENCIAIS_TESTE.md` (senha `12345678`) **não valerão** até que o responsável defina manualmente.
2. **Remover as contas existentes** e re-executar `npm run start` para que o script cadastre `0123`/`0234` com nome `Administrador Teste`/`Colaborador Teste` e senha `12345678`:
   ```sql
   DELETE FROM colaboradores WHERE re IN ('0123','0234');
   ```
   Em seguida, `npm run start` imprimirá `CREATED: ...` para ambos.

A escolha é da equipe. O comportamento do script segue a instrução "Os REs já existentes devem ser preservados, inclusive suas senhas atuais."

## 10. Roteiro de validação com MySQL real e React (a executar pelo responsável)

Esta fase **não** foi concluída automaticamente — exige o MySQL do responsável, com schema aplicado, e um navegador. Executar da raiz do projeto:

### 10.1 Preparação (uma vez)

1. Confirmar que o MySQL está rodando.
2. Confirmar que o schema de `backend/database/schema.sql` já foi aplicado no Workbench (ver EVIDENCIAS_ETAPA_A.md §5).
3. Confirmar que `backend/.env` tem `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` preenchidos.
4. Confirmar dependências instaladas (`pip install -r backend/requirements.txt` e `npm install`).

### 10.2 Criar os usuários padrão

```
python backend/scripts/criar_usuarios_teste.py
```

Esperado:
- Primeira execução: `CREATED: 0123 (administrador)` e `CREATED: 0234 (colaborador)`.
- Segunda execução: `SKIP: 0123 ja existe com os mesmos dados` e idem para `0234`.

### 10.3 Iniciar backend e frontend em terminais separados

```
# Terminal 1
python backend/app.py

# Terminal 2
npm run dev
```

Abrir `http://localhost:5173/`.

### 10.4 Cenários obrigatórios

| # | Cenário | Resultado esperado |
|---|---|---|
| 1 | Login `0123` / `12345678` | Redireciona para `/home`; menu com todas as rotas (admin + colaborador) |
| 2 | Login `0234` / `12345678` | Redireciona para `/home`; menu sem rotas admin |
| 3 | Login com senha errada | Mensagem genérica |
| 4 | Login com RE inexistente (`9999`) | Mesma mensagem genérica do item 3 |
| 5 | Logado como `0234`, acessar `/painel-adm` direto | Redireciona para `/home` |
| 6 | Logado como `0123`, acessar `/painel-adm` | Página renderiza |
| 7 | Pressionar F5 em qualquer página autenticada | Sessão persiste (consulta `/me` retorna 200) |
| 8 | Logout, depois tentar `/pedidos` | Redireciona para `/` |
| 9 | DevTools → Console → `document.cookie` | Cookie `session` não aparece (HttpOnly) |
| 10 | DevTools → Network → repetir uma escrita sem `X-CSRF-Token` | 403 "Token CSRF ausente ou inválido" |
| 11 | SQL manual: `UPDATE colaboradores SET ativo=0 WHERE re='0234';` + tentar logar como `0234` | 403 "Conta sem permissão de acesso." Após o teste, `UPDATE ... SET ativo=1`. |
| 12 | Executar o script duas vezes seguidas | Nenhuma duplicação; segunda execução imprime SKIP para ambos |

### 10.5 Como anexar as evidências

Ao concluir, acrescentar a este documento (ou em arquivo separado anexado à tarefa) o retorno real de cada cenário. Nenhum item deve ser presumido como aprovado sem execução.

## 11. Pendências identificadas e para onde apontam

Registradas em `docs/ACOMPANHAMENTO_REQUISITOS.md §4` nesta fase. Resumo:

| # | Pendência | Tarefa futura |
|---|---|---|
| P1 | `backend/colaboradores.py` com colunas incompatíveis com o schema | T04 |
| P2 | `backend/clientes.py` com colunas desatualizadas em cadastrar/editar/excluir | T07 |
| P3 | `backend/estoque.py` com DELETE físico; sem filtro `ativo=1` | T10 |
| P4 | URLs hardcoded em `Inicio.jsx`, `Estoque.jsx`, `AddEstoque.jsx` (e `EditarEstoque.jsx`) | T12/T14 |
| P5 | `AddEstoque.jsx` envia `tipo_item` em maiúsculo violando ENUM | T14 |
| P6 | `pedidosService.js` e `solicitacoesService.js` são mocks em `localStorage` | T08/T09/T13 |

Nenhuma dessas pendências foi corrigida nesta fase. Cada uma tem a tarefa aprovada no planejamento onde deve ser tratada.

## 12. Limites desta evidência

- A verificação de MySQL + schema **foi** executada automaticamente nesta sessão pelo `npm run start` (§9); contudo, os cenários visuais 1–11 de `CREDENCIAIS_TESTE.md §7` (login real pela tela, logout, F5, HttpOnly, CSRF rejeitado, conta inativa) **não** foram executados aqui — precisam ser executados pelo responsável no navegador local.
- Enquanto houver as contas `0123`/`0234` no banco com nomes `JOAO`/`joao`, o login visual precisa usar as senhas atuais dessas contas (desconhecidas desta sessão). Para usar `12345678` será necessário remover as contas antes do próximo `npm run start`.
- Nenhum requisito foi marcado como concluído em `docs/ACOMPANHAMENTO_REQUISITOS.md §1` — todos permanecem `[ ]` até que o responsável anexe as evidências do roteiro de testes visuais.
- As pendências do §11 continuam abertas e deverão ser tratadas nas tarefas apontadas.
- O arquivo local `backend/scripts/start.py` (não rastreado no git) foi **preservado** e não é mais referenciado pelo `package.json`. Pode ser removido pela equipe manualmente ou mantido como referência histórica.
- `start.sh` (na raiz) contém um padrão problemático (inicia `app.py` em background e em seguida chama `npm run start`, que agora é o novo launcher; executaria dois Flask na mesma porta). Registrada como pendência adicional abaixo para avaliação futura.
- Nenhum `git commit` ou `git push` foi executado. Os novos arquivos (`iniciar_sistema.py`, `iniciar_sistema.cjs`, `criar_usuarios_teste.py`, `CREDENCIAIS_TESTE.md`, este documento) e as modificações em `package.json`, `AGENTS.md`, `docs/ACOMPANHAMENTO_REQUISITOS.md` **não** são ignorados pelo `.gitignore` e estão prontos para `git add`.
