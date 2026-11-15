# E-Threads

Sistema web de gestão e acompanhamento da produção de roupas desenvolvido como projeto acadêmico de TCC. O objetivo principal é permitir o controle de pedidos, estoque, clientes, usuários e solicitações de alteração/exclusão dentro de um fluxo de produção e administração.

> Este README foi alinhado ao estado atual do repositório e não descreve uma solução perfeita ou totalmente finalizada. O projeto é uma base funcional em evolução, com arquitetura definida e validações em andamento.

---

## Visão geral

O E-Threads combina:

- Frontend em React + Vite
- Backend em Python + Flask
- Banco de dados MySQL
- Autenticação por sessão do Flask
- Fluxos para pedidos, estoque, clientes, colaboradores e relatórios

A aplicação foi pensada para uso operacional em uma empresa de confecção/produção, com foco em organização interna, controle de produção e acompanhamento de regras de negócio.

---

## Stack tecnológica

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [React Router DOM](https://reactrouter.com/)
- [Python](https://www.python.org/)
- [Flask](https://flask.palletsprojects.com/)
- [MySQL](https://www.mysql.com/)
- [mysql-connector-python](https://pypi.org/project/mysql-connector-python/)
- [python-dotenv](https://pypi.org/project/python-dotenv/)
- [Pillow](https://pypi.org/project/Pillow/)
- [Chart.js](https://www.chartjs.org/)
- [jspdf](https://github.com/parallax/jsPDF)
- [qrcode.react](https://www.npmjs.com/package/qrcode.react)

---

## Funcionalidades principais

- Login e autenticação de colaboradores
- Sessão com controle de acesso por perfil
- Dashboard de início
- Criação e acompanhamento de pedidos
- Seleção de produtos e fichas técnicas
- Gestão de estoque e movimentações
- Cadastro e manutenção de clientes
- Gestão de equipe/colaboradores (área administrativa)
- Controle de solicitações de edição e exclusão
- Relatórios e indicadores
- Upload de imagens relacionadas a itens, clientes e artes

---

## Estrutura do projeto

```text
projeto/
├── backend/
│   ├── .env.example
│   ├── app.py
│   ├── config.py
│   ├── requirements.txt
│   ├── database/
│   ├── auth/
│   ├── scripts/
│   ├── static/
│   └── ...
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── auth/
│   ├── hooks/
│   ├── styles/
│   ├── App.jsx
│   └── main.jsx
├── docs/
│   ├── ARQUITETURA_TCC.md
│   ├── ACOMPANHAMENTO_REQUISITOS.md
│   └── ...
├── package.json
├── vite.config.js
├── README.md
├── requisitos.txt
├── contexto-projeto.txt
└── ...
```

---

## Pré-requisitos

Antes de iniciar, certifique-se de ter instalado:

- [Node.js](https://nodejs.org/) (versão LTS recomendada)
- [npm](https://www.npmjs.com/)
- [Python 3](https://www.python.org/downloads/)
- [Git](https://git-scm.com/)
- MySQL em execução local ou disponível para conexão

---

## Configuração do ambiente

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd projeto
```

### 2. Crie o ambiente virtual do backend

```bash
python -m venv .venv
```

Ative o ambiente virtual:

- Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

- Windows CMD:

```cmd
.venv\Scripts\activate.bat
```

- Linux/macOS:

```bash
source .venv/bin/activate
```

### 3. Instale as dependências do backend

```bash
pip install -r backend/requirements.txt
```

### 4. Configure as variáveis de ambiente

Copie o exemplo do backend para o ambiente local:

```bash
copy backend\.env.example backend\.env
```

Ou no Linux/macOS:

```bash
cp backend/.env.example backend/.env
```

Edite o arquivo `backend/.env` com os dados do banco e da aplicação, por exemplo:

```env
APP_ENV=development
SECRET_KEY=sua_chave_local
FRONTEND_ORIGIN=http://localhost:5173
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=ethreads_db
```

> O arquivo `.env` não deve ser commitado. Ele fica localmente no ambiente do projeto.

### 5. Instale as dependências do frontend

```bash
npm install
```

---

## Como executar o projeto

### Opção 1: iniciar backend e frontend em terminais separados

Terminal 1 — Backend Flask:

```bash
python backend/app.py
```

Terminal 2 — Frontend Vite:

```bash
npm run dev -- --host
```

A interface ficará disponível em:

- Frontend: http://localhost:5173
- Backend: http://127.0.0.1:5000

### Opção 2: iniciar pela rotina do projeto

```bash
npm start
```

Esse comando utiliza o script localizado em `backend/scripts/iniciar_sistema.cjs` para localizar a virtualenv Python e iniciar o sistema com a estrutura do projeto.

---

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm install` | Instala dependências do frontend |
| `npm run dev -- --host` | Inicia o ambiente Vite para desenvolvimento |
| `npm start` | Inicia o sistema usando a rotina de bootstrap do projeto |
| `python backend/app.py` | Inicia a API Flask diretamente |
| `pip install -r backend/requirements.txt` | Instala dependências do backend |

---

## Fluxo principal do sistema

1. O usuário acessa o sistema e faz login.
2. A autenticação usa sessão no Flask e valida o colaborador ativo.
3. O frontend realiza chamadas para a API via proxy do Vite.
4. O backend valida permissões, regras de negócio e conexão com o MySQL.
5. O sistema permite gestão de pedidos, estoque, clientes e solicitações conforme o perfil do usuário.

---

## Observações importantes

- O projeto é acadêmico e está em evolução constante.
- A documentação foi mantida com foco no que realmente existe no repositório e no que foi estruturado até o momento.
- O sistema ainda exige validação prática com banco real e testes funcionais em ambiente local.
- Algumas áreas podem estar parcialmente implementadas ou dependentes de ajustes na execução real.

---

## Documentação complementar

Para entender melhor a arquitetura e o acompanhamento do desenvolvimento, consulte:

- [docs/ARQUITETURA_TCC.md](docs/ARQUITETURA_TCC.md)
- [docs/ACOMPANHAMENTO_REQUISITOS.md](docs/ACOMPANHAMENTO_REQUISITOS.md)
- [requisitos.txt](requisitos.txt)
