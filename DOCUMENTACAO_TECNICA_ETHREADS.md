# DOCUMENTAÇÃO TÉCNICA DO E-THREADS

## Trabalho de Conclusão de Curso — SENAI

**Projeto:** E-Threads — sistema web de gestão e acompanhamento da produção de roupas
**Data de revisão:** 14 de novembro de 2026
**Branch observada:** `teste`
**Objetivo:** registrar a arquitetura, estrutura, fluxos de negócio e dependências reais do projeto, com base no repositório atual e nos documentos de referência.

> Limite importante: esta documentação descreve o estado técnico observado no repositório e as decisões de arquitetura aprovadas. Ela não substitui a validação funcional em ambiente real com banco MySQL e execução do sistema completo.

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

A aplicação está organizada em duas camadas principais:

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

## 2. Stack tecnológica

### 2.1 Frontend

- React
- Vite
- JavaScript
- React Router DOM
- Axios
- Chart.js
- jspdf / jspdf-autotable
- qrcode.react

### 2.2 Backend

- Python
- Flask
- Flask-Cors
- mysql-connector-python
- python-dotenv
- Werkzeug
- QR Code

### 2.3 Banco de dados

- MySQL

### 2.4 Integrações e utilidades

- Cloudinary para imagens
- SMTP/Gmail para envio de e-mail
- Sessão Flask para autenticação
- Proxy do Vite com encaminhamento para `/api`

---

## 3. Estrutura do repositório

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

## 4. Arquitetura geral

### 4.1 Frontend

O frontend fica em `src/` e está organizado em:

- páginas em `src/pages/`
- autenticação em `src/auth/`
- componentes reutilizáveis em `src/components/`
- serviços de API em `src/services/`
- estilos em `src/styles/`
- utilitários e hooks em `src/hooks/` e `src/utils/`

A navegação do sistema utiliza React Router, e a comunicação com o backend é feita via `axios` ou fetch, conforme o módulo.

### 4.2 Backend

O backend fica em `backend/` e é estruturado em módulos por responsabilidade.

Pontos importantes observados:

- `backend/app.py`: ponto de entrada principal do Flask e registro dos módulos;
- `backend/config.py`: leitura das variáveis de ambiente e configurações globais;
- `backend/database/`: conexão e schema do banco;
- `backend/auth/`: decorators de autenticação e autorização;
- `backend/resources/`: utilitários compartilhados, segurança, e-mail e imagens;
- `backend/scripts/`: utilitários de bootstrap e ambiente;
- `backend/tests/`: testes de backend e regras de negócio.

### 4.3 Comunicação entre frontend e backend

A configuração de proxy em `vite.config.js` permite que o navegador chame rotas do tipo `/api/...` sem precisar lidar com CORS de origem cruzada.

A arquitetura indica fluxo como:

1. O usuário navega na interface React.
2. O frontend envia requisições para o backend Flask.
3. O Flask valida sessão, permissões e regras do negócio.
4. Os dados são consultados ou persistidos no MySQL.
5. O frontend renderiza os dados em tela.

---

## 5. Modelo de dados e banco

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

### 5.1 Regras arquiteturais importantes

- autenticação por RE + senha;
- sessão Flask com cookie HttpOnly;
- permissões por nível de acesso (`administrador` e `colaborador`);
- aprovações de edição/exclusão via tabela de solicitações;
- rastreio de movimentação de estoque;
- uso de `soft delete`/flags de ativação ao invés de exclusão definitiva em alguns fluxos;
- separação de produção/negócio de status e solicitação administrativa.

### 5.2 Observações de implementação

A estrutura correta do banco e suas constraints são definidas em documentação e no schema, mas a validação real depende de um ambiente MySQL funcional e da execução de migração/schema no ambiente local.

---

## 6. Autenticação e segurança

### 6.1 Mecanismo de autenticação

A aplicação utiliza sessão Flask, em vez de JWT em `localStorage`.

Essa decisão é coerente com o tipo de aplicação:

- há upload de imagens e dados sensíveis;
- há risco maior de XSS em armazenamento client-side;
- cookie `HttpOnly` reduz a exposição do token/sessão para scripts do navegador.

### 6.2 Controles observados

- cookie com `HttpOnly`;
- uso de `SameSite=Lax`;
- CORS configurado para a origem do frontend;
- decorators para autenticação e autorização;
- verificação no backend para rotas administrativas;
- validação de sessão em cada requisição protegida.

### 6.3 Limitações documentadas

