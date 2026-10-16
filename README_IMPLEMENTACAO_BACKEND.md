# E-Threads — Implementação do backend

Resumo de banco de dados, conexão Flask/MySQL, autenticação inicial e integração mínima do login React. Escopo: T01, T02, T03 e parte de T12.

## Arquivos essenciais na raiz — NÃO APAGAR

> **Equipe: não apaguem, renomeiem ou movam estes arquivos sem conversar com o grupo.** Eles permanecem nos caminhos originais.

| Arquivo | Finalidade confirmada no conteúdo |
|---|---|
| [AGENTS.md](AGENTS.md) | Orienta o Codex a implementar tarefas aprovadas, preservar alterações e apresentar testes e evidências. |
| [CLAUDE.md](CLAUDE.md) | Orienta o Claude a analisar, revisar a arquitetura e planejar tarefas antes da implementação autorizada. |
| [contexto-projeto.txt](contexto-projeto.txt) | Reúne objetivo, tecnologias, fluxos, responsabilidades e decisões, incluindo registros de etapas anteriores. |
| [requisitos.txt](requisitos.txt) | Define requisitos e regras de negócio que delimitam funcionalidades e permissões. |

## Arquitetura

React e Vite exibem o login. O frontend chama `/api`; no desenvolvimento, o proxy do Vite encaminha essas requisições ao Flask, retirando o prefixo. Proxy significa esse encaminhamento entre servidores.

Flask valida login, sessão e permissões e consulta MySQL por `mysql.connector`. O acesso usa um pool, conjunto de conexões reutilizáveis criado na primeira consulta. O perfil define as áreas exibidas; o backend verifica a autorização novamente nas chamadas protegidas.

Referências: [arquitetura aprovada](docs/ARQUITETURA_TCC.md) e [planejamento dos requisitos](docs/ACOMPANHAMENTO_REQUISITOS.md).

## Arquivos criados

**24 arquivos novos identificados na inspeção do estado de trabalho anterior ao commit.** A contagem inclui implementação, testes e guias; exclui referências de planejamento e este resumo.

| Caminho | O que faz | Por que existe / uso |
|---|---|---|
| [backend/config.py](backend/config.py) | Carrega configuração e opções de sessão. | Configuração central desta infraestrutura. |
| [backend/.env.example](backend/.env.example) | Enumera variáveis de configuração. | Referência local; não versionar valores sensíveis. |
| [backend/requirements.txt](backend/requirements.txt) | Lista dependências Python. | Preparação do backend. |
| [backend/database/__init__.py](backend/database/__init__.py) | Identifica o pacote de banco. | Organização dos imports. |
| [backend/database/connection.py](backend/database/connection.py) | Gerencia pool, cursor, transações e fechamento. | Acesso compartilhado ao MySQL. |
| [backend/auth/__init__.py](backend/auth/__init__.py) | Identifica o pacote de autenticação. | Organização dos imports. |
| [backend/auth/csrf.py](backend/auth/csrf.py) | Gera e verifica token CSRF. | Proteção das escritas, inclusive login. |
| [backend/auth/decorators.py](backend/auth/decorators.py) | Exige conta válida e perfil adequado. | Autorização consultada no banco. |
| [backend/scripts/__init__.py](backend/scripts/__init__.py) | Identifica o pacote dos scripts. | Organização dos procedimentos iniciais. |
| [backend/scripts/bootstrap_user.py](backend/scripts/bootstrap_user.py) | Valida entradas/duplicações, gera hash e grava conta. | Lógica comum dos dois comandos. |
| [backend/scripts/create_admin.py](backend/scripts/create_admin.py) | Inicia a criação do administrador. | Primeira conta administrativa. |
| [backend/scripts/create_test_collaborator.py](backend/scripts/create_test_collaborator.py) | Inicia a criação do colaborador. | Conta para testar permissões comuns. |
| [backend/tests/test_auth.py](backend/tests/test_auth.py) | Testa login, sessão, autorização e CSRF. | Verificação com banco simulado. |
| [backend/tests/test_infrastructure.py](backend/tests/test_infrastructure.py) | Testa configuração, proteções de acesso e transações. | Verificação com conexões simuladas. |
| [backend/tests/test_bootstrap.py](backend/tests/test_bootstrap.py) | Testa RE manual, duplicações e senha oculta. | Verificação sem criar contas reais. |
| [backend/README_AUTENTICACAO.md](backend/README_AUTENTICACAO.md) | Explica a preparação original. | Guia detalhado com trechos históricos. |
| [backend/EVIDENCIAS_ETAPA_A.md](backend/EVIDENCIAS_ETAPA_A.md) | Registra testes da etapa A. | Evidências anteriores, datadas de 15/10/2026. |
| [src/services/api.js](src/services/api.js) | Centraliza autenticação em `/api`, CSRF e erros. | Comunicação React/Flask. |
| [src/auth/AuthContext.js](src/auth/AuthContext.js) | Define o contexto da sessão. | Estado compartilhado entre componentes. |
| [src/auth/AuthProvider.jsx](src/auth/AuthProvider.jsx) | Consulta `/me`; controla login, logout e nova tentativa. | Restauração e atualização da sessão. |
| [src/auth/useAuth.js](src/auth/useAuth.js) | Expõe sessão e ações aos componentes. | Acesso ao contexto compartilhado. |
| [src/auth/ProtectedRoute.jsx](src/auth/ProtectedRoute.jsx) | Exige sessão e perfil administrativo quando necessário. | Bloqueio de navegação não autorizada. |
| [src/auth/SessionStatus.jsx](src/auth/SessionStatus.jsx) | Mostra carregamento ou erro/nova tentativa. | Aguarda confirmação da sessão. |
| [tests/frontend_auth.test.mjs](tests/frontend_auth.test.mjs) | Testa cliente HTTP, menus e guardas React. | Verificação com API e perfis simulados. |

