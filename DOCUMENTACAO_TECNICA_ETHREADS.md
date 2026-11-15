# DOCUMENTAÇÃO TÉCNICA DO E-THREADS

## Trabalho de Conclusão de Curso — SENAI

**Projeto:** E-Threads — sistema web de gestão e acompanhamento da produção de roupas  
**Data de revisão:** 14 de novembro de 2026  
**Branch observada:** `teste`  
**Objetivo:** registrar o estado real do projeto, com foco no que já existe no repositório, no que foi planejado e no que ainda está pendente.

> Limite importante: esta documentação foi escrita de forma realista e fiel ao código e aos documentos oficiais. Ela não descreve um sistema perfeito nem concluído; descreve o projeto como ele realmente está estruturado, implementado e em andamento.

---

## 1. Visão geral

O E-Threads é um sistema web de apoio à gestão de uma confecção, com foco em:

- cadastro e manutenção de clientes;
- criação e acompanhamento de pedidos;
- gestão de estoque e movimentações;
- cadastro e controle de colaboradores;
- autenticação por RE + senha;
- solicitações administrativas de edição e exclusão;
- relatórios e indicadores de produção.

O projeto está organizado em duas camadas principais:

- Frontend em React + Vite + JavaScript
- Backend em Python + Flask
- Banco de dados em MySQL

A documentação foi revisada com base em:

- `src/`
- `backend/`
- `tests/`
- `docs/ARQUITETURA_TCC.md`
- `docs/ACOMPANHAMENTO_REQUISITOS.md`
- `package.json`
- `backend/requirements.txt`
- `backend/config.py`
- `vite.config.js`

---

## 2. Status geral do projeto

### 2.1 Implementado no código

É possível identificar no repositório a presença de infraestrutura e módulos para:

- frontend React com páginas e componentes;
- backend Flask com módulos por domínio;
- estrutura de configuração e ambiente;
- conexão com MySQL;
- autenticação e autorização por sessão;
- módulos de clientes, pedidos, estoque e colaboradores;
- testes automatizados em diferentes áreas.

### 2.2 Parcialmente implementado

Alguns módulos e fluxos aparecem com estrutura e intenção definidas, mas ainda exigem validação real em ambiente funcional, como por exemplo:

- fluxo completo de autenticação em execução;
- aprovação e recusa de solicitações;
- criação e atualização de pedidos no banco real;
- gerenciamento completo de estoque e movimentações;
- geração e visualização de relatórios com dados reais;
- integração com SMTP e Cloudinary.

### 2.3 Planejado / futuras melhorias

Há elementos previstos na arquitetura e no planejamento, mas ainda não consolidados como implementação final no projeto atual, por exemplo:

- melhoria contínua da segurança e validação de fluxos de aprovação;
- refinamento de regras de negócio e cobertura de testes;
- expansão de relatórios e dashboard administrativo;
- ajustes finais de UX e usabilidade nas telas;
- refinamento de integração externa e ambiente de produção.

### 2.4 Limitações reais do projeto

O projeto não deve ser apresentado como perfeito ou plenamente concluído. Ele tem caráter acadêmico e funcional, com arquitetura adequada, mas ainda exige validação em ambiente real para confirmar funcionamento completo.

---

## 3. Stack tecnológica

### 3.1 Frontend

- React
- Vite
- JavaScript
- React Router DOM
- Axios
- Chart.js
- jspdf / jspdf-autotable
- qrcode.react

### 3.2 Backend

- Python
- Flask
- Flask-Cors
- mysql-connector-python
- python-dotenv
- Werkzeug
- QR Code

### 3.3 Banco de dados

- MySQL

### 3.4 Integrações e utilidades

- Cloudinary para imagens
- SMTP/Gmail para envio de e-mail
- Sessão Flask para autenticação
- Proxy do Vite com encaminhamento para `/api`

---

## 4. Estrutura do repositório