- a autenticação e autorização precisam ser validadas em ambiente real com MySQL ativo;
- a proteção CSRF deve ser confirmada conforme a implementação efetiva das rotas e do front;
- a arquitetura da sessão é stateless e pode exigir atenção em cenários de revogação ou logout em múltiplos dispositivos.

---

## 7. Fluxos principais do sistema

### 7.1 Gestão de clientes

O cliente é tratado como entidade central para pedidos e histórico. O fluxo envolve:

- cadastro;
- busca e filtro;
- relacionamento com pedidos;
- edição de status e atividade.

### 7.2 Gestão de pedidos

A criação e acompanhamento de pedidos envolve:

- cadastro do cliente associado;
- seleção de produto/itens; 
- definição de tamanhos, quantidades e observações;
- envio para produção;
- consulta de ficha técnica;
- alteração ou exclusão por solicitação administrativa.

### 7.3 Estoque

O módulo de estoque controla:

- itens de produto e material;
- quantidade atual e quantidade mínima;
- movimentações de entrada e saída;
- status calculado conforme regra de disponibilidade;
- aprovação administrativa para ajustes e exclusão de itens.

### 7.4 Colaboradores e permissões

O módulo administrativo controla:

- cadastro de colaboradores;
- níveis de acesso;
- ativação de conta;
- login por RE;
- gestão de solicitações pendentes.

### 7.5 Solicitações administrativas

A aplicação prevê uma camada de aprovação para ações sensíveis, como:

- edição de pedido;
- exclusão de pedido;
- movimentação especial no estoque;
- exclusão de item do estoque.

O padrão arquitetural é criar uma solicitação em vez de alterar diretamente o registro principal antes da aprovação.

### 7.6 Relatórios

Os relatórios são lidos a partir de consultas agregadas sobre pedidos e estoque, sem criação de tabela específica para relatórios, seguindo o desenho da arquitetura do projeto.

---

## 8. Frontend: organização por módulos

### 8.1 Estrutura funcionalmente relevante

Dentro de `src` há módulos para:

- autenticação e sessão
- clientes
- pedidos
- estoque
- equipe/colaboradores
- perfil
- relatórios
- visualização de fotos/imagens e documentos

### 8.2 Padrão observado

O projeto combina:

- componentes reutilizáveis em `src/components/`
- páginas específicas em `src/pages/`
- serviços encapsulados em `src/services/`
- estilos específicos por módulo em `src/styles/`

Essa estrutura é adequada para um TCC e facilita manutenção incremental.

---

## 9. Backend: módulos principais

### 9.1 `backend/app.py`

Responsável por:

- criar o app Flask;
- carregar configurações;
- inicializar banco e autenticação;
- registrar blueprints;
- configurar CORS e middlewares.

### 9.2 `backend/config.py`

Centraliza leitura do ambiente e configuração da aplicação. O arquivo considera:

- `SECRET_KEY`
- `FRONTEND_ORIGIN`
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `SMTP_*` para integrações futuras

### 9.3 `backend/database/connection.py`

Responsável pela conexão com MySQL, com uso de pool de conexões e cursor em formato dicionário para facilitar JSON e leitura de dados.

### 9.4 `backend/resources/`

Contém utilitários compartilhados.

Exemplos típicos:

- `seguranca.py`
- `email_service.py`
- `controle_estoque.py`
- `foto_colaborador.py`

### 9.5 `backend/scripts/`

Scripts de ambiente e bootstrap para:

- criação de usuários de teste;
- criação de admin;
- setup de ambiente e inicialização.

---

## 10. Execução local

### 10.1 Pré-requisitos

- Node.js 18+
- npm
- Python 3.10+
- MySQL local ou acessível
- Git

### 10.2 Dependências do frontend

```bash
npm install
```

### 10.3 Dependências do backend

```bash
python -m venv .venv
python -m pip install -r backend/requirements.txt
```

### 10.4 Variáveis de ambiente

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

### 10.5 Iniciando o sistema

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

## 11. Observações de qualidade e implementação

### 11.1 O que está bem estruturado

- separação entre frontend e backend
- manutenção de módulos por responsabilidade
- uso de documentação arquitetural
- organização de scripts e recursos
- uso de sessão Flask e decorators de autenticação

### 11.2 O que ainda precisa de validação real

- funcionamento do MySQL em ambiente real
- execução de migração/schema
- ações de login/logout
- fluxos de criação de pedido
- aprovação de solicitações
- edição e exclusão de itens do estoque
- e-mail SMTP
- integração com Cloudinary
- comportamento real de front e back em navegação