## Arquivos modificados

**10 arquivos existentes**, classificados pelas diferenças do Git, considerando alterações preparadas e não preparadas para commit.

| Caminho | O que mudou | Por que existe / uso |
|---|---|---|
| [.gitignore](.gitignore) | Acrescentou `.venv/` ao ignore. | Ambiente Python fora do versionamento. |
| [backend/app.py](backend/app.py) | Integra configuração, CORS restrito, CSRF, autorização e erros. | Inicialização e proteção do Flask. |
| [backend/database/schema.sql](backend/database/schema.sql) | Substituiu SQL antigo pelas dez tabelas aprovadas. | Estrutura relacional sem exclusões ou migrações. |
| [backend/login.py](backend/login.py) | Implementa sessão, `/csrf`, login, `/me` e logout. | Ciclo de autenticação; ativação antiga não publicada. |
| [backend/resources/database_connection.py](backend/resources/database_connection.py) | Encaminha a conexão antiga ao módulo compartilhado. | Compatibilidade dos imports legados. |
| [src/App.jsx](src/App.jsx) | Protege rotas e aguarda a sessão inicial. | Controle das páginas acessíveis. |
| [src/main.jsx](src/main.jsx) | Envolve a aplicação em `AuthProvider`. | Compartilhamento da autenticação. |
| [src/pages/Login.jsx](src/pages/Login.jsx) | Integra formulário, erros/envio e aviso de redefinição indisponível. | Login real sem confirmação fictícia de envio. |
| [src/components/Sidebar.jsx](src/components/Sidebar.jsx) | Usa identidade/perfil da sessão e logout real. | Menu conforme as permissões. |
| [vite.config.js](vite.config.js) | Encaminha `/api` ao Flask na porta 5000. | Proxy de desenvolvimento. |

## Fluxo de login

1. Ao abrir/atualizar, React consulta `/api/me`: restaura sessão válida, apresenta login quando ausente ou permite nova tentativa em falha de conexão.
2. Obtém o token em `/api/csrf` e envia RE/senha para `/api/login` com `X-CSRF-Token`. CSRF exige esse valor da sessão para autorizar requisições de escrita.
3. Flask consulta exclusivamente RE e verifica hash da senha, conta ativa, ativação e perfil. No sucesso, troca sessão e token. O cookie, registro de sessão guardado pelo navegador, é assinado, `HttpOnly`, `SameSite=Lax` e `Secure` em produção.
4. React consulta `/api/me` novamente e abre a tela inicial. Colaborador acessa Início, Pedidos, Estoque e Clientes; administrador também acessa Colaboradores, Relatórios, Painel Adm e Perfil. URLs administrativas redirecionam colaborador para o início.
5. Logout chama `/api/logout` e limpa cookie atual e estado React. Token CSRF fica em memória no frontend; `POST/PUT/PATCH/DELETE` sem token correto são bloqueados no Flask. A autorização reconsulta a conta nas chamadas protegidas.

## Banco de dados e usuários iniciais

O [schema](backend/database/schema.sql) define as **10 tabelas aprovadas**, detalhadas na [arquitetura, seção 2](docs/ARQUITETURA_TCC.md). Conforme confirmação do responsável nesta solicitação, o SQL foi executado manualmente no MySQL Workbench.

