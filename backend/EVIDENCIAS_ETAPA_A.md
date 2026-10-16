# Evidências da etapa A — 15/10/2026

Branch verificada: `teste`. Escopo: T01, T02, T03 e integração mínima de T12.
Nenhum banco/tabela/dado foi criado, alterado ou excluído pelo agente.
Não houve commit, push, merge ou alteração dos documentos protegidos.

## Ambiente identificado

```text
mysqld.exe --version
Ver 8.0.46 for Win64 on x86_64 (MySQL Community Server - GPL)

Python 3.14 / Node v24.13.1 / Vite 8.0.3
Flask 3.1.3 / Flask-Cors 6.0.5 / Werkzeug 3.1.9
mysql-connector-python 9.7.0 / python-dotenv 1.2.4
```

O binário/serviço foi identificado sem login no MySQL. A versão do servidor
efetivamente conectado no Workbench ainda deve ser conferida na etapa B.
As dependências Python foram instaladas exclusivamente na `.venv` local.

## Testes Python executados

Comando da raiz:

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s backend/tests -v
```

Saída final real:

```text
Ran 55 tests in 2.250s
OK
```

Distribuição: 28 de autenticação/CSRF; 19 de infraestrutura; 8 de scripts.
Foram executados login dos dois perfis com hashes Werkzeug e banco simulado,
senha incorreta, e-mail rejeitado, conta inativa/não ativada, `/me`, logout,
rotação de CSRF, token incorreto/ausente nos quatro métodos de escrita,
rebaixamento/desativação durante sessão, cookies, consultas parametrizadas,
CORS, cleanup/commit/rollback e bloqueio de duplicações nos scripts.

As URLs reais `/listar-colaboradores`, `/listar-clientes`, `/listar-estoque`
passaram pelas guards reais do app. As views de negócio foram substituídas
por respostas de teste, e todos os cursores/conexões por mocks. Assim, esse
resultado comprova autorização antes da view, sem validar seus SQLs legados.
Nenhum teste criou usuários ou executou consultas no servidor MySQL.

## Testes React executados

```powershell
node --test tests/frontend_auth.test.mjs
```

Saída final real:

```text
tests 19
suites 3
pass 19
fail 0
```

Cobertura: cliente `/api`, token inicial e renovação, login→`/me`→logout,
restauração da sessão por `/me`, erro de rede vs 401, respostas inválidas,
menus/nomes dos dois perfis, guardas e vínculo das rotas reais `/equipe`,
`/painel-adm` e `/relatorio` ao perfil administrativo, carregamento/erro inicial.
Fetch e perfis foram simulados; a renderização usou React SSR. Isso não
substitui o teste visual no navegador com usuários e cookie reais da etapa C.

## Build, lint e compilação

```powershell
.\node_modules\.bin\vite.cmd build
.\node_modules\.bin\eslint.cmd src/App.jsx src/main.jsx src/pages/Login.jsx src/components/Sidebar.jsx src/auth src/services/api.js vite.config.js
.\.venv\Scripts\python.exe -m compileall -q backend
git diff --check
```

Todos concluíram com exit code 0. Build: 332 módulos transformados, concluído
em 748 ms nesta execução. O bundle principal mede aproximadamente 1,05 MB;
otimização de bundle permanece fora deste escopo. Git informou somente aviso
de normalização LF/CRLF em `backend/login.py`, sem erro de whitespace.

## Inicialização e proxy HTTP reais, sem banco

Flask e Vite foram iniciados temporariamente e encerrados após o smoke test:

```text
Serving Flask app 'app'
Debug mode: off
Running on http://127.0.0.1:5000

VITE v8.0.3 ready
Local: http://127.0.0.1:5173/
```

Um cliente HTTP com cookie jar acessou a porta do Vite. Resultado real:

```text
GET /api/csrf: 200 token_present: True HttpOnly: True SameSite=Lax: True
GET /api/me: 401 Autenticação necessária.
POST /api/login: 403 Token CSRF ausente ou inválido.
```

Logs do Flask confirmaram remoção do prefixo pelo proxy:

```text
GET /csrf HTTP/1.1 200
GET /me HTTP/1.1 401
POST /login HTTP/1.1 403
```

Nenhuma dessas três requisições consulta o banco: a primeira apenas gera
token; a segunda não possui sessão autenticada; a terceira é bloqueada pelo
CSRF antes do login. Valores de cookies/tokens não foram registrados aqui.

## Schema: revisão estática, sem execução

Conferidos no arquivo: 10 tabelas, 10 PKs, 16 FKs com tipos compatíveis e
RESTRICT, 5 UNIQUE e os 2 CHECK previstos (saldo e alvo exclusivo).
CREATE TABLE não usa IF NOT EXISTS; o arquivo destina-se a uma base vazia.
Não contém SQL de exclusão, migração ou inserção de dados.

MySQL aplica CHECK a partir de 8.0.16, conforme a
[documentação oficial de CHECK](https://dev.mysql.com/doc/refman/8.0/en/create-table-check-constraints.html).
O arquivo foi preparado para a instalação 8.0.46 identificada. A execução
manual, existência real das tabelas, integridade efetivamente aplicada e
`SHOW CREATE TABLE` continuam pendentes.

## Limites da evidência e próximo passo

- Conexão Flask/MySQL (`SELECT 1`): **não executada**, aguardando etapa C.
- Schema aplicado/relacionamentos reais: **não validados**, aguardando Workbench.
- Contas iniciais e login/permissões com dados reais: **não executados**.
- Navegação visual, refresh e alternância de contas reais: **não executados**.
- CRUDs e demais módulos: preservados para suas tarefas; consultas/URLs
  legadas ainda precisam de integração com o schema, sessão e CSRF novos.
- Alterações locais preexistentes, inclusive as três imagens removidas,
  foram preservadas; não houve restauração, staging ou commit.

Nenhum requisito foi marcado como concluído. O próximo passo autorizado é
a execução manual do `database/schema.sql` pelo usuário. **A etapa C aguarda
confirmação de que o banco foi criado e está funcionando.**