### 11.3 Indicadores de maturidade

O projeto está em fase de implementação/validação, com estrutura adequada para um TCC funcional. O que ainda impede uma conclusão definitiva é a ausência de evidência final de execução completa em ambiente real com banco e fluxos de usuário validados.

---

## 12. Limitações conhecidas

- Dependência de MySQL configurado e acessível.
- Necessidade de arquivo `.env` local com credenciais válidas.
- Integrações externas dependem de chaves e contas reais.
- Alguns módulos ainda exigem validação funcional e testes de regressão.
- Documentação e código devem continuar sendo mantidos em sincronia conforme o produto evolui.

---

## 13. Testes e evidência

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

## 14. Conclusão

O E-Threads está estruturado como um sistema web funcional para gestão de produção e operação de confecção, com separação clara entre frontend, backend, banco de dados e documentação técnica.

A arquitetura atual é coerente com os objetivos do TCC e com o desenho documentado em `docs/ARQUITETURA_TCC.md`. O projeto está em um estágio de implementação e validação, e a próxima etapa principal é a confirmação de comportamento real em ambiente de execução com MySQL e interfaces funcionando de ponta a ponta.

---

## 15. Arquitetura em camadas

O sistema pode ser entendido em camadas independentes, cada uma com responsabilidade específica:

```text
+-----------------------------------------------------------+
| Camada de apresentação                                     |
| - React + Vite                                            |
| - páginas, componentes, autenticação visual               |
| - serviços de consumo da API                              |
+-----------------------------------------------------------+
                            |
                            v
+-----------------------------------------------------------+
| Camada de aplicação                                        |
| - Flask + blueprints                                      |
| - validação de sessão e permissões                        |
| - regras de negócio e integrações                         |
+-----------------------------------------------------------+
                            |
                            v
+-----------------------------------------------------------+
| Camada de dados                                            |
| - MySQL                                                   |
| - schema relacional                                        |
| - transações e integridade referencial                    |
+-----------------------------------------------------------+
```

### 15.1 Camada de apresentação

Responsável por:

- navegação do usuário;
- exibição dos dados em UI;
- interações do colaborador/comum e administrativo;
- coleta de dados em formulários;
- chamadas à API do backend para persistência e consulta.

### 15.2 Camada de aplicação

Responsável por:

- autenticação e autorização;
- regras de negócio de pedidos, estoque e clientes;
- validações antes de gravar no banco;
- processamento de solicitações administrativas;
- geração de respostas em JSON para o frontend.

### 15.3 Camada de dados

Responsável por:

- persistência de clientes, colaboradores, pedidos, itens e movimentações;
- integridade referencial e consistência das transações;
- suporte para consultas e relatórios.

---

## 16. Diagramas de sequência

### 16.1 Fluxo de login

```text
Usuário -> Frontend: informa RE e senha
Frontend -> Backend: POST /api/login
Backend -> Banco: busca colaborador por RE
Banco --> Backend: dados do colaborador
Backend -> Backend: valida senha e cria sessão
Backend --> Frontend: sucesso + dados do usuário
Frontend --> Usuário: redireciona para tela principal
```

### 16.2 Fluxo de criação de pedido

```text
Usuário -> Frontend: preenche dados do cliente e pedido
Frontend -> Backend: POST /api/pedidos
Backend -> Banco: grava pedido principal
Backend -> Banco: grava itens e tamanhos em transação
Banco --> Backend: confirmação
Backend --> Frontend: pedido criado / ficha técnica
Frontend --> Usuário: exibe confirmação e novo status
```

### 16.3 Fluxo de aprovação de solicitação

```text
Colaborador -> Frontend: solicita edição ou exclusão
Frontend -> Backend: POST /api/solicitacoes
Backend -> Banco: grava solicitação com status pendente
Administrador -> Frontend: visualiza solicitações pendentes
Frontend -> Backend: POST /api/solicitacoes/:id/aprovar
Backend -> Banco: valida regra e aplica mudança
Banco --> Backend: confirmação da transação
Backend --> Frontend: status aprovado/recusado
Frontend --> Usuário: exibe resultado final
```

---

## 17. Descrição dos principais endpoints

A lista abaixo representa a visão funcional dos principais módulos do sistema observado no código e na documentação. A nomenclatura pode variar conforme a implementação real final, mas o contrato funcional esperado é este.

### 17.1 Autenticação

- `POST /api/login`
  - recebe `re` e `senha`
  - valida colaborador ativo e conta ativada
  - inicia sessão Flask
  - retorna dados do usuário logado ou mensagem de erro

