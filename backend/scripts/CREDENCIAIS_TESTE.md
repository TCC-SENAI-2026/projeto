# E-Threads — Credenciais de desenvolvimento (Fase 03)

> **Aviso:** este documento descreve contas de teste do ambiente local do TCC SENAI 2026. Não são credenciais de produção, não devem ser publicadas em serviços de hospedagem e não devem ser reutilizadas em qualquer deploy real.

## 1. Contas padrão

| Perfil | RE | Senha | Nível de acesso |
|---|---|---|---|
| Administrador Teste | `100000` | Definida no terminal | `administrador` |


- O RE é tratado como **texto** (preserva zeros à esquerda).
- A senha é armazenada no MySQL com hash seguro (`werkzeug.security.generate_password_hash`); nunca em texto puro.

## 2. Pré-requisitos

1. **MySQL 8.0+** rodando localmente (confirmado 8.0.46 em `backend/EVIDENCIAS_ETAPA_A.md`).
2. **Schema aplicado** manualmente pelo responsável no MySQL Workbench a partir de `backend/database/schema.sql`.
3. **Arquivo `backend/.env`** com as variáveis `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` configuradas. Veja `backend/.env.example` para o modelo (sem segredos).
4. **Dependências Python instaladas** na `.venv` local:
   ```
   pip install -r backend/requirements.txt
   ```

## 3. Criação das contas e inicialização

Da raiz do projeto, após instalar as dependências e configurar o `backend/.env`:

```powershell
.\.venv\Scripts\python.exe backend/scripts/create_admin.py
npm run start
```

O primeiro comando cria o administrador inicial com RE `100000`. Informe o nome, o e-mail e a senha escolhida no terminal. Use essa conta para cadastrar colaboradores em **Equipe**.

O `npm run start` verifica a conex?o com o MySQL e inicia o Flask e o Vite. A aplica??o fica dispon?vel em `http://localhost:5173/`.

### Mensagens de erro possíveis em `npm run start`

| Mensagem | Causa provável | Como resolver |
|---|---|---|
| `Ambiente virtual Python nao encontrado.` | Falta criar a venv. | `python -m venv .venv` ou `python -m venv backend/.venv` + `pip install -r backend/requirements.txt` |
| `Dependencia Python ausente: ...` | Falta instalar `requirements.txt` na venv. | `pip install -r backend/requirements.txt` |
| `Configuracao invalida: Configure DB_USER e DB_PASSWORD no ambiente local.` | `backend/.env` incompleto. | Preencher as variáveis `DB_*` em `backend/.env` (ver `backend/.env.example`). |
| `Nao foi possivel conectar ao MySQL.` | Serviço do MySQL off ou credenciais erradas. | Iniciar o MySQL; conferir host/porta/usuário/senha. |
| `A tabela 'colaboradores' nao existe no banco configurado.` | Schema ainda não aplicado. | Aplicar `backend/database/schema.sql` no MySQL Workbench. |

## 4. Debug: iniciar componentes separadamente

Se precisar isolar Flask ou Vite para diagnóstico:

```
# Só o bootstrap de usuários (sem subir servidores)
python backend/scripts/create_admin.py

# Só o backend Flask
python backend/app.py

# Só o frontend Vite
npm run dev
```

## 5. Como logar e deslogar

### Login

1. Acesse `http://localhost:5173/`.
2. Preencha **RE** e **Senha** com uma das contas da seção 1.
3. Clique em **Entrar**.
4. Será redirecionado para `/home` (dashboard).

### Logout

1. Na barra lateral, clique no botão de **sair**.
2. A sessão é encerrada no backend (cookie expira imediatamente); qualquer rota protegida passa a redirecionar para `/`.

## 6. Permissões por perfil

### Colaborador cadastrado em Equipe

Rotas permitidas:
- `/home`
- `/pedidos`, `/pedidos/novo`, `/pedidos/novo/produtos`, `/pedidos/novo/ficha`
- `/estoque`, `/add-estoque`, `/editar-estoque/:id`
- `/clientes`, `/formCliente`

Rotas bloqueadas (redirecionam para `/home`): `/relatorio`, `/formUsuario`, `/equipe`, `/painel-adm`.

### Administrador (`100000`)

Todas as rotas acima **mais**:
- `/relatorio`
- `/formUsuario`
- `/perfil`
- `/equipe`
- `/painel-adm`

> A proteção acontece em dois lugares: `src/auth/ProtectedRoute.jsx` (navegação do React) e `backend/auth/decorators.py` (relê `nivel_acesso` e `ativo` do banco a cada requisição protegida). O frontend sozinho não autoriza — o backend sempre valida.

## 7. Roteiro de testes manuais (D6)

Com o Flask e o Vite rodando, verificar no navegador:

| # | Cenário | Resultado esperado |
|---|---|---|
| 1 | Login `100000` com a senha escolhida | Redireciona para `/home`; menu com todas as rotas |
| 2 | Login com RE e senha do colaborador cadastrado | Redireciona para `/home`; menu sem rotas administrativas |
| 3 | Login com senha errada | Mensagem genérica "RE ou senha incorretos." |
| 4 | Login com RE inexistente (`9999`) | Mesma mensagem genérica do item 3 |
| 5 | Logado como colaborador, acessar `/painel-adm` direto pela URL | Redireciona para `/home` |
| 6 | Logado como `100000`, acessar `/painel-adm` | Página renderiza |
| 7 | Após login, pressionar **F5** em qualquer página autenticada | Sessão persiste (consulta `/me` retorna 200) |
| 8 | Fazer logout e tentar acessar `/pedidos` | Redireciona para `/` |
| 9 | DevTools → Console → `document.cookie` | Cookie `session` **não aparece** (é HttpOnly) |
| 10 | DevTools → Network → repetir uma escrita (ex.: cadastrar estoque) sem `X-CSRF-Token` | Resposta 403 "Token CSRF ausente ou inválido." |

## 8. Testes automatizados

Para confirmar que a infraestrutura de autenticação continua passando:

```
# Backend (55 testes, banco simulado por mock)
cd backend && python -m unittest discover -s tests -v

# Frontend (19 testes, fetch simulado)
node --test tests/frontend_auth.test.mjs
```

Esses testes **não** conectam ao MySQL real; validam a lógica isolada. A validação end-to-end do item 7 (acima) é obrigatória antes de considerar a Fase 03 concluída.

## 9. Segurança — lembretes

- Nunca commite `backend/.env` (já está no `.gitignore`).
- Nunca inclua senhas neste documento.
- Para a instalação da empresa, use um banco separado e provisione o administrador com `create_admin.py`.
- O arquivo `backend/.env` fica fora do repositório; cada integrante configura o seu localmente.
