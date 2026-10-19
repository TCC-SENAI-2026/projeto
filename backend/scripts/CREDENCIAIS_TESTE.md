# E-Threads — Credenciais de desenvolvimento (Fase 03)

> **Aviso:** este documento descreve contas de teste do ambiente local do TCC SENAI 2026. Não são credenciais de produção, não devem ser publicadas em serviços de hospedagem e não devem ser reutilizadas em qualquer deploy real.

## 1. Contas padrão

| Perfil | RE | Senha | Nível de acesso |
|---|---|---|---|
| Administrador Teste | `0123` | `12345678` | `administrador` |
| Colaborador Teste  | `0234` | `12345678` | `colaborador` |

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

## 3. Comando único para iniciar o sistema

Da raiz do projeto, após instalar as dependências e configurar o `backend/.env`:

```
npm run start
```

Esse comando faz, em sequência:

1. Localiza o Python da venv (procura em `.venv` da raiz **ou** em `backend/.venv`; funciona em Windows e macOS).
2. Verifica a conexão com o MySQL e se o schema (`backend/database/schema.sql`) foi aplicado.
3. Executa `backend/scripts/criar_usuarios_teste.py` para cadastrar os usuários `0123` e `0234` **somente se ainda não existirem**.
4. Sobe o backend Flask em `http://127.0.0.1:5000`.
5. Sobe o frontend Vite em `http://localhost:5173/`.
6. `Ctrl+C` encerra os dois processos juntos.

**Acessar a aplicação:** abra `http://localhost:5173/` no navegador. O Vite redireciona `/api/*` para o Flask automaticamente.

### Saídas esperadas do bootstrap

Primeira execução contra um banco com schema aplicado:
```
CREATED: 0123 (administrador)
CREATED: 0234 (colaborador)
```

Execuções seguintes (idempotente):
```
SKIP: 0123 ja existe com os mesmos dados
SKIP: 0234 ja existe com os mesmos dados
```

Se algum RE já existir **com dados diferentes** dos descritos acima:
```
CONFLICT: 0123 ja existe com dados diferentes (nome='...', nivel_acesso='...'). Nenhuma alteracao feita; resolva manualmente antes de continuar.
```
O `npm run start` **não** sobrescreve esses dados e **continua** subindo Flask e Vite — a decisão de ajustar o registro é da equipe. Códigos internos do script `criar_usuarios_teste.py`:

- `0` — sucesso (criados ou pulados sem conflito).
- `1` — erro de configuração ou conexão.
- `2` — conflito; nenhum dado foi alterado.

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
python backend/scripts/criar_usuarios_teste.py

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

### Colaborador (`0234`)

Rotas permitidas:
- `/home`
- `/pedidos`, `/pedidos/novo`, `/pedidos/novo/produtos`, `/pedidos/novo/ficha`
- `/estoque`, `/add-estoque`, `/editar-estoque/:id`
- `/clientes`, `/formCliente`

Rotas bloqueadas (redirecionam para `/home`): `/relatorio`, `/formUsuario`, `/perfil`, `/equipe`, `/painel-adm`.

### Administrador (`0123`)

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
| 1 | Login `0123` / `12345678` | Redireciona para `/home`; menu com todas as rotas |
| 2 | Login `0234` / `12345678` | Redireciona para `/home`; menu sem rotas administrativas |
| 3 | Login com senha errada | Mensagem genérica "RE ou senha incorretos." |
| 4 | Login com RE inexistente (`9999`) | Mesma mensagem genérica do item 3 |
| 5 | Logado como `0234`, acessar `/painel-adm` direto pela URL | Redireciona para `/home` |
| 6 | Logado como `0123`, acessar `/painel-adm` | Página renderiza |
| 7 | Após login, pressionar **F5** em qualquer página autenticada | Sessão persiste (consulta `/me` retorna 200) |
| 8 | Fazer logout e tentar acessar `/pedidos` | Redireciona para `/` |
| 9 | DevTools → Console → `document.cookie` | Cookie `session` **não aparece** (é HttpOnly) |
| 10 | DevTools → Network → repetir uma escrita (ex.: cadastrar estoque) sem `X-CSRF-Token` | Resposta 403 "Token CSRF ausente ou inválido." |
| 11 | SQL manual: `UPDATE colaboradores SET ativo=0 WHERE re='0234';` → tentar logar como `0234` | 403 "Conta sem permissão de acesso." Após o teste: `UPDATE colaboradores SET ativo=1 WHERE re='0234';` |

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
- Nunca inclua segredos reais neste documento. As senhas acima são **exclusivamente** para desenvolvimento local.
- Se este projeto for publicado em um servidor compartilhado, **remova as contas `0123` e `0234` do banco** antes do deploy ou use um banco separado.
- O arquivo `backend/.env` fica fora do repositório; cada integrante configura o seu localmente.