```text
projeto/
├── AGENTS.md
├── CLAUDE.md
├── README.md
├── DOCUMENTACAO_TECNICA_ETHREADS.md
├── requisitos.txt
├── contexto-projeto.txt
├── itens_faltantes.txt
├── package.json
├── vite.config.js
├── start.sh
├── eslint.config.js
├── index.html
├── public/
│   └── img/
├── src/
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   ├── main.jsx
│   ├── auth/
│   ├── components/
│   ├── hooks/
│   ├── pages/
│   ├── services/
│   ├── styles/
│   └── utils/
├── backend/
│   ├── app.py
│   ├── config.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── auth/
│   ├── database/
│   ├── resources/
│   ├── scripts/
│   ├── static/
│   ├── tests/
│   ├── catalogo.py
│   ├── clientes.py
│   ├── colaboradores.py
│   ├── estoque.py
│   ├── login.py
│   ├── pedidos.py
│   ├── perfil.py
│   ├── relatorios.py
│   └── solicitacoes.py
├── docs/
│   ├── ARQUITETURA_TCC.md
│   └── ACOMPANHAMENTO_REQUISITOS.md
└── tests/
    ├── frontend_auth.test.mjs
    ├── foto_colaborador.test.mjs
    ├── foto_produto_estoque.test.mjs
    ├── pedidos_estoque.test.mjs
    ├── perfil.test.mjs
    ├── tecidos_estoque.test.mjs
    └── ...
```

---

## 5. Arquitetura geral

### 5.1 Frontend

O frontend fica em `src/` e está organizado em:

- páginas em `src/pages/`
- autenticação em `src/auth/`
- componentes reutilizáveis em `src/components/`
- serviços de API em `src/services/`
- estilos em `src/styles/`
- utilitários e hooks em `src/hooks/` e `src/utils/`

A navegação do sistema utiliza React Router, e a comunicação com o backend é feita via `axios` ou fetch, conforme o módulo.

### 5.2 Backend

O backend fica em `backend/` e é estruturado em módulos por responsabilidade.

Pontos importantes observados:

- `backend/app.py`: ponto de entrada principal do Flask e registro dos módulos;
- `backend/config.py`: leitura das variáveis de ambiente e configurações globais;
- `backend/database/`: conexão e schema do banco;
- `backend/auth/`: decorators de autenticação e autorização;
- `backend/resources/`: utilitários compartilhados, segurança, e-mail e imagens;
- `backend/scripts/`: utilitários de bootstrap e ambiente;
- `backend/tests/`: testes de backend e regras de negócio.

### 5.3 Comunicação entre frontend e backend

A configuração de proxy em `vite.config.js` permite que o navegador chame rotas do tipo `/api/...` sem precisar lidar com CORS de origem cruzada.

O fluxo arquitetural observado é:

1. O usuário navega na interface React.
2. O frontend envia requisições para o backend Flask.
3. O Flask valida sessão, permissões e regras do negócio.
4. Os dados são consultados ou persistidos no MySQL.
5. O frontend renderiza os dados em tela.

---

## 6. Modelo de dados e banco

A arquitetura do projeto foi pensada para um banco relacional MySQL, com modelagem própria para as operações de gestão da confecção.

As entidades principais esperadas na modelagem do sistema são:

- `colaboradores`
- `tokens`
- `clientes`
- `catalogo_itens`
- `pedidos`
- `pedido_itens`
- `pedido_item_tamanhos`
- `estoque`
- `estoque_movimentacoes`
- `solicitacoes`

O desenho corresponde ao descrito em `docs/ARQUITETURA_TCC.md` e ao schema em `backend/database/schema.sql`.

### 6.1 Regras arquiteturais importantes

- autenticação por RE + senha;
- sessão Flask com cookie HttpOnly;
- permissões por nível de acesso (`administrador` e `colaborador`);
- aprovações de edição/exclusão via tabela de solicitações;
- rastreio de movimentação de estoque;
- uso de `soft delete`/flags de ativação ao invés de exclusão definitiva em alguns fluxos;
- separação de produção/negócio de status e solicitação administrativa.