- `POST /api/logout`
  - encerra a sessão do usuário
  - remove identificação ativa do cookie

- `GET /api/me`
  - consulta o colaborador autenticado
  - retorna dados do usuário atual e permissões

### 17.2 Colaboradores

- `GET /api/colaboradores`
  - lista colaboradores
  - pode filtrar por status, nome ou RE

- `POST /api/colaboradores`
  - cadastra novo colaborador ou administrador
  - gera RE e registra processo de ativação

- `GET /api/colaboradores/:id`
  - consulta detalhe do colaborador

- `PUT /api/colaboradores/:id`
  - atualiza dados cadastrais e status

### 17.3 Clientes

- `GET /api/clientes`
  - lista clientes ativos/inativos

- `POST /api/clientes`
  - cadastra novo cliente

- `GET /api/clientes/:id`
  - consulta cliente específico

- `PUT /api/clientes/:id`
  - atualiza dados do cliente

### 17.4 Pedidos

- `GET /api/pedidos`
  - lista pedidos com filtros por status e pesquisa

- `POST /api/pedidos`
  - cria pedido e itens associados

- `GET /api/pedidos/:id`
  - retorna ficha técnica completa do pedido

- `PUT /api/pedidos/:id`
  - atualiza dados do pedido ou inicia fluxo de edição por solicitação

### 17.5 Estoque

- `GET /api/estoque`
  - lista itens em estoque

- `POST /api/estoque`
  - cadastra novo item

- `POST /api/estoque/movimentacao`
  - registra entrada ou saída de material

- `PUT /api/estoque/:id`
  - altera item ou dispara solicitação administrativa

### 17.6 Solicitações

- `GET /api/solicitacoes`
  - lista solicitações pendentes e históricas

- `POST /api/solicitacoes`
  - cria nova solicitação de edição ou exclusão

- `POST /api/solicitacoes/:id/aprovar`
  - aprova a solicitação e aplica alteração real

- `POST /api/solicitacoes/:id/recusar`
  - rejeita solicitação, sem alterar o dado original

### 17.7 Relatórios

- `GET /api/relatorios/financeiros`
  - dados relevantes de pedidos e produção

- `GET /api/relatorios/estoque`
  - resumos de estoque baixo ou indisponível

- `GET /api/relatorios/producao`
  - consolida pedidos por status e período

> Observação: a documentação da API pode variar conforme a implementação final, e a nomenclatura precisa deve ser confirmada através dos blueprints e dos arquivos do backend.

---

## 18. Status de implementação por módulo

A classificação abaixo indica o que foi observado no código e na estrutura do projeto, e não uma garantia de funcionamento completo em produção.

| Módulo | Status observável | Observação |
|---|---|---|
| Autenticação | Implementado no código | Sessão Flask e decorators de acesso observados em `backend/` |
| Colaboradores | Implementado no código | Estrutura e telas existentes; validação de fluxo real ainda necessária |
| Clientes | Implementado no código | Módulo funcionalmente relevante e presente no frontend/backend |
| Pedidos | Implementado no código | Fluxo de criação, ficha técnica e histórico previstos |
| Estoque | Implementado no código | Cadastro e movimentações observados no repositório |
| Solicitações administrativas | Parcial | Arquitetura e intenção definidas; validação de aprovação ainda necessária |
| Relatórios | Parcial | Estrutura e módulos presentes; dependem de dados reais do banco |
| Banco de dados | Parcial | Schema e modelagem definidos; execução real ainda pendente |
| Integração com e-mail | Parcial | Estrutura e utilitários presentes |
| Integração de imagens | Parcial | Recursos de upload e manipulação presentes |
| Testes automatizados | Parcial | Estrutura de testes no repositório, mas validação funcional real continua necessária |

---

## 19. Considerações finais

A documentação técnica do E-Threads está bem alinhada com a arquitetura atual do projeto e com a organização do repositório. Ela cobre os principais aspectos de software, negócio e infraestrutura necessários para a continuidade do desenvolvimento.

O ponto crítico para a etapa final do TCC é a validação real em ambiente funcional, principalmente:

- MySQL com schema aplicado;
- autenticação em execução;
- fluxos de pedido e estoque validados;
- aprovação de solicitações testada;
- relatórios gerados a partir de dados reais.

Sem essas evidências, a documentação técnica descreve corretamente a arquitetura, mas ainda não substitui a prova de funcionamento completo do sistema.