Os scripts são executados localmente no terminal, um por vez. Ambos pedem RE de quatro dígitos, preservam zeros iniciais e ocultam a senha com `getpass`. Armazenam somente uma representação para verificação da senha (hash Werkzeug), não o texto simples. Recusam duplicações e outra conta existente do mesmo perfil; criam contas ativas e ativadas.

O responsável informou que os dois scripts exibiram sucesso, confirmando a gravação de Administrador e Colaborador no banco. Essa é uma confirmação de execução manual, não um teste realizado pelo agente nesta documentação. Nenhum dado específico das contas é registrado aqui.

## Situação dos testes e pontos de atenção

| Verificação | Evidência e limite |
|---|---|
| Automatizados da etapa A | Registro de 15/10/2026: 55 testes Python e 19 React aprovados, além de build, lint e compilação; banco/API simulados. |
| Ajuste posterior do RE manual | Na execução anterior do ajuste, 10 testes isolados de bootstrap passaram; não somar esse subconjunto ao total da etapa A. |
| HTTP pelo proxy | Registro anterior: `/api/csrf` com 200, `/api/me` anônimo com 401 e login sem CSRF com 403; sem consulta MySQL ou autenticação real. |
| MySQL real e scripts | Responsável confirmou schema manual e sucesso na gravação das duas contas; isso comprova a criação informada, não o login completo. |
| Pendente na aplicação real | Login dos dois perfis, senha incorreta, conta inativa, atualização da página, logout, alternância do menu e URLs administrativas; chaves estrangeiras e restrições CHECK também não foram verificadas pelo agente no banco. |

**Login completo pelo Flask e React ainda não declarado validado.** Nenhum teste foi reexecutado nesta tarefa: somente este documento foi criado, sem scripts, SQL ou alterações em outros arquivos/requisitos.

Inconsistências confirmadas, sem correção:

- Arquitetura §4 ainda descreve ausência de CSRF dedicado; o código implementa token real, conforme T03 e autorização posterior.
- Planejamento cita outros caminhos: contexto/guardas estão em `src/auth/`; blueprints permanecem na raiz de `backend/`.
- Guia antigo descreve RE gerado para colaborador e banco/contas pendentes; ambos os scripts agora pedem RE. O sucesso manual informado é posterior às evidências históricas.
- Páginas de negócio mantêm chamadas diretas e consultas com campos legados. Só a autenticação usa o novo cliente; T12 integral e CRUDs não estão concluídos.

## Preparar o ambiente virtual e criar as contas iniciais

Use o terminal **PowerShell do VS Code**, com Python instalado. A partir da raiz do projeto, entre na pasta do backend:

```powershell
cd backend
```

Se já estiver dentro de `backend`, não repita esse comando. O ambiente virtual é criado localmente pelo Python; os pacotes são baixados ao instalar as dependências.

Crie o ambiente abaixo somente se ainda não existir uma `.venv` dentro de `backend`:

```powershell
python -m venv .venv
```

Ative esse ambiente no terminal atual e instale as dependências:

```powershell
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

Esses comandos preparam `backend/.venv`. Antes de criar as contas, o banco deve estar criado e o arquivo local `backend/.env` deve estar configurado com sua senha do banco. Não compartilhe seu conteúdo.

Execute primeiro o script do **Administrador**, ainda dentro de `backend` e com o ambiente ativo:

```powershell
python .\scripts\create_admin.py
```

Quando o script pedir a confirmação do banco, digite `BANCO CRIADO`. Depois, preencha diretamente no terminal, conforme cada pergunta:

1. Nome.
2. E-mail.
3. RE com exatamente quatro dígitos, preservando zeros à esquerda.
4. Senha com pelo menos oito caracteres.
5. Confirmação da mesma senha.

**A senha e sua confirmação ficam ocultas durante a digitação. É normal não aparecer nada no terminal.** Elas são armazenadas somente como hash; não coloque senhas neste documento ou no Git.

Somente após a mensagem de sucesso do Administrador, execute o script do **Colaborador de teste**:

```powershell
python .\scripts\create_test_collaborator.py
```

Confirme `BANCO CRIADO` e informe novamente nome, e-mail, RE de quatro dígitos, senha e confirmação para essa conta. O RE é informado por quem executa o script nos dois casos.

Guarde os REs exibidos e use as respectivas senhas definidas no terminal ao testar o login. Os scripts recusam duplicações e outra conta já existente do mesmo perfil; se algum falhar, pare e não execute o seguinte antes de resolver o erro.

depois de tudo instalado pessoal, rode na pasta raiz do projeto o npm run start ai vcs coloquem o re e a senha que foi colocado no proprio terminal