### 6.2 Observações de implementação

A estrutura correta do banco e suas constraints são definidas em documentação e no schema, mas a validação real depende de um ambiente MySQL funcional e da execução de migração/schema no ambiente local.

---

## 7. Autenticação e segurança

### 7.1 Mecanismo de autenticação

A aplicação utiliza sessão Flask, em vez de JWT em `localStorage`.

Essa decisão é coerente com o tipo de aplicação:

- há upload de imagens e dados sensíveis;
- há risco maior de XSS em armazenamento client-side;
- cookie `HttpOnly` reduz a exposição do token/sessão para scripts do navegador.

### 7.2 Controles observados

- cookie com `HttpOnly`;
- uso de `SameSite=Lax`;
- CORS configurado para a origem do frontend;
- decorators para autenticação e autorização;
- verificação no backend para rotas administrativas;
- validação de sessão em cada requisição protegida.

### 7.3 Limitações documentadas

- a autenticação e autorização precisam ser validadas em ambiente real com MySQL ativo;
- a proteção CSRF deve ser confirmada conforme a implementação efetiva das rotas e do front;
- a arquitetura da sessão é stateless e pode exigir atenção em cenários de revogação ou logout em múltiplos dispositivos.

---

## 8. Fluxos principais do sistema

### 8.1 Gestão de clientes

O cliente é tratado como entidade central para pedidos e histórico. O fluxo envolve:

- cadastro;
- busca e filtro;
- relacionamento com pedidos;
- edição de status e atividade.

### 8.2 Gestão de pedidos

A criação e acompanhamento de pedidos envolve:

- cadastro do cliente associado;
- seleção de produto/itens;
- definição de tamanhos, quantidades e observações;
- envio para produção;
- consulta de ficha técnica;
- alteração ou exclusão por solicitação administrativa.

### 8.3 Estoque

O módulo de estoque controla:

- itens de produto e material;
- quantidade atual e quantidade mínima;
- movimentações de entrada e saída;
- status calculado conforme regra de disponibilidade;
- aprovação administrativa para ajustes e exclusão de itens.

### 8.4 Colaboradores e permissões

O módulo administrativo controla:

- cadastro de colaboradores;
- níveis de acesso;
- ativação de conta;
- login por RE;
- gestão de solicitações pendentes.

### 8.5 Solicitações administrativas

A aplicação prevê uma camada de aprovação para ações sensíveis, como:

- edição de pedido;
- exclusão de pedido;
- movimentação especial no estoque;
- exclusão de item do estoque.

O padrão arquitetural é criar uma solicitação em vez de alterar diretamente o registro principal antes da aprovação.

### 8.6 Relatórios

Os relatórios são lidos a partir de consultas agregadas sobre pedidos e estoque, sem criação de tabela específica para relatórios, seguindo o desenho da arquitetura do projeto.

---

## 9. Frontend: organização por módulos

### 9.1 Estrutura funcionalmente relevante

Dentro de `src` há módulos para:

- autenticação e sessão
- clientes
- pedidos
- estoque
- equipe/colaboradores
- perfil
- relatórios
- visualização de fotos/imagens e documentos

### 9.2 Padrão observado

O projeto combina:

- componentes reutilizáveis em `src/components/`
- páginas específicas em `src/pages/`
- serviços encapsulados em `src/services/`
- estilos específicos por módulo em `src/styles/`

Essa estrutura é adequada para um TCC e facilita manutenção incremental.

---

## 10. Backend: módulos principais

### 10.1 `backend/app.py`

Responsável por:

- criar o app Flask;
- carregar configurações;
- inicializar banco e autenticação;
- registrar blueprints;
- configurar CORS e middlewares.

### 10.2 `backend/config.py`

Centraliza leitura do ambiente e configuração da aplicação. O arquivo considera:

- `SECRET_KEY`
- `FRONTEND_ORIGIN`
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `SMTP_*` para integrações futuras

### 10.3 `backend/database/connection.py`

Responsável pela conexão com MySQL, com uso de pool de conexões e cursor em formato dicionário para facilitar JSON e leitura de dados.

### 10.4 `backend/resources/`

Contém utilitários compartilhados.

Exemplos típicos:

- `seguranca.py`
- `email_service.py`
- `controle_estoque.py`
- `foto_colaborador.py`

### 10.5 `backend/scripts/`

Scripts de ambiente e bootstrap para:

- criação de usuários de teste;
- criação de admin;
- setup de ambiente e inicialização.

---

## 11. Execução local

### 11.1 Pré-requisitos

- Node.js 18+
- npm
- Python 3.10+
- MySQL local ou acessível
- Git

### 11.2 Dependências do frontend

```bash
npm install
```

### 11.3 Dependências do backend

```bash
python -m venv .venv
python -m pip install -r backend/requirements.txt
```

### 11.4 Variáveis de ambiente

O backend lê sua configuração a partir de `backend/.env`, com base em `backend/.env.example`.

Exemplo:

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

### 11.5 Iniciando o sistema

Frontend:

```bash
npm run dev
```

Backend:

```bash
npm start
```

ou diretamente:

```bash
python backend/app.py
```

---

## 12. Observações de qualidade e implementação

### 12.1 O que está bem estruturado

- separação entre frontend e backend
- manutenção de módulos por responsabilidade
- uso de documentação arquitetural
- organização de scripts e recursos
- uso de sessão Flask e decorators de autenticação

### 12.2 O que ainda precisa de validação real

- funcionamento do MySQL em ambiente real
- execução de migração/schema
- ações de login/logout
- fluxos de criação de pedido
- aprovação de solicitações
- edição e exclusão de itens do estoque
- e-mail SMTP
- integração com Cloudinary
- comportamento real de front e back em navegação

### 12.3 Ideias futuras de implementação

Estas são melhorias e evoluções possíveis, mas não fazem parte do escopo irrealista do projeto atual:

- expansão de relatórios e dashboards analíticos;
- refinamento do processo de autenticação e recuperação de senha;
- melhoria contínua de regras e fluxos de aprovação;
- otimização de performance e filtros de listas grandes;
- mais cobertura de testes automatizados e validações de regressão;
- maior automação de deploy e ambiente de produção;
- evolução de integrações externas e auditoria operacional.

---

## 13. Limitações conhecidas

- Dependência de MySQL configurado e acessível.
- Necessidade de arquivo `.env` local com credenciais válidas.
- Integrações externas dependem de chaves e contas reais.
- Alguns módulos ainda exigem validação funcional e testes de regressão.
- Documentação e código devem continuar sendo mantidos em sincronia conforme o produto evolui.

---

## 14. Testes e evidência

O repositório contém testes automatizados em `backend/tests/` e em `tests/` para partes relevantes do sistema. Ainda assim, os testes devem ser interpretados com cautela:

- alguns podem usar mocks;
- alguns dependem de estrutura do banco local;
- a validação ponta a ponta precisa ser feita em ambiente de execução real.

A evidência real de funcionamento deve incluir:

- login com RE e senha;
- acesso administrativo e bloqueios de colaborador comum;
- criação de cliente;
- criação de pedido;
- movimentação de estoque;
- aprovação/rejeição de solicitações;
- geração e leitura dos relatórios.

---

## 15. Conclusão

O E-Threads está estruturado como um sistema web para gestão de produção e operação de confecção, com separação clara entre frontend, backend, banco de dados e documentação técnica.

A arquitetura atual é coerente com os objetivos do TCC e com o desenho documentado em `docs/ARQUITETURA_TCC.md`. O projeto está em fase de implementação e validação, e a próxima etapa principal é a confirmação de comportamento real em ambiente de execução com MySQL e interfaces funcionando de ponta a ponta.

O documento foi escrito para refletir a realidade do projeto: há uma base sólida, módulos definidos, documentação e estrutura apropriadas para um TCC, mas ainda há pendências, limitações e melhorias futuras que precisam ser reconhecidas de forma honesta.
